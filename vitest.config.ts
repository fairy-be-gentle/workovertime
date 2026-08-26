import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/test/**/*.test.{ts,js}'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    // 运行测试的顺序
    sequence: {
      // 随机顺序运行测试，发现测试间依赖
      shuffle: true,
      // 每个文件内也随机顺序
      ranTogether: false,
    },
    // 覆盖率配置（可选）
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/server/**'],
    },
  },
});
