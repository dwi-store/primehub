import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Repository is published at https://dwi-store.github.io/primehub/
  output: "export",
  basePath: "/primehub",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  poweredByHeader: false
};

export default nextConfig;
