import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["fhevmjs"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
        config.resolve.fallback = {
            ...config.resolve.fallback,
            "tfhe_bg.wasm": false,
        };
    }
    return config;
  },
};

export default nextConfig;
