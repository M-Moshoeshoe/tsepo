import { z } from 'zod';

/** Amounts are handled as whole millionths of a token, so sums are exact. */
const DECIMALS = 6;
const FACTOR = 10n ** BigInt(DECIMALS);
const DECIMAL_PATTERN = /^(0|[1-9]\d*)(\.\d{1,6})?$/;

/** A positive amount written as a plain decimal string, at most six decimal places. */
export const DecimalAmountSchema = z
  .string()
  .regex(DECIMAL_PATTERN, { message: 'Not a decimal amount with at most six decimal places' })
  .refine((value) => toUnits(value) > 0n, { message: 'Amount must be above zero' });

/** Converts "2.5" to 2500000n. Throws on anything that is not a plain decimal. */
export function toUnits(value: string): bigint {
  const match = DECIMAL_PATTERN.exec(value);
  if (match === null) throw new Error(`Not a decimal amount: ${value}`);
  const whole = match[1] ?? '0';
  const fraction = (match[2] ?? '.').slice(1).padEnd(DECIMALS, '0');
  return BigInt(whole) * FACTOR + BigInt(fraction);
}

/** Converts 2500000n back to "2.5". */
export function formatUnits(units: bigint): string {
  if (units < 0n) throw new Error('Amounts are never negative');
  const whole = units / FACTOR;
  const fraction = (units % FACTOR).toString().padStart(DECIMALS, '0').replace(/0+$/, '');
  return fraction === '' ? whole.toString() : `${whole.toString()}.${fraction}`;
}
