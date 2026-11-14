import { describe, expect, it, vi } from 'vitest';
import { Yad } from '../src/yad';
import type { YadRange } from '../src/yad';
import { create, d, dayButton, focus, html, input, q, qa, setValue, track, usePickerEnv } from './helpers';

usePickerEnv();

function range(options: Parameters<typeof Yad.range>[2] = {}): YadRange {
  const pair = Yad.range('#from', '#to', { duration: 0, ...options });
  track(pair.from);
  track(pair.to);
  return pair;
}

const twoInputs = '<input id="from"><input id="to">';

function cls(dp: Yad, date: Date): string {
  return dayButton(dp, date)!.parentElement!.className;
}

describe('Yad.range', () => {
  it('creates two pickers and registers them', () => {
    html(twoInputs);
    const { from, to } = range();
    expect(from).toBeInstanceOf(Yad);
    expect(Yad.getInstance('#from')).toBe(from);
    expect(Yad.getInstance('#to')).toBe(to);
    expect(from).not.toBe(to);
  });

  it('applies the shared options to both pickers', () => {
    html(twoInputs);
    const { from, to } = range({ dateFormat: 'yy-mm-dd', numberOfMonths: 2 });
    expect(from.option('dateFormat')).toBe('yy-mm-dd');
    expect(to.option('numberOfMonths')).toBe(2);
  });

  it('accepts elements as well as selectors', () => {
    html(twoInputs);
    const pair = Yad.range(input('from'), input('to'));
    track(pair.from);
    track(pair.to);
    expect(pair.from.element).toBe(input('from'));
  });

  it('throws when both sides are the same element', () => {
    html(twoInputs);
    expect(() => track(Yad.range('#from', '#from').from)).toThrow(/different elements/);
  });

  it('disables days before the start in the end picker', () => {
    html(twoInputs);
    const { from, to } = range();
    from.setDate(d(2026, 11, 20));
    to.show();
    expect(dayButton(to, d(2026, 11, 19))!.getAttribute('aria-disabled')).toBe('true');
    expect(dayButton(to, d(2026, 11, 20))!.hasAttribute('aria-disabled')).toBe(false);
  });

  it('disables days after the end in the start picker', () => {
    html(twoInputs);
    const { from, to } = range();
    to.setDate(d(2026, 11, 24));
    from.show();
    expect(dayButton(from, d(2026, 11, 25))!.getAttribute('aria-disabled')).toBe('true');
    expect(dayButton(from, d(2026, 11, 24))!.hasAttribute('aria-disabled')).toBe(false);
  });

  it('clamps programmatic dates to the other side', () => {
    html(twoInputs);
    const { from, to } = range();
    from.setDate(d(2026, 11, 20));
    to.setDate(d(2026, 11, 18));
    expect(to.getDate()).toEqual(d(2026, 11, 20));
    from.setDate(d(2026, 11, 30));
    expect(from.getDate()).toEqual(d(2026, 11, 20));
  });

  it('keeps the shared minDate and maxDate as outer bounds', () => {
    html(twoInputs);
    const { from, to } = range({ minDate: 0, maxDate: '+1m' });
    from.setDate(d(2026, 11, 1));
    expect(from.getDate()).toEqual(d(2026, 11, 14));
    to.setDate(d(2027, 3, 1));
    expect(to.getDate()).toEqual(d(2026, 12, 14));
    // The range bound is the narrower one.
    from.setDate(d(2026, 11, 20));
    to.setDate(d(2026, 11, 15));
    expect(to.getDate()).toEqual(d(2026, 11, 20));
  });

  it('opens the end picker at the start date when it is empty', () => {
    html(twoInputs);
    const { from, to } = range();
    from.setDate(d(2027, 2, 10));
    to.show();
    expect(q(to, '.yad-highlight [data-date]')!.dataset.date).toBe('2027-2-10');
  });

  it('highlights the range in both calendars', () => {
    html(twoInputs);
    const { from, to } = range();
    from.setDate(d(2026, 11, 20));
    to.setDate(d(2026, 11, 23));
    for (const dp of [from, to]) {
      dp.show();
      expect(cls(dp, d(2026, 11, 20))).toContain('yad-range-start');
      expect(cls(dp, d(2026, 11, 23))).toContain('yad-range-end');
      expect(qa(dp, '.yad-in-range [data-date]').map((b) => b.dataset.date)).toEqual(['2026-11-21', '2026-11-22']);
      expect(cls(dp, d(2026, 11, 19))).not.toMatch(/yad-(in-)?range/);
      dp.hide();
    }
  });

  it('marks a one-day range as start and end', () => {
    html(twoInputs);
    const { from, to } = range();
    from.setDate(d(2026, 11, 20));
    to.setDate(d(2026, 11, 20));
    to.show();
    expect(cls(to, d(2026, 11, 20))).toMatch(/yad-range-start.*yad-range-end/);
    expect(qa(to, '.yad-in-range')).toHaveLength(0);
  });

  it('marks only the chosen end while the other is empty', () => {
    html(twoInputs);
    const { from } = range();
    from.setDate(d(2026, 11, 20));
    from.show();
    expect(cls(from, d(2026, 11, 20))).toContain('yad-range-start');
    expect(qa(from, '.yad-in-range, .yad-range-end')).toHaveLength(0);
  });

  it('redraws an open partner when a day is clicked', () => {
    html(twoInputs);
    const { from, to } = range({ showTime: true, timeFormat: 'HH:mm' });
    to.setDate(d(2026, 11, 25, 12));
    from.show();
    dayButton(from, d(2026, 11, 20))!.click();
    to.show();
    expect(cls(to, d(2026, 11, 22))).toContain('yad-in-range');
    expect(dayButton(to, d(2026, 11, 19))!.getAttribute('aria-disabled')).toBe('true');
  });

  it('updates the partner while the user types', () => {
    html('<div id="from"></div><div id="to"></div><input id="x">');
    const pair = Yad.range('#from', '#to');
    track(pair.from);
    track(pair.to);
    pair.from.setDate(d(2026, 11, 20));
    expect(dayButton(pair.to, d(2026, 11, 19))!.getAttribute('aria-disabled')).toBe('true');

    html(twoInputs);
    const { from, to } = range();
    to.show();
    const el = input('from');
    el.value = '11/18/2026';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    expect(dayButton(to, d(2026, 11, 17))!.getAttribute('aria-disabled')).toBe('true');
    expect(from.getDate()).toEqual(d(2026, 11, 18));
  });

  it('works with inline calendars', () => {
    html('<div id="from"></div><div id="to"></div>');
    const { from, to } = range();
    // The end calendar starts empty, so the start can still move freely.
    expect(to.getDate()).toBeNull();
    dayButton(from, d(2026, 11, 16))!.click();
    dayButton(to, d(2026, 11, 18))!.click();
    expect(cls(from, d(2026, 11, 17))).toContain('yad-in-range');
    expect(cls(to, d(2026, 11, 17))).toContain('yad-in-range');
    expect(dayButton(to, d(2026, 11, 15))!.getAttribute('aria-disabled')).toBe('true');
    expect(dayButton(from, d(2026, 11, 19))!.getAttribute('aria-disabled')).toBe('true');
  });

  it('moves a contradicting initial end value up to the start', () => {
    html('<input id="from" value="11/20/2026"><input id="to" value="11/10/2026">');
    const { from, to } = range();
    expect(from.getDate()).toEqual(d(2026, 11, 20));
    expect(to.getDate()).toEqual(d(2026, 11, 20));
    expect(input('to').value).toBe('11/20/2026');
  });

  it('keeps consistent initial values', () => {
    html('<input id="from" value="11/20/2026"><input id="to" value="11/22/2026">');
    range();
    expect(input('to').value).toBe('11/22/2026');
  });

  it('calls onSelect on each side', () => {
    html(twoInputs);
    const onSelect = vi.fn();
    const { from } = range({ onSelect });
    focus(input('from'));
    dayButton(from, d(2026, 11, 20))!.click();
    expect(onSelect).toHaveBeenCalledWith('11/20/2026', from);
  });

  it('re-linking replaces the previous range', () => {
    html('<input id="from"><input id="to"><input id="other">');
    const first = range();
    const second = Yad.range('#from', '#other');
    track(second.to);
    expect(second.from).toBe(first.from);
    // #to is no longer linked: it is not limited by #from.
    first.from.setDate(d(2026, 11, 20));
    first.to.setDate(d(2026, 11, 10));
    expect(first.to.getDate()).toEqual(d(2026, 11, 10));
    second.to.setDate(d(2026, 11, 10));
    expect(second.to.getDate()).toEqual(d(2026, 11, 20));
  });

  it('destroying one side frees the other', () => {
    html(twoInputs);
    const { from, to } = range();
    from.setDate(d(2026, 11, 20));
    from.destroy();
    to.setDate(d(2026, 11, 10));
    expect(to.getDate()).toEqual(d(2026, 11, 10));
    to.show();
    expect(qa(to, '.yad-range-start, .yad-range-end, .yad-in-range')).toHaveLength(0);
  });

  it('does not change unlinked pickers', () => {
    html('<input id="date">');
    const dp = create('#date');
    dp.setDate(d(2026, 11, 20));
    dp.show();
    expect(qa(dp, '.yad-range-start, .yad-range-end, .yad-in-range')).toHaveLength(0);
  });
});

describe('Yad.range with the time picker', () => {
  const timeOptions = { showTime: true, timeFormat: 'HH:mm' } as const;

  it('limits the end time on the start day', () => {
    html(twoInputs);
    const { from, to } = range(timeOptions);
    from.setDate(d(2026, 11, 20, 14, 30));
    to.setDate(d(2026, 11, 20, 9, 0));
    expect(to.getDate()).toEqual(d(2026, 11, 20, 14, 30));
    to.setDate(d(2026, 11, 21, 9, 0));
    expect(to.getDate()).toEqual(d(2026, 11, 21, 9, 0));
  });

  it('limits the start time on the end day', () => {
    html(twoInputs);
    const { from, to } = range(timeOptions);
    to.setDate(d(2026, 11, 20, 10, 15));
    from.setDate(d(2026, 11, 20, 18, 0));
    // Like maxDateTime: the hour is capped, the minutes stay within the allowed range.
    expect(from.getDate()).toEqual(d(2026, 11, 20, 10, 0));
  });

  it('narrows the hour slider of the end picker', () => {
    html(twoInputs);
    const { from, to } = range(timeOptions);
    from.setDate(d(2026, 11, 20, 14, 30));
    to.setDate(d(2026, 11, 20, 16, 0));
    to.show();
    const hour = q<HTMLInputElement>(to, 'input[data-unit="hour"]')!;
    expect(hour.min).toBe('14');
  });

  it('respects a shared minDateTime as well', () => {
    html(twoInputs);
    const { from, to } = range({ ...timeOptions, minDateTime: d(2026, 11, 20, 8, 0) });
    from.setDate(d(2026, 11, 19, 7, 0));
    expect(from.getDate()).toEqual(d(2026, 11, 20, 8, 0));
    from.setDate(d(2026, 11, 21, 12, 0));
    to.setDate(d(2026, 11, 20, 9, 0));
    expect(to.getDate()).toEqual(d(2026, 11, 21, 12, 0));
  });

  it('keeps the earlier shared maxDateTime for the start', () => {
    html(twoInputs);
    const { from, to } = range({ ...timeOptions, maxDateTime: d(2026, 11, 20, 12, 0) });
    to.setDate(d(2026, 11, 20, 12, 0));
    from.setDate(d(2026, 11, 25, 12, 0));
    expect(from.getDate()).toEqual(d(2026, 11, 20, 12, 0));
    expect(to.getDate()).toEqual(d(2026, 11, 20, 12, 0));
  });

  it('uses only the day when the other side has no time', () => {
    html(twoInputs);
    const pair = Yad.range('#from', '#to', { duration: 0 });
    track(pair.from);
    track(pair.to);
    pair.to.option({ showTime: true, timeFormat: 'HH:mm' });
    pair.from.setDate(d(2026, 11, 20));
    pair.to.setDate(d(2026, 11, 20, 1, 0));
    expect(pair.to.getDate()).toEqual(d(2026, 11, 20, 1, 0));
  });

  it('updates the partner while a slider is dragged', () => {
    html(twoInputs);
    const { from, to } = range(timeOptions);
    to.setDate(d(2026, 11, 21, 10, 0));
    from.setDate(d(2026, 11, 20, 10, 0));
    from.show();
    to.show();
    const hour = q<HTMLInputElement>(from, 'input[data-unit="hour"]')!;
    setValue(hour, 11, 'input');
    expect(input('from').value).toBe('11/20/2026 11:00');
    expect(cls(to, d(2026, 11, 20))).toContain('yad-range-start');
  });
});
