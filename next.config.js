/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure production builds use webpack (not turbopack) for Vercel compatibility
  experimental: {
    turbo: {
      // Turbo configs if needed
    }
  },
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
    
    // Fix for AppKit dynamic import issues - resolve phosphor icon imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@phosphor-icons/webcomponents/PhArrowCircleDown': '@phosphor-icons/webcomponents/dist/PhArrowCircleDown',
      '@phosphor-icons/webcomponents/PhArrowClockwise': '@phosphor-icons/webcomponents/dist/PhArrowClockwise',
      '@phosphor-icons/webcomponents/PhArrowDown': '@phosphor-icons/webcomponents/dist/PhArrowDown',
      '@phosphor-icons/webcomponents/PhArrowLeft': '@phosphor-icons/webcomponents/dist/PhArrowLeft',
      '@phosphor-icons/webcomponents/PhArrowRight': '@phosphor-icons/webcomponents/dist/PhArrowRight',
    };
    
    // Improve chunk splitting for better loading
    if (config.optimization.splitChunks) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        appkit: {
          test: /[\\/]node_modules[\\/]@reown[\\/]/,
          name: 'appkit',
          chunks: 'all',
          priority: 30,
        },
        phosphor: {
          test: /[\\/]node_modules[\\/]@phosphor-icons[\\/]/,
          name: 'phosphor-icons',
          chunks: 'all',
          priority: 25,
        },
      };
    }
    
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