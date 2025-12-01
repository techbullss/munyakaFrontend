import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // (optional) if you use images from external domains:
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // (optional) disable telemetry in production
  telemetry: false,
};

export default nextConfig;