import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Obraz Dockera uruchamia minimalny serwer z .next/standalone.
  output: "standalone",
  // Monorepo: śledzenie plików od katalogu głównego repo (pnpm-workspace).
  outputFileTracingRoot: path.join(__dirname, "../.."),
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
