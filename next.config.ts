import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  output: "export",
  distDir: "dist",
  basePath: "/animochat-turn-server",
  assetPrefix: "/animochat-turn-server/",
  images: {
    unoptimized: true,
  },
  
  compiler: {

  }
};

export default nextConfig;
