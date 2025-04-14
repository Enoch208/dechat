import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Skip ESLint during builds - this will ignore all ESLint errors
    ignoreDuringBuilds: true,
  },
}
export default nextConfig;
