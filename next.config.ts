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
  async redirects() {
    return [
      {
        source: "/audits",
        destination: "/missions",
        permanent: false,
      },
      {
        source: "/audits/:path*",
        destination: "/missions/:path*",
        permanent: false,
      },
      {
        source: "/equipe",
        destination: "/unite?focus=equipe",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
