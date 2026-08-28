import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 1. THIS FIXES THE DOCKER BUILD ERROR:
  output: 'standalone',

  // 2. THIS PREVENTS THE MIXED CONTENT ERROR:
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://136.69.15.83/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;