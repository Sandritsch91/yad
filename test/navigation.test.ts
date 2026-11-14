import { describe, expect, it, vi } from 'vitest';
import { Yad } from '../src/yad';
import { create, d, dayButton, html, q, qa, setValue, shownMonth, texts, usePickerEnv } from './helpers';

usePickerEnv();

const inline = (options = {}) => {
  html('<div id="cal"></div>');
  return create('#cal', options);
};
const click = (dp: Yad, selector: string) => q<HTMLButtonElement>(dp, selector)!.click();

describe('previous / next', () => {
  it('moves by stepMonths', () => {
    const dp = inline({ stepMonths: 3 });
    click(dp, '.yad-next');
    expect(shownMonth(dp)).toBe('February 2027');
    click(dp, '.yad-prev');
    click(dp, '.yad-prev');
    expect(shownMonth(dp)).toBe('August 2026');
  });

  it('crosses year boundaries', () => {
    const dp = inline({ defaultDate: d(2026, 12, 15) });
    click(dp, '.yad-next');
    expect(shownMonth(dp)).toBe('January 2027');
    click(dp, '.yad-prev');
    click(dp, '.yad-prev');
    expect(shownMonth(dp)).toBe('November 2026');
  });

  it('is disabled at minDate / maxDate', () => {
    const dp = inline({ minDate: d(2026, 11, 3), maxDate: d(2026, 12, 20) });
    expect(q<HTMLButtonElement>(dp, '.yad-prev')!.disabled).toBe(true);
    click(dp, '.yad-next');
    expect(shownMonth(dp)).toBe('December 2026');
    expect(q<HTMLButtonElement>(dp, '.yad-next')!.disabled).toBe(true);
    // Clicking a disabled button does nothing
    q<HTMLButtonElement>(dp, '.yad-next')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(shownMonth(dp)).toBe('December 2026');
  });

  it('hideIfNoPrevNext hides instead of disabling', () => {
    const dp = inline({ minDate: 0, maxDate: '+1m', hideIfNoPrevNext: true });
    expect(q(dp, '.yad-prev')).toBeNull();
    expect(q(dp, '.yad-next')).not.toBeNull();
    dp.option('maxDate', '+10d');
    expect(q(dp, '.yad-next')).toBeNull();
  });

  it('labels the buttons with prevText / nextText', () => {
    const dp = inline({ prevText: 'Back', nextText: 'Forward' });
    expect(q(dp, '.yad-prev')!.getAttribute('aria-label')).toBe('Back');
    expect(q(dp, '.yad-next')!.getAttribute('title')).toBe('Forward');
  });

  it('navigationAsDateFormat formats the labels with the target month', () => {
    const dp = inline({
      navigationAsDateFormat: true, prevText: "'<' M", nextText: "M '>'", currentText: "'Today:' d M", showButtonPanel: true,
    });
    expect(q(dp, '.yad-prev')!.getAttribute('aria-label')).toBe('< Oct');
    expect(q(dp, '.yad-next')!.getAttribute('aria-label')).toBe('Dec >');
    expect(q(dp, '.yad-current')!.textContent).toBe('Today: 14 Nov');
  });
});

describe('several months', () => {
  it('numberOfMonths [rows, cols] renders a grid with one prev and one next button', () => {
    const dp = inline({ numberOfMonths: [2, 2] });
    expect(qa(dp, '.yad-row')).toHaveLength(2);
    expect(qa(dp, '.yad-group')).toHaveLength(4);
    expect(qa(dp, '.yad-prev')).toHaveLength(1);
    expect(qa(dp, '.yad-next')).toHaveLength(1);
    expect(dp.widget().classList.contains('yad--multi')).toBe(true);
    expect(qa(dp, '.yad-group').map((g) => g.className)).toEqual([
      'yad-group yad-group--first', 'yad-group yad-group--last', 'yad-group yad-group--first', 'yad-group yad-group--last',
    ]);
    expect([0, 1, 2, 3].map((i) => shownMonth(dp, i))).toEqual(
      ['November 2026', 'December 2026', 'January 2027', 'February 2027']);
  });

  it('marks middle months', () => {
    const dp = inline({ numberOfMonths: 3 });
    expect(qa(dp, '.yad-group')[1].classList.contains('yad-group--middle')).toBe(true);
  });

  it('showCurrentAtPos shows earlier months first', () => {
    const dp = inline({ numberOfMonths: 3, showCurrentAtPos: 1 });
    expect([0, 1, 2].map((i) => shownMonth(dp, i))).toEqual(['October 2026', 'November 2026', 'December 2026']);
  });

  it('showCurrentAtPos is limited to the number of months', () => {
    const dp = inline({ numberOfMonths: 2, showCurrentAtPos: 5 });
    expect(shownMonth(dp, 1)).toBe('November 2026');
  });

  it('only the first month gets dropdowns', () => {
    const dp = inline({ numberOfMonths: 2, changeMonth: true, changeYear: true });
    expect(qa(dp, '.yad-month-select')).toHaveLength(1);
    expect(qa(dp, '.yad-year-select')).toHaveLength(1);
    expect(texts(dp, '.yad-month')).toEqual(['December']);
  });

  it('changing the dropdown keeps the month at its position', () => {
    const dp = inline({ numberOfMonths: 2, changeMonth: true });
    setValue(q<HTMLSelectElement>(dp, '.yad-month-select')!, 4);
    expect(shownMonth(dp, 0)).toBe('May 2026');
    expect(shownMonth(dp, 1)).toBe('June 2026');
  });
});

describe('dropdowns', () => {
  it('omit months outside minDate / maxDate', () => {
    const dp = inline({ changeMonth: true, minDate: d(2026, 9, 15), maxDate: d(2027, 2, 1) });
    expect(Array.from(q<HTMLSelectElement>(dp, '.yad-month-select')!.options).map((o) => o.textContent))
      .toEqual(['Sep', 'Oct', 'Nov', 'Dec']);
  });

  it('use monthNamesShort', () => {
    const dp = inline({ ...Yad.regional.de, changeMonth: true });
    expect(q<HTMLSelectElement>(dp, '.yad-month-select')!.options[2].textContent).toBe('Mär');
  });

  it('clamp the highlighted day when the month is shorter', () => {
    const dp = inline({ changeMonth: true, defaultDate: d(2027, 1, 31) });
    setValue(q<HTMLSelectElement>(dp, '.yad-month-select')!, 1);
    expect(q(dp, '.yad-highlight')!.textContent).toBe('28');
  });

  it.each([
    ['2020:2022', [2020, 2022]],
    ['-2:+1', [2024, 2027]],
    ['c-1:c+1', [2025, 2027]],
    ['2000:c+0', [2000, 2026]],
    ['c+5:c-5', [2031, 2031]],
    ['nonsense', [2026, 2026]],
  ])('yearRange %j', (yearRange, [first, last]) => {
    const dp = inline({ changeYear: true, yearRange });
    const years = Array.from(q<HTMLSelectElement>(dp, '.yad-year-select')!.options).map((o) => Number(o.value));
    // The displayed year is always included
    expect(years[0]).toBe(Math.min(first, 2026));
    expect(years[years.length - 1]).toBe(Math.max(last, 2026));
  });

  it('yearRange is clipped by minDate / maxDate', () => {
    const dp = inline({ changeYear: true, yearRange: '2000:2050', minDate: d(2025, 1, 1), maxDate: d(2028, 12, 31) });
    const years = Array.from(q<HTMLSelectElement>(dp, '.yad-year-select')!.options).map((o) => o.value);
    expect(years).toEqual(['2025', '2026', '2027', '2028']);
  });

  it('show the yearSuffix next to the year dropdown', () => {
    const dp = inline({ changeYear: true, yearSuffix: '年' });
    expect(q(dp, '.yad-year-suffix')!.textContent).toBe('年');
  });

  it('keep focus on the changed dropdown', () => {
    const dp = inline({ changeYear: true });
    const select = q<HTMLSelectElement>(dp, '.yad-year-select')!;
    select.focus();
    setValue(select, 2027);
    expect(document.activeElement).toBe(q(dp, '.yad-year-select'));
  });

  it('ignore change events from other selects', () => {
    const dp = inline();
    const foreign = document.createElement('select');
    dp.widget().appendChild(foreign);
    foreign.dispatchEvent(new Event('change', { bubbles: true }));
    expect(shownMonth(dp)).toBe('November 2026');
  });
});

describe('title', () => {
  it('showMonthAfterYear and yearSuffix', () => {
    const dp = inline({ showMonthAfterYear: true, yearSuffix: '年' });
    expect(q(dp, '.yad-title')!.textContent).toBe('2026年November');
    expect(dp.widget().getAttribute('aria-label')).toBe('2026年 November');
  });

  it('is an aria-live region labelling the grid', () => {
    const dp = inline();
    const title = q(dp, '.yad-title')!;
    expect(title.getAttribute('aria-live')).toBe('polite');
    expect(q(dp, '.yad-calendar')!.getAttribute('aria-labelledby')).toBe(title.id);
  });
});

describe('day grid', () => {
  it('marks today, weekends and the selection', () => {
    const dp = inline({ defaultDate: d(2026, 11, 20) });
    const today = dayButton(dp, d(2026, 11, 14))!;
    expect(today.getAttribute('aria-current')).toBe('date');
    expect(today.parentElement!.classList.contains('yad-today')).toBe(true);
    expect(today.parentElement!.classList.contains('yad-week-end')).toBe(true);
    const selected = dayButton(dp, d(2026, 11, 20))!.parentElement!;
    expect(selected.classList.contains('yad-selected')).toBe(true);
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expect(dayButton(dp, d(2026, 11, 16))!.parentElement!.classList.contains('yad-week-end')).toBe(false);
  });

  it('labels day buttons with the full localised date', () => {
    const dp = inline({ ...Yad.regional.fr });
    expect(dayButton(dp, d(2026, 11, 14))!.getAttribute('aria-label')).toBe('samedi, 14 novembre 2026');
  });

  it('uses a roving tabindex', () => {
    const dp = inline();
    const focusable = qa<HTMLButtonElement>(dp, '.yad-day-btn').filter((b) => b.tabIndex === 0);
    expect(focusable).toHaveLength(1);
    expect(focusable[0].textContent).toBe('14');
  });

  it('starts the week on firstDay', () => {
    const dp = inline({ firstDay: 6 });
    expect(texts(dp, 'thead th')).toEqual(['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr']);
    // 1 Nov 2026 is a Sunday: one empty cell before it when weeks start on Saturday
    const firstRow = qa(dp, 'tbody tr')[0];
    expect(firstRow.children[0].classList.contains('yad-empty')).toBe(true);
    expect(firstRow.children[1].textContent).toBe('1');
  });

  it('renders full weeks only', () => {
    const dp = inline({ defaultDate: d(2026, 2, 1) }); // February 2026: Sunday 1st to Saturday 28th
    expect(qa(dp, 'tbody tr')).toHaveLength(4);
  });

  it('abbreviation titles carry the full day names', () => {
    const dp = inline({ ...Yad.regional.de });
    expect(qa(dp, 'thead abbr').map((a) => a.getAttribute('title'))[0]).toBe('Montag');
  });

  it('showWeek uses calculateWeek and weekHeader', () => {
    const calculateWeek = vi.fn((date: Date) => date.getDate());
    const dp = inline({ showWeek: true, weekHeader: 'KW', calculateWeek });
    expect(q(dp, 'thead th')!.textContent).toBe('KW');
    expect(texts(dp, 'tbody .yad-week-col')).toEqual(['1', '8', '15', '22', '29']);
    expect(calculateWeek).toHaveBeenCalledTimes(5);
  });

  it('beforeShowDay adds classes and tooltips and disables days', () => {
    const dp = inline({
      beforeShowDay: (date: Date) => date.getDate() === 20 ? [false, 'busy full', 'Fully booked'] : [true, ''],
    });
    const cell = dayButton(dp, d(2026, 11, 20))!.parentElement!;
    expect(cell.classList.contains('busy')).toBe(true);
    expect(cell.classList.contains('full')).toBe(true);
    expect(cell.classList.contains('yad-unselectable')).toBe(true);
    expect(cell.getAttribute('title')).toBe('Fully booked');
  });

  it('beforeShowDay gets a copy of the date', () => {
    const dp = inline({
      beforeShowDay: (date: Date) => {
        date.setFullYear(1999);
        return [true];
      },
    });
    expect(dayButton(dp, d(2026, 11, 20))).not.toBeNull();
  });

  it('escapes HTML in texts', () => {
    const dp = inline({
      beforeShowDay: () => [true, '', '<b>"tip"</b>'],
      prevText: '<script>',
      showButtonPanel: true,
      currentText: '<i>now</i>',
    });
    expect(q(dp, 'b')).toBeNull();
    expect(q(dp, 'script')).toBeNull();
    expect(q(dp, '.yad-current')!.textContent).toBe('<i>now</i>');
    expect(dayButton(dp, d(2026, 11, 2))!.parentElement!.getAttribute('title')).toBe('<b>"tip"</b>');
  });
});

describe('other months', () => {
  it('are empty by default', () => {
    const dp = inline({ defaultDate: d(2026, 10, 1) }); // October 2026 starts on a Thursday
    const lead = qa(dp, 'tbody td')[0];
    expect(lead.classList.contains('yad-empty')).toBe(true);
    expect(lead.textContent).toBe('');
  });

  it('showOtherMonths shows their days as text', () => {
    const dp = inline({ showOtherMonths: true, defaultDate: d(2026, 10, 1) });
    // October 2026 starts on a Thursday: 27–30 September are shown
    const lead = qa(dp, 'tbody td').slice(0, 4);
    expect(lead.map((td) => td.textContent)).toEqual(['27', '28', '29', '30']);
    expect(lead.every((td) => td.classList.contains('yad-other-month'))).toBe(true);
    expect(lead[0].querySelector('button')).toBeNull();
  });

  it('selectOtherMonths makes them selectable', () => {
    const onSelect = vi.fn();
    const dp = inline({ showOtherMonths: true, selectOtherMonths: true, defaultDate: d(2026, 10, 1), onSelect });
    dayButton(dp, d(2026, 9, 29))!.click();
    expect(dp.getDate()).toEqual(d(2026, 9, 29));
    expect(shownMonth(dp)).toBe('September 2026');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('button panel', () => {
  it('Today goes to the current month without selecting', () => {
    const onSelect = vi.fn();
    const onChangeMonthYear = vi.fn();
    const dp = inline({ showButtonPanel: true, defaultDate: d(2027, 6, 1), onSelect, onChangeMonthYear });
    click(dp, '.yad-current');
    expect(shownMonth(dp)).toBe('November 2026');
    expect(onSelect).not.toHaveBeenCalled();
    expect(onChangeMonthYear).toHaveBeenCalledWith(2026, 11, dp);
  });

  it('gotoCurrent makes Today go to the selection', () => {
    const dp = inline({ showButtonPanel: true, gotoCurrent: true });
    dp.setDate(d(2027, 3, 10));
    click(dp, '.yad-next');
    click(dp, '.yad-current');
    expect(shownMonth(dp)).toBe('March 2027');
  });

  it('Today is disabled when today is out of range', () => {
    const dp = inline({ showButtonPanel: true, minDate: d(2027, 1, 1) });
    expect(q<HTMLButtonElement>(dp, '.yad-current')!.disabled).toBe(true);
  });

  it('inline calendars have no close button', () => {
    const dp = inline({ showButtonPanel: true });
    expect(q(dp, '.yad-close')).toBeNull();
  });
});

describe('onChangeMonthYear', () => {
  it('reports the new month (1-12) for each kind of navigation', () => {
    const onChangeMonthYear = vi.fn();
    const dp = inline({ onChangeMonthYear, changeMonth: true, changeYear: true });
    click(dp, '.yad-next');
    expect(onChangeMonthYear).toHaveBeenLastCalledWith(2026, 12, dp);
    setValue(q<HTMLSelectElement>(dp, '.yad-year-select')!, 2030);
    expect(onChangeMonthYear).toHaveBeenLastCalledWith(2030, 12, dp);
    setValue(q<HTMLSelectElement>(dp, '.yad-month-select')!, 0);
    expect(onChangeMonthYear).toHaveBeenLastCalledWith(2030, 1, dp);
    expect(onChangeMonthYear).toHaveBeenCalledTimes(3);
  });

  it('is not called when the month stays the same', () => {
    const onChangeMonthYear = vi.fn();
    const dp = inline({ onChangeMonthYear });
    dayButton(dp, d(2026, 11, 20))!.click();
    dp.refresh();
    expect(onChangeMonthYear).not.toHaveBeenCalled();
  });

  it('reports the month at showCurrentAtPos', () => {
    const onChangeMonthYear = vi.fn();
    const dp = inline({ onChangeMonthYear, numberOfMonths: 3, showCurrentAtPos: 1 });
    click(dp, '.yad-next');
    expect(onChangeMonthYear).toHaveBeenLastCalledWith(2026, 12, dp);
  });
});

describe('right to left', () => {
  it('sets dir and the rtl class', () => {
    const dp = inline({ isRTL: true });
    expect(dp.widget().dir).toBe('rtl');
    expect(dp.widget().classList.contains('yad--rtl')).toBe(true);
    dp.option('isRTL', false);
    expect(dp.widget().dir).toBe('ltr');
  });
});
