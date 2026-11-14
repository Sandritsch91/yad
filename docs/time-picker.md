# Time picker

yad includes a time picker modelled on the [jQuery UI Timepicker addon](https://trentrichardson.com/examples/timepicker/)
by Trent Richardson. It uses the same option names, format tokens and behaviour.

## Date and time

```js
Yad.datetimepicker('#when');
// same as
new Yad('#when', { showTime: true });
```

The calendar gets a time section with a readout and one slider per unit, plus a button panel with **Now** and
**Done**. The input contains date and time separated by `separator`:

```
11/20/2026 03:05 PM          (English, default)
20.11.2026 15:05             (German locale)
```

How it behaves:

- **Selecting a day keeps the popup open**, so the time can be set next. **Done**, Escape, Tab or clicking
  outside closes it. Enter in the input selects the highlighted day and closes.
- **Dragging a slider** updates the input live and fires `input` events. **Releasing** it commits: `onSelect` is
  called and `change` fires.
- **Now** selects the current date and time.
- Changing the time before a day is selected selects the highlighted day.
- `getDate()` returns a `Date` including the time. `setDate()` accepts a `Date` (its time is used) or a
  `'date time'` string.

## Time only

```js
Yad.timepicker('#at', { timeFormat: 'HH:mm' });
// same as
new Yad('#at', { timeOnly: true, timeFormat: 'HH:mm' });
```

No calendar is shown; the header shows `timeOnlyTitle` ("Choose Time"). The input contains only the time.
`getDate()` returns today's date with the selected time.

## Choosing the units

Which controls appear is decided by `timeFormat`:

| `timeFormat` | Controls |
|---|---|
| `'HH:mm'` | Hour, minute |
| `'hh:mm TT'` | Hour, minute (hour dropdown labels like "03 PM") |
| `'HH:mm:ss'` | Hour, minute, second |
| `'HH:mm:ss.l'` | Hour, minute, second, millisecond |

Override with `showHour`, `showMinute`, `showSecond`, `showMillisec` (`true`/`false`; `null` = from the format).

## Sliders or dropdowns

```js
new Yad('#when', { showTime: true, controlType: 'select' });
```

| `controlType` | Control |
|---|---|
| `'slider'` (default) | `<input type="range">`, keyboard accessible with the arrow keys |
| `'select'` | `<select>` with one option per step |

## Steps

```js
new Yad('#when', { showTime: true, stepMinute: 15 });   // 00, 15, 30, 45
```

`stepHour`, `stepMinute`, `stepSecond` and `stepMillisec` default to `1`. The steps count from the unit's
minimum (`hourMin`, `minuteMin`, ...). Any time that is set, typed or passed to `setDate()` is snapped to the
nearest step.

## Limiting the time

### Every day: `hourMin` / `hourMax` and friends

```js
// Office hours: 08:00 to 18:45
new Yad('#when', { showTime: true, hourMin: 8, hourMax: 18, stepMinute: 15 });
```

| Options | Defaults |
|---|---|
| `hourMin`, `hourMax` | `0`, `23` |
| `minuteMin`, `minuteMax` | `0`, `59` |
| `secondMin`, `secondMax` | `0`, `59` |
| `millisecMin`, `millisecMax` | `0`, `999` |

### An absolute range: `minDateTime` / `maxDateTime`

```js
new Yad('#when', {
  showTime: true,
  minDateTime: new Date(2026, 10, 20, 9, 30),   // 20 Nov 2026 09:30
  maxDateTime: new Date(2026, 10, 22, 17, 0),   // 22 Nov 2026 17:00
});
```

- Days before 20 November and after 22 November are disabled (like `minDate`/`maxDate`; when both are set,
  the narrower range wins).
- On **20 November**, hours start at 9. While the hour is 9, minutes start at 30. At 10:00 or later all minutes
  are allowed again.
- On **22 November**, the same applies to the upper bound.
- Values outside the range are clamped: `setDate(new Date(2026, 10, 20, 8, 0))` results in 09:30.

## Initial time

When the value is empty, the time starts at `hour`, `minute`, `second`, `millisec` (all `0` by default),
clamped into the allowed range.

```js
new Yad('#when', { showTime: true, hour: 9, minute: 0 });
```

## Alternative field

`altField` receives date and time too. Use `altTimeFormat` and `altSeparator` for a machine-readable copy:

```js
new Yad('#when', {
  showTime: true,
  altField: '#when-iso',
  altFormat: 'yy-mm-dd',
  altTimeFormat: 'HH:mm:ss',
  altSeparator: 'T',          // → 2026-11-20T15:04:05
});
```

## Typing

Users can type the value. yad parses `date + separator + time`, and copes with separators that also appear
inside the formats (e.g. `dateFormat: 'd M yy'` with a space separator). With `constrainInput` (default)
only characters of the date format, the time format, the separator and the am/pm names can be typed.

## Locale texts

| Option | en | de | fr |
|---|---|---|---|
| `timeFormat` | `hh:mm TT` | `HH:mm` | `HH:mm` |
| `timeOnlyTitle` | Choose Time | Zeit wählen | Choisir une heure |
| `timeText` | Time | Zeit | Heure |
| `hourText` | Hour | Stunde | Heures |
| `minuteText` | Minute | Minute | Minutes |
| `secondText` | Second | Sekunde | Secondes |
| `millisecText` | Millisecond | Millisekunde | Millisecondes |
| `nowText` | Now | Jetzt | Maintenant |
| `amNames` | `AM`, `A` | `vorm.`, `AM`, `A` | `AM`, `A` |
| `pmNames` | `PM`, `P` | `nachm.`, `PM`, `P` | `PM`, `P` |

`en-GB` uses the English texts with `HH:mm`. Locales you write yourself may leave out the time texts; the
English ones are used then. See [Localisation](localization.md).

## Differences from the Timepicker addon

- It is part of yad: there is no separate plugin to load.
- Timezone support (`z`, `Z` tokens, `timezoneList`) is not implemented.
- `altFieldTimeOnly`, `showTimepicker`, `oneLine` and `pickerTimeFormat` are not implemented. Use
  `altTimeFormat`/`altSeparator` for the alternative field.
- Sliders are native `<input type="range">` elements instead of jQuery UI sliders.

## Example: appointment booking

```js
import { de } from '@sandritsch91/yad/i18n/de';

new Yad('#appointment', {
  ...de,
  showTime: true,
  minDate: 1,                       // from tomorrow
  maxDate: '+2m',
  beforeShowDay: Yad.noWeekends,    // Monday to Friday
  hourMin: 8,
  hourMax: 17,
  stepMinute: 30,                   // half-hour slots
  controlType: 'select',
  altField: '#appointment-iso',
  altFormat: 'yy-mm-dd',
  altTimeFormat: 'HH:mm',
  altSeparator: 'T',
});
```
