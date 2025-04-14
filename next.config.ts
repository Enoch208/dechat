import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Skip ESLint during builds - this will ignore all ESLint errors
    ignoreDuringBuilds: true,
  },
  
  // Enable image optimization for the PWA
  images: {
    domains: [],
    unoptimized: false,
  },
  
  // Configure headers for PWA
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
