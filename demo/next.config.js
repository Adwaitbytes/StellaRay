/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Optimize for production
  swcMinify: true,
  
  // Environment variables validation
  env: {
    NEXT_PUBLIC_STELLAR_RPC_URL: process.env.NEXT_PUBLIC_STELLAR_RPC_URL,
    NEXT_PUBLIC_STELLAR_HORIZON_URL: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
    NEXT_PUBLIC_FRIENDBOT_URL: process.env.NEXT_PUBLIC_FRIENDBOT_URL || 'https://friendbot.stellar.org',
  },
  
  // Image optimization
  images: {
    domains: ['lh3.googleusercontent.com'], // Google profile images
    unoptimized: false,
  },
  
  // Vercel-specific optimizations
  compress: true,
  poweredByHeader: false,
  
  // Enable experimental features if needed
  experimental: {
    optimizeCss: true,
  },
};

module.exports = nextConfig;
