import type { NextConfig } from "next";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/").pop() || "buildwise-ai-value-architect";
const isPublicDemo = process.env.PUBLIC_DEMO === "true";
const basePath = isPublicDemo ? `/${repositoryName}` : "";

const nextConfig: NextConfig = {
  output: isPublicDemo ? "export" : undefined,
  basePath,
  assetPrefix: basePath ? `${basePath}/` : undefined,
  trailingSlash: isPublicDemo,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BUILDWISE_PUBLIC_DEMO: isPublicDemo ? "true" : "false",
    NEXT_PUBLIC_BUILDWISE_STANDALONE_URL: process.env.STANDALONE_APP_URL || "",
  },
};

export default nextConfig;
