/** @type {import('next').NextConfig} */
const nextConfig = {
    // TEMPORARILY DISABLED: React StrictMode causes Firebase listener issues
    // See FIREBASE_STRICTMODE_FIX.md for details
    // This is a known bug: https://github.com/firebase/firebase-js-sdk/issues/6716
    reactStrictMode: false,  // Changed from true - Firebase compatibility
    swcMinify: true,

    // Performance: Enable compression
    compress: true,

    // Performance: Optimize images
    images: {
        unoptimized: false,
        formats: ['image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        minimumCacheTTL: 60,
    },

    // Performance: Enable React optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
    },

    // Performance: Code splitting
    webpack: (config, { dev, isServer }) => {
        // Production optimizations
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                moduleIds: 'deterministic',
                runtimeChunk: 'single',
                splitChunks: {
                    chunks: 'all',
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        // Vendor chunk for node_modules
                        vendor: {
                            name: 'vendor',
                            chunks: 'all',
                            test: /node_modules/,
                            priority: 20,
                        },
                        // Common chunk for shared code
                        common: {
                            name: 'common',
                            minChunks: 2,
                            chunks: 'all',
                            priority: 10,
                            reuseExistingChunk: true,
                            enforce: true,
                        },
                    },
                },
            };
        }
        return config;
    },

    // Ensure trailing slashes are handled correctly
    trailingSlash: false,

    // Production source maps (smaller)
    productionBrowserSourceMaps: false,

    // Power optimizations
    poweredByHeader: false,

    // Add env variable support
    env: {
        NEXT_PUBLIC_TRACKING_ID: process.env.NEXT_PUBLIC_TRACKING_ID || '',
    },
}

module.exports = nextConfig
