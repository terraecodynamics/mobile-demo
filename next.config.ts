import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow opening the dev server from a phone via LAN IP (e.g. http://192.168.x.x:3000).
  // Without this, Next blocks /_next assets → blank page on mobile.
  allowedDevOrigins: [
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
  ],
};

export default nextConfig;
