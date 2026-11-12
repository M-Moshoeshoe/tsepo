import type { NextConfig } from 'next';

const config: NextConfig = {
  // The engine (xrpl, the Anthropic SDK) runs only on the server and is loaded from node_modules as is.
  serverExternalPackages: ['xrpl', '@anthropic-ai/sdk'],
  poweredByHeader: false,
  // Use this project folder as the root, not a lockfile found in a parent folder.
  turbopack: { root: import.meta.dirname },
  // The agent page used to be at /registry.
  redirects: () => Promise.resolve([{ source: '/registry', destination: '/agent', permanent: false }]),
};

export default config;
