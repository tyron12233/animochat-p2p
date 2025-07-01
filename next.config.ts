import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  output: "export",
  distDir: "dist",
  images: {
    unoptimized: true,
  },
  
  compiler: {
    // removeConsole: true, 
  }
};

export default nextConfig;
