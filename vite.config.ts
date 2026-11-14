import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'yad',
      // es → yad.js (import), cjs → yad.cjs (Node require), umd → yad.umd.js (<script> tag, sets window.yad).
      // The UMD file needs a .js extension so CDNs serve it with a JavaScript MIME type.
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => ({ es: 'yad.js', cjs: 'yad.cjs', umd: 'yad.umd.js' })[format] ?? `yad.${format}.js`,
      cssFileName: 'yad',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'html'],
      // CI fails if coverage drops below these (currently ~99.7% lines, ~97.7% branches).
      thresholds: {
        lines: 98,
        statements: 98,
        functions: 100,
        branches: 95,
      },
    },
  },
});
