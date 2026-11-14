# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/Sandritsch91/yad/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Sandritsch91/yad/compare/v0.1.1...v1.0.0
[0.1.1]: https://github.com/Sandritsch91/yad/compare/22d5295...v0.1.1
[0.1.0]: https://github.com/Sandritsch91/yad/commits/22d5295
