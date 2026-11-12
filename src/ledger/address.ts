import { isValidClassicAddress } from 'xrpl';
import { z } from 'zod';

/** A classic XRP Ledger address, checked including its checksum. */
export const ClassicAddressSchema = z
  .string()
  .refine(isValidClassicAddress, { message: 'Not a valid classic address' });
