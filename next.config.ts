import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow remote images from any HTTPS source
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    // Cache optimized images for 1 day (only used for non-proxy URLs)
    minimumCacheTTL: 86400,
    // Prefer modern formats for better compression
    formats: ["image/avif", "image/webp"],
    // Limit concurrent image optimizations to prevent overload
    // deviceSizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200],
    // imageSizes for smaller images like thumbnails
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
