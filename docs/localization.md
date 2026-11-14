# Localisation

Texts, date format, first day of the week and text direction are grouped into **locales**, like jQuery UI's
`$.datepicker.regional`.

## Bundled locales

| Key | Language | `dateFormat` | `timeFormat` | Week starts |
|---|---|---|---|---|
| `''`, `en`, `en-US` | English (US), the default | `mm/dd/yy` | `hh:mm TT` | Sunday |
| `en-GB` | English (UK) | `dd/mm/yy` | `HH:mm` | Monday |
| `de` | German | `dd.mm.yy` | `HH:mm` | Monday |
| `fr` | French | `dd/mm/yy` | `HH:mm` | Monday |

They are available as `Yad.regional[key]` and as named exports (`en`, `enGB`, `de`, `fr`).

## Using a locale

```js
// For one picker
new Yad('#date', Yad.regional.de);
new Yad('#date', { ...Yad.regional.de, minDate: 0 });   // locale + your options

// For every picker created afterwards
Yad.setDefaults(Yad.regional.fr);

// Switch an existing picker (the value is reformatted)
dp.option(Yad.regional.fr);

// Keys with a hyphen need brackets
new Yad('#date', Yad.regional['en-GB']);
```

In ES5 code (no spread syntax): `new Yad('#date', Object.assign({}, Yad.regional.de, { minDate: 0 }))`.

Override single settings after the locale:

```js
new Yad('#date', { ...Yad.regional.fr, dateFormat: 'yy-mm-dd', firstDay: 0 });
```

## Following the page language

yad does not detect the language. To follow `<html lang="...">`:

```js
const lang = document.documentElement.lang;             // e.g. 'de' or 'en-GB'
Yad.setDefaults(Yad.regional[lang] ?? Yad.regional[lang.split('-')[0]] ?? Yad.regional['']);
```

## What a locale contains

| Setting | Example (de) |
|---|---|
| `closeText`, `prevText`, `nextText`, `currentText` | `'Schließen'`, `'Zurück'`, `'Vor'`, `'Heute'` |
| `monthNames`, `monthNamesShort` | `['Januar', ...]`, `['Jan', ...]` |
| `dayNames`, `dayNamesShort`, `dayNamesMin` | `['Sonntag', ...]`, `['So', ...]`, `['So', ...]` (always starting with **Sunday**) |
| `weekHeader` | `'KW'` |
| `dateFormat` | `'dd.mm.yy'` |
| `firstDay` | `1` |
| `isRTL`, `showMonthAfterYear`, `yearSuffix` | `false`, `false`, `''` |
| Time picker: `timeFormat`, `timeOnlyTitle`, `timeText`, `hourText`, `minuteText`, `secondText`, `millisecText`, `nowText`, `amNames`, `pmNames` | `'HH:mm'`, `'Zeit wählen'`, ... |

All of them are ordinary [options](options.md#locale-texts).

## Writing your own locale

Add an object with the settings above to `Yad.regional`. The time picker texts are optional; missing ones
fall back to English.

```js
Yad.regional.it = {
  closeText: 'Chiudi',
  prevText: 'Prec',
  nextText: 'Succ',
  currentText: 'Oggi',
  monthNames: ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno',
    'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'],
  monthNamesShort: ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'],
  dayNames: ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'],
  dayNamesShort: ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'],
  dayNamesMin: ['Do', 'Lu', 'Ma', 'Me', 'Gi', 'Ve', 'Sa'],
  weekHeader: 'Sm',
  dateFormat: 'dd/mm/yy',
  firstDay: 1,
  isRTL: false,
  showMonthAfterYear: false,
  yearSuffix: '',
  // optional, for the time picker
  timeFormat: 'HH:mm',
  timeOnlyTitle: 'Scegli orario',
  timeText: 'Orario',
  hourText: 'Ora',
  minuteText: 'Minuti',
  secondText: 'Secondi',
  nowText: 'Adesso',
};

Yad.setDefaults(Yad.regional.it);
```

In TypeScript, type it as `RegionalSettings`:

```ts
import { Yad, type RegionalSettings } from '@sandritsch91/yad';

const it: RegionalSettings = { /* ... */ };
Yad.regional.it = it;
```

Locale files from jQuery UI (`datepicker-xx.js`) contain the same settings: copy the object passed to
`datepicker.regional['xx']`.

## Right-to-left languages

Set `isRTL: true`. The calendar is mirrored (`dir="rtl"`), the previous/next buttons swap sides, the popup
aligns with the right edge of the input, and the left/right arrow keys are swapped.

```js
new Yad('#date', {
  isRTL: true,
  monthNames: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  dayNamesMin: ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س'],
  firstDay: 6,
});
```

## Contributing a locale

New locales are welcome: add `src/i18n/xx.ts` (see `src/i18n/de.ts`), register it in `Yad.regional` in
`src/yad.ts`, export it from `src/index.ts`, and extend `test/i18n.test.ts`.
