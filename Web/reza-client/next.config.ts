import type { NextConfig } from "next";

// Prefer next.config.js if both exist — keep this in sync.
const nextConfig: NextConfig = {
  env: {
    TZ: "Africa/Casablanca",
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
