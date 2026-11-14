import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  daysInMonth, daylightSavingAdjust, determineDate, formatDate, isSameDay, iso8601Week, parseDate, stripTime,
} from '../src/date-utils';
import { formatTime, parseTime, timeFormatUnits, timeOf, withTime } from '../src/time-utils';
import { de } from '../src/i18n/de';
import { fr } from '../src/i18n/fr';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('date helpers', () => {
  it('stripTime removes the time and returns a new object', () => {
    const date = new Date(2026, 4, 6, 13, 45, 12, 500);
    const stripped = stripTime(date);
    expect(stripped).toEqual(d(2026, 5, 6));
    expect(stripped).not.toBe(date);
    expect(date.getHours()).toBe(13);
  });

  it.each([
    [2026, 0, 31], [2026, 1, 28], [2024, 1, 29], [1900, 1, 28], [2000, 1, 29], [2026, 3, 30], [2026, 11, 31],
  ])('daysInMonth(%i, %i) = %i', (year, month, days) => {
    expect(daysInMonth(year, month)).toBe(days);
  });

  it('daylightSavingAdjust handles null and keeps normal midnights', () => {
    expect(daylightSavingAdjust(null)).toBeNull();
    expect(daylightSavingAdjust(d(2026, 6, 1))!.getHours()).toBe(0);
    // A date that ended up at 23:00 (DST shift) is moved forward into the right day.
    const shifted = new Date(2026, 2, 28, 23, 0);
    expect(daylightSavingAdjust(shifted)!.getDate()).toBe(29);
  });

  it('isSameDay ignores time and handles empty values', () => {
    expect(isSameDay(new Date(2026, 0, 1, 1), new Date(2026, 0, 1, 23))).toBe(true);
    expect(isSameDay(d(2026, 1, 1), d(2026, 1, 2))).toBe(false);
    expect(isSameDay(d(2026, 1, 1), d(2027, 1, 1))).toBe(false);
    expect(isSameDay(null, d(2026, 1, 1))).toBe(false);
    expect(isSameDay(undefined, undefined)).toBe(false);
  });

  it.each([
    [d(2026, 12, 28), 53], [d(2027, 1, 3), 53], [d(2027, 1, 4), 1], [d(2024, 12, 30), 1], [d(2020, 12, 31), 53],
  ])('iso8601Week(%s) = %i', (date, week) => {
    expect(iso8601Week(date)).toBe(week);
  });
});

describe('formatDate edge cases', () => {
  it('pads two-digit years below 10', () => {
    expect(formatDate('y', d(2005, 1, 1))).toBe('05');
    expect(formatDate('y', d(2010, 1, 1))).toBe('10');
  });

  it('formats Windows ticks', () => {
    const date = d(2026, 2, 3);
    const ticks = BigInt(formatDate('!', date));
    const epochTicks = 621355968000000000n;
    expect(Number((ticks - epochTicks) / 10000n)).toBe(date.getTime());
  });

  it('formats day of year at year end and in leap years', () => {
    expect(formatDate('oo', d(2026, 12, 31))).toBe('365');
    expect(formatDate('oo', d(2024, 12, 31))).toBe('366');
    expect(formatDate('o', d(2026, 1, 1))).toBe('1');
  });

  it('handles quotes in literals', () => {
    expect(formatDate("'it''s' d", d(2026, 1, 5))).toBe("it's 5");
    expect(formatDate("'unterminated d", d(2026, 1, 5))).toBe('unterminated d');
  });

  it('uses all four name lists of a locale', () => {
    expect(formatDate('D DD M MM', d(2026, 3, 2), fr)).toBe('lun. lundi mars mars');
    expect(formatDate('D DD M MM', d(2026, 10, 4), de)).toBe('So Sonntag Okt Oktober');
  });
});

describe('parseDate edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 14));
  });
  afterEach(() => vi.useRealTimers());

  it('throws on missing arguments', () => {
    expect(() => parseDate(null as unknown as string, '1')).toThrow('Invalid arguments');
    expect(() => parseDate('yy', null)).toThrow('Invalid arguments');
  });

  it('parses Unix timestamps and Windows ticks', () => {
    const date = d(2026, 2, 3);
    expect(parseDate('@', String(date.getTime()))).toEqual(date);
    expect(parseDate('!', formatDate('!', date))).toEqual(date);
  });

  it('parses quoted literals and escaped quotes', () => {
    expect(parseDate("'day' d 'of' MM yy", 'day 5 of March 2026')).toEqual(d(2026, 3, 5));
    expect(parseDate("d''m''yy", "5'3'2026")).toEqual(d(2026, 3, 5));
    expect(() => parseDate("'day' d", 'dag 5')).toThrow('Unexpected literal');
  });

  it('ignores trailing text after whitespace but rejects other trailing text (like jQuery UI)', () => {
    expect(parseDate('yy-mm-dd', '2026-03-05  ')).toEqual(d(2026, 3, 5));
    expect(parseDate('yy-mm-dd', '2026-03-05 10:00')).toEqual(d(2026, 3, 5));
    expect(() => parseDate('yy-mm-dd', '2026-03-05x')).toThrow('Extra/unparsed');
  });

  it('uses the current year when the format has no year', () => {
    expect(parseDate('dd.mm.', '24.12.')).toEqual(d(2026, 12, 24));
  });

  it('applies a relative shortYearCutoff (default +10)', () => {
    // 2026: cutoff = 26 + 10 = 36
    expect(parseDate('dd.mm.y', '01.01.36')!.getFullYear()).toBe(2036);
    expect(parseDate('dd.mm.y', '01.01.37')!.getFullYear()).toBe(1937);
    expect(parseDate('dd.mm.y', '01.01.27', { shortYearCutoff: '+0' })!.getFullYear()).toBe(1927);
    expect(parseDate('dd.mm.y', '01.01.26', { shortYearCutoff: '+0' })!.getFullYear()).toBe(2026);
  });

  it('requires all digits of a four-digit year', () => {
    expect(() => parseDate('yy-mm-dd', '26-03-05')).toThrow('Missing number');
  });

  it('accepts one- or two-digit days and months', () => {
    expect(parseDate('dd.mm.yy', '5.3.2026')).toEqual(d(2026, 3, 5));
    expect(parseDate('d.m.yy', '05.03.2026')).toEqual(d(2026, 3, 5));
  });

  it('prefers the longest matching name', () => {
    // "Mar" would also match the start of "March"
    expect(parseDate('M d yy', 'Mar 5 2026')).toEqual(d(2026, 3, 5));
    expect(parseDate('MM d yy', 'March 5 2026')).toEqual(d(2026, 3, 5));
  });

  it('parses day of year beyond February', () => {
    expect(parseDate('yy-oo', '2026-365')).toEqual(d(2026, 12, 31));
    expect(parseDate('yy-oo', '2024-060')).toEqual(d(2024, 2, 29));
    expect(() => parseDate('yy-oo', '2026-366')).toThrow('Invalid date');
  });

  it('rejects impossible dates', () => {
    expect(() => parseDate('yy-mm-dd', '2026-13-01')).toThrow('Invalid date');
    expect(() => parseDate('yy-mm-dd', '2026-00-10')).toThrow('Invalid date');
    expect(() => parseDate('yy-mm-dd', '2025-02-29')).toThrow('Invalid date');
    expect(parseDate('yy-mm-dd', '2024-02-29')).toEqual(d(2024, 2, 29));
  });
});

describe('determineDate edge cases', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 0, 31, 15, 30));
  });
  afterEach(() => vi.useRealTimers());

  it('clamps month offsets to the end of the month', () => {
    expect(determineDate('+1m', null)).toEqual(d(2026, 2, 28));
    expect(determineDate('+13m', null)).toEqual(d(2027, 2, 28));
  });

  it('clamps year offsets from 29 February', () => {
    vi.setSystemTime(new Date(2024, 1, 29));
    expect(determineDate('+1y', null)).toEqual(d(2025, 2, 28));
    expect(determineDate('+4y', null)).toEqual(d(2028, 2, 29));
  });

  it('is case-insensitive and tolerates spaces', () => {
    expect(determineDate('+2W', null)).toEqual(d(2026, 2, 14));
    expect(determineDate('+1 d', null)).toEqual(d(2026, 2, 1));
    expect(determineDate('-1Y', null)).toEqual(d(2025, 1, 31));
  });

  it('strips the time of Date specs and copies them', () => {
    const spec = new Date(2026, 5, 1, 18, 0);
    const result = determineDate(spec, null)!;
    expect(result).toEqual(d(2026, 6, 1));
    expect(result).not.toBe(spec);
  });

  it('returns today for 0 and falls back for NaN and invalid dates', () => {
    const fallback = d(2000, 1, 1);
    expect(determineDate(0, null)).toEqual(d(2026, 1, 31));
    expect(determineDate(NaN, fallback)).toEqual(fallback);
    expect(determineDate(new Date('nope'), fallback)).toEqual(fallback);
    expect(determineDate(undefined, fallback)).toEqual(fallback);
  });

  it('uses the date format before relative parsing', () => {
    expect(determineDate('05.03.2026', null, 'dd.mm.yy')).toEqual(d(2026, 3, 5));
    // Not valid in the format: read as offsets
    expect(determineDate('+3', null, 'dd.mm.yy')).toEqual(d(2026, 2, 3));
  });
});

describe('time utils edge cases', () => {
  it('formats empty and partial times', () => {
    expect(formatTime('HH:mm', null)).toBe('');
    expect(formatTime('HH:mm', undefined)).toBe('');
    expect(formatTime('HH:mm:ss.l', {})).toBe('00:00:00.000');
  });

  it('formats midnight and noon in 12-hour time', () => {
    expect(formatTime('hh:mm TT', { hour: 0 })).toBe('12:00 AM');
    expect(formatTime('hh:mm TT', { hour: 12 })).toBe('12:00 PM');
    expect(formatTime('hh:mm TT', { hour: 23, minute: 59 })).toBe('11:59 PM');
  });

  it('handles quotes in time formats', () => {
    expect(formatTime("HH'h''x'mm", { hour: 9, minute: 5 })).toBe("09h'x05");
    expect(formatTime("HH''mm", { hour: 9, minute: 5 })).toBe("09'05");
    expect(formatTime("HH 'open", { hour: 9 })).toBe('09 open');
    expect(parseTime("HH'h'mm", '09h05')).toEqual({ hour: 9, minute: 5, second: 0, millisec: 0 });
    expect(parseTime("HH'h''x'mm", "09h'x05")?.minute).toBe(5);
  });

  it('parseTime handles null, whitespace and regex characters in literals', () => {
    expect(parseTime('HH:mm', null)).toBeNull();
    expect(parseTime('HH:mm', undefined)).toBeNull();
    expect(parseTime('HH:mm', '  09:05  ')?.minute).toBe(5);
    expect(parseTime('HH.mm', '09.05')?.minute).toBe(5);
    expect(parseTime('HH.mm', '09x05')).toBeNull();
    expect(parseTime('(HH)', '(09)')?.hour).toBe(9);
  });

  it('parseTime accepts a 24-hour value with a PM marker', () => {
    expect(parseTime('H TT', '9 PM')?.hour).toBe(21);
    expect(parseTime('H TT', '21 PM')?.hour).toBe(21);
    expect(parseTime('H TT', '9 AM')?.hour).toBe(9);
  });

  it('parseTime rejects out-of-range values', () => {
    expect(parseTime('HH:mm:ss', '10:00:60')).toBeNull();
    expect(parseTime('hh:mm TT', '00:30 AM')).toBeNull();
    expect(parseTime('HH:mm:ss.l', '10:00:00.1000')).toBeNull();
  });

  it('parseTime with a 12-hour format and no marker keeps the hour', () => {
    expect(parseTime('hh:mm', '07:30')?.hour).toBe(7);
  });

  it('parseTime accepts any configured marker and their first letters', () => {
    const settings = { amNames: ['vorm.', 'AM'], pmNames: ['nachm.', 'PM'] };
    expect(parseTime('hh:mm TT', '01:00 nachm.', settings)?.hour).toBe(13);
    expect(parseTime('hh:mm TT', '01:00 pm', settings)?.hour).toBe(13);
    expect(parseTime('hh:mm T', '01:00 n', settings)?.hour).toBe(13);
    expect(parseTime('hh:mm T', '01:00 v', settings)?.hour).toBe(1);
    expect(parseTime('hh:mm TT', '01:00 xm', settings)).toBeNull();
  });

  it('parseTime treats a marker listed as both AM and PM as no marker', () => {
    const settings = { amNames: ['X', 'AM'], pmNames: ['X', 'PM'] };
    expect(parseTime('h:mm TT', '3:00 X', settings)?.hour).toBe(3);
    expect(parseTime('h:mm TT', '3:00 PM', settings)?.hour).toBe(15);
  });

  it('timeFormatUnits detects milliseconds and am/pm', () => {
    expect(timeFormatUnits('HH:mm:ss.l')).toEqual({ hour: true, minute: true, second: true, millisec: true, ampm: false });
    expect(timeFormatUnits("'H'mm")).toEqual({ hour: false, minute: true, second: false, millisec: false, ampm: false });
    expect(timeFormatUnits('h t').ampm).toBe(true);
  });

  it('timeOf and withTime convert between dates and times', () => {
    const date = new Date(2026, 10, 20, 15, 4, 5, 6);
    expect(timeOf(date)).toEqual({ hour: 15, minute: 4, second: 5, millisec: 6 });
    expect(withTime(d(2026, 1, 1), { hour: 1, minute: 2, second: 3, millisec: 4 }))
      .toEqual(new Date(2026, 0, 1, 1, 2, 3, 4));
  });
});
