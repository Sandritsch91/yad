import { describe, expect, it, vi } from 'vitest';
import { Yad } from '../src/yad';
import { create, d, focus, html, input, key, q, track, usePickerEnv } from './helpers';

usePickerEnv();

describe('construction', () => {
  it('throws for a selector that matches nothing', () => {
    expect(() => new Yad('#missing')).toThrow('Yad: element not found: #missing');
  });

  it('accepts an element or a selector', () => {
    html('<input id="date"><div id="cal"></div>');
    const a = create(input());
    const b = create('#cal');
    expect(a.element).toBe(input());
    expect(a.input).toBe(input());
    expect(a.inline).toBe(false);
    expect(b.input).toBeNull();
    expect(b.inline).toBe(true);
  });

  it('getInstance returns undefined for unknown targets', () => {
    html('<input id="date">');
    expect(Yad.getInstance('#date')).toBeUndefined();
    expect(Yad.getInstance('#missing')).toBeUndefined();
  });

  it('attach works with a NodeList and an array', () => {
    html('<input class="d"><input class="d"><input class="d">');
    const fromList = Yad.attach(document.querySelectorAll<HTMLInputElement>('.d'), { duration: 0 });
    fromList.forEach(track);
    expect(fromList).toHaveLength(3);
    const again = Yad.attach([document.querySelector<HTMLInputElement>('.d')!]);
    expect(again[0]).toBe(fromList[0]);
  });

  it('starts disabled when the input is disabled', () => {
    html('<input id="date" disabled>');
    const dp = create('#date');
    expect(dp.isDisabled()).toBe(true);
  });

  it('marks the input for assistive technology', () => {
    html('<input id="date">');
    const dp = create('#date');
    expect(input().getAttribute('autocomplete')).toBe('off');
    expect(input().getAttribute('aria-haspopup')).toBe('dialog');
    expect(input().getAttribute('aria-controls')).toBe(dp.widget().id);
    expect(input().classList.contains('yad-input')).toBe(true);
  });
});

describe('option()', () => {
  it('returns a copy of all options', () => {
    html('<input id="date">');
    const dp = create('#date', { dateFormat: 'yy-mm-dd' });
    const all = dp.option();
    all.dateFormat = 'changed';
    expect(dp.option('dateFormat')).toBe('yy-mm-dd');
  });

  it('can set a value to undefined explicitly', () => {
    html('<input id="date">');
    const dp = create('#date', { onSelect: () => undefined });
    dp.option('onSelect', null);
    expect(dp.option('onSelect')).toBeNull();
  });

  it('re-clamps the value when the range changes', () => {
    html('<input id="date">');
    const dp = create('#date', { dateFormat: 'yy-mm-dd' });
    dp.setDate(d(2026, 11, 1));
    dp.option('minDate', d(2026, 11, 10));
    expect(input().value).toBe('2026-11-10');
    dp.option({ minDate: null, maxDate: '-1w' });
    expect(input().value).toBe('2026-11-07');
  });

  it('uses minDate when maxDate is before it', () => {
    html('<input id="date">');
    const dp = create('#date', { minDate: d(2026, 12, 1), maxDate: d(2026, 11, 1), dateFormat: 'yy-mm-dd' });
    dp.setDate(d(2027, 1, 1));
    expect(input().value).toBe('2026-12-01');
  });

  it('changing defaultDate moves an inline calendar without a selection', () => {
    html('<div id="cal"></div>');
    const dp = create('#cal');
    dp.setDate(null);
    dp.option('defaultDate', d(2027, 3, 1));
    expect(q(dp, '.yad-month')!.textContent).toBe('March');
  });
});

describe('defaults', () => {
  it('setDefaults affects only pickers created afterwards', () => {
    html('<input id="a"><input id="b">');
    const a = create('#a');
    Yad.setDefaults({ firstDay: 1 });
    const b = create('#b');
    expect(a.option('firstDay')).toBe(0);
    expect(b.option('firstDay')).toBe(1);
  });

  it('constructor options override defaults', () => {
    Yad.setDefaults({ dateFormat: 'yy-mm-dd' });
    html('<input id="date">');
    expect(create('#date', { dateFormat: 'dd.mm.yy' }).option('dateFormat')).toBe('dd.mm.yy');
  });
});

describe('trigger button', () => {
  it('adds and removes the trigger when showOn changes', () => {
    html('<input id="date">');
    const dp = create('#date');
    expect(document.querySelector('.yad-trigger')).toBeNull();
    dp.option('showOn', 'both');
    expect(document.querySelectorAll('.yad-trigger')).toHaveLength(1);
    dp.option('buttonText', 'Pick');
    expect(document.querySelectorAll('.yad-trigger')).toHaveLength(1);
    expect(document.querySelector('.yad-trigger')!.textContent).toBe('Pick');
    dp.option('showOn', 'focus');
    expect(document.querySelector('.yad-trigger')).toBeNull();
  });

  it('renders an image inside the button', () => {
    html('<input id="date">');
    create('#date', { showOn: 'button', buttonImage: 'cal.png', buttonText: 'Calendar' });
    const button = document.querySelector('button.yad-trigger')!;
    const img = button.querySelector('img')!;
    expect(img.getAttribute('src')).toBe('cal.png');
    expect(img.alt).toBe('Calendar');
    expect(button.getAttribute('aria-label')).toBe('Calendar');
  });

  it('can use the image alone as an accessible trigger', () => {
    html('<input id="date">');
    const dp = create('#date', { showOn: 'button', buttonImage: 'cal.png', buttonImageOnly: true, buttonText: 'Open' });
    const img = document.querySelector<HTMLImageElement>('img.yad-trigger')!;
    expect(img.getAttribute('role')).toBe('button');
    expect(img.tabIndex).toBe(0);
    expect(key(img, 'Enter')).toBe(true);
    expect(dp.isVisible()).toBe(true);
    key(img, ' ');
    expect(dp.isVisible()).toBe(false);
    expect(key(img, 'a')).toBe(false);
  });

  it('toggles the popup and keeps focus in the input', () => {
    html('<input id="date">');
    const dp = create('#date', { showOn: 'button' });
    const trigger = document.querySelector<HTMLButtonElement>('.yad-trigger')!;
    trigger.click();
    expect(dp.isVisible()).toBe(true);
    expect(document.activeElement).toBe(input());
    trigger.click();
    expect(dp.isVisible()).toBe(false);
  });

  it('is disabled together with the picker', () => {
    html('<input id="date">');
    const dp = create('#date', { showOn: 'both' });
    const trigger = document.querySelector<HTMLButtonElement>('.yad-trigger')!;
    dp.disable();
    expect(trigger.disabled).toBe(true);
    expect(trigger.classList.contains('yad-trigger--disabled')).toBe(true);
    trigger.dispatchEvent(new MouseEvent('click'));
    expect(dp.isVisible()).toBe(false);
    dp.enable();
    expect(trigger.disabled).toBe(false);
  });

  it('disables an image-only trigger by class', () => {
    html('<input id="date">');
    const dp = create('#date', { showOn: 'button', buttonImage: 'x.png', buttonImageOnly: true });
    dp.disable();
    const img = document.querySelector<HTMLImageElement>('img.yad-trigger')!;
    expect(img.classList.contains('yad-trigger--disabled')).toBe(true);
    img.click();
    expect(dp.isVisible()).toBe(false);
  });
});

describe('appendText', () => {
  it('is placed between the input and the trigger', () => {
    html('<div id="wrap"><input id="date"></div>');
    const dp = create('#date', { showOn: 'both' });
    dp.option('appendText', '(yyyy-mm-dd)');
    const children = Array.from(document.getElementById('wrap')!.children).map((el) => el.className || el.id);
    expect(children).toEqual(['yad-input', 'yad-append', 'yad-trigger']);
    expect(document.querySelector('.yad-append')!.textContent).toBe('(yyyy-mm-dd)');
    dp.option('appendText', '');
    expect(document.querySelector('.yad-append')).toBeNull();
  });
});

describe('autoSize', () => {
  it('sizes the input for the longest possible date', () => {
    html('<input id="date">');
    create('#date', { autoSize: true, dateFormat: 'DD, d MM yy' });
    expect(input().size).toBe('Wednesday, 30 September 2009'.length);
  });

  it('uses short names for short tokens and updates on format change', () => {
    html('<input id="date">');
    const dp = create('#date', { autoSize: true, dateFormat: 'D, d M yy' });
    expect(input().size).toBe('Sun, 20 Jan 2009'.length);
    dp.option('dateFormat', 'yy-mm-dd');
    expect(input().size).toBe(10);
  });

  it('includes the time', () => {
    html('<input id="date">');
    create('#date', { autoSize: true, dateFormat: 'yy-mm-dd', showTime: true, timeFormat: 'hh:mm TT' });
    expect(input().size).toBe('2009-12-20 11:59 PM'.length);
  });

  it('is restored by destroy', () => {
    html('<input id="date" size="7">');
    const dp = create('#date', { autoSize: true });
    expect(input().size).toBe(10);
    dp.destroy();
    expect(input().size).toBe(7);
  });
});

describe('beforeShow', () => {
  it('receives the input and instance and can change options', () => {
    html('<input id="date" data-min="2026-11-20">');
    const beforeShow = vi.fn((el: HTMLInputElement) => ({ minDate: el.dataset.min, dateFormat: 'yy-mm-dd' }));
    const dp = create('#date', { beforeShow });
    dp.show();
    expect(beforeShow).toHaveBeenCalledWith(input(), dp);
    expect(dp.option('minDate')).toBe('2026-11-20');
    expect(q(dp, '.yad-prev')!.hasAttribute('disabled')).toBe(true);
  });

  it('may return nothing', () => {
    html('<input id="date">');
    const dp = create('#date', { beforeShow: () => undefined });
    dp.show();
    expect(dp.isVisible()).toBe(true);
  });
});

describe('destroy', () => {
  it('restores attributes and removes everything it added', () => {
    html('<input id="date" autocomplete="on">');
    const dp = create('#date', { showOn: 'both', appendText: 'hint' });
    dp.show();
    dp.destroy();
    expect(input().getAttribute('autocomplete')).toBe('on');
    expect(input().hasAttribute('aria-haspopup')).toBe(false);
    expect(input().hasAttribute('aria-controls')).toBe(false);
    expect(input().classList.contains('yad-input')).toBe(false);
    expect(document.querySelector('.yad, .yad-trigger, .yad-append')).toBeNull();
  });

  it('removes the autocomplete attribute it added', () => {
    html('<input id="date">');
    create('#date').destroy();
    expect(input().hasAttribute('autocomplete')).toBe(false);
  });

  it('stops listening to the input', () => {
    html('<input id="date">');
    const dp = create('#date');
    dp.destroy();
    focus(input());
    expect(document.querySelector('.yad')).toBeNull();
    expect(key(input(), 'a')).toBe(false);
  });

  it('removes an inline calendar', () => {
    html('<div id="cal"></div>');
    const dp = create('#cal');
    dp.destroy();
    expect(document.getElementById('cal')!.innerHTML).toBe('');
  });

  it('allows attaching a new picker afterwards', () => {
    html('<input id="date">');
    create('#date').destroy();
    const again = create('#date');
    expect(Yad.getInstance('#date')).toBe(again);
  });
});

describe('animation', () => {
  it('keeps the popup rendered until the hide animation finished', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(d(2026, 11, 14));
    html('<input id="date">');
    const dp = track(new Yad('#date', { duration: 200, showAnim: 'slide' }));
    dp.show();
    expect(dp.widget().dataset.anim).toBe('slide');
    expect(dp.widget().style.getPropertyValue('--yad-duration')).toBe('200ms');
    expect(dp.widget().classList.contains('yad--open')).toBe(true);
    dp.hide();
    expect(dp.widget().classList.contains('yad--open')).toBe(false);
    expect(dp.widget().hidden).toBe(false);
    vi.advanceTimersByTime(200);
    expect(dp.widget().hidden).toBe(true);
  });

  it('reopening during the hide animation cancels it', () => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    vi.setSystemTime(d(2026, 11, 14));
    html('<input id="date">');
    const dp = track(new Yad('#date', { duration: 200 }));
    dp.show();
    dp.hide();
    dp.show();
    vi.advanceTimersByTime(500);
    expect(dp.widget().hidden).toBe(false);
  });

  it.each([['none'], ['']] as const)('showAnim %j disables the animation', (anim) => {
    html('<input id="date">');
    const dp = track(new Yad('#date', { duration: 200, showAnim: anim }));
    dp.show();
    expect(dp.widget().dataset.anim).toBe('none');
    dp.hide();
    expect(dp.widget().hidden).toBe(true);
  });
});

describe('enable / disable', () => {
  it('makes an inline calendar non-interactive', () => {
    html('<div id="cal"></div>');
    const onSelect = vi.fn();
    const dp = create('#cal', { onSelect });
    dp.disable();
    expect(dp.widget().classList.contains('yad--disabled')).toBe(true);
    expect(q(dp, '.yad-prev')!.hasAttribute('disabled')).toBe(true);
    q<HTMLButtonElement>(dp, '.yad-day-btn')!.click();
    expect(onSelect).not.toHaveBeenCalled();
    dp.enable();
    expect(dp.widget().classList.contains('yad--disabled')).toBe(false);
  });

  it('disabling closes an open popup', () => {
    html('<input id="date">');
    const dp = create('#date');
    dp.show();
    dp.disable();
    expect(dp.isVisible()).toBe(false);
    expect(input().disabled).toBe(true);
  });

  it('disables the dropdowns', () => {
    html('<div id="cal"></div>');
    const dp = create('#cal', { changeMonth: true, changeYear: true });
    dp.disable();
    expect(q<HTMLSelectElement>(dp, '.yad-month-select')!.disabled).toBe(true);
    expect(q<HTMLSelectElement>(dp, '.yad-year-select')!.disabled).toBe(true);
  });
});

describe('theme', () => {
  it('is light by default', () => {
    html('<div id="cal"></div>');
    const dp = create('#cal');
    expect(dp.option('theme')).toBe('light');
    expect(dp.widget().dataset.theme).toBe('light');
  });

  it.each([['dark'], ['auto']] as const)('can be set to %s', (theme) => {
    html('<input id="date">');
    const dp = create('#date', { theme });
    dp.show();
    expect(dp.widget().dataset.theme).toBe(theme);
  });

  it('can be changed later and set as a default', () => {
    html('<div id="cal"></div><div id="cal2"></div>');
    const dp = create('#cal');
    dp.option('theme', 'dark');
    expect(dp.widget().dataset.theme).toBe('dark');
    Yad.setDefaults({ theme: 'auto' });
    expect(create('#cal2').widget().dataset.theme).toBe('auto');
  });

  it('keeps classes added by the page', () => {
    html('<div id="cal"></div>');
    const dp = create('#cal');
    dp.widget().classList.add('yad--dark');
    dp.option('theme', 'auto');
    expect(dp.widget().classList.contains('yad--dark')).toBe(true);
  });
});
