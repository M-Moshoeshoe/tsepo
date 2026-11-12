import type { NextConfig } from 'next';

const config: NextConfig = {
  // The engine (xrpl, the Anthropic SDK) runs only on the server and is loaded from node_modules as is.
  serverExternalPackages: ['xrpl', '@anthropic-ai/sdk'],
  poweredByHeader: false,
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
