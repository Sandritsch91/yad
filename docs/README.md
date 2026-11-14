# yad documentation

yad (Yet Another Datepicker) is a dependency-free date and time picker for the browser. Its API follows
[jQuery UI's datepicker](https://api.jqueryui.com/datepicker/) and the
[jQuery UI Timepicker addon](https://trentrichardson.com/examples/timepicker/), without jQuery.

## Contents

| Guide | What it covers |
|---|---|
| [Getting started](getting-started.md) | Installing, loading (bundler, ES module, `<script>` tag), popup vs. inline |
| [Options](options.md) | Every option with its type, default and behaviour |
| [Methods](methods.md) | Instance methods, static methods and properties, named exports |
| [Events and callbacks](events.md) | `onSelect`, `onClose`, `beforeShowDay`, ... and the DOM events yad fires |
| [Date and time formats](formats.md) | Format tokens, `formatDate` / `parseDate` / `formatTime` / `parseTime`, relative dates |
| [Time picker](time-picker.md) | Date + time and time-only pickers, steps, ranges, limits |
| [Localisation](localization.md) | Bundled locales, switching language, writing your own locale |
| [Theming](theming.md) | CSS custom properties, dark mode, the Bootstrap 5 theme, CSS classes |
| [Keyboard and accessibility](keyboard-and-accessibility.md) | Keyboard shortcuts and ARIA structure |
| [Migrating from jQuery UI](migrating-from-jquery-ui.md) | Mapping jQuery UI calls to yad, and the differences |

## A first example

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/yad.css">

<input id="date">

<script type="module">
  import { Yad } from 'https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/yad.js';

  const dp = new Yad('#date', { dateFormat: 'yy-mm-dd', minDate: 0 });

  dp.option('maxDate', '+3m');
  dp.getDate();
</script>
```
