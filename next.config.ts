import type { NextConfig } from 'next';

/**
 * Security headers on every response. The content policy keeps every
 * resource on this origin. Next.js streams pages with small inline scripts,
 * so scripts and styles allow 'unsafe-inline'; a nonce would force every
 * page to render per request. Framing is denied outright.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const SECURITY_HEADERS = [
  { key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
];

const config: NextConfig = {
  // The engine (xrpl, the Anthropic SDK) runs only on the server and is loaded from node_modules as is.
  serverExternalPackages: ['xrpl', '@anthropic-ai/sdk'],
  poweredByHeader: false,
  headers: () => Promise.resolve([{ source: '/:path*', headers: SECURITY_HEADERS }]),
  // Use this project folder as the root, not a lockfile found in a parent folder.
  turbopack: { root: import.meta.dirname },
  // Old addresses keep working. Query strings, such as a desk filter, are passed through.
  redirects: () =>
    Promise.resolve([
      { source: '/agent', destination: '/business/agent', permanent: true },
      { source: '/registry', destination: '/business/agent', permanent: true },
      { source: '/compliance', destination: '/exchange/payments', permanent: true },
      { source: '/exchange', destination: '/exchange/payments', permanent: false },
    ]),
};

export default config;
