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

/**
 * Finds a payee by full name, or by a first name that exactly one payee has,
 * so "Pay Naledi" works. A first name two payees share matches nobody.
 */
export function createPayeeDirectory(payees: readonly Payee[]): PayeeDirectory {
  const byName = new Map(payees.map((payee) => [normalise(payee.name), payee]));
  if (byName.size !== payees.length) throw new Error('Two payees share a name');
  const byFirstName = new Map<string, Payee[]>();
  for (const payee of payees) {
    const first = normalise(payee.name).split(' ')[0] ?? '';
    byFirstName.set(first, [...(byFirstName.get(first) ?? []), payee]);
  }
  return {
    resolve: (name) => {
      const key = normalise(name);
      const exact = byName.get(key);
      if (exact !== undefined) return exact;
      const candidates = byFirstName.get(key);
      return candidates?.length === 1 ? candidates[0] : undefined;
    },
  };
}
