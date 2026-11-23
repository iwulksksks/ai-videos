import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // These packages use native code or bundle their own tools, so Next.js must not bundle them.
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/cli",
    "esbuild",
  ],
};

export default nextConfig;
