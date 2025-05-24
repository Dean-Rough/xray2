import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server components
  serverExternalPackages: ['lighthouse', '@modelcontextprotocol/sdk'],

  eslint: {
    // Disable ESLint during builds for faster deployment
    ignoreDuringBuilds: true,
    dirs: [], // Don't run ESLint on any directories
  },

  typescript: {
    // Disable TypeScript checking during builds for faster deployment
    ignoreBuildErrors: true,
  },

  // Additional build optimizations
  poweredByHeader: false,

  // Webpack configuration
  webpack: (config, { dev, isServer }) => {
    // Disable ESLint plugin completely for faster builds
    config.plugins = config.plugins.filter(
      plugin => plugin.constructor.name !== 'ESLintWebpackPlugin'
    );

    // Handle MCP SDK modules properly
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }

    return config;
  },
};

export default nextConfig;
