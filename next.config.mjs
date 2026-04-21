/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 2592000, // 30 days
    qualities: [60, 75, 90],
    remotePatterns: [
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
