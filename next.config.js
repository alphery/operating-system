/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    images: {
        unoptimized: true,
    },
    // Ensure trailing slashes are handled correctly
    trailingSlash: false,
    // Add env variable support
    env: {
        NEXT_PUBLIC_TRACKING_ID: process.env.NEXT_PUBLIC_TRACKING_ID || '',
    },
}

module.exports = nextConfig
