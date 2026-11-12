export interface Payee {
  name: string;
  /** The exchange agent lane account the contractor is paid through. */
  ledgerAddress: string;
  /** Identifies the contractor's account at the exchange. */
  destinationTag: number;
}

export interface PayeeDirectory {
  /** Finds a known payee by name. Payment details always come from here, never from the model or the list. */
  resolve(name: string): Payee | undefined;
}

function normalise(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function createPayeeDirectory(payees: readonly Payee[]): PayeeDirectory {
  const byName = new Map(payees.map((payee) => [normalise(payee.name), payee]));
  if (byName.size !== payees.length) throw new Error('Two payees share a name');
  return { resolve: (name) => byName.get(normalise(name)) };
}
