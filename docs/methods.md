# Methods

```js
import { Yad } from '@sandritsch91/yad';

const dp = new Yad('#date', { dateFormat: 'yy-mm-dd' });
dp.setDate('+1w').show();   // setters and show/hide return the instance, so calls can be chained
```

## Constructor

### `new Yad(target, options?)`

| Parameter | Type | Description |
|---|---|---|
| `target` | `string \| HTMLElement` | A CSS selector (first match) or an element. An `<input>` gets a popup, any other element an inline calendar. |
| `options` | `Partial<YadOptions>` | See [Options](options.md). Merged over `Yad.defaults`. |

Throws `Error('Yad: element not found: …')` if the selector matches nothing.

If the element already has a picker, the options are applied to it and the **existing** instance is returned.

## Instance methods

### `option()`

| Call | Returns | Description |
|---|---|---|
| `option()` | `YadOptions` | A copy of all current options. |
| `option(name)` | the value | One option. |
| `option(name, value)` | `this` | Set one option. |
| `option({ ... })` | `this` | Set several options. |

Changing an option re-renders the picker. When the change affects how the value is written (e.g.
`dateFormat`, `minDate`, a new locale, time settings), the current value is re-clamped and reformatted.

```js
dp.option('dateFormat');                 // 'yy-mm-dd'
dp.option('dateFormat', 'dd.mm.yy');     // input changes from 2026-12-24 to 24.12.2026
dp.option(fr);                           // switch language (fr from '@sandritsch91/yad/i18n/fr')
```

### `getDate()`

Returns the selected date as a new `Date`, or `null` when nothing is selected.

- For a popup the value is read from the input, so text the user typed is included. Text that cannot be
  parsed is ignored and the previous selection is returned.
- Without the time picker the time is `00:00:00`. With the time picker it is the selected time.
- Changing the returned object does not affect the picker.

### `setDate(date)`

Sets the selected date. `date` is a [date spec](options.md): a `Date`, a number of days from today, a
string in `dateFormat`, a relative string such as `'+1m -1d'`, or `null`/`''` to clear.

- The date is clamped into `minDate`/`maxDate`.
- With the time picker, the time of a `Date` and a `'date time'` string are used too.
- Does **not** fire `onSelect` or `input`/`change` events (it is a programmatic change).
- Returns `this`.

```js
dp.setDate(new Date(2026, 11, 24));
dp.setDate('2026-12-24');
dp.setDate(3);          // in three days
dp.setDate(null);       // clear
```

### `show()` / `hide()`

Open or close the popup. No effect on inline calendars or disabled pickers. `hide()` calls `onClose`.
Both return `this`.

### `isVisible()`

`true` when the popup is open. Always `true` for inline calendars.

### `refresh()`

Re-render the calendar. Call it after something `beforeShowDay` depends on has changed, e.g. after loading
booked dates from a server.

```js
fetch('/api/booked').then((r) => r.json()).then((dates) => {
  booked = new Set(dates);
  dp.refresh();
});
```

### `enable()` / `disable()` / `isDisabled()`

`disable()` closes the popup, disables the input and the trigger button, and makes an inline calendar
non-interactive (`.yad--disabled`). `enable()` reverses it. A picker attached to an input that is already
`disabled` starts disabled.

### `widget()`

The calendar's root element (`<div class="yad">`). For popups it is created when the picker is created and
mounted on first `show()`.

### `destroy()`

Removes the calendar, the trigger button and the appended text, removes all event listeners, and restores
the input's attributes. Afterwards `Yad.getInstance(element)` returns `undefined` and a new picker can be
attached.

## Instance properties

| Property | Type | Description |
|---|---|---|
| `element` | `HTMLElement` | The element the picker is attached to. |
| `input` | `HTMLInputElement \| null` | The input for popups, `null` for inline calendars. |
| `inline` | `boolean` | Whether this is an inline calendar. |

## Static methods and properties

### `Yad.setDefaults(options)`

Changes `Yad.defaults` for all pickers created afterwards.

```js
Yad.setDefaults({ ...de, showButtonPanel: true });   // de from '@sandritsch91/yad/i18n/de'
```

### `Yad.defaults`

The current default options (`YadOptions`).

### `Yad.regional`

The registered locales. Built in: `''`, `en`, `en-US` (English). Add others with `Yad.regional.de = de` or
`Object.assign(Yad.regional, locales)`. See [Localisation](localization.md).

### `Yad.getInstance(target)`

The picker attached to an element (selector or element), or `undefined`.

### `Yad.attach(selector, options?)`

Creates a picker for every element matching a selector (or every element of an iterable) and returns them
as an array, like `$(selector).datepicker(options)`.

### `Yad.datetimepicker(target, options?)` / `Yad.timepicker(target, options?)`

Shortcuts for `new Yad(target, { ...options, showTime: true })` and `{ ...options, timeOnly: true }`.
See [Time picker](time-picker.md).

### `Yad.formatDate(format, date, settings?)`

Formats a date. See [Date and time formats](formats.md#formatdateformat-date-settings).

### `Yad.parseDate(format, text, settings?)`

Parses a date string, throwing on invalid input. See [Date and time formats](formats.md#parsedateformat-text-settings).

### `Yad.formatTime(format, time, settings?)` / `Yad.parseTime(format, text, settings?)`

Format and parse times. See [Date and time formats](formats.md#time-functions).

### `Yad.iso8601Week(date)`

The ISO 8601 week number (weeks start on Monday, week 1 contains the first Thursday). The default
`calculateWeek`.

### `Yad.noWeekends(date)`

Returns `[false, '']` for Saturdays and Sundays and `[true, '']` otherwise. Ready to use as `beforeShowDay`.

## Named exports

The ES module and CommonJS builds export:

| Export | Description |
|---|---|
| `Yad` | The class. |
| `formatDate`, `parseDate`, `iso8601Week`, `noWeekends` | Same as the static methods. |
| `formatTime`, `parseTime` | Same as the static methods. |
| `determineDate(spec, fallback, format?, settings?)` | Resolves a [date spec](options.md) to a `Date` (or `fallback`). |
| `en` | The built-in English locale. |

The other locales are separate entry points: `@sandritsch91/yad/i18n/<key>` exports one locale (e.g.
`import { ptBR } from '@sandritsch91/yad/i18n/pt-BR'`), and `@sandritsch91/yad/i18n` exports all of them plus a
`locales` record keyed like `Yad.regional`. See [Localisation](localization.md#loading-more-locales).

TypeScript types: `YadOptions`, `RegionalSettings`, `TimeRegionalSettings`, `TimeControlType`, `YadTheme`, `DateSpec`,
`BeforeShowDayResult`, `FormatSettings`, `ParseSettings`, `TimeParts`, `TimeSettings`.

The UMD build exposes the same names on `window.yad` (`yad.Yad`, `yad.formatDate`, `yad.de`, ...).
