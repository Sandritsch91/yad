import { describe, expect, it, vi } from 'vitest';
import type { Yad } from '../src/yad';
import { create, d, dayButton, focus, html, input, mousedown, q, usePickerEnv } from './helpers';

usePickerEnv();

const popup = (options = {}, markup = '<input id="date"><input id="other">') => {
  html(markup);
  return create('#date', { dateFormat: 'yy-mm-dd', ...options });
};

/** Give the input and popup a layout (jsdom has none). */
function layout(dp: Yad, rect: Partial<DOMRect>, size = { width: 300, height: 320 }): void {
  const full = { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, ...rect };
  input().getBoundingClientRect = () => ({ ...full, toJSON: () => full }) as DOMRect;
  Object.defineProperty(dp.widget(), 'offsetWidth', { configurable: true, value: size.width });
  Object.defineProperty(dp.widget(), 'offsetHeight', { configurable: true, value: size.height });
}

describe('showing', () => {
  it('opens on focus by default and is mounted on the body', () => {
    const dp = popup();
    expect(dp.widget().isConnected).toBe(false);
    focus(input());
    expect(dp.isVisible()).toBe(true);
    expect(dp.widget().parentElement).toBe(document.body);
    expect(dp.widget().hidden).toBe(false);
  });

  it('showOn "button" does not open on focus', () => {
    const dp = popup({ showOn: 'button' });
    focus(input());
    expect(dp.isVisible()).toBe(false);
  });

  it('showOn "both" opens on focus and has a trigger', () => {
    const dp = popup({ showOn: 'both' });
    focus(input());
    expect(dp.isVisible()).toBe(true);
    expect(document.querySelector('.yad-trigger')).not.toBeNull();
  });

  it('show() does nothing when disabled, already open or inline', () => {
    const beforeShow = vi.fn();
    const dp = popup({ beforeShow });
    dp.disable();
    dp.show();
    expect(dp.isVisible()).toBe(false);
    dp.enable();
    dp.show();
    dp.show();
    expect(beforeShow).toHaveBeenCalledTimes(1);

    html('<div id="cal"></div>');
    const inline = create('#cal');
    expect(inline.show()).toBe(inline);
    expect(inline.hide()).toBe(inline);
    expect(inline.isVisible()).toBe(true);
  });

  it('opens on the selected date, else the default date', () => {
    const dp = popup({ defaultDate: d(2027, 3, 1) });
    dp.show();
    expect(q(dp, '.yad-month')!.textContent).toBe('March');
    dp.hide();
    input().value = '2026-07-04';
    dp.show();
    expect(q(dp, '.yad-month')!.textContent).toBe('July');
    expect(q(dp, '.yad-selected')!.textContent).toBe('4');
  });

  it('a defaultDate outside the range is clamped', () => {
    const dp = popup({ defaultDate: d(2020, 1, 1), minDate: 0 });
    dp.show();
    expect(q(dp, '.yad-highlight')!.textContent).toBe('14');
  });
});

describe('closing', () => {
  it('a mousedown outside closes', () => {
    const onClose = vi.fn();
    const dp = popup({ onClose });
    dp.setDate(d(2026, 11, 20));
    dp.show();
    mousedown(document.body);
    expect(dp.isVisible()).toBe(false);
    expect(onClose).toHaveBeenCalledWith('2026-11-20', dp);
  });

  it('a mousedown on the input, the popup or the trigger keeps it open', () => {
    const dp = popup({ showOn: 'both' });
    dp.show();
    mousedown(input());
    mousedown(q(dp, '.yad-title')!);
    mousedown(document.querySelector('.yad-trigger')!);
    expect(dp.isVisible()).toBe(true);
  });

  it('moving focus outside closes, moving inside does not', () => {
    const dp = popup({ changeMonth: true });
    dp.show();
    input().dispatchEvent(new FocusEvent('focusout', { relatedTarget: q(dp, '.yad-month-select') }));
    expect(dp.isVisible()).toBe(true);
    q(dp, '.yad-month-select')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: input() }));
    expect(dp.isVisible()).toBe(true);
    // Focus leaving to nowhere (e.g. window blur) keeps it open
    input().dispatchEvent(new FocusEvent('focusout', { relatedTarget: null }));
    expect(dp.isVisible()).toBe(true);
    input().dispatchEvent(new FocusEvent('focusout', { relatedTarget: input('other') }));
    expect(dp.isVisible()).toBe(false);
  });

  it('onClose is not called when already closed', () => {
    const onClose = vi.fn();
    const dp = popup({ onClose });
    dp.hide();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closing removes the document and window listeners', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const dp = popup();
    dp.show();
    dp.hide();
    expect(remove).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
    remove.mockRestore();
  });

  it('Done closes and returns focus to the input', () => {
    const dp = popup({ showButtonPanel: true });
    dp.show();
    q<HTMLButtonElement>(dp, '.yad-close')!.click();
    expect(dp.isVisible()).toBe(false);
    expect(document.activeElement).toBe(input());
  });
});

describe('mouse focus handling', () => {
  it('keeps focus in the input when clicking calendar buttons', () => {
    const dp = popup();
    dp.show();
    expect(mousedown(q(dp, '.yad-next')!)).toBe(true);
    expect(mousedown(dayButton(dp, d(2026, 11, 20))!)).toBe(true);
  });

  it('lets dropdowns and sliders receive the mouse normally', () => {
    const dp = popup({ changeMonth: true, showTime: true });
    dp.show();
    expect(mousedown(q(dp, '.yad-month-select')!)).toBe(false);
    expect(mousedown(q(dp, '.yad-time-slider')!)).toBe(false);
  });

  it('inline calendars do not interfere with focus', () => {
    html('<div id="cal"></div>');
    const dp = create('#cal');
    expect(mousedown(q(dp, '.yad-next')!)).toBe(false);
  });
});

describe('positioning', () => {
  it('opens below the input, with scroll offset', () => {
    const dp = popup();
    window.scrollX = 0;
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 100 });
    layout(dp, { top: 50, bottom: 80, left: 40, right: 240 });
    dp.show();
    expect(dp.widget().style.position).toBe('absolute');
    expect(dp.widget().style.left).toBe('40px');
    expect(dp.widget().style.top).toBe('180px');
    expect(dp.widget().classList.contains('yad--above')).toBe(false);
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  it('opens above when there is no room below', () => {
    const dp = popup();
    layout(dp, { top: 600, bottom: 630, left: 40, right: 240 }, { width: 300, height: 320 });
    dp.show();
    expect(dp.widget().style.top).toBe('280px');
    expect(dp.widget().classList.contains('yad--above')).toBe(true);
  });

  it('stays below when there is no room above either', () => {
    const dp = popup();
    layout(dp, { top: 100, bottom: 130, left: 40 }, { width: 300, height: 700 });
    dp.show();
    expect(dp.widget().style.top).toBe('130px');
  });

  it('stays inside the viewport horizontally', () => {
    const dp = popup();
    layout(dp, { top: 10, bottom: 40, left: 900, right: 1000 });
    dp.show();
    expect(dp.widget().style.left).toBe(`${window.innerWidth - 300}px`);
  });

  it('aligns with the right edge for right-to-left', () => {
    const dp = popup({ isRTL: true });
    layout(dp, { top: 10, bottom: 40, left: 400, right: 600 });
    dp.show();
    expect(dp.widget().style.left).toBe('300px');
  });

  it('uses fixed positioning inside a fixed container', () => {
    const dp = popup({}, '<div style="position: fixed"><input id="date"></div>');
    layout(dp, { top: 10, bottom: 40, left: 20 });
    dp.show();
    expect(dp.widget().style.position).toBe('fixed');
    expect(dp.widget().style.top).toBe('40px');
  });

  it('repositions on resize and scroll while open', () => {
    const dp = popup();
    layout(dp, { top: 10, bottom: 40, left: 20 });
    dp.show();
    layout(dp, { top: 110, bottom: 140, left: 20 });
    window.dispatchEvent(new Event('resize'));
    expect(dp.widget().style.top).toBe('140px');
    layout(dp, { top: 60, bottom: 90, left: 20 });
    document.dispatchEvent(new Event('scroll'));
    expect(dp.widget().style.top).toBe('90px');
    dp.hide();
    layout(dp, { top: 300, bottom: 330, left: 20 });
    window.dispatchEvent(new Event('resize'));
    expect(dp.widget().style.top).toBe('90px');
  });

  it('is mounted inside an [aria-modal] dialog', () => {
    const dp = popup({}, '<div role="dialog" aria-modal="true" id="m"><input id="date"></div>');
    dp.show();
    expect(dp.widget().parentElement!.id).toBe('m');
  });
});

describe('typing', () => {
  it('updates the calendar while the text is valid', () => {
    const dp = popup();
    dp.show();
    input().value = '2027-02';
    input().dispatchEvent(new Event('input'));
    expect(q(dp, '.yad-month')!.textContent).toBe('November');
    input().value = '2027-02-14';
    input().dispatchEvent(new Event('input'));
    expect(q(dp, '.yad-month')!.textContent).toBe('February');
  });

  it('ignores dates outside the range', () => {
    const dp = popup({ maxDate: '+1m' });
    dp.show();
    input().value = '2030-01-01';
    input().dispatchEvent(new Event('input'));
    expect(q(dp, '.yad-month')!.textContent).toBe('November');
  });

  it('updates the altField', () => {
    const dp = popup({ altField: '#other', altFormat: 'dd.mm.yy' });
    dp.show();
    input().value = '2027-02-14';
    input().dispatchEvent(new Event('input'));
    expect(input('other').value).toBe('14.02.2027');
  });

  it('getDate keeps the last valid date while the text is invalid', () => {
    const dp = popup();
    dp.setDate(d(2026, 11, 20));
    input().value = '2026-11-2x';
    expect(dp.getDate()).toEqual(d(2026, 11, 20));
    input().value = '';
    expect(dp.getDate()).toBeNull();
  });

  it('getDate clamps typed dates into the range', () => {
    const dp = popup({ minDate: 0 });
    input().value = '2020-01-01';
    expect(dp.getDate()).toEqual(d(2026, 11, 14));
  });
});

describe('altField', () => {
  it('accepts an element and is cleared with the value', () => {
    const dp = popup({ altField: document.createElement('input') });
    const alt = dp.option('altField') as HTMLInputElement;
    dp.setDate(d(2026, 11, 20));
    expect(alt.value).toBe('2026-11-20');
    dp.setDate(null);
    expect(alt.value).toBe('');
  });

  it('ignores a selector that matches nothing', () => {
    const dp = popup({ altField: '#missing' });
    expect(() => dp.setDate(d(2026, 11, 20))).not.toThrow();
  });
});
