import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { de } from '../src/i18n/de';
import { Yad } from '../src/yad';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

function setup(html = '<input id="date">') {
  document.body.innerHTML = html;
  return document.getElementById('date') as HTMLInputElement;
}

function key(el: Element, k: string, init: KeyboardEventInit = {}) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
}

function dayButton(dp: Yad, date: Date): HTMLButtonElement | null {
  return dp.widget().querySelector(`[data-date="${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}"]`);
}

describe('Yad', () => {
  let instances: Yad[] = [];
  const create = (target: string | HTMLElement, options = {}) => {
    const dp = new Yad(target, { duration: 0, ...options });
    instances.push(dp);
    return dp;
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(d(2026, 11, 10));
  });

  afterEach(() => {
    instances.forEach((dp) => dp.destroy());
    instances = [];
    vi.useRealTimers();
    Yad.defaults = { ...Yad.defaults, ...Yad.regional[''], dateFormat: 'mm/dd/yy' };
  });

  it('opens on focus and selects a date on click', () => {
    const input = setup();
    const onSelect = vi.fn();
    const change = vi.fn();
    input.addEventListener('change', change);
    const dp = create(input, { onSelect });

    input.dispatchEvent(new Event('focus'));
    expect(dp.isVisible()).toBe(true);
    expect(input.getAttribute('aria-expanded')).toBe('true');

    dayButton(dp, d(2026, 11, 20))!.click();
    expect(input.value).toBe('11/20/2026');
    expect(onSelect).toHaveBeenCalledWith('11/20/2026', dp);
    expect(change).toHaveBeenCalledTimes(1);
    expect(dp.isVisible()).toBe(false);
    expect(dp.getDate()).toEqual(d(2026, 11, 20));
  });

  it('renders inline when attached to a div', () => {
    setup('<div id="date"></div>');
    const dp = create('#date', { defaultDate: '2026-12-24', dateFormat: 'yy-mm-dd' });
    expect(dp.inline).toBe(true);
    expect(dp.widget().parentElement!.id).toBe('date');
    expect(dp.widget().querySelector('.yad-title')!.textContent).toBe('December2026');
    dayButton(dp, d(2026, 12, 3))!.click();
    expect(dp.getDate()).toEqual(d(2026, 12, 3));
    expect(dp.widget().querySelector('.yad-selected')!.textContent).toBe('3');
  });

  it('supports option getters and setters', () => {
    const input = setup();
    const dp = create(input, { dateFormat: 'yy-mm-dd' });
    expect(dp.option('dateFormat')).toBe('yy-mm-dd');
    dp.setDate(d(2026, 1, 5));
    expect(input.value).toBe('2026-01-05');
    dp.option('dateFormat', 'dd.mm.yy');
    expect(input.value).toBe('05.01.2026');
    dp.option({ dateFormat: 'd M yy' });
    expect(input.value).toBe('5 Jan 2026');
    expect(dp.option().dateFormat).toBe('d M yy');
  });

  it('setDate accepts relative specs and clamps to min/max', () => {
    const input = setup();
    const dp = create(input, { minDate: 0, maxDate: '+1m' });
    dp.setDate('+3d');
    expect(dp.getDate()).toEqual(d(2026, 11, 13));
    dp.setDate('-1y');
    expect(dp.getDate()).toEqual(d(2026, 11, 10));
    dp.setDate('+1y');
    expect(dp.getDate()).toEqual(d(2026, 12, 10));
    dp.setDate(null);
    expect(dp.getDate()).toBeNull();
    expect(input.value).toBe('');
  });

  it('disables days outside min/max and via beforeShowDay', () => {
    const input = setup();
    const dp = create(input, { minDate: d(2026, 11, 5), beforeShowDay: Yad.noWeekends });
    dp.show();
    expect(dayButton(dp, d(2026, 11, 4))!.getAttribute('aria-disabled')).toBe('true');
    expect(dayButton(dp, d(2026, 11, 7))!.getAttribute('aria-disabled')).toBe('true'); // Saturday
    expect(dayButton(dp, d(2026, 11, 9))!.hasAttribute('aria-disabled')).toBe(false);
    dayButton(dp, d(2026, 11, 7))!.click();
    expect(input.value).toBe('');
    expect(dp.widget().querySelector<HTMLButtonElement>('.yad-prev')!.disabled).toBe(true);
  });

  it('navigates months with prev/next and fires onChangeMonthYear', () => {
    const input = setup();
    const onChangeMonthYear = vi.fn();
    const dp = create(input, { onChangeMonthYear });
    dp.show();
    dp.widget().querySelector<HTMLButtonElement>('.yad-next')!.click();
    expect(onChangeMonthYear).toHaveBeenLastCalledWith(2026, 12, dp);
    expect(dp.widget().querySelector('.yad-month')!.textContent).toBe('December');
    dp.widget().querySelector<HTMLButtonElement>('.yad-prev')!.click();
    dp.widget().querySelector<HTMLButtonElement>('.yad-prev')!.click();
    expect(onChangeMonthYear).toHaveBeenLastCalledWith(2026, 10, dp);
  });

  it('renders multiple months', () => {
    const input = setup();
    const dp = create(input, { numberOfMonths: [2, 3] });
    dp.show();
    expect(dp.widget().querySelectorAll('.yad-group')).toHaveLength(6);
    expect(dp.widget().querySelectorAll('.yad-row')).toHaveLength(2);
    expect(dp.widget().querySelectorAll('.yad-prev')).toHaveLength(1);
    expect(dp.widget().querySelectorAll('.yad-next')).toHaveLength(1);
  });

  it('supports month and year dropdowns', () => {
    const input = setup();
    const dp = create(input, { changeMonth: true, changeYear: true, yearRange: '2020:2030' });
    dp.show();
    const year = dp.widget().querySelector<HTMLSelectElement>('.yad-year-select')!;
    expect(year.options).toHaveLength(11);
    year.value = '2028';
    year.dispatchEvent(new Event('change', { bubbles: true }));
    const month = dp.widget().querySelector<HTMLSelectElement>('.yad-month-select')!;
    month.value = '1';
    month.dispatchEvent(new Event('change', { bubbles: true }));
    expect(dp.widget().querySelector<HTMLSelectElement>('.yad-year-select')!.value).toBe('2028');
    expect(dp.widget().querySelector<HTMLSelectElement>('.yad-month-select')!.value).toBe('1');
    expect(dayButton(dp, d(2028, 2, 29))).not.toBeNull();
  });

  it('shows week numbers and respects firstDay', () => {
    const input = setup();
    const dp = create(input, { showWeek: true, firstDay: 1 });
    dp.show();
    const headers = Array.from(dp.widget().querySelectorAll('thead th')).map((th) => th.textContent);
    expect(headers).toEqual(['Wk', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']);
    const weeks = Array.from(dp.widget().querySelectorAll('tbody .yad-week-col')).map((td) => td.textContent);
    expect(weeks[0]).toBe('44');
  });

  it('updates the altField', () => {
    setup('<input id="date"><input id="alt">');
    const dp = create('#date', { altField: '#alt', altFormat: 'yy-mm-dd' });
    dp.setDate(d(2026, 3, 1));
    expect((document.getElementById('alt') as HTMLInputElement).value).toBe('2026-03-01');
  });

  it('supports keyboard selection from the input', () => {
    const input = setup();
    const dp = create(input);
    input.dispatchEvent(new Event('focus'));
    key(input, 'ArrowRight', { ctrlKey: true });
    key(input, 'ArrowDown', { ctrlKey: true });
    key(input, 'PageDown');
    key(input, 'Enter');
    expect(dp.getDate()).toEqual(d(2026, 12, 18));
    expect(dp.isVisible()).toBe(false);
  });

  it('supports arrow key navigation inside the grid', () => {
    setup('<div id="date"></div>');
    const dp = create('#date');
    const start = dayButton(dp, d(2026, 11, 10))!;
    expect(start.tabIndex).toBe(0);
    start.focus();
    key(start, 'ArrowDown');
    key(document.activeElement!, 'ArrowLeft');
    expect(document.activeElement).toBe(dayButton(dp, d(2026, 11, 16)));
    key(document.activeElement!, 'PageDown');
    expect(document.activeElement).toBe(dayButton(dp, d(2026, 12, 16)));
    key(document.activeElement!, 'Enter');
    expect(dp.getDate()).toEqual(d(2026, 12, 16));
  });

  it('closes on Escape and on outside click', () => {
    const input = setup();
    const dp = create(input);
    dp.show();
    key(input, 'Escape');
    expect(dp.isVisible()).toBe(false);
    dp.show();
    document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    expect(dp.isVisible()).toBe(false);
  });

  it('constrains input to valid characters', () => {
    const input = setup();
    create(input, { dateFormat: 'yy-mm-dd' });
    const ev = (k: string) => new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    const letter = ev('a');
    input.dispatchEvent(letter);
    expect(letter.defaultPrevented).toBe(true);
    const digit = ev('5');
    input.dispatchEvent(digit);
    expect(digit.defaultPrevented).toBe(false);
    const dash = ev('-');
    input.dispatchEvent(dash);
    expect(dash.defaultPrevented).toBe(false);
  });

  it('creates a trigger button with showOn: button', () => {
    const input = setup();
    const dp = create(input, { showOn: 'button', buttonText: 'Pick', appendText: '(mm/dd/yyyy)' });
    input.dispatchEvent(new Event('focus'));
    expect(dp.isVisible()).toBe(false);
    const trigger = input.parentElement!.querySelector<HTMLButtonElement>('.yad-trigger')!;
    expect(trigger.textContent).toBe('Pick');
    expect(input.nextElementSibling!.className).toBe('yad-append');
    trigger.click();
    expect(dp.isVisible()).toBe(true);
  });

  it('shows the button panel', () => {
    const input = setup();
    const dp = create(input, { showButtonPanel: true });
    dp.setDate(d(2027, 5, 1));
    dp.show();
    expect(dp.widget().querySelector('.yad-month')!.textContent).toBe('May');
    dp.widget().querySelector<HTMLButtonElement>('.yad-current')!.click();
    expect(dp.widget().querySelector('.yad-month')!.textContent).toBe('November');
    dp.widget().querySelector<HTMLButtonElement>('.yad-close')!.click();
    expect(dp.isVisible()).toBe(false);
  });

  it('uses regional settings', () => {
    const input = setup();
    const dp = create(input, { ...de });
    dp.setDate(d(2026, 3, 2));
    expect(input.value).toBe('02.03.2026');
    dp.show();
    expect(dp.widget().querySelector('.yad-month')!.textContent).toBe('März');
    expect(dp.widget().querySelector('thead th')!.textContent).toBe('Mo');
  });

  it('setDefaults affects new instances', () => {
    Yad.setDefaults({ dateFormat: 'yy/mm/dd' });
    const input = setup();
    const dp = create(input);
    dp.setDate(d(2026, 1, 2));
    expect(input.value).toBe('2026/01/02');
  });

  it('enable / disable', () => {
    const input = setup();
    const dp = create(input);
    dp.disable();
    expect(dp.isDisabled()).toBe(true);
    expect(input.disabled).toBe(true);
    dp.show();
    expect(dp.isVisible()).toBe(false);
    dp.enable();
    dp.show();
    expect(dp.isVisible()).toBe(true);
  });

  it('returns the existing instance and cleans up on destroy', () => {
    const input = setup();
    const dp = create(input);
    expect(new Yad(input, { showWeek: true })).toBe(dp);
    expect(dp.option('showWeek')).toBe(true);
    expect(Yad.getInstance(input)).toBe(dp);
    dp.show();
    dp.destroy();
    instances = [];
    expect(Yad.getInstance(input)).toBeUndefined();
    expect(document.querySelector('.yad')).toBeNull();
    expect(input.hasAttribute('aria-expanded')).toBe(false);
  });

  it('attach() initialises multiple elements', () => {
    setup('<input class="d"><input class="d">');
    const list = Yad.attach('.d', { duration: 0 });
    instances.push(...list);
    expect(list).toHaveLength(2);
  });

  it('mounts the popup inside an enclosing modal so focus traps keep working', () => {
    setup('<div class="modal"><input id="date"></div><dialog open><input id="dlg"></dialog>');
    const dp = create('#date');
    dp.show();
    expect(dp.widget().parentElement!.className).toBe('modal');
    expect(dp.widget().style.position).toBe('fixed');
    const dp2 = create('#dlg');
    dp2.show();
    expect(dp2.widget().parentElement!.tagName).toBe('DIALOG');
  });

  it('mounts the popup on the body by default', () => {
    const input = setup();
    const dp = create(input);
    dp.show();
    expect(dp.widget().parentElement).toBe(document.body);
    expect(dp.widget().style.position).toBe('absolute');
  });

  it('reads typed input into the calendar', () => {
    const input = setup();
    const dp = create(input);
    dp.show();
    input.value = '02/14/2027';
    input.dispatchEvent(new Event('input'));
    expect(dp.widget().querySelector('.yad-month')!.textContent).toBe('February');
    expect(dp.widget().querySelector('.yad-selected')!.textContent).toBe('14');
  });
});
