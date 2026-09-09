import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createGenerationRoute, createHostGenerationRunner } from './src/server/generationRoute';
import { createExportRoute } from './src/server/exportRoute';
import { createProbeRoute } from './src/server/probeRoute';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cuecut-local-generation-api',
      configureServer(server) {
        server.middlewares.use('/api/generate-effects', createGenerationRoute(createHostGenerationRunner()));
        server.middlewares.use('/api/export', createExportRoute());
        server.middlewares.use('/api/probe-video', createProbeRoute());
      },
    },
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['node_modules', 'dist', 'AI-Project-Ledger-Dashboard/**', 'tests/e2e/**'],
  }
});
