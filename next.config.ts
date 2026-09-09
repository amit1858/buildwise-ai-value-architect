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
};

export default nextConfig;
