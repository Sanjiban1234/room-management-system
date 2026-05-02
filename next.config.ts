import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcrypt", "jose", "firebase-admin"],
};

export default nextConfig;
