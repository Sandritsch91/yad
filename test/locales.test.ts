import { describe, expect, it } from 'vitest';
import { formatDate, parseDate } from '../src/date-utils';
import { formatTime, parseTime, timeFormatUnits } from '../src/time-utils';
import { locales } from '../src/i18n';
import { Yad } from '../src/yad';

const entries = Object.entries(locales);
const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('locale catalogue', () => {
  it('has many locales, including the core ones and aliases', () => {
    expect(entries.length).toBeGreaterThan(80);
    for (const key of ['en', 'en-GB', 'de', 'fr', 'es', 'it', 'ja', 'zh-CN', 'ar', 'he', 'ru', 'pt-BR', 'no', 'zh']) {
      expect(locales[key], key).toBeDefined();
    }
    expect(locales.no).toBe(locales.nb);
    expect(locales.en).toBe(Yad.regional.en);
    // Not built in: only available through the i18n modules
    expect(Yad.regional.de).toBeUndefined();
  });
});

describe.each(entries)('%s', (key, locale) => {
  it('has complete name lists without duplicates', () => {
    expect(locale.monthNames).toHaveLength(12);
    expect(locale.monthNamesShort).toHaveLength(12);
    expect(locale.dayNames).toHaveLength(7);
    expect(locale.dayNamesShort).toHaveLength(7);
    expect(locale.dayNamesMin).toHaveLength(7);
    // Parsing names needs them to be distinguishable
    expect(new Set(locale.monthNames).size).toBe(12);
    expect(new Set(locale.monthNamesShort).size).toBe(12);
    expect(new Set(locale.dayNames).size).toBe(7);
    for (const name of [...locale.monthNames, ...locale.dayNames, ...locale.dayNamesMin]) {
      expect(name.trim(), key).not.toBe('');
    }
  });

  it('has valid settings and texts', () => {
    expect(locale.firstDay).toBeGreaterThanOrEqual(0);
    expect(locale.firstDay).toBeLessThanOrEqual(6);
    for (const text of [locale.closeText, locale.prevText, locale.nextText, locale.currentText, locale.weekHeader,
      locale.timeText, locale.timeOnlyTitle, locale.hourText, locale.minuteText, locale.secondText,
      locale.millisecText, locale.nowText]) {
      expect(text.trim(), key).not.toBe('');
    }
    expect(locale.amNames.length).toBeGreaterThan(0);
    expect(locale.pmNames.length).toBeGreaterThan(0);
  });

  it('dates round-trip through its dateFormat', () => {
    const settings = locale;
    for (let month = 1; month <= 12; month++) {
      for (const date of [d(2026, month, 1), d(1999, month, 28), d(2031, month, 9)]) {
        const text = formatDate(locale.dateFormat, date, settings);
        expect(parseDate(locale.dateFormat, text, settings), `${key}: ${text}`).toEqual(date);
      }
    }
  });

  it('dates round-trip with month and day names', () => {
    for (const format of ['d MM yy', 'D, d M yy', 'DD dd MM yy']) {
      for (let month = 1; month <= 12; month++) {
        const date = d(2026, month, 3 + month);
        const text = formatDate(format, date, locale);
        expect(parseDate(format, text, locale), `${key}: ${text}`).toEqual(date);
      }
    }
  });

  it('times round-trip through its timeFormat', () => {
    const units = timeFormatUnits(locale.timeFormat);
    expect(units.hour && units.minute).toBe(true);
    for (let hour = 0; hour < 24; hour++) {
      const time = { hour, minute: (hour * 7) % 60, second: 0, millisec: 0 };
      const text = formatTime(locale.timeFormat, time, locale);
      expect(parseTime(locale.timeFormat, text, locale), `${key}: ${text}`).toEqual(time);
    }
  });

  it('renders a working date and time picker', () => {
    document.body.innerHTML = '<input id="date">';
    const dp = new Yad('#date', { ...locale, showTime: true, duration: 0 });
    dp.setDate(new Date(2026, 10, 20, 15, 5));
    expect(dp.getDate()).toEqual(new Date(2026, 10, 20, 15, 5));
    dp.show();
    const widget = dp.widget();
    expect(widget.dir).toBe(locale.isRTL ? 'rtl' : 'ltr');
    expect(widget.querySelector('.yad-title')!.textContent).toContain(locale.monthNames[10]);
    const headers = Array.from(widget.querySelectorAll('thead th')).map((th) => th.textContent);
    expect(headers[0]).toBe(locale.dayNamesMin[locale.firstDay]);
    dp.destroy();
  });
});
