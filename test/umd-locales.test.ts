import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { umdLocale } from '../scripts/umd-locale.mjs';
import { formatDate } from '../src/date-utils';
import { locales } from '../src/i18n';
import { ja } from '../src/i18n/ja';
import { ptBR } from '../src/i18n/pt-BR';

type Global = Record<string, unknown> & {
  yad?: { Yad: { regional: Record<string, unknown> } };
  yadI18n?: { locales: Record<string, unknown> };
};

/** Run a script like a browser <script> tag, with `globalThis` as the global object. */
function runScript(source: string, global: Global): Global {
  global.globalThis = global;
  runInNewContext(source, global);
  return global;
}

describe('single-locale UMD files', () => {
  it('register the locale on yad.Yad.regional when loaded after yad.umd.js', () => {
    const global = runScript(umdLocale('ja', ja), { yad: { Yad: { regional: { de: {} } } } });
    expect(global.yad!.Yad.regional.ja).toEqual(ja);
    expect(Object.keys(global.yad!.Yad.regional)).toEqual(['de', 'ja']);
  });

  it('keep the locale in yadI18n.locales, also when yad is not loaded yet', () => {
    const global = runScript(umdLocale('pt-BR', ptBR), {});
    expect(global.yadI18n!.locales['pt-BR']).toEqual(ptBR);
    runScript(umdLocale('ja', ja), global);
    expect(Object.keys(global.yadI18n!.locales)).toEqual(['pt-BR', 'ja']);
  });

  it('export the locale under CommonJS', () => {
    const module = { exports: {} };
    runScript(umdLocale('ja', ja), { module, exports: module.exports });
    expect(module.exports).toEqual(ja);
  });

  it('define an AMD module', () => {
    let factory: (() => unknown) | undefined;
    const define = Object.assign((deps: string[], f: () => unknown) => {
      expect(deps).toEqual([]);
      factory = f;
    }, { amd: {} });
    runScript(umdLocale('ja', ja), { define });
    expect(factory!()).toEqual(ja);
  });

  it('keep all characters of every locale intact', () => {
    for (const [key, locale] of Object.entries(locales)) {
      const global = runScript(umdLocale(key, locale), { yad: { Yad: { regional: {} } } });
      const loaded = global.yad!.Yad.regional[key] as typeof locale;
      expect(loaded, key).toEqual(locale);
      expect(formatDate('DD, d MM yy', new Date(2026, 10, 20), loaded)).toBe(
        formatDate('DD, d MM yy', new Date(2026, 10, 20), locale));
    }
  });

  it('name the locale in a header comment that survives minifiers', () => {
    expect(umdLocale('ja', ja, 'Japanese').startsWith('/*! yad locale: Japanese (ja) */')).toBe(true);
    expect(umdLocale('x', ja, 'evil */ comment')).toContain('/*! yad locale: evil  comment (x) */');
  });
});
