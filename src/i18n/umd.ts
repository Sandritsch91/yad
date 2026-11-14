/**
 * Entry of dist/yad-i18n.umd.js: load it after yad.umd.js with a <script> tag and every locale is
 * registered on `yad.Yad.regional` (also available as `window.yadI18n.locales`).
 */
import { locales } from './index';

export { locales };

const yad = (globalThis as { yad?: { Yad?: { regional: Record<string, unknown> } } }).yad;
if (yad?.Yad) {
  Object.assign(yad.Yad.regional, locales);
}
