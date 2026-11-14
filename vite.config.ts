import { readdirSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import type { UserConfig } from 'vitest/config';

/** Every locale module in src/i18n (plus the index), built as separate files so they can be imported one by one. */
const localeEntries = Object.fromEntries(
  readdirSync('src/i18n')
    .filter((file) => file.endsWith('.ts') && file !== 'umd.ts')
    .map((file) => [file.replace(/\.ts$/, ''), `src/i18n/${file}`]),
);

const builds: Record<string, UserConfig['build']> = {
  // npm run build: the library itself.
  // es → yad.js (import), cjs → yad.cjs (Node require), umd → yad.umd.js (<script> tag, sets window.yad).
  // The UMD file needs a .js extension so CDNs serve it with a JavaScript MIME type.
  production: {
    lib: {
      entry: 'src/index.ts',
      name: 'yad',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => ({ es: 'yad.js', cjs: 'yad.cjs', umd: 'yad.umd.js' })[format] ?? `yad.${format}.js`,
      cssFileName: 'yad',
    },
  },
  // vite build --mode i18n: dist/i18n/<locale>.js / .cjs and dist/i18n/index.js / .cjs
  i18n: {
    outDir: 'dist/i18n',
    emptyOutDir: false,
    lib: {
      entry: localeEntries,
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
    },
  },
  // vite build --mode i18n-umd: dist/yad-i18n.umd.js, registers all locales on window.yad.Yad.regional
  'i18n-umd': {
    emptyOutDir: false,
    lib: {
      entry: 'src/i18n/umd.ts',
      name: 'yadI18n',
      formats: ['umd'],
      fileName: () => 'yad-i18n.umd.js',
    },
  },
};

export default defineConfig(({ mode }) => ({
  build: builds[mode] ?? builds.production,
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Generated locale data and the UMD registration entry contain no logic to cover.
      exclude: ['src/i18n/umd.ts'],
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
}));
