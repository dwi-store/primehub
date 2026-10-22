import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Repository is published at https://dwi-store.github.io/upprime/
  output: "export",
  basePath: "/upprime",
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  poweredByHeader: false
};

export default nextConfig;
