import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    authInterrupts: true,
    // Resumes are capped at 10 MB and comment attachments at 25 MB, both uploaded
    // through Server Actions, so raise the 1 MB default with room for multipart overhead.
    serverActions: {
      bodySizeLimit: "26mb",
    },
    // src/proxy.ts runs on these requests, which buffers bodies up to 10 MB by default.
    proxyClientMaxBodySize: "26mb",
  },
};

export default nextConfig;
