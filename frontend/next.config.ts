import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Disable type errors failing the build (for dev ONLY)
    ignoreBuildErrors: true,
  },
  eslint: {
    // Disable eslint errors failing the build (for dev ONLY)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;


