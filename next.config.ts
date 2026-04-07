import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@pinecone-database/pinecone", "dd-trace"],
};

export default nextConfig;
