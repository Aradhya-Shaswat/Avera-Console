import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  serverExternalPackages: ["@neondatabase/serverless"],
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "motion",
      "dexie",
      "zod",
    ],
  },
};

export default nextConfig;
