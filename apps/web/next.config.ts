import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Este repo tiene un lockfile propio en la raíz; hay que decirle a
  // Turbopack cuál es la raíz de ESTE app para que no confunda los dos.
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
