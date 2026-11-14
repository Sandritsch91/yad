# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- `Yad.range(from, to, options?)` links a start and an end picker: the end cannot be before the start, the start
  cannot be after the end (including the time with `showTime`), and both calendars highlight the range
  (`.yad-range-start`, `.yad-range-end`, `.yad-in-range`, `--yad-range-bg`). See `docs/date-ranges.md`.

## [1.1.0] - 2026-11-14

> **Note:** this release contains a breaking change (see *Changed*): `en-GB`, `de` and `fr` must now be loaded
> like every other locale. It is released as a minor version because 1.0.0 was only available for about an hour.

### Added

- 78 more locales, for 82 in total: Afrikaans, Albanian, Arabic, Armenian, Azerbaijani, Basque, Belarusian, Bengali,
  Bosnian, Bulgarian, Catalan, Chinese (Simplified; Traditional for Taiwan and Hong Kong), Croatian, Czech, Danish,
  Dutch (+ Belgium), English (Australia, Canada, India, Ireland, New Zealand, South Africa), Esperanto, Estonian,
  Faroese, Filipino, Finnish, French (Belgium, Canada, Switzerland), Galician, Georgian, German (Austria, Switzerland),
  Greek, Hebrew, Hindi, Hungarian, Icelandic, Indonesian, Irish, Italian (+ Switzerland), Japanese, Kazakh, Korean,
  Latvian, Lithuanian, Macedonian, Malay, Norwegian (Bokmål, Nynorsk), Persian, Polish, Portuguese (Portugal, Brazil),
  Romanian, Russian, Serbian (Cyrillic, Latin), Slovak, Slovenian, Spanish (Spain, Argentina, Mexico), Swahili,
  Swedish, Tamil, Thai, Turkish, Ukrainian, Urdu, Uzbek, Vietnamese and Welsh.
- New entry points so only the languages you use are loaded: `@sandritsch91/yad/i18n/<key>` (one locale, about 1 KB),
  `@sandritsch91/yad/i18n` (all locales and a `locales` record) and `dist/yad-i18n.umd.js` (all locales for `<script>`
  tags, registered on `yad.Yad.regional`).
- One classic-script file per locale, `dist/i18n/<key>.umd.js` (about 2 KB), that registers itself on
  `yad.Yad.regional` when loaded after `yad.umd.js`, like jQuery UI's `datepicker-xx.js` files.
- `scripts/generate-locales.mjs` (`npm run generate:locales`) generates the locales from Unicode CLDR data.
- Language selector on the demo pages.

### Changed

- **Breaking:** only English is built into `yad.js` (the default, `Yad.regional.en`, also `''` and `en-US`). `en-GB`,
  `de` and `fr` are no longer built in and the core package no longer exports `enGB`, `de` and `fr`: load them like
  every other language, e.g. `import { de } from '@sandritsch91/yad/i18n/de'` and `Yad.regional.de = de`, or
  `dist/i18n/de.umd.js` for `<script>` tags. The core bundle is about 2 KB smaller.

## [1.0.0] - 2026-11-14

First stable release.

### Added

- Time picker, modelled on the jQuery UI Timepicker addon: `showTime` for date and time, `timeOnly` for time only,
  plus `Yad.datetimepicker()` and `Yad.timepicker()` shortcuts.
- Time options `timeFormat`, `separator`, `controlType` (`'slider'` or `'select'`), `showHour`/`showMinute`/
  `showSecond`/`showMillisec`, `stepHour`/`stepMinute`/`stepSecond`/`stepMillisec`, `hourMin`/`hourMax` (and the
  minute, second and millisecond equivalents), `hour`/`minute`/`second`/`millisec`, `minDateTime`, `maxDateTime`,
  `altTimeFormat` and `altSeparator`.
- `Yad.formatTime()` and `Yad.parseTime()` with the addon's format tokens (`HH`, `hh`, `mm`, `ss`, `l`, `TT`, ...).
- Time texts in all bundled locales: `timeOnlyTitle`, `timeText`, `hourText`, `minuteText`, `secondText`,
  `millisecText`, `nowText`, `amNames`, `pmNames` and `timeFormat`.
- Time picker styles in the base stylesheet and the Bootstrap 5 theme.
- `CHANGELOG.md` is included in the npm package.
- `theme` option: `'light'` (default), `'dark'` or `'auto'` (follow the operating system). The browser's own
  controls inside the picker follow it through CSS `color-scheme`.

### Changed

- **Breaking:** the picker no longer turns dark automatically when the operating system is in dark mode, which
  made it dark on light pages. It is light by default; use `theme: 'auto'` for the previous behaviour.
  The `yad--dark` and `yad--light` classes still force a mode.

### Fixed

- Time formats: `''` inside a quoted literal now produces a quote, as in date formats.

## [0.1.1] - 2026-11-10

### Added

- Separate CommonJS build `dist/yad.cjs` for Node's `require()`.
- `unpkg` and `jsdelivr` entry points in `package.json`, so bare CDN URLs resolve to the classic-script bundle.
- README section on using yad without a build step (ES module and classic `<script>`).
- Demo page `demo/umd.html` using a plain `<script>` tag.
- npm version badge in the README.
- Releases are published from GitHub Actions with npm provenance.

### Changed

- The classic-script (UMD) bundle is now `dist/yad.umd.js` (was `dist/yad.umd.cjs`), so CDNs serve it with a JavaScript MIME type. It still sets `window.yad`.

## [0.1.0] - 2026-11-10

### Added

- Initial release of yad, a dependency-free datepicker with a jQuery UI compatible API.
- Popup mode when attached to an `<input>`, inline mode for any other element.
- jQuery UI options, including `dateFormat`, `minDate`/`maxDate` with relative dates (`'+1m -7d'`), `changeMonth`/`changeYear`, `numberOfMonths`, `showWeek`, `showButtonPanel`, `showOn` with a trigger button, `altField`/`altFormat`, `beforeShowDay` and `isRTL`.
- Callbacks: `onSelect`, `onClose`, `onChangeMonthYear` and `beforeShow`.
- Methods: `option`, `getDate`, `setDate`, `show`, `hide`, `refresh`, `enable`, `disable`, `isDisabled`, `widget` and `destroy`, plus `Yad.attach()` for multiple elements.
- Utilities: `Yad.formatDate`, `Yad.parseDate`, `Yad.iso8601Week`, `Yad.noWeekends` and `Yad.setDefaults`.
- Locales: English (`en`, default, and `en-GB`), German (`de`) and French (`fr`) via `Yad.regional`.
- Keyboard-navigable ARIA grid, plus jQuery UI's keyboard shortcuts on the input.
- Theming with CSS custom properties, automatic dark mode, and a Bootstrap 5 theme (`themes/bootstrap5.css`).
- The popup mounts inside enclosing modals and `<dialog>` elements, so focus traps keep working.
- ES module and UMD builds with TypeScript type definitions.
- GitHub Actions workflow running the type check, tests and build on Node 22, 24 and 26.

[Unreleased]: https://github.com/Sandritsch91/yad/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Sandritsch91/yad/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/Sandritsch91/yad/compare/v0.1.1...v1.0.0
[0.1.1]: https://github.com/Sandritsch91/yad/compare/22d5295...v0.1.1
[0.1.0]: https://github.com/Sandritsch91/yad/commits/22d5295
