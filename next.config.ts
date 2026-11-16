import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aplikasi ini sangat dinamis (stok real-time, dashboard), jadi memakai
  // model caching klasik; halaman yang membaca DB ditandai force-dynamic.
  cacheComponents: false,
  serverExternalPackages: ["@react-pdf/renderer", "@prisma/client", "bcryptjs"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
