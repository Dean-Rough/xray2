/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['lighthouse']
  },
  eslint: {
    // Completely disable ESLint during builds
    ignoreDuringBuilds: true,
    dirs: [], // Don't run ESLint on any directories
  },
  typescript: {
    // Disable TypeScript checking during builds
    ignoreBuildErrors: true,
  },
  // Additional build optimizations
  swcMinify: true,
  poweredByHeader: false,
};

module.exports = nextConfig;
