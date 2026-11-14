import { describe, expect, it, vi } from 'vitest';
import { create, d, dayButton, html, input, usePickerEnv } from './helpers';

usePickerEnv();

describe('event order', () => {
  it('altField, onSelect, input, change, onClose', () => {
    html('<input id="date"><input id="alt">');
    const log: string[] = [];
    const dp = create('#date', {
      altField: '#alt',
      altFormat: 'yy-mm-dd',
      onSelect: (text) => log.push(`onSelect ${text} alt=${input('alt').value}`),
      onClose: (text) => log.push(`onClose ${text}`),
    });
    input().addEventListener('input', () => log.push(`input ${input().value}`));
    input().addEventListener('change', () => log.push('change'));
    dp.show();
    dayButton(dp, d(2026, 11, 20))!.click();
    expect(log).toEqual([
      'onSelect 11/20/2026 alt=2026-11-20',
      'input 11/20/2026',
      'change',
      'onClose 11/20/2026',
    ]);
  });
});

describe('DOM events', () => {
  it('bubble, so delegated listeners and forms see them', () => {
    html('<form id="f"><input id="date"></form>');
    const change = vi.fn();
    document.getElementById('f')!.addEventListener('change', change);
    const dp = create('#date');
    dp.show();
    dayButton(dp, d(2026, 11, 20))!.click();
    expect(change).toHaveBeenCalledTimes(1);
  });

  it('are not fired when the same date is selected again', () => {
    html('<input id="date">');
    const change = vi.fn();
    const onSelect = vi.fn();
    input().addEventListener('change', change);
    const dp = create('#date', { onSelect });
    dp.show();
    dayButton(dp, d(2026, 11, 20))!.click();
    dp.show();
    dayButton(dp, d(2026, 11, 20))!.click();
    expect(change).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('are not fired for programmatic changes', () => {
    html('<input id="date">');
    const listener = vi.fn();
    const onSelect = vi.fn();
    input().addEventListener('input', listener);
    input().addEventListener('change', listener);
    const dp = create('#date', { onSelect });
    dp.setDate(d(2026, 11, 20));
    dp.option('dateFormat', 'yy-mm-dd');
    dp.setDate(null);
    expect(listener).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('a programmatic value is the baseline for the next user change', () => {
    html('<input id="date">');
    const change = vi.fn();
    input().addEventListener('change', change);
    const dp = create('#date');
    dp.setDate(d(2026, 11, 20));
    dp.show();
    dayButton(dp, d(2026, 11, 20))!.click();
    expect(change).not.toHaveBeenCalled();
  });
});

describe('onSelect', () => {
  it('is not called for unselectable days', () => {
    html('<div id="cal"></div>');
    const onSelect = vi.fn();
    const dp = create('#cal', { onSelect, beforeShowDay: () => [false] });
    dayButton(dp, d(2026, 11, 20))!.click();
    expect(onSelect).not.toHaveBeenCalled();
    expect(dp.getDate()).toEqual(d(2026, 11, 14)); // inline default selection is unchanged
  });

  it('is not called for days outside the range', () => {
    html('<div id="cal"></div>');
    const onSelect = vi.fn();
    const dp = create('#cal', { onSelect, maxDate: 0 });
    dayButton(dp, d(2026, 11, 20))!.click();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('inline calendars stay open and re-render the selection', () => {
    html('<div id="cal"></div>');
    const onSelect = vi.fn();
    const dp = create('#cal', { onSelect, dateFormat: 'yy-mm-dd' });
    dayButton(dp, d(2026, 11, 3))!.click();
    dayButton(dp, d(2026, 11, 4))!.click();
    expect(onSelect.mock.calls.map((c) => c[0])).toEqual(['2026-11-03', '2026-11-04']);
    expect(dp.widget().querySelector('.yad-selected')!.textContent).toBe('4');
  });
});

describe('clicks', () => {
  it('clicks outside buttons do nothing', () => {
    html('<div id="cal"></div>');
    const onSelect = vi.fn();
    const dp = create('#cal', { onSelect });
    (dp.widget().querySelector('.yad-title') as HTMLElement).click();
    (dp.widget().querySelector('thead th') as HTMLElement).click();
    dp.widget().click();
    expect(onSelect).not.toHaveBeenCalled();
    expect(dp.getDate()).toEqual(d(2026, 11, 14));
  });
});

describe('getDate / setDate', () => {
  it('getDate returns a copy', () => {
    html('<div id="cal"></div>');
    const dp = create('#cal');
    dp.setDate(d(2026, 11, 20));
    dp.getDate()!.setFullYear(1999);
    expect(dp.getDate()).toEqual(d(2026, 11, 20));
  });

  it.each([
    [d(2026, 12, 24, 18, 30), d(2026, 12, 24)],
    ['12/24/2026', d(2026, 12, 24)],
    [3, d(2026, 11, 17)],
    ['+1w', d(2026, 11, 21)],
    ['+1m -1d', d(2026, 12, 13)],
    ['-1y', d(2025, 11, 14)],
  ])('setDate(%j)', (spec, expected) => {
    html('<div id="cal"></div>');
    const dp = create('#cal');
    expect(dp.setDate(spec)).toBe(dp);
    expect(dp.getDate()).toEqual(expected);
  });

  it.each([[null], ['']])('setDate(%j) clears', (spec) => {
    html('<input id="date">');
    const dp = create('#date');
    dp.setDate(d(2026, 11, 20));
    dp.setDate(spec);
    expect(dp.getDate()).toBeNull();
    expect(input().value).toBe('');
  });

  it('setDate re-renders an open popup', () => {
    html('<input id="date">');
    const dp = create('#date');
    dp.show();
    dp.setDate(d(2027, 2, 2));
    expect(dp.widget().querySelector('.yad-month')!.textContent).toBe('February');
  });
});
