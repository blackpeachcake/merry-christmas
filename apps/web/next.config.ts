import path from "node:path";
import type { NextConfig } from "next";

// 모노레포 루트. standalone 출력이 packages/* 까지 추적하고, Turbopack도 이 범위에서 모듈을 찾는다.
const monorepoRoot = path.join(__dirname, "../../");

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,

  // Docker(GKE) 배포용. .next/standalone/apps/web/server.js 로 실행한다.
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,

  // 휴대폰 등 다른 기기에서 개발 서버를 열 때만 쓴다. 예: DEV_ALLOWED_ORIGINS=192.168.0.10 pnpm dev:web
  allowedDevOrigins: process.env.DEV_ALLOWED_ORIGINS?.split(",").filter(Boolean),

  turbopack: {
    root: monorepoRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
