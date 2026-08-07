import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * En environnement cloud, certains scripts Turbopack `crossorigin` envoient
   * un header Origin ; on expose explicitement les assets statiques.
   */
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, OPTIONS" },
        ],
      },
    ];
  },
};

export default nextConfig;
