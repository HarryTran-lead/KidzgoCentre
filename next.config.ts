// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // Cho phép load ảnh từ Unsplash (hero background)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    // có thể giữ mặc định formats: ['image/avif', 'image/webp']
  },
  experimental: {
    // (tùy chọn) giảm bundle khi import icon
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
