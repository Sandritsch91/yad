# Localisation

Texts, date format, first day of the week and text direction are grouped into **locales**, like jQuery UI's
`$.datepicker.regional`.

## Bundled locales

yad ships 82 locales (86 keys including aliases). **Only English (`en`, marked ¹) is built in**: it is the default
and always available as `Yad.regional.en` (also `''` and `en-US`). Every other language is a separate module that
you [load and register](#loading-more-locales) yourself, so a page only downloads the languages it uses.

Month and day names, date and time formats, the 12/24-hour clock, am/pm names, the first day of the week,
text direction and the words for "today", "now", "hour", "minute" and "second" come from the Unicode
[CLDR](https://cldr.unicode.org/) data. The remaining interface texts (Close, Prev, Next, the week header, Time,
Choose time, Millisecond) are translated by hand; corrections from native speakers are welcome.

| Key | Language | `dateFormat` | `timeFormat` | Week starts | |
|---|---|---|---|---|---|
| `af` | Afrikaans | `yy-mm-dd` | `HH:mm` | Sunday | |
| `sq` | Albanian | `dd.mm.yy` | `hh:mm tt` | Monday | |
| `ar` | Arabic | `dd/mm/yy` | `hh:mm TT` | Saturday | RTL |
| `hy` | Armenian | `dd.mm.yy` | `HH:mm` | Monday | |
| `en-AU` | Australian English | `dd/mm/yy` | `hh:mm tt` | Monday | |
| `de-AT` | Austrian German | `dd.mm.yy` | `HH:mm` | Monday | |
| `az` | Azerbaijani | `dd.mm.yy` | `HH:mm` | Monday | |
| `bn` | Bangla | `dd/mm/yy` | `hh:mm TT` | Sunday | |
| `eu` | Basque | `yy/mm/dd` | `HH:mm` | Monday | |
| `be` | Belarusian | `dd.mm.yy` | `HH:mm` | Monday | |
| `bs` | Bosnian | `dd. mm. yy.` | `HH:mm` | Monday | |
| `pt-BR` | Brazilian Portuguese | `dd/mm/yy` | `HH:mm` | Sunday | |
| `en-GB` | British English | `dd/mm/yy` | `HH:mm` | Monday | |
| `bg` | Bulgarian | `dd.mm.yy' г.'` | `HH:mm` | Monday | |
| `en-CA` | Canadian English | `yy-mm-dd` | `hh:mm tt` | Sunday | |
| `fr-CA` | Canadian French | `yy-mm-dd` | `HH' h 'mm` | Sunday | |
| `ca` | Catalan | `dd/mm/yy` | `HH:mm` | Monday | |
| `zh-CN`, `zh` | Chinese (China) | `yy/mm/dd` | `HH:mm` | Monday | |
| `zh-HK` | Chinese (Hong Kong SAR China) | `dd/mm/yy` | `TThh:mm` | Sunday | |
| `zh-TW` | Chinese (Taiwan) | `yy/mm/dd` | `TThh:mm` | Sunday | |
| `hr` | Croatian | `dd. mm. yy.` | `HH:mm` | Monday | |
| `cs` | Czech | `dd. mm. yy` | `HH:mm` | Monday | |
| `da` | Danish | `dd.mm.yy` | `HH.mm` | Monday | |
| `nl` | Dutch | `dd-mm-yy` | `HH:mm` | Monday | |
| `en` | English ¹ | `mm/dd/yy` | `hh:mm TT` | Sunday | |
| `en-IN` | English (India) | `dd/mm/yy` | `hh:mm tt` | Sunday | |
| `en-IE` | English (Ireland) | `dd/mm/yy` | `HH:mm` | Monday | |
| `en-NZ` | English (New Zealand) | `dd/mm/yy` | `hh:mm tt` | Monday | |
| `en-ZA` | English (South Africa) | `yy/mm/dd` | `HH:mm` | Sunday | |
| `eo` | Esperanto | `yy-mm-dd` | `HH:mm` | Monday | |
| `et` | Estonian | `dd.mm.yy` | `HH:mm` | Monday | |
| `fo` | Faroese | `dd.mm.yy` | `HH:mm` | Monday | |
| `fil` | Filipino | `mm/dd/yy` | `hh:mm TT` | Sunday | |
| `fi` | Finnish | `dd.mm.yy` | `HH.mm` | Monday | |
| `nl-BE` | Flemish | `dd/mm/yy` | `HH:mm` | Monday | |
| `fr` | French | `dd/mm/yy` | `HH:mm` | Monday | |
| `fr-BE` | French (Belgium) | `dd/mm/yy` | `HH:mm` | Monday | |
| `gl` | Galician | `dd/mm/yy` | `HH:mm` | Monday | |
| `ka` | Georgian | `dd.mm.yy` | `HH:mm` | Monday | |
| `de` | German | `dd.mm.yy` | `HH:mm` | Monday | |
| `el` | Greek | `dd/mm/yy` | `hh:mm tt` | Monday | |
| `he` | Hebrew | `dd.mm.yy` | `HH:mm` | Sunday | RTL |
| `hi` | Hindi | `dd/mm/yy` | `hh:mm tt` | Sunday | |
| `hu` | Hungarian | `yy. mm. dd.` | `HH:mm` | Monday | |
| `is` | Icelandic | `dd.mm.yy` | `HH:mm` | Sunday | |
| `id` | Indonesian | `dd/mm/yy` | `HH.mm` | Sunday | |
| `ga` | Irish | `dd/mm/yy` | `HH:mm` | Monday | |
| `it` | Italian | `dd/mm/yy` | `HH:mm` | Monday | |
| `it-CH` | Italian (Switzerland) | `dd.mm.yy` | `HH:mm` | Monday | |
| `ja` | Japanese | `yy/mm/dd` | `HH:mm` | Sunday | |
| `kk` | Kazakh | `dd.mm.yy` | `HH:mm` | Monday | |
| `ko` | Korean | `yy. mm. dd.` | `TT hh:mm` | Sunday | |
| `lv` | Latvian | `dd.mm.yy` | `HH:mm` | Monday | |
| `lt` | Lithuanian | `yy-mm-dd` | `HH:mm` | Monday | |
| `mk` | Macedonian | `dd.mm.yy' г.'` | `HH:mm` | Monday | |
| `ms` | Malay | `dd/mm/yy` | `hh:mm TT` | Monday | |
| `es-MX` | Mexican Spanish | `dd/mm/yy` | `hh:mm tt` | Sunday | |
| `nb`, `no` | Norwegian Bokmål | `dd.mm.yy` | `HH:mm` | Monday | |
| `nn` | Norwegian Nynorsk | `dd.mm.yy` | `HH:mm` | Monday | |
| `fa` | Persian | `yy/mm/dd` | `HH:mm` | Saturday | RTL |
| `pl` | Polish | `dd.mm.yy` | `HH:mm` | Monday | |
| `pt`, `pt-PT` | Portuguese | `dd/mm/yy` | `HH:mm` | Sunday | |
| `ro` | Romanian | `dd.mm.yy` | `HH:mm` | Monday | |
| `ru` | Russian | `dd.mm.yy` | `HH:mm` | Monday | |
| `sr`, `sr-Cyrl` | Serbian | `dd.mm.yy.` | `HH:mm` | Monday | |
| `sr-Latn` | Serbian (Latin) | `dd.mm.yy.` | `HH:mm` | Monday | |
| `sk` | Slovak | `dd. mm. yy` | `HH:mm` | Monday | |
| `sl` | Slovenian | `dd. mm. yy` | `HH:mm` | Monday | |
| `es` | Spanish | `dd/mm/yy` | `HH:mm` | Monday | |
| `es-AR` | Spanish (Argentina) | `dd/mm/yy` | `hh:mm tt` | Monday | |
| `sw` | Swahili | `dd/mm/yy` | `HH:mm` | Sunday | |
| `sv` | Swedish | `yy-mm-dd` | `HH:mm` | Monday | |
| `fr-CH` | Swiss French | `dd.mm.yy` | `HH:mm` | Monday | |
| `de-CH` | Swiss High German | `dd.mm.yy` | `HH:mm` | Monday | |
| `ta` | Tamil | `dd/mm/yy` | `hh:mm TT` | Sunday | |
| `th` | Thai | `dd/mm/yy` | `HH:mm` | Sunday | |
| `tr` | Turkish | `dd.mm.yy` | `HH:mm` | Monday | |
| `uk` | Ukrainian | `dd.mm.yy` | `HH:mm` | Monday | |
| `ur` | Urdu | `dd/mm/yy` | `hh:mm TT` | Sunday | RTL |
| `uz` | Uzbek | `dd/mm/yy` | `HH:mm` | Monday | |
| `vi` | Vietnamese | `dd/mm/yy` | `HH:mm` | Monday | |
| `cy` | Welsh | `dd/mm/yy` | `HH:mm` | Monday | |

The key `''` and `en-US` are also English (US), the default.

## Loading more locales

### With a bundler or ES modules

Import only the languages you need. Each file is about 1 KB:

```js
import { Yad } from '@sandritsch91/yad';
import { ja } from '@sandritsch91/yad/i18n/ja';
import { ptBR } from '@sandritsch91/yad/i18n/pt-BR';

new Yad('#date', ja);
Yad.regional['pt-BR'] = ptBR;   // optional: register under its key
```

The export name is the key without hyphens: `pt-BR` → `ptBR`, `sr-Latn` → `srLatn`, `zh-CN` → `zhCN`.

Or register all of them at once:

```js
import { Yad } from '@sandritsch91/yad';
import { locales } from '@sandritsch91/yad/i18n';

Object.assign(Yad.regional, locales);
new Yad('#date', Yad.regional.ko);
```

From a CDN without a bundler:

```html
<script type="module">
  import { Yad } from 'https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/yad.js';
  import { it } from 'https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/i18n/it.js';
  new Yad('#date', it);
</script>
```

### With a classic `<script>` tag

Each locale is also available as a classic script, `dist/i18n/<key>.umd.js` (about 2 KB). Load it after
`yad.umd.js` and it registers itself on `yad.Yad.regional`, like jQuery UI's `datepicker-xx.js` files:

```html
<script src="https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/yad.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/i18n/ja.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/i18n/pt-BR.umd.js"></script>
<script>
  new yad.Yad('#date', yad.Yad.regional.ja);
</script>
```

A locale script loaded **before** `yad.umd.js` cannot register itself; it is kept in `yadI18n.locales`, so you can
register it afterwards with `Object.assign(yad.Yad.regional, yadI18n.locales)`. Aliases (`no`, `zh`, `pt-PT`,
`sr-Cyrl`) have no file of their own: load the target (`nb`, `zh-CN`, `pt`, `sr`).

To load every locale at once, use `yad-i18n.umd.js` instead (about 73 KB, 17 KB gzipped):

```html
<script src="https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/yad.umd.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@sandritsch91/yad/dist/yad-i18n.umd.js"></script>
<script>
  new yad.Yad('#date', yad.Yad.regional.ja);
</script>
```

## Using a locale

Load the locale first (see [Loading more locales](#loading-more-locales)), e.g.

```js
import { de } from '@sandritsch91/yad/i18n/de';
import { fr } from '@sandritsch91/yad/i18n/fr';
import { enGB } from '@sandritsch91/yad/i18n/en-GB';
Object.assign(Yad.regional, { de, fr, 'en-GB': enGB });
```

Then:

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

yad does not detect the language. To follow `<html lang="...">` (with the locales registered, e.g.
`Object.assign(Yad.regional, locales)`):

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

Locales are generated by `scripts/generate-locales.mjs` from the CLDR data in Node's ICU:

1. Add the language's interface texts to the `STRINGS` table and an entry to `LOCALES` in the script.
2. Run `npm run generate:locales`. It writes `src/i18n/<key>.ts` and `src/i18n/index.ts`.
3. Run `npm test`: `test/locales.test.ts` checks every locale (complete names, dates and times that format and
   parse back, a working picker).

To correct a generated value (a name or format CLDR gets wrong for a date picker), fix it in the script rather than
in the generated file, so the fix survives regeneration. The core locales `en`, `en-GB`, `de` and `fr` are
hand-written in `src/i18n/`.
