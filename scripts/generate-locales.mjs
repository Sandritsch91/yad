#!/usr/bin/env node
/**
 * Generates src/i18n/<code>.ts locale files and src/i18n/index.ts.
 *
 * Most of each locale comes from the Unicode CLDR data built into Node (ICU): month and day names, date and
 * time patterns, 12/24-hour clock, am/pm names, first day of the week, text direction, and the words for
 * "today", "now", "hour", "minute" and "second". The few interface texts CLDR does not have (Close, Prev,
 * Next, week header, Time, Choose time, Millisecond) are in the STRINGS table below.
 *
 * en, en-GB, de and fr are hand-written and not generated. Only en is bundled in yad.js.
 *
 * Usage: node scripts/generate-locales.mjs
 * To add a language: add its texts to STRINGS and an entry to LOCALES, then run the script.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// [closeText, prevText, nextText, weekHeader, timeText, timeOnlyTitle, millisecText]
const STRINGS = {
  af: ['Sluit', 'Vorige', 'Volgende', 'Wk', 'Tyd', 'Kies tyd', 'Millisekonde'],
  ar: ['إغلاق', 'السابق', 'التالي', 'أسبوع', 'الوقت', 'اختر الوقت', 'مللي ثانية'],
  az: ['Bağla', 'Geri', 'İrəli', 'Hf', 'Vaxt', 'Vaxtı seçin', 'Millisaniyə'],
  be: ['Зачыніць', 'Папярэдні', 'Наступны', 'Тд', 'Час', 'Выберыце час', 'Мілісекунда'],
  bg: ['Затвори', 'Назад', 'Напред', 'Седм', 'Час', 'Изберете час', 'Милисекунда'],
  bn: ['বন্ধ', 'পূর্ববর্তী', 'পরবর্তী', 'সপ্তাহ', 'সময়', 'সময় নির্বাচন করুন', 'মিলিসেকেন্ড'],
  bs: ['Zatvori', 'Prethodni', 'Sljedeći', 'Sed', 'Vrijeme', 'Odaberite vrijeme', 'Milisekunda'],
  ca: ['Tanca', 'Anterior', 'Següent', 'Set', 'Hora', 'Trieu l’hora', 'Mil·lisegon'],
  cs: ['Zavřít', 'Předchozí', 'Další', 'Týd', 'Čas', 'Zvolte čas', 'Milisekunda'],
  cy: ['Cau', 'Blaenorol', 'Nesaf', 'Wy', 'Amser', 'Dewiswch amser', 'Milieiliad'],
  da: ['Luk', 'Forrige', 'Næste', 'Uge', 'Tid', 'Vælg tidspunkt', 'Millisekund'],
  de: ['Schließen', 'Zurück', 'Vor', 'KW', 'Zeit', 'Zeit wählen', 'Millisekunde'],
  el: ['Κλείσιμο', 'Προηγούμενος', 'Επόμενος', 'Εβδ', 'Ώρα', 'Επιλογή ώρας', 'Χιλιοστό'],
  en: ['Done', 'Prev', 'Next', 'Wk', 'Time', 'Choose Time', 'Millisecond'],
  eo: ['Fermi', 'Antaŭa', 'Sekva', 'Sb', 'Tempo', 'Elektu tempon', 'Milisekundo'],
  es: ['Cerrar', 'Anterior', 'Siguiente', 'Sm', 'Hora', 'Elegir hora', 'Milisegundo'],
  et: ['Sulge', 'Eelnev', 'Järgnev', 'näd', 'Aeg', 'Vali aeg', 'Millisekund'],
  eu: ['Itxi', 'Aurrekoa', 'Hurrengoa', 'As', 'Ordua', 'Aukeratu ordua', 'Milisegundoa'],
  fa: ['بستن', 'قبلی', 'بعدی', 'هف', 'زمان', 'انتخاب زمان', 'میلی‌ثانیه'],
  fi: ['Sulje', 'Edellinen', 'Seuraava', 'Vk', 'Aika', 'Valitse aika', 'Millisekunti'],
  fil: ['Isara', 'Nakaraan', 'Susunod', 'Lgo', 'Oras', 'Pumili ng oras', 'Millisecond'],
  fo: ['Lat aftur', 'Fyrra', 'Næsta', 'Vk', 'Tíð', 'Vel tíð', 'Millisekund'],
  fr: ['Fermer', 'Précédent', 'Suivant', 'Sem.', 'Heure', 'Choisir une heure', 'Millisecondes'],
  ga: ['Dún', 'Roimhe', 'Ar aghaidh', 'Sn', 'Am', 'Roghnaigh am', 'Milleasoicind'],
  gl: ['Pechar', 'Anterior', 'Seguinte', 'Sm', 'Hora', 'Escolla a hora', 'Milisegundo'],
  he: ['סגור', 'הקודם', 'הבא', 'שבוע', 'שעה', 'בחר שעה', 'אלפית שנייה'],
  hi: ['बंद करें', 'पिछला', 'अगला', 'सप्ताह', 'समय', 'समय चुनें', 'मिलीसेकंड'],
  hr: ['Zatvori', 'Prethodni', 'Sljedeći', 'Tje', 'Vrijeme', 'Odaberite vrijeme', 'Milisekunda'],
  hu: ['Bezár', 'Vissza', 'Előre', 'Hét', 'Idő', 'Válasszon időpontot', 'Ezredmásodperc'],
  hy: ['Փակել', 'Նախորդ', 'Հաջորդ', 'ՇԲՏ', 'Ժամանակ', 'Ընտրեք ժամանակը', 'Միլիվայրկյան'],
  id: ['Tutup', 'Mundur', 'Maju', 'Mg', 'Waktu', 'Pilih waktu', 'Milidetik'],
  is: ['Loka', 'Fyrri', 'Næsti', 'Vika', 'Tími', 'Veldu tíma', 'Millisekúnda'],
  it: ['Chiudi', 'Prec', 'Succ', 'Sm', 'Orario', 'Scegli orario', 'Millisecondo'],
  ja: ['閉じる', '前', '次', '週', '時間', '時間を選択', 'ミリ秒'],
  ka: ['დახურვა', 'წინა', 'შემდეგი', 'კვ', 'დრო', 'აირჩიეთ დრო', 'მილიწამი'],
  kk: ['Жабу', 'Алдыңғы', 'Келесі', 'Ап', 'Уақыт', 'Уақытты таңдаңыз', 'Миллисекунд'],
  ko: ['닫기', '이전 달', '다음 달', '주', '시간', '시간 선택', '밀리초'],
  lt: ['Uždaryti', 'Atgal', 'Pirmyn', 'SAV', 'Laikas', 'Pasirinkite laiką', 'Milisekundė'],
  lv: ['Aizvērt', 'Iepr.', 'Nāk.', 'Ned.', 'Laiks', 'Izvēlieties laiku', 'Milisekunde'],
  mk: ['Затвори', 'Претходна', 'Следна', 'Сед', 'Време', 'Изберете време', 'Милисекунда'],
  ms: ['Tutup', 'Sebelum', 'Selepas', 'Mg', 'Masa', 'Pilih masa', 'Milisaat'],
  nb: ['Lukk', 'Forrige', 'Neste', 'Uke', 'Tid', 'Velg tid', 'Millisekund'],
  nl: ['Sluiten', 'Vorige', 'Volgende', 'Wk', 'Tijd', 'Kies tijd', 'Milliseconde'],
  nn: ['Lukk', 'Førre', 'Neste', 'Veke', 'Tid', 'Vel tid', 'Millisekund'],
  pl: ['Zamknij', 'Poprzedni', 'Następny', 'Tydz', 'Czas', 'Wybierz czas', 'Milisekunda'],
  'pt-BR': ['Fechar', 'Anterior', 'Próximo', 'Sm', 'Hora', 'Escolha o horário', 'Milissegundo'],
  'pt-PT': ['Fechar', 'Anterior', 'Seguinte', 'Sem', 'Hora', 'Escolha a hora', 'Milissegundo'],
  ro: ['Închide', 'Precedenta', 'Următoarea', 'Săpt', 'Ora', 'Alegeți ora', 'Milisecundă'],
  ru: ['Закрыть', 'Пред', 'След', 'Нед', 'Время', 'Выберите время', 'Миллисекунда'],
  sk: ['Zavrieť', 'Predchádzajúci', 'Nasledujúci', 'Týž', 'Čas', 'Vyberte čas', 'Milisekunda'],
  sl: ['Zapri', 'Prejšnji', 'Naslednji', 'Teden', 'Čas', 'Izberite čas', 'Milisekunda'],
  sq: ['Mbyll', 'Mbrapa', 'Përpara', 'Ja', 'Koha', 'Zgjidhni kohën', 'Milisekonda'],
  'sr-Cyrl': ['Затвори', 'Претходна', 'Следећа', 'Сед', 'Време', 'Изаберите време', 'Милисекунда'],
  'sr-Latn': ['Zatvori', 'Prethodna', 'Sledeća', 'Sed', 'Vreme', 'Izaberite vreme', 'Milisekunda'],
  sv: ['Stäng', 'Förra', 'Nästa', 'Ve', 'Tid', 'Välj tid', 'Millisekund'],
  sw: ['Funga', 'Iliyopita', 'Ijayo', 'Wiki', 'Muda', 'Chagua muda', 'Milisekunde'],
  ta: ['மூடு', 'முந்தையது', 'அடுத்தது', 'வா', 'நேரம்', 'நேரத்தைத் தேர்ந்தெடுக்கவும்', 'மில்லிவினாடி'],
  th: ['ปิด', 'ย้อน', 'ถัดไป', 'สัปดาห์', 'เวลา', 'เลือกเวลา', 'มิลลิวินาที'],
  tr: ['Kapat', 'Geri', 'İleri', 'Hf', 'Saat', 'Saat seçin', 'Milisaniye'],
  uk: ['Закрити', 'Попередній', 'Наступний', 'Тиж', 'Час', 'Виберіть час', 'Мілісекунда'],
  ur: ['بند کریں', 'پچھلا', 'اگلا', 'ہفتہ', 'وقت', 'وقت منتخب کریں', 'ملی سیکنڈ'],
  uz: ['Yopish', 'Oldingi', 'Keyingi', 'Hf', 'Vaqt', 'Vaqtni tanlang', 'Millisoniya'],
  vi: ['Đóng', 'Trước', 'Tiếp', 'Tu', 'Thời gian', 'Chọn thời gian', 'Mili giây'],
  'zh-Hans': ['关闭', '上个月', '下个月', '周', '时间', '选择时间', '毫秒'],
  'zh-Hant': ['關閉', '上個月', '下個月', '週', '時間', '選擇時間', '毫秒'],
};

// [key in Yad.regional, Intl locale tag, STRINGS key]
const LOCALES = [
  ['af', 'af-ZA', 'af'],
  ['ar', 'ar', 'ar'],
  ['az', 'az-Latn-AZ', 'az'],
  ['be', 'be-BY', 'be'],
  ['bg', 'bg-BG', 'bg'],
  ['bn', 'bn-BD', 'bn'],
  ['bs', 'bs-Latn-BA', 'bs'],
  ['ca', 'ca-ES', 'ca'],
  ['cs', 'cs-CZ', 'cs'],
  ['cy', 'cy-GB', 'cy'],
  ['da', 'da-DK', 'da'],
  ['de-AT', 'de-AT', 'de'],
  ['de-CH', 'de-CH', 'de'],
  ['el', 'el-GR', 'el'],
  ['en-AU', 'en-AU', 'en'],
  ['en-CA', 'en-CA', 'en'],
  ['en-IE', 'en-IE', 'en'],
  ['en-IN', 'en-IN', 'en'],
  ['en-NZ', 'en-NZ', 'en'],
  ['en-ZA', 'en-ZA', 'en'],
  ['eo', 'eo', 'eo'],
  ['es', 'es-ES', 'es'],
  ['es-AR', 'es-AR', 'es'],
  ['es-MX', 'es-MX', 'es'],
  ['et', 'et-EE', 'et'],
  ['eu', 'eu-ES', 'eu'],
  ['fa', 'fa-IR', 'fa'],
  ['fi', 'fi-FI', 'fi'],
  ['fil', 'fil-PH', 'fil'],
  ['fo', 'fo-FO', 'fo'],
  ['fr-BE', 'fr-BE', 'fr'],
  ['fr-CA', 'fr-CA', 'fr'],
  ['fr-CH', 'fr-CH', 'fr'],
  ['ga', 'ga-IE', 'ga'],
  ['gl', 'gl-ES', 'gl'],
  ['he', 'he-IL', 'he'],
  ['hi', 'hi-IN', 'hi'],
  ['hr', 'hr-HR', 'hr'],
  ['hu', 'hu-HU', 'hu'],
  ['hy', 'hy-AM', 'hy'],
  ['id', 'id-ID', 'id'],
  ['is', 'is-IS', 'is'],
  ['it', 'it-IT', 'it'],
  ['it-CH', 'it-CH', 'it'],
  ['ja', 'ja-JP', 'ja'],
  ['ka', 'ka-GE', 'ka'],
  ['kk', 'kk-KZ', 'kk'],
  ['ko', 'ko-KR', 'ko'],
  ['lt', 'lt-LT', 'lt'],
  ['lv', 'lv-LV', 'lv'],
  ['mk', 'mk-MK', 'mk'],
  ['ms', 'ms-MY', 'ms'],
  ['nb', 'nb-NO', 'nb'],
  ['nl', 'nl-NL', 'nl'],
  ['nl-BE', 'nl-BE', 'nl'],
  ['nn', 'nn-NO', 'nn'],
  ['pl', 'pl-PL', 'pl'],
  ['pt', 'pt-PT', 'pt-PT'],
  ['pt-BR', 'pt-BR', 'pt-BR'],
  ['ro', 'ro-RO', 'ro'],
  ['ru', 'ru-RU', 'ru'],
  ['sk', 'sk-SK', 'sk'],
  ['sl', 'sl-SI', 'sl'],
  ['sq', 'sq-AL', 'sq'],
  ['sr', 'sr-Cyrl-RS', 'sr-Cyrl'],
  ['sr-Latn', 'sr-Latn-RS', 'sr-Latn'],
  ['sv', 'sv-SE', 'sv'],
  ['sw', 'sw-KE', 'sw'],
  ['ta', 'ta-IN', 'ta'],
  ['th', 'th-TH', 'th'],
  ['tr', 'tr-TR', 'tr'],
  ['uk', 'uk-UA', 'uk'],
  ['ur', 'ur-PK', 'ur'],
  ['uz', 'uz-Latn-UZ', 'uz'],
  ['vi', 'vi-VN', 'vi'],
  ['zh-CN', 'zh-Hans-CN', 'zh-Hans'],
  ['zh-HK', 'zh-Hant-HK', 'zh-Hant'],
  ['zh-TW', 'zh-Hant-TW', 'zh-Hant'],
];

/** Extra keys pointing at another locale. */
const ALIASES = { no: 'nb', 'pt-PT': 'pt', 'sr-Cyrl': 'sr', zh: 'zh-CN' };

/** Hand-written locales (not generated), re-exported from the index. */
const CORE = [['en', 'en', './en'], ['en-GB', 'enGB', './en-GB'], ['de', 'de', './de'], ['fr', 'fr', './fr']];

// --------------------------------------------------------------------------------------------------------

const SUNDAY = new Date(2026, 10, 15); // a Sunday
const clean = (s) => s.replace(/[‎‏؜]/g, '').replace(/[  ]/g, ' ');
const capitalize = (s, tag) => s.charAt(0).toLocaleUpperCase(tag) + s.slice(1);
const uniq = (list) => [...new Set(list)];
// Always the Gregorian calendar (yad's calendar) and Latin digits (what formatDate/parseDate use);
// some locales default to other calendars (fa: Persian, th: Buddhist).
const latn = (tag) => `${tag}-u-ca-gregory-nu-latn`;

/** Quote a literal for a format string if it contains letters (which could be format tokens). */
function literal(text) {
  return /\p{L}|'/u.test(text) ? `'${text.replace(/'/g, "''")}'` : text;
}

function names(tag, option, value, count, makeDate) {
  const fmt = new Intl.DateTimeFormat(latn(tag), { [option]: value });
  return Array.from({ length: count }, (_, i) => clean(fmt.format(makeDate(i))));
}

function dayNamesMin(tag) {
  const narrow = names(tag, 'weekday', 'narrow', 7, (i) => new Date(2026, 10, 15 + i));
  if (new Set(narrow).size === 7) {
    return narrow;
  }
  // Narrow names are ambiguous (e.g. S M T W T F S): use the short names, up to two letters.
  return names(tag, 'weekday', 'short', 7, (i) => new Date(2026, 10, 15 + i))
    .map((n) => capitalize([...n.replace(/\.$/, '')].slice(0, 2).join(''), tag));
}

function dateFormat(tag) {
  const parts = new Intl.DateTimeFormat(latn(tag), { year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(new Date(2026, 10, 4));
  return parts.map((p) => ({ day: 'dd', month: 'mm', year: 'yy' })[p.type] ?? literal(clean(p.value))).join('').trim();
}

function timeFormat(tag, amName) {
  const fmt = new Intl.DateTimeFormat(latn(tag), { hour: '2-digit', minute: '2-digit' });
  const twelve = ['h11', 'h12'].includes(fmt.resolvedOptions().hourCycle);
  const ampm = amName === amName.toLowerCase() && amName !== amName.toUpperCase() ? 'tt' : 'TT';
  return fmt.formatToParts(new Date(2026, 0, 1, 15, 5)).map((p) => {
    switch (p.type) {
      case 'hour': return twelve ? 'hh' : 'HH';
      case 'minute': return 'mm';
      case 'dayPeriod': return ampm;
      default: return literal(clean(p.value));
    }
  }).join('').trim();
}

function dayPeriod(tag, hour) {
  const parts = new Intl.DateTimeFormat(latn(tag), { hour: 'numeric', hourCycle: 'h12' })
    .formatToParts(new Date(2026, 0, 1, hour));
  return clean(parts.find((p) => p.type === 'dayPeriod')?.value ?? '').trim();
}

function monthYearOrder(tag) {
  const parts = new Intl.DateTimeFormat(latn(tag), { year: 'numeric', month: 'long' }).formatToParts(SUNDAY);
  const yearIndex = parts.findIndex((p) => p.type === 'year');
  const monthIndex = parts.findIndex((p) => p.type === 'month');
  const after = parts[yearIndex + 1];
  // Only CJK languages write a year marker (年, 년) directly after the number.
  const suffix = after?.type === 'literal' && /[぀-ヿ㐀-鿿가-힯]/.test(after.value)
    ? after.value.trim() : '';
  return { showMonthAfterYear: yearIndex < monthIndex, yearSuffix: suffix };
}

function generate(tag, strings) {
  const [closeText, prevText, nextText, weekHeader, timeText, timeOnlyTitle, millisecText] = strings;
  const locale = new Intl.Locale(tag);
  const firstDay = locale.getWeekInfo().firstDay % 7;
  const rtf = new Intl.RelativeTimeFormat(tag, { numeric: 'auto' });
  const fields = new Intl.DisplayNames(tag, { type: 'dateTimeField' });
  const am = dayPeriod(tag, 9) || 'AM';
  const pm = dayPeriod(tag, 15) || 'PM';
  return {
    closeText,
    prevText,
    nextText,
    currentText: capitalize(rtf.format(0, 'day'), tag),
    monthNames: names(tag, 'month', 'long', 12, (i) => new Date(2026, i, 15)),
    monthNamesShort: names(tag, 'month', 'short', 12, (i) => new Date(2026, i, 15)),
    dayNames: names(tag, 'weekday', 'long', 7, (i) => new Date(2026, 10, 15 + i)),
    dayNamesShort: names(tag, 'weekday', 'short', 7, (i) => new Date(2026, 10, 15 + i)),
    dayNamesMin: dayNamesMin(tag),
    weekHeader,
    dateFormat: dateFormat(tag),
    firstDay,
    isRTL: locale.getTextInfo().direction === 'rtl',
    ...monthYearOrder(tag),
    timeOnlyTitle,
    timeText,
    hourText: capitalize(fields.of('hour'), tag),
    minuteText: capitalize(fields.of('minute'), tag),
    secondText: capitalize(fields.of('second'), tag),
    millisecText,
    nowText: capitalize(rtf.format(0, 'second'), tag),
    amNames: uniq([am, 'AM', 'A']),
    pmNames: uniq([pm, 'PM', 'P']),
    timeFormat: timeFormat(tag, am),
  };
}

const identifier = (key) => key.replace(/-(\w)/g, (_, c) => c.toUpperCase());
const display = (key) => new Intl.DisplayNames('en', { type: 'language' }).of(key);
const ts = (value) => (Array.isArray(value)
  ? `[${value.map(ts).join(', ')}]`
  : typeof value === 'string' ? `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'` : String(value));

const header = `// Generated by scripts/generate-locales.mjs from CLDR ${process.versions.cldr} (ICU ${process.versions.icu}).
// Edit the STRINGS table in the script and re-run it instead of editing this file.
`;

for (const [key, tag, stringsKey] of LOCALES) {
  const data = generate(tag, STRINGS[stringsKey]);
  const body = Object.entries(data).map(([k, v]) => `  ${k}: ${ts(v)},`).join('\n');
  const file = `${header}import type { RegionalSettings } from '../options';

/** ${display(key)} */
export const ${identifier(key)}: Required<RegionalSettings> = {
${body}
};
`;
  writeFileSync(join(root, 'src', 'i18n', `${key}.ts`), file);
}

const all = [...CORE.map(([key, id]) => [key, id]), ...LOCALES.map(([key]) => [key, identifier(key)])]
  .sort((a, b) => a[0].localeCompare(b[0]));
const index = `${header}import type { RegionalSettings } from '../options';
${CORE.filter(([, , path], i, list) => list.findIndex((c) => c[2] === path) === i)
    .map(([, , path]) => `import { ${CORE.filter((c) => c[2] === path).map((c) => c[1]).join(', ')} } from '${path}';`)
    .join('\n')}
${LOCALES.map(([key]) => `import { ${identifier(key)} } from './${key}';`).join('\n')}

export {
${all.map(([, id]) => `  ${id},`).join('\n')}
};

/**
 * All bundled locales by key, e.g. \`locales['pt-BR']\`. Register them all with
 * \`Object.assign(Yad.regional, locales)\`.
 */
export const locales: Record<string, Required<RegionalSettings>> = {
${all.map(([key, id]) => `  '${key}': ${id},`).join('\n')}
${Object.entries(ALIASES).map(([alias, target]) => `  '${alias}': ${identifier(target)},`).join('\n')}
};
`;
writeFileSync(join(root, 'src', 'i18n', 'index.ts'), index);

console.log(`Generated ${LOCALES.length} locales (+ ${CORE.length} core, ${Object.keys(ALIASES).length} aliases).`);
