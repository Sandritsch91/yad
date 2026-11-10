import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'yad',
      fileName: 'yad',
      cssFileName: 'yad',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
