import { describe, expect, it } from 'vitest';
import { determineDate, formatDate, iso8601Week, noWeekends, parseDate, stripTime } from '../src/date-utils';
import { de } from '../src/i18n/de';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('formatDate', () => {
  it('formats numeric tokens', () => {
    expect(formatDate('d/m/y', d(2001, 2, 3))).toBe('3/2/01');
    expect(formatDate('dd/mm/yy', d(2001, 2, 3))).toBe('03/02/2001');
    expect(formatDate('o', d(2001, 2, 3))).toBe('34');
    expect(formatDate('oo', d(2001, 2, 3))).toBe('034');
  });

  it('formats names', () => {
    expect(formatDate('D, d M yy', d(2026, 11, 10))).toBe('Tue, 10 Nov 2026');
    expect(formatDate('DD, d MM yy', d(2026, 11, 10))).toBe('Tuesday, 10 November 2026');
    expect(formatDate('DD, d. MM yy', d(2026, 3, 2), de)).toBe('Montag, 2. März 2026');
  });

  it('handles literals and quotes', () => {
    expect(formatDate("'day' d 'of' MM", d(2026, 1, 5))).toBe('day 5 of January');
    expect(formatDate("d''m", d(2026, 1, 5))).toBe("5'1");
  });

  it('formats timestamps', () => {
    const date = d(2026, 1, 5);
    expect(formatDate('@', date)).toBe(String(date.getTime()));
  });

  it('returns empty string for no date', () => {
    expect(formatDate('yy-mm-dd', null)).toBe('');
  });
});

describe('parseDate', () => {
  it('parses numeric formats', () => {
    expect(parseDate('dd/mm/yy', '03/02/2001')).toEqual(d(2001, 2, 3));
    expect(parseDate('d/m/yy', '3/2/2001')).toEqual(d(2001, 2, 3));
    expect(parseDate('yy-mm-dd', '2026-11-10')).toEqual(d(2026, 11, 10));
  });

  it('parses names case-insensitively', () => {
    expect(parseDate('d MM yy', '10 november 2026')).toEqual(d(2026, 11, 10));
    expect(parseDate('D, d M yy', 'Tue, 10 Nov 2026')).toEqual(d(2026, 11, 10));
    expect(parseDate('d. MM yy', '2. März 2026', de)).toEqual(d(2026, 3, 2));
  });

  it('parses day of year', () => {
    expect(parseDate('yy-oo', '2001-034')).toEqual(d(2001, 2, 3));
  });

  it('applies shortYearCutoff', () => {
    expect(parseDate('dd/mm/y', '01/01/30', { shortYearCutoff: 50 })!.getFullYear()).toBe(2030);
    expect(parseDate('dd/mm/y', '01/01/70', { shortYearCutoff: 50 })!.getFullYear()).toBe(1970);
  });

  it('returns null for empty input', () => {
    expect(parseDate('yy-mm-dd', '')).toBeNull();
  });

  it('throws on invalid input', () => {
    expect(() => parseDate('yy-mm-dd', '2026-02-30')).toThrow('Invalid date');
    expect(() => parseDate('yy-mm-dd', '2026/02/03')).toThrow('Unexpected literal');
    expect(() => parseDate('yy-mm-dd', '2026-02-03x')).toThrow('Extra/unparsed');
    expect(() => parseDate('d MM yy', '3 Foo 2026')).toThrow('Unknown name');
  });

  it('round-trips with formatDate', () => {
    const date = d(2026, 7, 4);
    for (const format of ['yy-mm-dd', 'dd.mm.yy', 'DD, d MM yy', "'w'oo/yy", 'M d, yy']) {
      expect(parseDate(format, formatDate(format, date))).toEqual(date);
    }
  });
});

describe('determineDate', () => {
  const today = stripTime(new Date());

  it('resolves relative strings', () => {
    const expected = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    expect(determineDate('+1w', null)).toEqual(expected);
    expect(determineDate('+7', null)).toEqual(expected);
    expect(determineDate('+7d', null)).toEqual(expected);
    expect(determineDate(7, null)).toEqual(expected);
  });

  it('combines offsets', () => {
    const expected = new Date(today.getFullYear() + 1, today.getMonth() - 1, 1);
    const result = determineDate('+1y -1m', null)!;
    expect(result.getFullYear()).toBe(expected.getFullYear());
    expect(result.getMonth()).toBe(expected.getMonth());
  });

  it('parses with the date format first', () => {
    expect(determineDate('2026-01-02', null, 'yy-mm-dd')).toEqual(d(2026, 1, 2));
  });

  it('falls back to the default', () => {
    expect(determineDate(null, d(2020, 1, 1))).toEqual(d(2020, 1, 1));
    expect(determineDate('', null)).toBeNull();
  });
});

describe('helpers', () => {
  it('computes ISO weeks', () => {
    expect(iso8601Week(d(2026, 1, 1))).toBe(1);
    expect(iso8601Week(d(2021, 1, 3))).toBe(53);
    expect(iso8601Week(d(2026, 11, 10))).toBe(46);
  });

  it('noWeekends', () => {
    expect(noWeekends(d(2026, 11, 7))[0]).toBe(false); // Saturday
    expect(noWeekends(d(2026, 11, 8))[0]).toBe(false); // Sunday
    expect(noWeekends(d(2026, 11, 9))[0]).toBe(true); // Monday
  });
});
