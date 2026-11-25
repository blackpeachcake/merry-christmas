import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    setupFiles: ['./vitest.setup.ts'], // .env(DATABASE_URL) 로드 — 통합 테스트용
    fileParallelism: false, // DB 통합 테스트가 같은 DB를 공유 → 직렬 실행(레이스 방지)
  },
});
