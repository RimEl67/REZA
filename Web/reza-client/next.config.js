/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TZ: 'Africa/Casablanca',
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = nextConfig;
