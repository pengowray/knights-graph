import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
};

/* ---added--- */
const isGithubActions = process.env.GITHUB_ACTIONS === 'true';
//const isGithubActions = true;
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
