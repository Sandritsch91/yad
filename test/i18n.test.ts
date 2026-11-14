import { describe, expect, it } from 'vitest';
import { formatDate, parseDate } from '../src/date-utils';
import { Yad } from '../src/yad';
import { de } from '../src/i18n/de';
import { en } from '../src/i18n/en';
import { enGB } from '../src/i18n/en-GB';
import { fr } from '../src/i18n/fr';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('regional settings', () => {
  const locales = { en, enGB, de, fr };

  it.each(Object.entries(locales))('%s is complete', (_name, locale) => {
    expect(locale.monthNames).toHaveLength(12);
    expect(locale.monthNamesShort).toHaveLength(12);
    expect(locale.dayNames).toHaveLength(7);
    expect(locale.dayNamesShort).toHaveLength(7);
    expect(locale.dayNamesMin).toHaveLength(7);
  });

  it('only English is built in', () => {
    expect(Yad.regional['']).toBe(en);
    expect(Yad.regional.en).toBe(en);
    expect(Yad.regional['en-US']).toBe(en);
    expect(Object.keys(Yad.regional).sort()).toEqual(['', 'en', 'en-US']);
    expect(Yad.defaults.dateFormat).toBe(en.dateFormat);
  });

  it('other locales are registered manually', () => {
    const before = { ...Yad.regional };
    try {
      Yad.regional.de = de;
      expect(Yad.regional.de).toBe(de);
    } finally {
      Yad.regional = before;
    }
  });

  it('formats and parses French dates', () => {
    const date = d(2026, 8, 15);
    expect(formatDate(fr.dateFormat, date, fr)).toBe('15/08/2026');
    expect(formatDate('DD d MM yy', date, fr)).toBe('samedi 15 août 2026');
    expect(formatDate('D d M yy', d(2026, 2, 3), fr)).toBe('mar. 3 févr. 2026');
    expect(parseDate('DD d MM yy', 'samedi 15 août 2026', fr)).toEqual(date);
    expect(parseDate('d M yy', '3 févr. 2026', fr)).toEqual(d(2026, 2, 3));
  });

  it('uses day-first format and Monday start for en-GB', () => {
    expect(formatDate(enGB.dateFormat, d(2026, 11, 10), enGB)).toBe('10/11/2026');
    expect(enGB.firstDay).toBe(1);
    expect(enGB.monthNames).toEqual(en.monthNames);
  });

  it('renders the French calendar', () => {
    document.body.innerHTML = '<div id="cal"></div>';
    const dp = new Yad('#cal', { ...fr, defaultDate: d(2026, 8, 15), showButtonPanel: true });
    const w = dp.widget();
    expect(w.querySelector('.yad-month')!.textContent).toBe('août');
    expect(Array.from(w.querySelectorAll('thead th')).map((th) => th.textContent).join('')).toBe('LMMJVSD');
    expect(w.querySelector('.yad-current')!.textContent).toBe('Aujourd’hui');
    dp.destroy();
  });
});
