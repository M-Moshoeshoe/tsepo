/**
 * Pilot pricing, to be validated: 0.25% of each payment, charged to each
 * side (the business whose agent sends it, and the platform that receives
 * it), with a minimum of R0.50 and a maximum of R25 per side, per payment.
 * No monthly fees. Amounts are whole cents, so no rounding drifts.
 */
export const FEE_BASIS_POINTS = 25;
export const MIN_FEE_CENTS = 50;
export const MAX_FEE_CENTS = 2500;

/** The fee one side pays on one payment, in cents. The payment is in cents too. */
export function feePerSideCents(paymentCents: number): number {
  if (!Number.isInteger(paymentCents) || paymentCents <= 0) throw new RangeError('A payment is a positive whole number of cents.');
  const share = Math.round((paymentCents * FEE_BASIS_POINTS) / 10_000);
  return Math.min(MAX_FEE_CENTS, Math.max(MIN_FEE_CENTS, share));
}

/** Which bound, if any, set the fee. */
export function feeBound(paymentCents: number): 'minimum' | 'cap' | undefined {
  const share = Math.round((paymentCents * FEE_BASIS_POINTS) / 10_000);
  if (share < MIN_FEE_CENTS) return 'minimum';
  if (share > MAX_FEE_CENTS) return 'cap';
  return undefined;
}

/** "R0.50", "R5", "R2,000", "R10,000": whole rands without cents, otherwise two decimals. */
export function formatRand(cents: number): string {
  const whole = Math.floor(cents / 100);
  const rest = cents % 100;
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return rest === 0 ? `R${grouped}` : `R${grouped}.${String(rest).padStart(2, '0')}`;
}

/** "R2 million" for whole millions of rands, otherwise as formatRand. */
export function formatRandMillions(cents: number): string {
  const millions = cents / 100_000_000;
  return Number.isInteger(millions) && millions > 0 ? `R${String(millions)} million` : formatRand(cents);
}

/** What a month of agent payments earns, from both sides, for the illustration on the market page. */
export function monthlyFees(payments: number, averageCents: number): { volumeCents: number; perSideCents: number; totalCents: number } {
  const perSideCents = payments * feePerSideCents(averageCents);
  return { volumeCents: payments * averageCents, perSideCents, totalCents: perSideCents * 2 };
}

/** The three example payments the pricing table shows: the minimum, a typical payment and the cap. */
export const EXAMPLE_PAYMENTS_CENTS = [5_000, 200_000, 5_000_000] as const;
