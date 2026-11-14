# yad — Yet Another Datepicker

[![npm](https://img.shields.io/npm/v/@sandritsch91/yad)](https://www.npmjs.com/package/@sandritsch91/yad)
[![Tests](https://github.com/Sandritsch91/yad/actions/workflows/test.yml/badge.svg)](https://github.com/Sandritsch91/yad/actions/workflows/test.yml)

A dependency-free datepicker written in TypeScript, with an API modelled on
[jQuery UI's datepicker](https://api.jqueryui.com/datepicker/), without jQuery.

## Usage

```bash
npm install @sandritsch91/yad
```

```js
import { Yad } from '@sandritsch91/yad';
import '@sandritsch91/yad/yad.css';

// Attach to an <input> → popup; attach to a <div> → inline calendar
const dp = new Yad('#date', { dateFormat: 'yy-mm-dd', minDate: 0, maxDate: '+1m' });
```

### Without a build step

As an ES module:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/yad.css">
<script type="module">
  import { Yad } from 'https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/yad.js';
  new Yad('#date');
</script>
```

As a classic script, which sets `window.yad`:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/yad.css">
<script src="https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/yad.umd.js"></script>
<script>
  new yad.Yad('#date', { dateFormat: 'dd.mm.yy' });
</script>
```

Pin a version in production, e.g. `@sandritsch91/yad@0.1.0`.

| jQuery UI                                   | yad                               |
|---------------------------------------------|-----------------------------------|
| `$('#d').datepicker(opts)`                  | `new Yad('#d', opts)`             |
| `$('.d').datepicker(opts)`                  | `Yad.attach('.d', opts)`          |
| `$('#d').datepicker('option', 'minDate', 0)`| `dp.option('minDate', 0)`         |
| `$('#d').datepicker('getDate')`             | `dp.getDate()`                    |
| `$('#d').datepicker('setDate', '+1w')`      | `dp.setDate('+1w')`               |
| `show` / `hide` / `refresh` / `destroy`     | `dp.show()` … `dp.destroy()`      |
| `enable` / `disable` / `isDisabled`         | `dp.enable()` …                   |
| `widget`                                    | `dp.widget()`                     |
| `$.datepicker.setDefaults(...)`             | `Yad.setDefaults(...)`            |
| `$.datepicker.regional['de']`               | `Yad.regional.de`                 |
| `$.datepicker.formatDate / parseDate`       | `Yad.formatDate / Yad.parseDate`  |
| `$.datepicker.iso8601Week / noWeekends`     | `Yad.iso8601Week / Yad.noWeekends`|

### Time picker

Date and time picking modelled on the
[jQuery UI Timepicker addon](https://trentrichardson.com/examples/timepicker/), built in:

```js
Yad.datetimepicker('#when');                    // = new Yad('#when', { showTime: true })
Yad.timepicker('#at', { timeFormat: 'HH:mm' }); // = new Yad('#at', { timeOnly: true, ... })

new Yad('#meeting', {
  showTime: true,
  timeFormat: 'HH:mm',          // tokens: H HH h hh m mm s ss l t T tt TT
  stepMinute: 15,
  hourMin: 8,
  hourMax: 18,
  controlType: 'select',        // or 'slider' (default)
  minDateTime: new Date(2026, 10, 20, 9, 30),
});

dp.getDate();                   // Date including the time
dp.setDate(new Date(2026, 10, 20, 14, 30));
Yad.formatTime('hh:mm TT', { hour: 14, minute: 30 }); // "02:30 PM"
Yad.parseTime('HH:mm', '14:30');                      // { hour: 14, minute: 30, second: 0, millisec: 0 }
```

With the time picker, selecting a day keeps the popup open. **Now** selects the current date and time,
and **Done** or clicking outside closes it.

Time options: `showTime`, `timeOnly`, `timeFormat`, `separator`, `controlType`, `showHour`,
`showMinute`, `showSecond`, `showMillisec` (`null` = decided by `timeFormat`), `stepHour`, `stepMinute`,
`stepSecond`, `stepMillisec`, `hourMin`/`hourMax` (and the minute, second and millisecond equivalents),
`hour`, `minute`, `second`, `millisec` (initial time), `minDateTime`, `maxDateTime`, `altTimeFormat`,
`altSeparator`. The locale texts `timeOnlyTitle`, `timeText`, `hourText`, `minuteText`, `secondText`,
`millisecText`, `nowText`, `amNames`, `pmNames` and `timeFormat` are part of `Yad.regional`. The default
English locale uses 12-hour time (`hh:mm TT`). `en-GB`, `de` and `fr` use 24-hour time (`HH:mm`).

### Themes

Override the CSS custom properties (`.yad { --yad-accent: hotpink; }`) or load a bundled theme after `yad.css`:

```js
import 'bootstrap/dist/css/bootstrap.min.css';
import '@sandritsch91/yad/yad.css';
import '@sandritsch91/yad/themes/bootstrap5.css';
```

The **Bootstrap 5** theme takes its colours, radii, focus rings and shadows from Bootstrap's CSS
variables. A customised `$primary` and `data-bs-theme="dark"` therefore apply automatically. The
trigger button fits inside an `.input-group`, and the picker works inside `.modal`s.
Demo: `npm run dev`, then open http://localhost:5173/demo/bootstrap5.html.

### Options

The full reference with types and defaults is in [docs/options.md](docs/options.md).

Same names and semantics as jQuery UI: `altField`, `altFormat`, `appendText`, `autoSize`,
`beforeShow`, `beforeShowDay`, `buttonImage`, `buttonImageOnly`, `buttonText`, `calculateWeek`,
`changeMonth`, `changeYear`, `closeText`, `constrainInput`, `currentText`, `dateFormat`, `dayNames`,
`dayNamesMin`, `dayNamesShort`, `defaultDate`, `duration`, `firstDay`, `gotoCurrent`,
`hideIfNoPrevNext`, `isRTL`, `maxDate`, `minDate`, `monthNames`, `monthNamesShort`,
`navigationAsDateFormat`, `nextText`, `numberOfMonths`, `onChangeMonthYear`, `onClose`, `onSelect`,
`prevText`, `selectOtherMonths`, `shortYearCutoff`, `showAnim` (`'fade' | 'slide' | 'none'`),
`showButtonPanel`, `showCurrentAtPos`, `showMonthAfterYear`, `showOn`, `showOtherMonths`, `showWeek`,
`stepMonths`, `weekHeader`, `yearRange`, `yearSuffix`.

Differences from jQuery UI:

- Selecting a date always dispatches `input` and `change` events on the input (jQuery UI only fires `change` when there is no `onSelect`).
- Day cells are buttons in an ARIA grid. When focus is in the calendar, the arrow keys, Home/End, PageUp/PageDown (Shift for a year), Enter/Space and Escape work.
- jQuery UI's keyboard shortcuts on the input also work: Ctrl+arrows, PageUp/PageDown, Ctrl+Home, Ctrl+End and Enter. ArrowDown moves focus into the calendar.
- Theming uses CSS custom properties (`--yad-accent`, `--yad-bg` and so on). Dark mode follows `prefers-color-scheme`. Add `.yad--light` or `.yad--dark` to the widget to force a mode.
- Bundled locales: `Yad.regional.en` (also `''` and `'en-US'`, the default), `'en-GB'`, `de` and `fr`. Use one with `Yad.setDefaults(Yad.regional.fr)` or `new Yad(el, { ...Yad.regional.fr })`.
- The `dialog` method and `showOptions` are not implemented.

## Documentation

Full documentation is in [`docs/`](docs/README.md):

- [Getting started](docs/getting-started.md): installation, ES module / `<script>` / bundler, popup vs. inline
- [Options](docs/options.md): every option with type, default and description
- [Methods](docs/methods.md): instance and static methods, named exports
- [Events and callbacks](docs/events.md): `onSelect`, `onClose`, `beforeShowDay`, DOM events
- [Date and time formats](docs/formats.md): format tokens, parsing, relative dates
- [Time picker](docs/time-picker.md): date + time and time-only pickers
- [Localisation](docs/localization.md): bundled locales and writing your own
- [Theming](docs/theming.md): CSS custom properties, dark mode, Bootstrap 5, CSS classes
- [Keyboard and accessibility](docs/keyboard-and-accessibility.md)
- [Migrating from jQuery UI](docs/migrating-from-jquery-ui.md)

## Development

```bash
npm install
npm run dev      # demo page at http://localhost:5173
npm test
npm run build    # dist/: ESM, UMD, CSS, .d.ts
```

## License

[MIT](LICENSE)
