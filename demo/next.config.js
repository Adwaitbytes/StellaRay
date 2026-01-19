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
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  },
  
  // Output standalone for Vercel
  output: 'standalone',
  
  // Image optimization
  images: {
    domains: ['lh3.googleusercontent.com'], // Google profile images
    unoptimized: false,
  },
  
  // Vercel-specific optimizations
  compress: true,
  poweredByHeader: false,
  
  // Disable static page generation for auth pages
  experimental: {
    optimizeCss: false, // Disable to avoid critters issue
  },
};

module.exports = nextConfig;
