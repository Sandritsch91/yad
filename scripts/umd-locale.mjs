/**
 * Wraps one locale object in a UMD script, like jQuery UI's datepicker-xx.js files.
 *
 * Loaded with a <script> tag after yad.umd.js, it registers the locale as `yad.Yad.regional[key]`. It also stores it
 * as `yadI18n.locales[key]` (the same place as dist/yad-i18n.umd.js), so a locale loaded before yad.umd.js can be
 * registered later. With CommonJS or AMD it simply exports the locale object.
 *
 * @param {string} key Key in Yad.regional, e.g. 'pt-BR'
 * @param {object} locale The locale settings
 * @param {string} [label] Human-readable name for the header comment
 * @returns {string} JavaScript source
 */
export function umdLocale(key, locale, label = key) {
  const k = JSON.stringify(key);
  return `/*! yad locale: ${label.replace(/\*\//g, '')} (${key}) */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    var locale = factory();
    root.yadI18n = root.yadI18n || {};
    root.yadI18n.locales = root.yadI18n.locales || {};
    root.yadI18n.locales[${k}] = locale;
    if (root.yad && root.yad.Yad) {
      root.yad.Yad.regional[${k}] = locale;
    }
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  return ${JSON.stringify(locale, null, 2).replace(/\n/g, '\n  ')};
}));
`;
}
