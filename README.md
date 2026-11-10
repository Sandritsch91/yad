# yad — Yet Another Datepicker

[![Tests](https://github.com/Sandritsch91/yad/actions/workflows/test.yml/badge.svg)](https://github.com/Sandritsch91/yad/actions/workflows/test.yml)

A dependency-free datepicker written in TypeScript, with an API modelled on
[jQuery UI's datepicker](https://api.jqueryui.com/datepicker/), without jQuery.

## Usage

```js
import { Yad } from 'yad';
import 'yad/yad.css';

// Attach to an <input> → popup; attach to a <div> → inline calendar
const dp = new Yad('#date', { dateFormat: 'yy-mm-dd', minDate: 0, maxDate: '+1m' });
```

Via `<script>` (UMD): `new yad.Yad('#date', { ... })`.

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

### Themes

Override the CSS custom properties (`.yad { --yad-accent: hotpink; }`) or load a bundled theme after `yad.css`:

```js
import 'bootstrap/dist/css/bootstrap.min.css';
import 'yad/yad.css';
import 'yad/themes/bootstrap5.css';
```

The **Bootstrap 5** theme takes its colours, radii, focus rings and shadows from Bootstrap's CSS
variables. A customised `$primary` and `data-bs-theme="dark"` therefore apply automatically. The
trigger button fits inside an `.input-group`, and the picker works inside `.modal`s.
Demo: `npm run dev`, then open http://localhost:5173/demo/bootstrap5.html.

### Options

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

## Development

```bash
npm install
npm run dev      # demo page at http://localhost:5173
npm test
npm run build    # dist/: ESM, UMD, CSS, .d.ts
```

## License

[MIT](LICENSE)
