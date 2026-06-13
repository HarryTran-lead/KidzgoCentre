// next.config.ts
import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
  },

  async rewrites() {
    const backendUrl = process.env.BACKEND_API_BASE_URL || "http://103.146.22.206:5000/api";
    // Extract base URL without the trailing /api
    const backendBaseUrl = backendUrl.replace(/\/api\/?$/, "");

    return [
      {
        // Proxy backend static files (images, uploads) through HTTPS to avoid mixed-content block.
        // Must be listed BEFORE the general /api/:path* rule so it takes priority.
        source: "/api/files/serve/:path*",
        destination: `${backendBaseUrl}/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendUrl}/:path*`,
      },
    ];
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      // Allow any external image domain for blog featured images
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "**" },
    ],
    unoptimized: false,
    qualities: [100, 75],
  },

};

export default nextConfig;
