import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { createGenerationRoute, createHostGenerationRunner } from './src/server/generationRoute';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'cuecut-local-generation-api',
      configureServer(server) {
        server.middlewares.use('/api/generate-effects', createGenerationRoute(createHostGenerationRunner()));
      },
    },
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    exclude: ['node_modules', 'dist', 'tests/e2e/**'],
  }
});
