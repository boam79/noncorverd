import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['lib/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      // 순수 함수 유틸이 모여 있는 lib/만 계측합니다. React 훅/컴포넌트는
      // 별도 렌더링 테스트 도구가 필요해 현재 커버리지 범위에서 제외합니다.
      include: ['lib/**/*.ts'],
      exclude: ['lib/**/*.test.ts', 'lib/hooks/**', 'lib/providers/**', 'lib/stores/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
