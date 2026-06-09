import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://static2.kapruka.com/**"),
      new URL("https://static.kapruka.com/**"),
      new URL("https://www.kapruka.com/**"),
    ],
  },
};

export default nextConfig;
