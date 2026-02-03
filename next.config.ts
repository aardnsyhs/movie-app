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

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "media-src 'self' blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              // Restrict frame sources to trusted domains only
              "frame-src https://zeldvorik.ru https://*.zeldvorik.ru",
              "frame-ancestors 'self'",
            ].join("; "),
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
