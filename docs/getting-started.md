# Getting started

## Installation

### With npm (bundlers such as Vite, webpack, Rollup, esbuild)

```bash
npm install @sandritsch91/yad
```

```js
import { Yad } from '@sandritsch91/yad';
import '@sandritsch91/yad/yad.css';

new Yad('#date');
```

The package ships:

| File | Format | Used by |
|---|---|---|
| `dist/yad.js` | ES module | `import`, bundlers, `<script type="module">` |
| `dist/yad.cjs` | CommonJS | Node's `require()` |
| `dist/yad.umd.js` | UMD | Classic `<script src>`, sets `window.yad` |
| `dist/yad.css` | CSS | Base styles (required) |
| `dist/themes/bootstrap5.css` | CSS | Optional [Bootstrap 5 theme](theming.md#bootstrap-5-theme) |
| `dist/*.d.ts` | TypeScript | Type definitions (picked up automatically) |

### Without a build step: ES module from a CDN

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sandritsch91/yad@0.1.1/dist/yad.css">

<input id="date">

<script type="module">
  import { Yad } from 'https://cdn.jsdelivr.net/npm/@sandritsch91/yad@0.1.1/dist/yad.js';
  new Yad('#date');
</script>
```

### Without a build step: classic `<script>` tag

The UMD build puts everything on the global `yad` object:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sandritsch91/yad@0.1.1/dist/yad.css">
<script src="https://cdn.jsdelivr.net/npm/@sandritsch91/yad@0.1.1/dist/yad.umd.js"></script>

<input id="date">

<script>
  var Yad = yad.Yad;
  new Yad('#date', { dateFormat: 'dd.mm.yy' });
</script>
```

Pin an exact version (`@0.1.1`) in production so an update cannot change your page unexpectedly.

> **ES modules need a web server.** Browsers block `<script type="module">` on pages opened from disk
> (`file://`), and some web servers send `.ts` or unknown files with the wrong type. Serve the page over HTTP,
> e.g. with `npx serve`.

## Popup or inline

What yad renders depends on the element you attach it to:

| Target | Result |
|---|---|
| `<input>` | **Popup**: opens below the input on focus (or with a [trigger button](options.md#input-and-trigger)), writes the date into the input. |
| Any other element (`<div>`, `<span>`, ...) | **Inline**: the calendar is always visible inside the element. Read the value with `getDate()` or `onSelect`. |

```html
<input id="popup">
<div id="inline"></div>

<script type="module">
  import { Yad } from '@sandritsch91/yad';

  new Yad('#popup');
  new Yad('#inline', {
    onSelect(dateText, inst) {
      console.log(dateText, inst.getDate());
    },
  });
</script>
```

An inline calendar starts with `defaultDate` (today, unless set) selected, as in jQuery UI.

## Creating instances

```js
// One element: a selector or an element
const dp = new Yad('#date', options);
const dp2 = new Yad(document.querySelector('#other'), options);

// Several elements at once, like $('.date').datepicker(options)
const pickers = Yad.attach('.date', options);   // returns Yad[]

// Find the instance of an element later
Yad.getInstance('#date');                      // Yad | undefined
```

Calling `new Yad()` on an element that already has a picker does not create a second one. It applies the
options to the existing instance and returns it.

## Setting defaults for every picker

```js
Yad.setDefaults({ dateFormat: 'yy-mm-dd', firstDay: 1 });
Yad.setDefaults(Yad.regional.de);   // German everywhere
```

`setDefaults` only affects pickers created afterwards.

## Reading and writing the value

```js
dp.getDate();              // Date, or null when empty
dp.setDate('2026-12-24');  // a string in dateFormat
dp.setDate(new Date());    // a Date
dp.setDate('+1w');         // relative to today
dp.setDate(null);          // clear
```

For a popup the input's `value` is the formatted date, so it is submitted with a form like any other field.
Use [`altField`](options.md#alternative-field) to submit a second, machine-readable format (e.g. ISO) at the
same time.

## Time picker

```js
Yad.datetimepicker('#when');   // date and time
Yad.timepicker('#at');         // time only
```

See [Time picker](time-picker.md).

## Next steps

- All configuration: [Options](options.md)
- Translations: [Localisation](localization.md)
- Colours and dark mode: [Theming](theming.md)
