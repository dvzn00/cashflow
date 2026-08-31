import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * @react-pdf/renderer ships CommonJS and pulls in Node-only internals.
   * Bundling it into the server output breaks the PDF route, so keep it
   * external and let Node require it at runtime.
   */
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
