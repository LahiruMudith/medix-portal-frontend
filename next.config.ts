import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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