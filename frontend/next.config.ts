import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Speed up compilation by tree-shaking & optimizing large library imports (especially lucide-react)
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'zustand',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
    ],
  },

  // Enable HTTP compression (Gzip / Brotli)
  compress: true,

  // React Strict Mode for predictable rendering
  reactStrictMode: true,

  // Remove unnecessary console logs in production builds
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },

  // Image optimization with modern formats (AVIF & WebP) and long caching
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'http', hostname: '127.0.0.1' },
      { protocol: 'https', hostname: '**' },
    ],
  },

  async rewrites() {
    const backendUrl = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${backendUrl}/media/:path*`,
      },
    ]
  },
};

export default nextConfig;
