#!/usr/bin/env node
/**
 * Writes dist/i18n/<key>.umd.js for every locale, from the CommonJS builds in dist/i18n (run after
 * `vite build --mode i18n`). Each file is a classic script that registers one locale on yad.Yad.regional.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { umdLocale } from './umd-locale.mjs';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'i18n');
const require = createRequire(import.meta.url);
const names = new Intl.DisplayNames(['en'], { type: 'language' });
const identifier = (key) => key.replace(/-(\w)/g, (_, c) => c.toUpperCase());

const keys = readdirSync(dir)
  .filter((file) => file.endsWith('.cjs') && file !== 'index.cjs')
  .map((file) => file.replace(/\.cjs$/, ''));

for (const key of keys) {
  const locale = require(join(dir, `${key}.cjs`))[identifier(key)];
  if (!locale) {
    throw new Error(`No locale export "${identifier(key)}" in ${key}.cjs`);
  }
  writeFileSync(join(dir, `${key}.umd.js`), umdLocale(key, locale, names.of(key)));
}
console.log(`Wrote ${keys.length} single-locale UMD files to dist/i18n.`);
