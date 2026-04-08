import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ASAAS_API_KEY: process.env.ASAAS_API_KEY,
  },
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;