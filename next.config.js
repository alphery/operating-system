/** @type {import('next').NextConfig} */
const nextConfig = {
    // TEMPORARILY DISABLED: React StrictMode causes Firebase listener issues
    // See FIREBASE_STRICTMODE_FIX.md for details
    // This is a known bug: https://github.com/firebase/firebase-js-sdk/issues/6716
    reactStrictMode: false,  // Changed from true - Firebase compatibility

    // Performance: Enable compression
    compress: true,

    // Performance: Optimize images
    images: {
        unoptimized: false,
        formats: ['image/webp'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920],
        minimumCacheTTL: 60,
        qualities: [75, 85],
    },

    // Performance: Enable React optimizations
    compiler: {
        removeConsole: process.env.NODE_ENV === 'production' ? {
            exclude: ['error', 'warn'],
        } : false,
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
