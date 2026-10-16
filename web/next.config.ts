import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Admin forms upload photos through server actions; the 1MB default
      // rejects most single photos before the action even runs.
      bodySizeLimit: "25mb",
    },
  },
  images: {
    // Cloudflare Workers have no built-in image optimizer; images are served
    // as uploaded instead of going through a paid Cloudflare Images binding.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
      },
    ],
  },
};

export default nextConfig;

initOpenNextCloudflareForDev();
