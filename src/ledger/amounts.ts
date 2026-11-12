import { convertHexToString, dropsToXrp } from 'xrpl';
import { z } from 'zod';

/** An amount as people read it: "2" and "RLUSD", or "100" and "XRP". */
export interface DisplayAmount {
  value: string;
  asset: string;
}

const HEX_CURRENCY = /^[0-9A-F]{40}$/;

/** "RLUSD" for the 40 character hex code the ledger stores; three letter codes as they are. */
export function currencyName(code: string): string {
  if (!HEX_CURRENCY.test(code)) return code;
  const name = convertHexToString(code).replace(/\0/g, '').trim();
  return name === '' ? code : name;
}

const IssuedSchema = z.object({ currency: z.string(), value: z.string() });
const DropsSchema = z.string().regex(/^\d+$/);

/** Names any ledger amount: XRP in drops, or an issued token. Undefined for anything else. */
export function describeAmount(raw: unknown): DisplayAmount | undefined {
  const drops = DropsSchema.safeParse(raw);
  if (drops.success) return { value: String(dropsToXrp(drops.data)), asset: 'XRP' };
  const issued = IssuedSchema.safeParse(raw);
  if (issued.success) return { value: issued.data.value, asset: currencyName(issued.data.currency) };
  return undefined;
}
