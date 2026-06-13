import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  // Uncomment the two lines below if deploying to a project repo (not username.github.io).
  // For username.github.io repos, basePath and assetPrefix are NOT needed (root deployment).
  // basePath: "/nombre-del-repo",
  // assetPrefix: "/nombre-del-repo/",

  images: {
    unoptimized: true,
  },
};

export default nextConfig;
