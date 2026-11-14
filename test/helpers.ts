import { afterEach, beforeEach, vi } from 'vitest';
import { Yad } from '../src/yad';
import type { YadOptions } from '../src/options';

/** Local date helper: d(2026, 11, 20) is 20 November 2026. */
export const d = (y: number, m: number, day: number, h = 0, min = 0, s = 0): Date =>
  new Date(y, m - 1, day, h, min, s);

/** The fixed "now" for all picker tests: Saturday 14 November 2026, 09:41:30. */
export const NOW = d(2026, 11, 14, 9, 41, 30);

const created: Yad[] = [];
const savedDefaults = { ...Yad.defaults };

/** Register fake time and automatic cleanup for a picker test file. */
export function usePickerEnv(): void {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    created.splice(0).forEach((dp) => {
      if (Yad.getInstance(dp.element) === dp) {
        dp.destroy();
      }
    });
    Yad.defaults = { ...savedDefaults };
    document.body.innerHTML = '';
    vi.useRealTimers();
  });
}

export function html(markup: string): void {
  document.body.innerHTML = markup;
}

/** Create a picker without animation and register it for cleanup. */
export function create(target: string | HTMLElement, options: Partial<YadOptions> = {}): Yad {
  const dp = new Yad(target, { duration: 0, ...options });
  created.push(dp);
  return dp;
}

export function track(dp: Yad): Yad {
  created.push(dp);
  return dp;
}

export function input(id = 'date'): HTMLInputElement {
  return document.getElementById(id) as HTMLInputElement;
}

/** Dispatch a keydown and return whether default was prevented. */
export function key(el: Element, k: string, init: KeyboardEventInit = {}): boolean {
  const event = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  return event.defaultPrevented;
}

export function mousedown(el: Element): boolean {
  const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event.defaultPrevented;
}

export function focus(el: HTMLElement): void {
  el.focus();
  el.dispatchEvent(new Event('focus'));
}

export function dayButton(dp: Yad, date: Date): HTMLButtonElement | null {
  return dp.widget().querySelector(`[data-date="${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}"]`);
}

export function q<T extends Element = HTMLElement>(dp: Yad, selector: string): T | null {
  return dp.widget().querySelector<T>(selector);
}

export function qa<T extends Element = HTMLElement>(dp: Yad, selector: string): T[] {
  return Array.from(dp.widget().querySelectorAll<T>(selector));
}

export function texts(dp: Yad, selector: string): string[] {
  return qa(dp, selector).map((el) => el.textContent ?? '');
}

/** Month and year shown in the (first) header, e.g. "November 2026". */
export function shownMonth(dp: Yad, index = 0): string {
  const group = qa(dp, '.yad-group')[index];
  const month = group.querySelector('.yad-month, .yad-month-select') as HTMLElement & { value?: string };
  const year = group.querySelector('.yad-year, .yad-year-select') as HTMLElement & { value?: string };
  const monthText = month instanceof HTMLSelectElement ? month.selectedOptions[0].textContent : month.textContent;
  const yearText = year instanceof HTMLSelectElement ? year.value : year.textContent;
  return `${monthText} ${yearText}`;
}

export function setValue(el: HTMLInputElement | HTMLSelectElement, value: string | number, event = 'change'): void {
  el.value = String(value);
  el.dispatchEvent(new Event(event, { bubbles: true }));
}
