/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Allow all HTTPS domains for Nouns proposal images
      // Proposals can reference images from any domain
      {
        protocol: 'https',
        hostname: '**',
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

    // Preserve class names and function names for better compatibility
    // with libraries like WalletConnect that might rely on them
    if (config.optimization) {
      if (!config.optimization.minimizer) {
        config.optimization.minimizer = [];
      }
      
      // Add our custom configuration for production
      config.optimization.minimizer.push({
        apply: (compiler) => {
          // Access terser plugin options
          compiler.options.optimization.minimizer.forEach(plugin => {
            if (plugin.constructor && plugin.constructor.name === 'TerserPlugin') {
              if (!plugin.options) plugin.options = {};
              if (!plugin.options.terserOptions) plugin.options.terserOptions = {};
              
              plugin.options.terserOptions.keep_classnames = true;
              plugin.options.terserOptions.keep_fnames = true;
              
              if (!plugin.options.terserOptions.mangle) {
                plugin.options.terserOptions.mangle = {};
              }
              
              plugin.options.terserOptions.mangle.reserved = [
                'Buffer', 'BigInt', 'Symbol', 'fetch'
              ];
            }
          });
        }
      });
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