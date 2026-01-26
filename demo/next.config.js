/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Environment variables validation
  env: {
    NEXT_PUBLIC_STELLAR_RPC_URL: process.env.NEXT_PUBLIC_STELLAR_RPC_URL,
    NEXT_PUBLIC_STELLAR_HORIZON_URL: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
    NEXT_PUBLIC_FRIENDBOT_URL: process.env.NEXT_PUBLIC_FRIENDBOT_URL || 'https://friendbot.stellar.org',
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'randomuser.me',
        pathname: '/**',
      },
    ],
    // Fallback domains for compatibility
    domains: ['randomuser.me', 'lh3.googleusercontent.com'],
  },

  // Vercel-specific optimizations
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
