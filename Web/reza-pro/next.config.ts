/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  distDir: '.next',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: blob:",
              "script-src-attr 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline' https:",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data: https:",
              "connect-src 'self' https: ws: wss: http://localhost:*",
              "frame-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
  async rewrites() {
    // Get backend URL from environment variable, with fallback to default
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

    // Remove /api suffix if present to get base backend URL
    const baseBackendUrl = backendUrl.replace(/\/api\/?$/, '');

    return [
      {
        source: '/api/:path*',
        destination: `${baseBackendUrl}/api/:path*`,
      },
      {
        source: '/uploads/:path*',
        destination: `${baseBackendUrl}/uploads/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
