/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: require('path').join(__dirname),
  
  // Target modern browsers to avoid unnecessary polyfills
  // SWC will use .browserslistrc configuration which targets modern browsers
  // This reduces bundle size by not transpiling baseline features
  // The .browserslistrc file already targets Chrome >= 111, Firefox >= 111, Safari >= 16.4, Edge >= 111
  // These browsers natively support all baseline features (Array.at, Object.fromEntries, etc.)
  
  // Configure cache control headers for static assets
  async headers() {
    return [
      {
        // Apply to all static assets in _next/static
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, immutable', // 30 days in seconds (30 * 24 * 60 * 60)
          },
        ],
      },
      {
        // Apply to static images and other static files
        source: '/:path*\\.(jpg|jpeg|png|gif|svg|webp|ico|woff|woff2|ttf|eot|css|js|json)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, immutable', // 30 days
          },
        ],
      },
    ];
  },
  
  // DuckDB requires native modules
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('duckdb');
    }
    
    // Configure webpack to ignore non-JSON files in hanzi-writer-data
    // This prevents webpack from trying to parse txt, md, and other non-JSON files
    config.module.rules.push({
      test: /node_modules\/hanzi-writer-data\/.*\.(txt|TXT|md|MD|LICENSE|html|HTML|js)$/,
      type: 'asset/source',
    });
    return config;
  },
  
}

module.exports = nextConfig

