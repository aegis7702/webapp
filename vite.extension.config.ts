import { defineConfig } from 'vite';
import baseConfig from './vite.config';

export default defineConfig({
  ...baseConfig,
  base: './',
  build: {
    ...(baseConfig.build ?? {}),
    outDir: 'dist-extension',
    emptyOutDir: true,
  },
});
