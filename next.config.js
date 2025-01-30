/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nft-cdn.alchemy.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'metadata.ens.domains',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/files/:path*',
        destination: '/api/serve/:path*'
      }
    ];
  }
};

module.exports = nextConfig; 