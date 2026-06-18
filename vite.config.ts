import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

declare const process: { env: Record<string, string | undefined> };

export default defineConfig({
  base: process.env.GITHUB_PAGES === 'true' ? '/habit-tracker/' : './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
