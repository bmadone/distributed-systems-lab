import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// One self-contained HTML file: opens from disk, no server needed.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  base: './',
  test: { environment: 'jsdom', globals: true, setupFiles: ['src/test-setup.ts'] },
});
