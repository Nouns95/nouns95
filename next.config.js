/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Allow all subdomains from common image/content hosts
      {
        protocol: 'https',
        hostname: '**.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.imgur.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.giphy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.squarespace-cdn.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.squarespace.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.shopify.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cloudfront.net',
        pathname: '/**',
      },
      // Web3 specific hosts
      {
        protocol: 'https',
        hostname: 'nft-cdn.alchemy.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'metadata.ens.domains',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.dweb.link',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.seadn.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'raw.seadn.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cloudflare-ipfs.com',
        pathname: '/**',
      },
      // Add IPFS skatehive gateway
      {
        protocol: 'https',
        hostname: 'ipfs.skatehive.app',
        pathname: '/**',
      },
      // Common ENS avatar hosting domains
      {
        protocol: 'https',
        hostname: 'euc.li',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.stamp.fyi',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'eth.xyz',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ens.xyz',
        pathname: '/**',
      },
      // Add imgbb domain
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
        pathname: '/**',
      },
      // Common image hosting services
      {
        protocol: 'https',
        hostname: '**.wp.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.wordpress.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.medium.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.cdninstagram.com',
        pathname: '/**',
      },
      // Add hackmd.io
      {
        protocol: 'https',
        hostname: 'hackmd.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.hackmd.io',
        pathname: '/**',
      },
      // Add Wikipedia domains
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.wikipedia.org',
        pathname: '/**',
      },
      // Add CryptoCoven domain
      {
        protocol: 'https',
        hostname: 'cryptocoven.s3.amazonaws.com',
        pathname: '/**',
      }
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  async rewrites() {
    return [
      {
        source: '/files/:path*',
        destination: '/api/serve/:path*'
      }
    ];
  },
};

module.exports = nextConfig; 