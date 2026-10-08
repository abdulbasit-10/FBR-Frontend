import type { NextConfig } from "next";

// Only used if NEXT_PUBLIC_API_BASE_URL is ever set to a relative path (e.g. "/api/v1")
// instead of the usual absolute URL — in that case requests hit this Next.js server first,
// which then needs somewhere real to forward them to. No hardcoded fallback: misconfiguration
// should fail loudly during build rather than silently proxying to a stale/unrelated backend.
const BACKEND = process.env.BACKEND_INTERNAL_URL;

const nextConfig: NextConfig = {
  async rewrites() {
    if (!BACKEND) return [];
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
