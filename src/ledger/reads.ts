import { convertHexToString, RippledError, type Client } from 'xrpl';
import { z } from 'zod';
import type { CredentialEntry } from '../domain/credential-check.ts';
import type { Reserves } from './reserve.ts';

/** All reads use the latest validated ledger, never a pending one. */
const VALIDATED = 'validated';

export interface AccountState {
  balanceDrops: number;
  flags: number;
  /** Fee on transfers of tokens this account issues; undefined means none. */
  transferRate: number | undefined;
}

const AccountInfoSchema = z.object({
  result: z.object({
    account_data: z.object({ Balance: z.string(), Flags: z.number(), TransferRate: z.number().optional() }),
  }),
});

const NotFoundSchema = z.object({ error: z.literal('actNotFound') });

/** Returns undefined when the account does not exist on the ledger. */
export async function getAccountState(client: Client, address: string): Promise<AccountState | undefined> {
  try {
    const response = await client.request({ command: 'account_info', account: address, ledger_index: VALIDATED });
    const data = AccountInfoSchema.parse(response).result.account_data;
    return { balanceDrops: Number(data.Balance), flags: data.Flags, transferRate: data.TransferRate };
  } catch (error: unknown) {
    if (error instanceof RippledError && NotFoundSchema.safeParse(error.data).success) return undefined;
    throw error;
  }
}

export async function requireAccountState(client: Client, address: string): Promise<AccountState> {
  const state = await getAccountState(client, address);
  if (state === undefined) throw new Error(`Account ${address} does not exist. Run npm run spike:accounts first.`);
  return state;
}

const ServerStateSchema = z.object({
  result: z.object({
    state: z.object({ validated_ledger: z.object({ reserve_base: z.number(), reserve_inc: z.number() }) }),
  }),
});

export async function getReserves(client: Client): Promise<Reserves> {
  const response = await client.request({ command: 'server_state' });
  const ledger = ServerStateSchema.parse(response).result.state.validated_ledger;
  return { baseDrops: ledger.reserve_base, ownerDrops: ledger.reserve_inc };
}

const AccountTxSchema = z.object({
  result: z.object({ transactions: z.array(z.object({ hash: z.string() })) }),
});

/** The hash of the first transaction that touched the account: its funding payment. */
export async function getFundingHash(client: Client, address: string): Promise<string | undefined> {
  const response = await client.request({
    command: 'account_tx',
    account: address,
    forward: true,
    limit: 1,
    ledger_index_min: -1,
    ledger_index_max: -1,
  });
  return AccountTxSchema.parse(response).result.transactions[0]?.hash;
}

const AccountObjectsSchema = z.object({
  result: z.object({ account_objects: z.array(z.unknown()), marker: z.unknown().optional() }),
});

type ObjectType = 'credential' | 'deposit_preauth' | 'signer_list';

async function getAccountObjects(client: Client, account: string, type: ObjectType): Promise<unknown[]> {
  const response = await client.request({ command: 'account_objects', account, type, ledger_index: VALIDATED });
  const { account_objects, marker } = AccountObjectsSchema.parse(response).result;
  if (marker !== undefined) throw new Error(`Account ${account} has more ${type} objects than one page holds`);
  return account_objects;
}

const CredentialObjectSchema = z.object({
  LedgerEntryType: z.literal('Credential'),
  index: z.string(),
  Issuer: z.string(),
  Subject: z.string(),
  CredentialType: z.string(),
  Flags: z.number(),
  Expiration: z.number().optional(),
  URI: z.string().optional(),
});

export interface FoundCredential {
  /** Ledger object ID, used in a payment's CredentialIDs field. */
  id: string;
  entry: CredentialEntry;
}

export async function findCredential(
  client: Client,
  query: { subject: string; issuer: string; credentialTypeHex: string },
): Promise<FoundCredential | undefined> {
  const objects = z.array(CredentialObjectSchema).parse(await getAccountObjects(client, query.subject, 'credential'));
  const match = objects.find(
    (object) => object.Issuer === query.issuer && object.CredentialType === query.credentialTypeHex,
  );
  if (match === undefined) return undefined;
  return {
    id: match.index,
    entry: {
      issuer: match.Issuer,
      subject: match.Subject,
      credentialType: convertHexToString(match.CredentialType),
      flags: match.Flags,
      expiration: match.Expiration,
      uri: match.URI === undefined ? undefined : convertHexToString(match.URI),
    },
  };
}

const DepositPreauthObjectSchema = z.object({
  AuthorizeCredentials: z
    .array(z.object({ Credential: z.object({ Issuer: z.string(), CredentialType: z.string() }) }))
    .optional(),
});

/** True when the owner preauthorises credentials of this issuer and type. */
export async function hasCredentialPreauth(
  client: Client,
  query: { owner: string; issuer: string; credentialTypeHex: string },
): Promise<boolean> {
  const objects = z.array(DepositPreauthObjectSchema).parse(
    await getAccountObjects(client, query.owner, 'deposit_preauth'),
  );
  return objects.some((object) =>
    (object.AuthorizeCredentials ?? []).some(
      ({ Credential }) => Credential.Issuer === query.issuer && Credential.CredentialType === query.credentialTypeHex,
    ),
  );
}

const SignerListObjectSchema = z.object({
  SignerQuorum: z.number(),
  SignerEntries: z.array(z.object({ SignerEntry: z.object({ Account: z.string(), SignerWeight: z.number() }) })),
});

export type SignerList = z.infer<typeof SignerListObjectSchema>;

export async function getSignerList(client: Client, account: string): Promise<SignerList | undefined> {
  const objects = z.array(SignerListObjectSchema).parse(await getAccountObjects(client, account, 'signer_list'));
  return objects[0];
}

const AccountLinesSchema = z.object({
  result: z.object({
    lines: z.array(z.object({ currency: z.string(), balance: z.string(), limit: z.string() })),
  }),
});

export interface TrustLine {
  balance: string;
  limit: string;
}

export async function getTrustLine(
  client: Client,
  query: { account: string; issuer: string; currency: string },
): Promise<TrustLine | undefined> {
  const response = await client.request({
    command: 'account_lines',
    account: query.account,
    peer: query.issuer,
    ledger_index: VALIDATED,
  });
  const line = AccountLinesSchema.parse(response).result.lines.find((item) => item.currency === query.currency);
  return line === undefined ? undefined : { balance: line.balance, limit: line.limit };
}

const NotFoundEntrySchema = z.object({ error: z.enum(['entryNotFound', 'txnNotFound']) });

function isNotFound(error: unknown): boolean {
  return error instanceof RippledError && NotFoundEntrySchema.safeParse(error.data).success;
}

const CredentialNodeSchema = z.object({
  result: z.object({ node: CredentialObjectSchema.omit({ index: true }), index: z.string() }),
});

/** Reads a credential by its ledger object ID. Undefined when it is not on the ledger. */
export async function getCredentialById(client: Client, id: string): Promise<FoundCredential | undefined> {
  try {
    const response = await client.request({ command: 'ledger_entry', index: id, ledger_index: VALIDATED });
    const { node, index } = CredentialNodeSchema.parse(response).result;
    return {
      id: index,
      entry: {
        issuer: node.Issuer,
        subject: node.Subject,
        credentialType: convertHexToString(node.CredentialType),
        flags: node.Flags,
        expiration: node.Expiration,
        uri: node.URI === undefined ? undefined : convertHexToString(node.URI),
      },
    };
  } catch (error: unknown) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

export async function getValidatedLedgerIndex(client: Client): Promise<number> {
  return client.getLedgerIndex();
}

const TxLookupSchema = z.object({
  result: z.object({
    validated: z.boolean().optional(),
    ledger_index: z.number().optional(),
    meta: z.object({ TransactionResult: z.string() }).optional(),
  }),
});

export type TransactionStatus =
  | { state: 'not-found' }
  | { state: 'pending' }
  | { state: 'validated'; result: string; ledgerIndex: number };

/** Looks a transaction up by hash, so a crashed run can be reconciled instead of resubmitted. */
export async function lookupTransaction(client: Client, hash: string): Promise<TransactionStatus> {
  try {
    const { result } = TxLookupSchema.parse(await client.request({ command: 'tx', transaction: hash }));
    if (result.validated !== true || result.meta === undefined || result.ledger_index === undefined) {
      return { state: 'pending' };
    }
    return { state: 'validated', result: result.meta.TransactionResult, ledgerIndex: result.ledger_index };
  } catch (error: unknown) {
    if (isNotFound(error)) return { state: 'not-found' };
    throw error;
  }
}

const IssuedAmountSchema = z.object({ currency: z.string(), issuer: z.string(), value: z.string() });

const AccountTxPageSchema = z.object({
  result: z.object({
    transactions: z.array(
      z.object({
        hash: z.string(),
        ledger_index: z.number(),
        validated: z.boolean().optional(),
        tx_json: z.object({
          TransactionType: z.string(),
          Account: z.string(),
          Destination: z.string().optional(),
          DestinationTag: z.number().optional(),
          InvoiceID: z.string().optional(),
          CredentialIDs: z.array(z.string()).optional(),
        }),
        meta: z.object({ TransactionResult: z.string(), delivered_amount: z.unknown().optional() }),
      }),
    ),
    marker: z.unknown().optional(),
  }),
});

export interface LedgerPayment {
  hash: string;
  ledgerIndex: number;
  result: string;
  sender: string;
  destinationTag: number | undefined;
  invoiceId: string | undefined;
  delivered: z.infer<typeof IssuedAmountSchema> | undefined;
  credentialIds: string[];
}

/**
 * Validated payments sent to `account` in ledgers after `afterLedger`, oldest
 * first, including failed ones. An `afterLedger` of 0 means from the earliest
 * ledger the server holds.
 */
export async function getIncomingPayments(client: Client, account: string, afterLedger: number): Promise<LedgerPayment[]> {
  const payments: LedgerPayment[] = [];
  let marker: unknown = undefined;
  do {
    const response = await client.request({
      command: 'account_tx',
      account,
      forward: true,
      ledger_index_min: afterLedger === 0 ? -1 : afterLedger + 1,
      ledger_index_max: -1,
      limit: 200,
      ...(marker === undefined ? {} : { marker }),
    });
    const page = AccountTxPageSchema.parse(response).result;
    for (const item of page.transactions) {
      const tx = item.tx_json;
      if (item.validated !== true || tx.TransactionType !== 'Payment' || tx.Destination !== account) continue;
      const delivered = IssuedAmountSchema.safeParse(item.meta.delivered_amount);
      payments.push({
        hash: item.hash,
        ledgerIndex: item.ledger_index,
        result: item.meta.TransactionResult,
        sender: tx.Account,
        destinationTag: tx.DestinationTag,
        invoiceId: tx.InvoiceID,
        delivered: delivered.success ? delivered.data : undefined,
        credentialIds: tx.CredentialIDs ?? [],
      });
    }
    marker = page.marker;
  } while (marker !== undefined);
  return payments;
}
