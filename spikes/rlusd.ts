import { LedgerEntry, TrustSetFlags, type TrustSet } from 'xrpl';
import { RLUSD } from '../src/ledger/testnet.ts';
import { signAsAgent } from './lib/agent.ts';
import { loadEnv } from '../src/config/env.ts';
import { getTrustLine, requireAccountState } from '../src/ledger/reads.ts';
import { accountLink, printLine, printStep } from '../src/cli/output.ts';
import { rlusd } from '../src/ledger/rlusd.ts';
import { runScript } from '../src/cli/run.ts';
import { confirm } from '../src/cli/report.ts';
import { signSingle } from '../src/ledger/submit.ts';
import { loadWallets } from '../src/config/wallets.ts';

/** The most RLUSD each account agrees to hold. */
const TRUST_LIMIT = '1000000';

const HOLDERS = ['agent', 'contractor', 'exchange'] as const;

await runScript('spike:rlusd', async (client) => {
  const env = loadEnv();
  const wallets = loadWallets(env);

  printStep('RLUSD issuer settings');
  const issuer = await requireAccountState(client, RLUSD.issuer);
  const requiresAuth = (issuer.flags & LedgerEntry.AccountRootFlags.lsfRequireAuth) !== 0;
  printLine(accountLink(RLUSD.issuer));
  printLine(`requires authorised trust lines: ${requiresAuth ? 'yes' : 'no'}`);
  printLine(`transfer fee: ${issuer.transferRate === undefined ? 'none' : `rate ${issuer.transferRate}`}`);

  for (const role of HOLDERS) {
    const { address } = wallets[role];
    printStep(`RLUSD trust line: ${role}`);
    printLine(accountLink(address));

    const line = await getTrustLine(client, { account: address, issuer: RLUSD.issuer, currency: RLUSD.currency });
    if (line !== undefined) {
      printLine('trust line already in place');
      continue;
    }

    const tx: TrustSet = {
      TransactionType: 'TrustSet',
      Account: address,
      LimitAmount: rlusd(TRUST_LIMIT),
      Flags: TrustSetFlags.tfSetNoRipple,
    };
    const signed =
      role === 'agent' ? await signAsAgent(client, wallets, tx, env.sourceTag) : await signSingle(client, wallets[role], tx);
    await confirm(client, signed);
  }
});
