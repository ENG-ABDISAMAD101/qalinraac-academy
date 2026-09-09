import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@qalinraac/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

export default nextConfig;
