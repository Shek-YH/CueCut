import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createGenerationRoute, createHostGenerationRunner } from './src/server/generationRoute';
import { createExportRoute } from './src/server/exportRoute';
import { createProbeRoute } from './src/server/probeRoute';
import { createRealtimeCaptureRoute } from './src/server/realtimeCaptureRoute';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cuecut-local-generation-api',
      configureServer(server) {
        server.middlewares.use('/api/generate-effects', createGenerationRoute(createHostGenerationRunner()));
        server.middlewares.use('/api/export', createExportRoute());
        server.middlewares.use('/api/probe-video', createProbeRoute());
        server.middlewares.use('/api/realtime-capture', createRealtimeCaptureRoute());
      },
    },
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    // `.workbuddy/tmp/**` 下放的是真跑脚本与临时验证文件（会打真实 ASR/LLM API、
    // 导出完整视频），绝不能被 `pnpm test` 收集，否则每次跑测试都烧额度且耗时数分钟。
    exclude: ['node_modules', 'dist', 'AI-Project-Ledger-Dashboard/**', '.workbuddy/**', 'tests/e2e/**'],
  }
});
