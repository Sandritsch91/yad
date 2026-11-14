import { describe, expect, it, vi } from 'vitest';
import { Yad } from '../src/yad';
import type { Yad as YadType } from '../src/yad';
import { create, d, dayButton, html, input, key, q, qa, setValue, texts, track, usePickerEnv } from './helpers';

usePickerEnv();

const datetime = (options = {}) => {
  html('<input id="date"><input id="alt">');
  return create('#date', { showTime: true, timeFormat: 'HH:mm', dateFormat: 'yy-mm-dd', ...options });
};
const slider = (dp: YadType, unit: string) => q<HTMLInputElement>(dp, `.yad-time-slider[data-unit="${unit}"]`)!;
const drag = (dp: YadType, unit: string, value: number) => setValue(slider(dp, unit), value, 'input');
const release = (dp: YadType, unit: string, value: number) => setValue(slider(dp, unit), value, 'change');

describe('units', () => {
  it('showX overrides the format', () => {
    const dp = datetime({ showSecond: true, showMinute: false });
    dp.show();
    expect(qa(dp, '[data-unit]').map((el) => el.dataset.unit)).toEqual(['hour', 'second']);
  });

  it('shows milliseconds for the l token', () => {
    const dp = datetime({ timeFormat: 'HH:mm:ss.l' });
    dp.setDate(d(2026, 11, 20, 1, 2, 3));
    dp.show();
    expect(slider(dp, 'millisec').max).toBe('999');
    release(dp, 'millisec', 250);
    expect(input().value).toBe('2026-11-20 01:02:03.250');
    expect(dp.getDate()!.getMilliseconds()).toBe(250);
  });

  it('labels each control with a <label for>', () => {
    const dp = datetime();
    dp.show();
    const labels = qa<HTMLLabelElement>(dp, 'label.yad-time-label');
    expect(labels.map((l) => l.textContent)).toEqual(['Hour', 'Minute']);
    expect(labels.every((l) => q(dp, `#${l.htmlFor}`) !== null)).toBe(true);
  });

  it('sliders announce the value as time text', () => {
    const dp = datetime({ timeFormat: 'hh:mm TT' });
    dp.setDate(d(2026, 11, 20, 15, 5));
    dp.show();
    expect(slider(dp, 'hour').getAttribute('aria-valuetext')).toBe('03 PM');
    expect(slider(dp, 'minute').getAttribute('aria-valuetext')).toBe('05');
    drag(dp, 'hour', 0);
    expect(slider(dp, 'hour').getAttribute('aria-valuetext')).toBe('12 AM');
  });

  it('the time section is a labelled group', () => {
    const dp = datetime();
    dp.show();
    expect(q(dp, '.yad-time')!.getAttribute('role')).toBe('group');
    expect(q(dp, '.yad-time')!.getAttribute('aria-label')).toBe('Time');
  });
});

describe('steps and limits', () => {
  it('snaps to the step grid starting at the unit minimum', () => {
    const dp = datetime({ stepMinute: 20, minuteMin: 5 });
    dp.setDate(d(2026, 11, 20, 10, 0));
    expect(input().value).toBe('2026-11-20 10:05');
    dp.setDate(d(2026, 11, 20, 10, 36));
    expect(input().value).toBe('2026-11-20 10:45');
  });

  it('values above the last step snap down to the last step', () => {
    const dp = datetime({ minuteMin: 10, minuteMax: 50, stepMinute: 15 });
    dp.setDate(d(2026, 11, 20, 10, 59));
    expect(input().value).toBe('2026-11-20 10:40');
    dp.setDate(d(2026, 11, 20, 10, 0));
    expect(input().value).toBe('2026-11-20 10:10');
  });

  it('Now does not pick another day when today is out of range', () => {
    const dp = datetime({ minDate: 1 });
    dp.show();
    const now = q<HTMLButtonElement>(dp, '[data-action="now"]')!;
    now.disabled = false;
    now.click();
    expect(input().value).toBe('');
  });

  it('dropdown options follow steps and limits', () => {
    const dp = datetime({ controlType: 'select', hourMin: 9, hourMax: 17, stepHour: 2 });
    dp.show();
    expect(texts(dp, 'select[data-unit="hour"] option')).toEqual(['09', '11', '13', '15', '17']);
  });

  it('maxDateTime limits lower units only at the bound hour', () => {
    const dp = datetime({ maxDateTime: d(2026, 11, 20, 17, 20) });
    dp.setDate(d(2026, 11, 20, 17, 0));
    dp.show();
    expect(slider(dp, 'hour').max).toBe('17');
    expect(slider(dp, 'minute').max).toBe('20');
    release(dp, 'hour', 16);
    expect(slider(dp, 'minute').max).toBe('59');
  });

  it('slider limits update while dragging across the bound hour', () => {
    const dp = datetime({ minDateTime: d(2026, 11, 20, 9, 30) });
    dp.setDate(d(2026, 11, 20, 12, 10));
    dp.show();
    expect(slider(dp, 'minute').min).toBe('0');
    drag(dp, 'hour', 9);
    expect(slider(dp, 'minute').min).toBe('30');
    expect(slider(dp, 'minute').value).toBe('30');
    expect(input().value).toBe('2026-11-20 09:30');
  });

  it('a later minDate and an earlier maxDate win over the date-time bounds', () => {
    const dp = datetime({
      minDateTime: d(2026, 11, 1, 8, 0), minDate: d(2026, 11, 10),
      maxDateTime: d(2026, 12, 31, 8, 0), maxDate: d(2026, 12, 1),
    });
    dp.setDate(d(2026, 11, 2, 12, 0));
    expect(dp.getDate()).toEqual(d(2026, 11, 10, 12, 0));
    dp.setDate(d(2026, 12, 20, 12, 0));
    expect(dp.getDate()).toEqual(d(2026, 12, 1, 12, 0));
  });

  it('the initial time comes from hour/minute options', () => {
    const dp = datetime({ hour: 9, minute: 30 });
    dp.show();
    dayButton(dp, d(2026, 11, 20))!.click();
    expect(input().value).toBe('2026-11-20 09:30');
  });
});

describe('selection', () => {
  it('picking another day keeps the time', () => {
    const dp = datetime();
    dp.setDate(d(2026, 11, 20, 15, 45));
    dp.show();
    dayButton(dp, d(2026, 11, 25))!.click();
    expect(input().value).toBe('2026-11-25 15:45');
  });

  it('a time change selects the highlighted day', () => {
    const dp = datetime();
    dp.show();
    release(dp, 'hour', 8);
    expect(input().value).toBe('2026-11-14 08:00');
    expect(q(dp, '.yad-selected')!.textContent).toBe('14');
  });

  it('a time change on an unselectable highlighted day only updates the readout', () => {
    const onSelect = vi.fn();
    const dp = datetime({ beforeShowDay: () => [false], onSelect });
    dp.show();
    release(dp, 'hour', 8);
    expect(input().value).toBe('');
    expect(onSelect).not.toHaveBeenCalled();
    expect(q(dp, '.yad-time-value')!.textContent).toBe('08:00');
  });

  it('dragging fires input but not onSelect or change', () => {
    const onSelect = vi.fn();
    const change = vi.fn();
    const dp = datetime({ onSelect });
    input().addEventListener('change', change);
    dp.setDate(d(2026, 11, 20, 10, 0));
    dp.show();
    drag(dp, 'minute', 15);
    drag(dp, 'minute', 30);
    expect(onSelect).not.toHaveBeenCalled();
    expect(change).not.toHaveBeenCalled();
    expect(input('alt').value).toBe('');
    release(dp, 'minute', 30);
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('dragging updates the altField live', () => {
    const dp = datetime({ altField: '#alt', altTimeFormat: 'HH.mm' });
    dp.setDate(d(2026, 11, 20, 10, 0));
    dp.show();
    drag(dp, 'hour', 13);
    expect(input('alt').value).toBe('2026-11-20 13.00');
  });

  it('committing keeps focus on the control', () => {
    const dp = datetime({ controlType: 'select' });
    dp.show();
    const minute = q<HTMLSelectElement>(dp, 'select[data-unit="minute"]')!;
    minute.focus();
    setValue(minute, 45);
    expect(document.activeElement).toBe(q(dp, 'select[data-unit="minute"]'));
  });

  it('Enter in the input selects the highlighted day with the time and closes', () => {
    const dp = datetime({ hour: 7 });
    dp.show();
    key(input(), 'Enter');
    expect(input().value).toBe('2026-11-14 07:00');
    expect(dp.isVisible()).toBe(false);
  });

  it('the grid Enter key keeps the popup open', () => {
    const dp = datetime();
    input().focus();
    dp.show();
    key(input(), 'ArrowDown');
    key(document.activeElement!, 'Enter');
    expect(input().value).toBe('2026-11-14 00:00');
    expect(dp.isVisible()).toBe(true);
  });

  it('ignores time input while disabled', () => {
    const dp = datetime();
    dp.setDate(d(2026, 11, 20, 10, 0));
    dp.show();
    const hour = slider(dp, 'hour');
    dp.disable();
    setValue(hour, 20);
    expect(dp.getDate()).toEqual(d(2026, 11, 20, 10, 0));
  });

  it('time controls are disabled for a disabled inline picker', () => {
    html('<div id="cal"></div>');
    const dp = create('#cal', { showTime: true });
    dp.disable();
    expect(qa<HTMLInputElement>(dp, '.yad-time-slider').every((s) => s.disabled)).toBe(true);
  });

  it('range input events from other inputs are ignored', () => {
    const dp = datetime();
    dp.show();
    const foreign = document.createElement('input');
    foreign.type = 'text';
    foreign.dataset.unit = 'hour';
    dp.widget().appendChild(foreign);
    setValue(foreign, 5, 'input');
    expect(input().value).toBe('');
  });
});

describe('Now button', () => {
  it('is disabled when today cannot be selected', () => {
    const dp = datetime({ minDate: 1 });
    dp.show();
    expect(q<HTMLButtonElement>(dp, '[data-action="now"]')!.disabled).toBe(true);
  });

  it('replaces the Today button and has no effect when today is excluded', () => {
    const dp = datetime({ showButtonPanel: true, beforeShowDay: () => [false] });
    dp.show();
    expect(q(dp, '[data-action="today"]')).toBeNull();
    const now = q<HTMLButtonElement>(dp, '[data-action="now"]')!;
    now.disabled = false;
    now.click();
    expect(input().value).toBe('');
  });

  it('works for time-only pickers regardless of minDate', () => {
    html('<input id="date">');
    const dp = track(Yad.timepicker('#date', { duration: 0, timeFormat: 'HH:mm', minDate: 5 }));
    dp.show();
    q<HTMLButtonElement>(dp, '[data-action="now"]')!.click();
    expect(input().value).toBe('09:41');
  });
});

describe('formatting and parsing', () => {
  it('a custom separator', () => {
    const dp = datetime({ separator: ' @ ' });
    dp.setDate(d(2026, 11, 20, 8, 5));
    expect(input().value).toBe('2026-11-20 @ 08:05');
    input().value = '2026-12-01 @ 17:30';
    expect(dp.getDate()).toEqual(d(2026, 12, 1, 17, 30));
  });

  it('an empty separator writes both parts but parses only the date', () => {
    const dp = datetime({ separator: '' });
    dp.setDate(d(2026, 11, 20, 8, 5));
    expect(input().value).toBe('2026-11-2008:05');
  });

  it('text with only a date keeps the current time', () => {
    const dp = datetime();
    dp.setDate(d(2026, 11, 20, 8, 5));
    input().value = '2026-12-01';
    expect(dp.getDate()).toEqual(d(2026, 12, 1, 8, 5));
  });

  it('setDate with a relative string keeps the time', () => {
    const dp = datetime();
    dp.setDate(d(2026, 11, 20, 8, 5));
    dp.setDate('+1d');
    expect(dp.getDate()).toEqual(d(2026, 11, 15, 8, 5));
  });

  it('switching the locale reformats date and time', () => {
    const dp = datetime({ timeFormat: 'hh:mm TT', dateFormat: 'mm/dd/yy' });
    dp.setDate(d(2026, 11, 20, 15, 5));
    expect(input().value).toBe('11/20/2026 03:05 PM');
    dp.option(Yad.regional.de);
    expect(input().value).toBe('20.11.2026 15:05');
  });

  it('turning the time picker on and off reformats the value', () => {
    html('<input id="date">');
    const dp = create('#date', { dateFormat: 'yy-mm-dd', timeFormat: 'HH:mm' });
    dp.setDate(d(2026, 11, 20));
    dp.option('showTime', true);
    expect(input().value).toBe('2026-11-20 00:00');
    dp.option({ showTime: false });
    expect(input().value).toBe('2026-11-20');
  });

  it('a locale without time texts falls back to English', () => {
    const { timeText, nowText, ...dateOnly } = Yad.regional.de;
    void timeText;
    void nowText;
    html('<input id="date">');
    const dp = create('#date', { ...Yad.regional.en, ...dateOnly, showTime: true });
    dp.show();
    expect(q(dp, '.yad-time-current .yad-time-label')!.textContent).toBe('Time');
    expect(q(dp, '[data-action="now"]')!.textContent).toBe('Now');
    expect(q(dp, 'label.yad-time-label')!.textContent).toBe('Stunde');
  });
});

describe('time only', () => {
  const timeOnly = (options = {}) => {
    html('<input id="date"><input id="alt">');
    return create('#date', { timeOnly: true, timeFormat: 'HH:mm', ...options });
  };

  it('getDate is null while empty', () => {
    const dp = timeOnly();
    expect(dp.getDate()).toBeNull();
    input().value = 'nonsense';
    expect(dp.getDate()).toBeNull();
  });

  it('setDate takes the time of a Date', () => {
    const dp = timeOnly();
    dp.setDate(d(2030, 1, 1, 18, 15));
    expect(input().value).toBe('18:15');
  });

  it('setDate parses a time string', () => {
    const dp = timeOnly();
    dp.setDate('06:40');
    expect(dp.getDate()).toEqual(d(2026, 11, 14, 6, 40));
  });

  it('writes only the time to the altField', () => {
    const dp = timeOnly({ altField: '#alt', altTimeFormat: 'HH:mm:ss' });
    dp.setDate('06:40');
    expect(input('alt').value).toBe('06:40:00');
  });

  it('Enter closes without changing the value', () => {
    const dp = timeOnly();
    dp.setDate('06:40');
    dp.show();
    key(input(), 'Enter');
    expect(input().value).toBe('06:40');
    expect(dp.isVisible()).toBe(false);
  });

  it('labels the popup with timeOnlyTitle', () => {
    const dp = timeOnly({ ...Yad.regional.de, timeFormat: 'HH:mm' });
    dp.show();
    expect(dp.widget().getAttribute('aria-label')).toBe('Zeit wählen');
    expect(dp.widget().classList.contains('yad--time-only')).toBe(true);
    expect(dp.widget().classList.contains('yad--multi')).toBe(false);
  });

  it('works inline', () => {
    html('<div id="cal"></div>');
    const onSelect = vi.fn();
    const dp = create('#cal', { timeOnly: true, timeFormat: 'HH:mm', onSelect });
    expect(q(dp, '.yad-calendar')).toBeNull();
    setValue(q<HTMLInputElement>(dp, '.yad-time-slider[data-unit="minute"]')!, 25);
    expect(onSelect).toHaveBeenCalledWith('00:25', dp);
  });

  it('ignores numberOfMonths', () => {
    const dp = timeOnly({ numberOfMonths: 3 });
    dp.show();
    expect(qa(dp, '.yad-group')).toHaveLength(0);
  });
});
