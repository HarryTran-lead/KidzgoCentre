// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "https://kidzgo-be.onrender.com/api/:path*",
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // (optional) nếu bạn load ảnh từ onrender hay domain khác thì thêm ở đây
      // { protocol: "https", hostname: "kidzgo-be.onrender.com" },
    ],
  },

  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
