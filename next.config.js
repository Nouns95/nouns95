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
      {
        protocol: 'https',
        hostname: 'arweave.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        port: '',
        pathname: '/**',
      }
    ],
  },
  async rewrites() {
    return [
      {
        source: '/files/:path*',
        destination: '/api/serve/:path*'
      }
    ];
  },
  webpack: (config, { isServer }) => {
    // Exclude specific modules from the client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig; 