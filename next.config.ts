import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Preserve existing src/modules and src/shared for backend logic
  // Next.js app directory is at the root level (app/)
  serverExternalPackages: ["openai", "hono"],

  images: {
    formats: ["image/avif", "image/webp"],
  },

  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
    ],
  },
};

export default nextConfig;
