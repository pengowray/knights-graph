import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

/* ---added--- */
const isGithubActions = process.env.GITHUB_ACTIONS || false;
const repo = 'knights-graph';

module.exports = {
  output: 'export',
  distDir: 'docs',
  assetPrefix: isGithubActions ? `/${repo}/` : '',
  images: {
    unoptimized: true,
  },
  basePath: isGithubActions ? `/${repo}` : '',
};
/* ---end of added--- */



export default nextConfig;
