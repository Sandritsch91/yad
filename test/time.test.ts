import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatTime, parseTime, timeFormatUnits } from '../src/time-utils';
import { Yad } from '../src/yad';
import { fr } from '../src/i18n/fr';
import { de } from '../src/i18n/de';

const d = (y: number, m: number, day: number, h = 0, min = 0, s = 0) => new Date(y, m - 1, day, h, min, s);

describe('formatTime', () => {
  const t = { hour: 15, minute: 7, second: 5, millisec: 42 };

  it('formats 24h tokens', () => {
    expect(formatTime('HH:mm', t)).toBe('15:07');
    expect(formatTime('H:m:s', t)).toBe('15:7:5');
    expect(formatTime('HH:mm:ss.l', t)).toBe('15:07:05.042');
  });

  it('formats 12h tokens with am/pm', () => {
    expect(formatTime('hh:mm TT', t)).toBe('03:07 PM');
    expect(formatTime('h:mm tt', t)).toBe('3:07 pm');
    expect(formatTime('h:mmT', { hour: 0, minute: 30 })).toBe('12:30A');
    expect(formatTime('h t', { hour: 12 })).toBe('12 p');
  });

  it('uses localised am/pm names and literals', () => {
    expect(formatTime('hh:mm TT', { hour: 9 }, de)).toBe('09:00 VORM.');
    expect(formatTime("HH'h'mm", t)).toBe('15h07');
  });
});

describe('parseTime', () => {
  it('parses 24h times', () => {
    expect(parseTime('HH:mm', '15:07')).toEqual({ hour: 15, minute: 7, second: 0, millisec: 0 });
    expect(parseTime('HH:mm:ss.l', '01:02:03.004')).toEqual({ hour: 1, minute: 2, second: 3, millisec: 4 });
  });

  it('parses 12h times with am/pm in any case', () => {
    expect(parseTime('hh:mm TT', '03:07 PM')?.hour).toBe(15);
    expect(parseTime('hh:mm TT', '12:00 am')?.hour).toBe(0);
    expect(parseTime('hh:mm TT', '12:00 PM')?.hour).toBe(12);
    expect(parseTime('h:mm T', '9:15 p')?.hour).toBe(21);
    expect(parseTime('hh:mm TT', '09:00 nachm.', de)?.hour).toBe(21);
  });

  it('returns null for invalid input', () => {
    expect(parseTime('HH:mm', '25:00')).toBeNull();
    expect(parseTime('HH:mm', '12:60')).toBeNull();
    expect(parseTime('HH:mm', '12')).toBeNull();
    expect(parseTime('hh:mm TT', '13:00 PM')).toBeNull();
    expect(parseTime('HH:mm', 'abc')).toBeNull();
  });

  it('round-trips with formatTime', () => {
    const t = { hour: 23, minute: 59, second: 1, millisec: 0 };
    for (const format of ['HH:mm:ss', 'hh:mm:ss TT', 'h:m:s tt', "HH'h'mm'm'ss"]) {
      expect(parseTime(format, formatTime(format, t))).toEqual(t);
    }
  });

  it('detects the units of a format', () => {
    expect(timeFormatUnits('HH:mm')).toEqual({ hour: true, minute: true, second: false, millisec: false, ampm: false });
    expect(timeFormatUnits('hh:mm:ss TT').second).toBe(true);
    expect(timeFormatUnits('hh:mm:ss TT').ampm).toBe(true);
  });
});

describe('time picker', () => {
  let instances: Yad[] = [];
  const setup = (html = '<input id="date">') => {
    document.body.innerHTML = html;
    return document.getElementById('date') as HTMLInputElement;
  };
  const create = (target: string | HTMLElement, options = {}) => {
    const dp = new Yad(target, { duration: 0, ...options });
    instances.push(dp);
    return dp;
  };
  const slider = (dp: Yad, unit: string) =>
    dp.widget().querySelector<HTMLInputElement>(`.yad-time-slider[data-unit="${unit}"]`)!;
  const drag = (el: HTMLInputElement, value: number) => {
    el.value = String(value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };
  const release = (el: HTMLInputElement | HTMLSelectElement, value: number) => {
    el.value = String(value);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  };
  const dayButton = (dp: Yad, date: Date) =>
    dp.widget().querySelector<HTMLButtonElement>(
      `[data-date="${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}"]`)!;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(d(2026, 11, 14, 9, 41, 30));
  });

  afterEach(() => {
    instances.forEach((dp) => dp.destroy());
    instances = [];
    vi.useRealTimers();
  });

  it('renders sliders for the units in timeFormat', () => {
    const input = setup();
    const dp = create(input, { showTime: true, timeFormat: 'HH:mm' });
    dp.show();
    expect(dp.widget().querySelector('.yad-calendar')).not.toBeNull();
    expect(slider(dp, 'hour')).not.toBeNull();
    expect(slider(dp, 'minute')).not.toBeNull();
    expect(dp.widget().querySelector('[data-unit="second"]')).toBeNull();
    dp.option('timeFormat', 'HH:mm:ss');
    expect(slider(dp, 'second')).not.toBeNull();
  });

  it('keeps the popup open on day selection and writes date and time', () => {
    const input = setup();
    const onSelect = vi.fn();
    const dp = create(input, { showTime: true, timeFormat: 'HH:mm', dateFormat: 'yy-mm-dd', onSelect });
    dp.show();
    dayButton(dp, d(2026, 11, 20)).click();
    expect(dp.isVisible()).toBe(true);
    expect(input.value).toBe('2026-11-20 00:00');

    drag(slider(dp, 'hour'), 14);
    expect(input.value).toBe('2026-11-20 14:00');
    expect(dp.widget().querySelector('.yad-time-value')!.textContent).toBe('14:00');
    release(slider(dp, 'minute'), 35);
    expect(input.value).toBe('2026-11-20 14:35');
    expect(onSelect).toHaveBeenLastCalledWith('2026-11-20 14:35', dp);
    expect(dp.getDate()).toEqual(d(2026, 11, 20, 14, 35));

    dp.widget().querySelector<HTMLButtonElement>('.yad-close')!.click();
    expect(dp.isVisible()).toBe(false);
  });

  it('fires input while dragging and change on release', () => {
    const input = setup();
    const onInput = vi.fn();
    const onChange = vi.fn();
    input.addEventListener('input', onInput);
    input.addEventListener('change', onChange);
    const dp = create(input, { showTime: true });
    dp.setDate(d(2026, 11, 20, 8, 0));
    dp.show();
    drag(slider(dp, 'hour'), 9);
    drag(slider(dp, 'hour'), 10);
    expect(onInput).toHaveBeenCalledTimes(2);
    expect(onChange).not.toHaveBeenCalled();
    release(slider(dp, 'hour'), 10);
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('formats 12-hour times by default in English', () => {
    const input = setup();
    const dp = Yad.datetimepicker(input, { duration: 0 });
    instances.push(dp);
    dp.setDate(d(2026, 11, 20, 15, 5));
    expect(input.value).toBe('11/20/2026 03:05 PM');
    expect(dp.getDate()).toEqual(d(2026, 11, 20, 15, 5));
  });

  it('parses typed date and time', () => {
    const input = setup();
    const dp = create(input, { ...de, showTime: true });
    input.value = '24.12.2026 18:30';
    expect(dp.getDate()).toEqual(d(2026, 12, 24, 18, 30));
    dp.show();
    input.value = '01.01.2027 07:15';
    input.dispatchEvent(new Event('input'));
    expect(slider(dp, 'hour').value).toBe('7');
    expect(slider(dp, 'minute').value).toBe('15');
  });

  it('handles a separator that also appears in the date format', () => {
    const input = setup();
    const dp = create(input, { showTime: true, dateFormat: 'd M yy', timeFormat: 'HH:mm' });
    dp.setDate('5 Mar 2027 06:45');
    expect(dp.getDate()).toEqual(d(2027, 3, 5, 6, 45));
    expect(input.value).toBe('5 Mar 2027 06:45');
  });

  it('applies steps and hour limits', () => {
    const input = setup();
    const dp = create(input, { showTime: true, timeFormat: 'HH:mm', stepMinute: 15, hourMin: 8, hourMax: 17 });
    dp.setDate(d(2026, 11, 20, 6, 52));
    expect(input.value).toBe('11/20/2026 08:45');
    dp.setDate(d(2026, 11, 20, 22, 8));
    expect(input.value).toBe('11/20/2026 17:15');
    dp.show();
    expect(slider(dp, 'hour').min).toBe('8');
    expect(slider(dp, 'hour').max).toBe('17');
    expect(slider(dp, 'minute').step).toBe('15');
  });

  it('respects minDateTime and maxDateTime', () => {
    const input = setup();
    const dp = create(input, {
      showTime: true,
      timeFormat: 'HH:mm',
      minDateTime: d(2026, 11, 20, 9, 30),
      maxDateTime: d(2026, 11, 22, 17, 0),
    });
    dp.setDate(d(2026, 11, 20, 8, 0));
    expect(dp.getDate()).toEqual(d(2026, 11, 20, 9, 30));
    dp.setDate(d(2026, 11, 22, 18, 0));
    expect(dp.getDate()).toEqual(d(2026, 11, 22, 17, 0));
    dp.setDate(d(2026, 11, 25, 12, 0));
    expect(dp.getDate()).toEqual(d(2026, 11, 22, 12, 0));
    dp.show();
    expect(dayButton(dp, d(2026, 11, 19)).getAttribute('aria-disabled')).toBe('true');
    expect(dayButton(dp, d(2026, 11, 23)).getAttribute('aria-disabled')).toBe('true');
    // On the min day, minutes are only limited while the hour sits on the bound hour.
    dp.setDate(d(2026, 11, 20, 9, 45));
    expect(slider(dp, 'hour').min).toBe('9');
    expect(slider(dp, 'minute').min).toBe('30');
    dp.setDate(d(2026, 11, 20, 10, 0));
    expect(slider(dp, 'minute').min).toBe('0');
  });

  it('supports dropdown controls', () => {
    const input = setup();
    const dp = create(input, { showTime: true, controlType: 'select', timeFormat: 'hh:mm TT', stepMinute: 30 });
    dp.setDate(d(2026, 11, 20, 13, 0));
    dp.show();
    const hour = dp.widget().querySelector<HTMLSelectElement>('select[data-unit="hour"]')!;
    const minute = dp.widget().querySelector<HTMLSelectElement>('select[data-unit="minute"]')!;
    expect(hour.options).toHaveLength(24);
    expect(hour.selectedOptions[0].textContent).toBe('01 PM');
    expect(Array.from(minute.options).map((o) => o.value)).toEqual(['0', '30']);
    release(minute, 30);
    expect(input.value).toBe('11/20/2026 01:30 PM');
  });

  it('time-only picker shows no calendar', () => {
    const input = setup();
    const dp = Yad.timepicker(input, { duration: 0, timeFormat: 'HH:mm' });
    instances.push(dp);
    dp.show();
    expect(dp.widget().querySelector('.yad-calendar')).toBeNull();
    expect(dp.widget().querySelector('.yad-title')!.textContent).toBe('Choose Time');
    release(slider(dp, 'hour'), 16);
    expect(input.value).toBe('16:00');
    expect(dp.getDate()).toEqual(d(2026, 11, 14, 16, 0));
    input.value = '07:20';
    expect(dp.getDate()).toEqual(d(2026, 11, 14, 7, 20));
  });

  it('"Now" selects the current date and time', () => {
    const input = setup();
    const dp = create(input, { showTime: true, timeFormat: 'HH:mm:ss' });
    dp.show();
    const now = dp.widget().querySelector<HTMLButtonElement>('[data-action="now"]')!;
    expect(now.textContent).toBe('Now');
    now.click();
    expect(input.value).toBe('11/14/2026 09:41:30');
  });

  it('writes date and time to altField', () => {
    setup('<input id="date"><input id="alt">');
    const dp = create('#date', {
      showTime: true, altField: '#alt', altFormat: 'yy-mm-dd', altTimeFormat: 'HH:mm:ss', altSeparator: 'T',
    });
    dp.setDate(d(2026, 11, 20, 15, 4, 5));
    expect((document.getElementById('alt') as HTMLInputElement).value).toBe('2026-11-20T15:04:05');
  });

  it('inline datetime picker fires onSelect with the time', () => {
    setup('<div id="date"></div>');
    const onSelect = vi.fn();
    const dp = create('#date', { showTime: true, timeFormat: 'HH:mm', onSelect });
    release(slider(dp, 'hour'), 11);
    expect(onSelect).toHaveBeenLastCalledWith('11/14/2026 11:00', dp);
  });

  it('uses localised time texts', () => {
    const input = setup();
    const dp = create(input, { ...fr, showTime: true });
    dp.show();
    const labels = Array.from(dp.widget().querySelectorAll('.yad-time-label')).map((l) => l.textContent);
    expect(labels).toEqual(['Heure', 'Heures', 'Minutes']);
    expect(dp.widget().querySelector('[data-action="now"]')!.textContent).toBe('Maintenant');
  });

  it('allows time characters with constrainInput', () => {
    const input = setup();
    create(input, { showTime: true, timeFormat: 'hh:mm TT' });
    const press = (k: string) => {
      const ev = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
      input.dispatchEvent(ev);
      return ev.defaultPrevented;
    };
    expect(press(':')).toBe(false);
    expect(press(' ')).toBe(false);
    expect(press('P')).toBe(false);
    expect(press('x')).toBe(true);
  });
});
