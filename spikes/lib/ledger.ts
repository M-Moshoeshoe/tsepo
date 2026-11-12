import { convertHexToString, RippledError, type Client } from 'xrpl';
import { z } from 'zod';
import type { CredentialEntry } from '../../src/credential/credential-check.ts';
import type { Reserves } from '../../src/ledger/reserve.ts';

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
