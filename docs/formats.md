# Date and time formats

yad uses jQuery UI's date format tokens and the Timepicker addon's time format tokens, so format strings
from existing jQuery UI code work unchanged.

## Date format tokens

| Token | Output | Example (Tue 3 Feb 2026) |
|---|---|---|
| `d` | Day of month, no leading zero | `3` |
| `dd` | Day of month, two digits | `03` |
| `o` | Day of year, no leading zeros | `34` |
| `oo` | Day of year, three digits | `034` |
| `D` | Day name, short (`dayNamesShort`) | `Tue` |
| `DD` | Day name, long (`dayNames`) | `Tuesday` |
| `m` | Month, no leading zero | `2` |
| `mm` | Month, two digits | `02` |
| `M` | Month name, short (`monthNamesShort`) | `Feb` |
| `MM` | Month name, long (`monthNames`) | `February` |
| `y` | Year, two digits | `26` |
| `yy` | Year, four digits | `2026` |
| `@` | Unix timestamp in milliseconds | `1770073200000` (in UTC+1) |
| `!` | Windows ticks (100 ns since 0001-01-01) | `639056700000000000` (in UTC+1) |
| `'...'` | Literal text | `'day' d` → `day 3` |
| `''` | A single quote | `d''m` → `3'2` |

Any other character is copied as is.

> **Watch out:** `yy` is the **four**-digit year and `y` the two-digit year. This is the opposite of many other
> libraries (and of the time tokens, where doubling means leading zeros).

### Common formats

| Format | Example |
|---|---|
| `'mm/dd/yy'` | `02/03/2026` (default, US) |
| `'dd/mm/yy'` | `03/02/2026` (UK, FR) |
| `'dd.mm.yy'` | `03.02.2026` (DE) |
| `'yy-mm-dd'` | `2026-02-03` (ISO 8601) |
| `'d M yy'` | `3 Feb 2026` |
| `'DD, d MM yy'` | `Tuesday, 3 February 2026` |
| `'D, dd M yy'` | `Tue, 03 Feb 2026` (RFC 2822) |

## Time format tokens

| Token | Output | Example (15:07:05.042) |
|---|---|---|
| `H` | Hour, 0–23, no leading zero | `15` |
| `HH` | Hour, 00–23 | `15` |
| `h` | Hour, 1–12, no leading zero | `3` |
| `hh` | Hour, 01–12 | `03` |
| `m` | Minute, no leading zero | `7` |
| `mm` | Minute, two digits | `07` |
| `s` | Second, no leading zero | `5` |
| `ss` | Second, two digits | `05` |
| `l` | Milliseconds, three digits | `042` |
| `t` | First letter of the am/pm name, lower case | `p` |
| `T` | First letter of the am/pm name, upper case | `P` |
| `tt` | am/pm name, lower case | `pm` |
| `TT` | am/pm name, upper case | `PM` |
| `'...'` | Literal text | `HH'h'mm` → `15h07` |

The am/pm names come from `amNames[0]` and `pmNames[0]` of the locale.

The tokens in `timeFormat` also decide which controls the time picker shows: `'HH:mm'` shows hour and minute
sliders, `'HH:mm:ss'` adds seconds.

## Date functions

### `formatDate(format, date, settings?)`

```js
import { de } from '@sandritsch91/yad/i18n/de';

Yad.formatDate('DD, d MM yy', new Date(2026, 1, 3));      // 'Tuesday, 3 February 2026'
Yad.formatDate('DD, d MM yy', new Date(2026, 1, 3), de);  // 'Dienstag, 3 Februar 2026'
Yad.formatDate('yy-mm-dd', null);                                     // ''
```

`settings` can provide `dayNames`, `dayNamesShort`, `monthNames` and `monthNamesShort`. A locale object
works as is.

### `parseDate(format, text, settings?)`

```js
Yad.parseDate('yy-mm-dd', '2026-02-03');               // Date(2026, 1, 3)
Yad.parseDate('d MM yy', '3 february 2026');           // names are case-insensitive
Yad.parseDate('d. MM yy', '3. März 2026', de);       // de from '@sandritsch91/yad/i18n/de'
Yad.parseDate('dd/mm/y', '03/02/70', { shortYearCutoff: 50 }); // 1970
Yad.parseDate('yy-mm-dd', '');                         // null
```

Throws an `Error` for invalid input, with jQuery UI's messages:

| Message | Cause |
|---|---|
| `Missing number at position N` | A digit was expected. |
| `Unknown name at position N` | No day or month name matched. |
| `Unexpected literal at position N` | A separator or literal did not match. |
| `Extra/unparsed characters found in date: …` | Text left over after the format. Trailing spaces are allowed. |
| `Invalid date` | The parts do not form a real date, e.g. `2026-02-30`. |
| `Invalid arguments` | `format` or `text` is `null`/`undefined`. |

Two-digit years use `shortYearCutoff` (default `'+10'`): years up to the current year + 10 belong to this
century, later ones to the previous century.

### Relative dates

Options that take a [date spec](options.md) (`minDate`, `maxDate`, `defaultDate`) and `setDate()` accept
offsets from today:

| Spec | Meaning |
|---|---|
| `0` | Today |
| `7` or `'+7'` or `'+7d'` | In 7 days |
| `'-1w'` | A week ago |
| `'+1m'` | In one month (clamped to the month's last day: 31 Jan + 1m = 28/29 Feb) |
| `'+1y'` | In one year |
| `'+1m +7d'` | In one month and a week |

Strings are first parsed with `dateFormat`; only if that fails are they read as offsets.

The named export `determineDate(spec, fallback, format?, settings?)` performs the same resolution.

## Time functions

### `formatTime(format, time, settings?)`

`time` is an object with `hour`, `minute`, `second` and `millisec` (missing parts are `0`).

```js
Yad.formatTime('HH:mm', { hour: 15, minute: 7 });            // '15:07'
Yad.formatTime('hh:mm TT', { hour: 15, minute: 7 });         // '03:07 PM'
Yad.formatTime('h:mm tt', { hour: 0, minute: 30 });          // '12:30 am'
Yad.formatTime('hh:mm TT', { hour: 9 }, de);                 // '09:00 VORM.' (de locale)
```

### `parseTime(format, text, settings?)`

Returns `{ hour, minute, second, millisec }`, or `null` if the text does not match. Unlike `parseDate` it does
not throw (same as the Timepicker addon).

```js
Yad.parseTime('HH:mm', '15:07');           // { hour: 15, minute: 7, second: 0, millisec: 0 }
Yad.parseTime('hh:mm TT', '03:07 pm');     // hour 15, am/pm is case-insensitive
Yad.parseTime('h:mm T', '9:15 P');         // hour 21, single-letter markers work
Yad.parseTime('HH:mm', '25:00');           // null
```

Any entry of `amNames`/`pmNames`, or its first letter, is accepted as a marker.
