/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,

  images: {
    // Next's built-in optimizer fetches each CDN image once (server-side) and
    // emits AVIF/WebP at responsive widths, cached for minimumCacheTTL. Because
    // that fetch carries no browser Referer, the EnCDN client must be in
    // `public` access mode (whitelist would 403 it). Source files are already
    // resized to WebP at upload (lib/imageOptimize.js) to keep this fetch cheap.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000, // 30 days
    qualities: [60, 75, 90, 95, 100],
    remotePatterns: [
      { protocol: "https", hostname: "cdn.enfinito.cloud",      pathname: "/d/**" },
      { protocol: "https", hostname: "*.googleusercontent.com", pathname: "/**" },
      { protocol: "https", hostname: "ui-avatars.com",          pathname: "/**" },
      { protocol: "https", hostname: "images.unsplash.com",     pathname: "/**" },
      { protocol: "https", hostname: "res.cloudinary.com",      pathname: "/**" },
    ],
  },

  experimental: {
    // Tree-shake heavy packages so only used exports are bundled
    optimizePackageImports: ["framer-motion", "gsap"],
  },
};

export default nextConfig;
