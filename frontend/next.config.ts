import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Assignment 2 moved the management pages under /admin — keep the old URLs working.
  async redirects() {
    return ["departments", "projects", "tasks", "tags"].map((entity) => ({
      source: `/${entity}/manage`,
      destination: `/admin/${entity}`,
      permanent: true,
    }));
  },
};

export default nextConfig;
