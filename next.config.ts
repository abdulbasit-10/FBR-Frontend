import type { NextConfig } from "next";

const BACKEND = "https://fbr-backend-production-1b53.up.railway.app";

const nextConfig: NextConfig = {
  // Proxy API calls server-side so browser never makes cross-origin requests
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
