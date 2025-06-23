import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
  distDir: "dist",
  basePath: "/animochat-turn-server",
  assetPrefix: "/animochat-turn-server/",
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
