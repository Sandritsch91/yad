import { describe, expect, it, vi } from 'vitest';
import type { Yad } from '../src/yad';
import { create, d, dayButton, html, input, key, q, shownMonth, usePickerEnv } from './helpers';

usePickerEnv();

const popup = (options = {}) => {
  html('<input id="date"><button id="next">next field</button>');
  return create('#date', { dateFormat: 'yy-mm-dd', ...options });
};
const highlighted = (dp: Yad) => q(dp, '.yad-highlight')?.querySelector('button')?.getAttribute('aria-label');

describe('input, popup closed', () => {
  it.each([
    ['ArrowDown', { altKey: true }],
    ['ArrowDown', { ctrlKey: true }],
    ['ArrowDown', { metaKey: true }],
    ['Home', { ctrlKey: true }],
  ])('%s %j opens the popup', (k, mods) => {
    const dp = popup();
    expect(key(input(), k, mods)).toBe(true);
    expect(dp.isVisible()).toBe(true);
  });

  it('plain arrow keys do not open it', () => {
    const dp = popup();
    expect(key(input(), 'ArrowDown')).toBe(false);
    expect(key(input(), 'Home')).toBe(false);
    expect(dp.isVisible()).toBe(false);
  });
});

describe('input, popup open', () => {
  it('Escape closes', () => {
    const dp = popup();
    dp.show();
    expect(key(input(), 'Escape')).toBe(true);
    expect(dp.isVisible()).toBe(false);
  });

  it('Tab closes without blocking focus movement', () => {
    const dp = popup();
    dp.show();
    expect(key(input(), 'Tab')).toBe(false);
    expect(dp.isVisible()).toBe(false);
  });

  it('Enter selects the highlighted day and closes', () => {
    const onSelect = vi.fn();
    const dp = popup({ onSelect });
    dp.show();
    expect(key(input(), 'Enter')).toBe(true);
    expect(input().value).toBe('2026-11-14');
    expect(onSelect).toHaveBeenCalledWith('2026-11-14', dp);
    expect(dp.isVisible()).toBe(false);
  });

  it('Enter on an unselectable day only closes', () => {
    const onSelect = vi.fn();
    const dp = popup({ onSelect, beforeShowDay: () => [false] });
    dp.show();
    key(input(), 'Enter');
    expect(onSelect).not.toHaveBeenCalled();
    expect(input().value).toBe('');
    expect(dp.isVisible()).toBe(false);
  });

  it('Ctrl/Cmd + arrows move the highlight by day and week', () => {
    const dp = popup();
    dp.show();
    key(input(), 'ArrowRight', { ctrlKey: true });
    expect(highlighted(dp)).toBe('Sunday, 15 November 2026');
    key(input(), 'ArrowDown', { ctrlKey: true });
    expect(highlighted(dp)).toBe('Sunday, 22 November 2026');
    key(input(), 'ArrowLeft', { metaKey: true });
    expect(highlighted(dp)).toBe('Saturday, 21 November 2026');
    key(input(), 'ArrowUp', { metaKey: true });
    expect(highlighted(dp)).toBe('Saturday, 14 November 2026');
  });

  it('Ctrl + left/right are swapped for right-to-left', () => {
    const dp = popup({ isRTL: true });
    dp.show();
    key(input(), 'ArrowLeft', { ctrlKey: true });
    expect(highlighted(dp)).toBe('Sunday, 15 November 2026');
  });

  it('plain arrows and Home/End stay with the text field', () => {
    const dp = popup();
    dp.show();
    for (const k of ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Home', 'End']) {
      expect(key(input(), k)).toBe(false);
    }
    expect(highlighted(dp)).toBe('Saturday, 14 November 2026');
  });

  it('ArrowDown moves focus into the grid', () => {
    const dp = popup();
    input().focus();
    dp.show();
    key(input(), 'ArrowDown');
    expect(document.activeElement).toBe(dayButton(dp, d(2026, 11, 14)));
  });

  it('PageUp / PageDown move by stepMonths, with Ctrl or Shift by a year', () => {
    const dp = popup({ stepMonths: 2 });
    dp.show();
    key(input(), 'PageDown');
    expect(shownMonth(dp)).toBe('January 2027');
    key(input(), 'PageUp');
    expect(shownMonth(dp)).toBe('November 2026');
    key(input(), 'PageDown', { ctrlKey: true });
    expect(shownMonth(dp)).toBe('November 2027');
    key(input(), 'PageUp', { shiftKey: true });
    expect(shownMonth(dp)).toBe('November 2026');
  });

  it('PageUp does not go before minDate', () => {
    const dp = popup({ minDate: 0 });
    dp.show();
    key(input(), 'PageUp');
    expect(shownMonth(dp)).toBe('November 2026');
  });

  it('Ctrl+Home goes to today', () => {
    const dp = popup();
    dp.setDate(d(2028, 5, 5));
    dp.show();
    expect(shownMonth(dp)).toBe('May 2028');
    key(input(), 'Home', { ctrlKey: true });
    expect(shownMonth(dp)).toBe('November 2026');
  });

  it('Ctrl+End clears the value and closes', () => {
    const onSelect = vi.fn();
    const change = vi.fn();
    const dp = popup({ onSelect });
    input().addEventListener('change', change);
    dp.setDate(d(2026, 11, 20));
    dp.show();
    key(input(), 'End', { ctrlKey: true });
    expect(input().value).toBe('');
    expect(dp.getDate()).toBeNull();
    expect(onSelect).toHaveBeenCalledWith('', dp);
    expect(change).toHaveBeenCalledTimes(1);
    expect(dp.isVisible()).toBe(false);
  });
});

describe('grid', () => {
  const grid = (options = {}) => {
    html('<input id="date">');
    const dp = create('#date', { dateFormat: 'yy-mm-dd', ...options });
    input().focus();
    dp.show();
    key(input(), 'ArrowDown');
    return dp;
  };
  const press = (k: string, init: KeyboardEventInit = {}) => key(document.activeElement!, k, init);
  const focused = () => document.activeElement!.getAttribute('aria-label');

  it('arrows move by day and week', () => {
    grid();
    press('ArrowRight');
    press('ArrowDown');
    press('ArrowLeft');
    press('ArrowLeft');
    press('ArrowUp');
    expect(focused()).toBe('Friday, 13 November 2026');
  });

  it('arrows are swapped for right-to-left', () => {
    grid({ isRTL: true });
    press('ArrowLeft');
    expect(focused()).toBe('Sunday, 15 November 2026');
  });

  it('Home / End go to the start and end of the week, respecting firstDay', () => {
    grid({ firstDay: 1 });
    press('Home');
    expect(focused()).toBe('Monday, 9 November 2026');
    press('End');
    expect(focused()).toBe('Sunday, 15 November 2026');
  });

  it('PageUp / PageDown move by month, with Shift by year', () => {
    const dp = grid();
    press('PageDown');
    expect(focused()).toBe('Monday, 14 December 2026');
    press('PageUp', { shiftKey: true });
    expect(focused()).toBe('Sunday, 14 December 2025');
    expect(shownMonth(dp)).toBe('December 2025');
  });

  it('moving past the month scrolls the calendar and fires onChangeMonthYear', () => {
    const onChangeMonthYear = vi.fn();
    const dp = grid({ onChangeMonthYear });
    for (let i = 0; i < 3; i++) {
      press('ArrowDown');
    }
    expect(focused()).toBe('Saturday, 5 December 2026');
    expect(shownMonth(dp)).toBe('December 2026');
    expect(onChangeMonthYear).toHaveBeenCalledWith(2026, 12, dp);
  });

  it('does not move before minDate', () => {
    grid({ minDate: 0 });
    press('ArrowLeft');
    press('ArrowUp');
    expect(focused()).toBe('Saturday, 14 November 2026');
  });

  it.each([['Enter'], [' ']])('%j selects', (k) => {
    const dp = grid();
    press('ArrowRight');
    expect(press(k)).toBe(true);
    expect(input().value).toBe('2026-11-15');
    expect(dp.isVisible()).toBe(false);
    expect(document.activeElement).toBe(input());
  });

  it('Enter on an unselectable day does nothing', () => {
    const dp = grid({ beforeShowDay: (date: Date) => [date.getDate() !== 15] });
    press('ArrowRight');
    press('Enter');
    expect(input().value).toBe('');
    expect(dp.isVisible()).toBe(true);
  });

  it('Escape closes and returns focus to the input', () => {
    const dp = grid();
    expect(press('Escape')).toBe(true);
    expect(dp.isVisible()).toBe(false);
    expect(document.activeElement).toBe(input());
  });

  it('Escape on other controls in the popup closes too', () => {
    const dp = grid({ changeMonth: true });
    const select = q<HTMLSelectElement>(dp, '.yad-month-select')!;
    select.focus();
    expect(key(select, 'Escape')).toBe(true);
    expect(dp.isVisible()).toBe(false);
  });

  it('other keys are left alone', () => {
    grid();
    expect(press('a')).toBe(false);
    expect(press('Tab')).toBe(false);
  });

  it('inline calendars keep Escape for the page', () => {
    html('<div id="cal"></div>');
    const dp = create('#cal');
    const button = dayButton(dp, d(2026, 11, 14))!;
    button.focus();
    expect(key(button, 'Escape')).toBe(false);
    expect(key(q(dp, '.yad-next')!, 'Escape')).toBe(false);
  });
});

describe('constrainInput', () => {
  it('allows the characters of the format, including names and literals', () => {
    popup({ dateFormat: "D, d M yy 'at' yy" });
    expect(key(input(), 'T')).toBe(false); // from "Tue"/"Thu"
    expect(key(input(), 'a')).toBe(false); // literal "at"
    expect(key(input(), ',')).toBe(false);
    expect(key(input(), 'Q')).toBe(true);
    expect(key(input(), '-')).toBe(true);
  });

  it('allows escaped quotes', () => {
    popup({ dateFormat: "d''m" });
    expect(key(input(), "'")).toBe(false);
  });

  it('ignores shortcuts and special keys', () => {
    popup();
    expect(key(input(), 'a', { ctrlKey: true })).toBe(false);
    expect(key(input(), 'Backspace')).toBe(false);
  });

  it('can be turned off', () => {
    popup({ constrainInput: false });
    expect(key(input(), 'x')).toBe(false);
  });

  it('also applies while the popup is open', () => {
    const dp = popup();
    dp.show();
    expect(key(input(), 'x')).toBe(true);
    expect(key(input(), '7')).toBe(false);
  });
});
