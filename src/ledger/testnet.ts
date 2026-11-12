/** The only network this project connects to. */
export const TESTNET_URL = 'wss://s.altnet.rippletest.net:51233';

/** Public explorer for the XRP Ledger Testnet. */
export const TESTNET_EXPLORER = 'https://testnet.xrpl.org';

/** Default SourceTag for agent payments (XRPL AI Starter Kit). */
export const DEFAULT_SOURCE_TAG = 20260530;

/**
 * RLUSD on Testnet. The code "RLUSD" is longer than three characters, so the
 * ledger stores it as a 40 character hex currency code.
 */
export const RLUSD = {
  currency: '524C555344000000000000000000000000000000',
  issuer: 'rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV',
} as const;
