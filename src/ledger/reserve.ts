/** Reserve settings reported by the ledger, in drops. */
export interface Reserves {
  baseDrops: number;
  ownerDrops: number;
}

/**
 * The smallest balance an account should hold before we use it: the base
 * reserve, one owner reserve per ledger object it will own, and a buffer
 * for transaction fees.
 */
export function requiredBalanceDrops(
  reserves: Reserves,
  ownedObjects: number,
  feeBufferDrops: number,
): number {
  if (!Number.isInteger(ownedObjects) || ownedObjects < 0) {
    throw new Error('ownedObjects must be a whole number of zero or more');
  }
  if (!Number.isInteger(feeBufferDrops) || feeBufferDrops < 0) {
    throw new Error('feeBufferDrops must be a whole number of zero or more');
  }
  return reserves.baseDrops + reserves.ownerDrops * ownedObjects + feeBufferDrops;
}
