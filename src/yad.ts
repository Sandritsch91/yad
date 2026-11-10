import {
  daysInMonth,
  determineDate,
  formatDate,
  iso8601Week,
  isSameDay,
  noWeekends,
  parseDate,
  stripTime,
} from './date-utils';
import type { FormatSettings, ParseSettings } from './date-utils';
import { BASE_DEFAULTS, REGIONAL_EN } from './options';
import type { BeforeShowDayResult, DateSpec, RegionalSettings, YadOptions } from './options';
import { de } from './i18n/de';
import { en, enGB } from './i18n/en';
import { fr } from './i18n/fr';

type Target = HTMLElement | string;

const instances = new WeakMap<HTMLElement, Yad>();
let uid = 0;

function resolveElement<T extends HTMLElement>(target: T | string): T {
  const el = typeof target === 'string' ? document.querySelector<T>(target) : target;
  if (!el) {
    throw new Error(`Yad: element not found: ${String(target)}`);
  }
  return el;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]!);
}

function addMonths(date: Date, months: number): Date {
  const year = date.getFullYear();
  const month = date.getMonth() + months;
  const day = Math.min(date.getDate(), daysInMonth(year, month));
  return new Date(year, month, day);
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function parseKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Yet Another Datepicker.
 *
 * Attach to an `<input>` for a popup picker, or to any other element (e.g. a `<div>`) for an inline
 * calendar. The API mirrors jQuery UI's datepicker:
 *
 * ```js
 * const dp = new Yad('#date', { dateFormat: 'yy-mm-dd', minDate: 0 });
 * dp.option('maxDate', '+1m');
 * dp.getDate();
 * ```
 */
export class Yad {
  /** Global defaults applied to every new instance. Change them with `Yad.setDefaults()`. */
  static defaults: YadOptions = { ...BASE_DEFAULTS, ...REGIONAL_EN };

  /** Localisations. `''` is the default (English). Use: `Yad.setDefaults(Yad.regional.de)`. */
  static regional: Record<string, RegionalSettings> = {
    '': REGIONAL_EN, en, 'en-US': en, 'en-GB': enGB, de, fr,
  };

  static formatDate = formatDate;
  static parseDate = parseDate;
  static iso8601Week = iso8601Week;
  static noWeekends = noWeekends;

  static setDefaults(options: Partial<YadOptions>): void {
    Object.assign(Yad.defaults, options);
  }

  /** Get the instance attached to an element, if any. */
  static getInstance(target: Target): Yad | undefined {
    const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
    return el ? instances.get(el) : undefined;
  }

  /** Attach to every element matching the selector (like `$(selector).datepicker(options)`). */
  static attach(selector: string | Iterable<HTMLElement>, options: Partial<YadOptions> = {}): Yad[] {
    const elements = typeof selector === 'string'
      ? Array.from(document.querySelectorAll<HTMLElement>(selector))
      : Array.from(selector);
    return elements.map((el) => new Yad(el, options));
  }

  // Definite assignment: the constructor may return an existing instance early.
  readonly element!: HTMLElement;
  readonly input!: HTMLInputElement | null;
  readonly inline!: boolean;

  private settings!: YadOptions;
  private readonly id = `yad-${++uid}`;
  private readonly container!: HTMLDivElement;
  private trigger: HTMLElement | null = null;
  private appendEl: HTMLSpanElement | null = null;
  private disabled = false;
  private visible = false;
  private hideTimer: ReturnType<typeof setTimeout> | undefined;
  private suppressFocusShow = false;
  private lastDateText = '';

  /** Selected date (authoritative for inline instances; mirrors the input otherwise). */
  private selected: Date | null = null;
  /** Keyboard cursor / highlighted day. */
  private cursor!: Date;
  /** First displayed month. */
  private viewYear!: number;
  private viewMonth!: number;

  private readonly saved: { autocomplete: string | null; size: number | null } = {
    autocomplete: null, size: null,
  };

  constructor(target: Target, options: Partial<YadOptions> = {}) {
    const element = resolveElement<HTMLElement>(target);
    const existing = instances.get(element);
    if (existing) {
      existing.option(options);
      return existing;
    }

    this.element = element;
    this.input = element instanceof HTMLInputElement ? element : null;
    this.inline = !this.input;
    this.settings = { ...Yad.defaults, ...options };

    this.container = document.createElement('div');
    this.container.id = this.id;
    this.container.className = 'yad';
    this.container.addEventListener('click', this.onClick);
    this.container.addEventListener('change', this.onSelectChange);
    this.container.addEventListener('keydown', this.onGridKeyDown);
    this.container.addEventListener('mousedown', this.onContainerMouseDown);

    const today = stripTime(new Date());
    this.cursor = today;
    this.viewYear = today.getFullYear();
    this.viewMonth = today.getMonth();

    instances.set(element, this);

    if (this.input) {
      this.attachToInput(this.input);
    } else {
      this.container.classList.add('yad--inline');
      this.element.appendChild(this.container);
      this.selected = this.getDefaultDate();
      this.moveCursor(this.selected ?? this.getDefaultDate() ?? today, false);
      this.render();
    }
  }

  // ---------------------------------------------------------------------------------------------
  // Public API (mirrors jQuery UI)
  // ---------------------------------------------------------------------------------------------

  /** Get all options, a single option, or set one/many options. */
  option(): YadOptions;
  option<K extends keyof YadOptions>(name: K): YadOptions[K];
  option<K extends keyof YadOptions>(name: K, value: YadOptions[K]): this;
  option(options: Partial<YadOptions>): this;
  option(nameOrOptions?: keyof YadOptions | Partial<YadOptions>, value?: unknown): unknown {
    if (nameOrOptions === undefined) {
      return { ...this.settings };
    }
    if (typeof nameOrOptions === 'string' && arguments.length < 2) {
      return this.settings[nameOrOptions];
    }
    const changes: Partial<YadOptions> = typeof nameOrOptions === 'string'
      ? { [nameOrOptions]: value }
      : nameOrOptions;

    const date = this.getDate();
    Object.assign(this.settings, changes);

    if (this.input) {
      if ('showOn' in changes || 'buttonText' in changes || 'buttonImage' in changes ||
        'buttonImageOnly' in changes) {
        this.setupTrigger();
      }
      if ('appendText' in changes || 'isRTL' in changes) {
        this.setupAppendText();
      }
      if ('autoSize' in changes || 'dateFormat' in changes) {
        this.applyAutoSize();
      }
    }
    if ('defaultDate' in changes && this.inline && !this.selected) {
      this.moveCursor(this.getDefaultDate() ?? new Date(), false);
    }
    if (date && ('dateFormat' in changes || 'minDate' in changes || 'maxDate' in changes ||
      'monthNames' in changes || 'monthNamesShort' in changes || 'dayNames' in changes ||
      'dayNamesShort' in changes)) {
      // Re-format and re-clamp the current date under the new settings.
      this.setDateInternal(this.clamp(date), false);
    }
    this.refresh();
    return this;
  }

  /** The currently selected date, or null. */
  getDate(): Date | null {
    if (this.input) {
      this.syncFromInput();
    }
    return this.selected ? new Date(this.selected.getTime()) : null;
  }

  /** Set the date. Accepts a Date, a number of days from today, a formatted or relative string, or null. */
  setDate(date: DateSpec): this {
    const resolved = date == null || date === '' ? null : this.resolveDate(date, null);
    this.setDateInternal(resolved ? this.clamp(resolved) : null, false);
    this.refresh();
    return this;
  }

  show(): this {
    if (this.inline || this.visible || this.disabled || !this.input) {
      return this;
    }
    const input = this.input;
    const extra = this.settings.beforeShow?.(input, this);
    if (extra) {
      Object.assign(this.settings, extra);
    }
    this.syncFromInput();
    this.moveCursor(this.selected ?? this.getDefaultDate() ?? new Date(), false);
    this.render();

    clearTimeout(this.hideTimer);
    const host = this.popupHost();
    if (this.container.parentElement !== host) {
      host.appendChild(this.container);
    }
    this.container.hidden = false;
    this.position();
    this.visible = true;
    input.setAttribute('aria-expanded', 'true');

    const anim = this.settings.duration > 0 && this.settings.showAnim ? this.settings.showAnim : '';
    this.container.style.setProperty('--yad-duration', `${this.settings.duration}ms`);
    this.container.dataset.anim = anim || 'none';
    // Force a reflow so the transition starts from the closed state.
    void this.container.offsetWidth;
    this.container.classList.add('yad--open');

    document.addEventListener('mousedown', this.onDocumentMouseDown, true);
    window.addEventListener('resize', this.onWindowChange);
    window.addEventListener('scroll', this.onWindowChange, true);
    return this;
  }

  hide(): this {
    if (this.inline || !this.visible) {
      return this;
    }
    this.visible = false;
    this.input?.setAttribute('aria-expanded', 'false');
    this.container.classList.remove('yad--open');
    document.removeEventListener('mousedown', this.onDocumentMouseDown, true);
    window.removeEventListener('resize', this.onWindowChange);
    window.removeEventListener('scroll', this.onWindowChange, true);

    const finish = (): void => {
      this.container.hidden = true;
    };
    if (this.container.dataset.anim !== 'none' && this.settings.duration > 0) {
      this.hideTimer = setTimeout(finish, this.settings.duration);
    } else {
      finish();
    }
    this.settings.onClose?.(this.input?.value ?? '', this);
    return this;
  }

  /** Whether the popup is currently shown (always true for inline instances). */
  isVisible(): boolean {
    return this.inline || this.visible;
  }

  /** Redraw the calendar. Call after changing things `beforeShowDay` depends on. */
  refresh(): this {
    if (this.inline || this.visible) {
      this.render();
      if (this.visible) {
        this.position();
      }
    }
    return this;
  }

  enable(): this {
    this.disabled = false;
    if (this.input) {
      this.input.disabled = false;
    }
    if (this.trigger instanceof HTMLButtonElement) {
      this.trigger.disabled = false;
    }
    this.trigger?.classList.remove('yad-trigger--disabled');
    this.container.classList.remove('yad--disabled');
    this.refresh();
    return this;
  }

  disable(): this {
    this.hide();
    this.disabled = true;
    if (this.input) {
      this.input.disabled = true;
    }
    if (this.trigger instanceof HTMLButtonElement) {
      this.trigger.disabled = true;
    }
    this.trigger?.classList.add('yad-trigger--disabled');
    this.container.classList.add('yad--disabled');
    this.refresh();
    return this;
  }

  isDisabled(): boolean {
    return this.disabled;
  }

  /** The calendar's root element. */
  widget(): HTMLElement {
    return this.container;
  }

  destroy(): void {
    this.hide();
    clearTimeout(this.hideTimer);
    this.container.remove();
    this.trigger?.remove();
    this.appendEl?.remove();
    if (this.input) {
      const input = this.input;
      input.removeEventListener('focus', this.onInputFocus);
      input.removeEventListener('keydown', this.onInputKeyDown);
      input.removeEventListener('input', this.onInputInput);
      input.removeEventListener('focusout', this.onFocusOut);
      input.classList.remove('yad-input');
      input.removeAttribute('aria-haspopup');
      input.removeAttribute('aria-expanded');
      input.removeAttribute('aria-controls');
      if (this.saved.autocomplete === null) {
        input.removeAttribute('autocomplete');
      } else {
        input.setAttribute('autocomplete', this.saved.autocomplete);
      }
      if (this.saved.size !== null) {
        input.size = this.saved.size;
      }
    }
    this.container.removeEventListener('focusout', this.onFocusOut);
    instances.delete(this.element);
  }

  // ---------------------------------------------------------------------------------------------
  // Setup
  // ---------------------------------------------------------------------------------------------

  private attachToInput(input: HTMLInputElement): void {
    this.container.classList.add('yad--popup');
    this.container.hidden = true;
    this.container.setAttribute('role', 'dialog');
    this.container.setAttribute('aria-modal', 'false');

    this.saved.autocomplete = input.getAttribute('autocomplete');
    input.setAttribute('autocomplete', 'off');
    input.classList.add('yad-input');
    input.setAttribute('aria-haspopup', 'dialog');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', this.id);

    input.addEventListener('focus', this.onInputFocus);
    input.addEventListener('keydown', this.onInputKeyDown);
    input.addEventListener('input', this.onInputInput);
    input.addEventListener('focusout', this.onFocusOut);
    this.container.addEventListener('focusout', this.onFocusOut);

    this.disabled = input.disabled;
    this.setupAppendText();
    this.setupTrigger();
    this.applyAutoSize();
    this.syncFromInput();
    this.lastDateText = input.value;
  }

  private setupTrigger(): void {
    this.trigger?.remove();
    this.trigger = null;
    const input = this.input!;
    const { showOn, buttonText, buttonImage, buttonImageOnly } = this.settings;
    if (showOn !== 'button' && showOn !== 'both') {
      return;
    }
    let trigger: HTMLElement;
    if (buttonImageOnly && buttonImage) {
      const img = document.createElement('img');
      img.src = buttonImage;
      img.alt = buttonText;
      img.title = buttonText;
      img.setAttribute('role', 'button');
      img.tabIndex = 0;
      trigger = img;
    } else {
      const button = document.createElement('button');
      button.type = 'button';
      button.disabled = this.disabled;
      if (buttonImage) {
        const img = document.createElement('img');
        img.src = buttonImage;
        img.alt = buttonText;
        img.title = buttonText;
        button.appendChild(img);
      } else {
        button.textContent = buttonText;
      }
      trigger = button;
    }
    trigger.className = 'yad-trigger';
    trigger.setAttribute('aria-label', buttonText);
    trigger.setAttribute('aria-controls', this.id);
    trigger.addEventListener('click', () => {
      if (this.disabled) {
        return;
      }
      if (this.visible) {
        this.hide();
      } else {
        this.show();
        this.suppressFocusShow = true;
        input.focus();
        this.suppressFocusShow = false;
      }
    });
    trigger.addEventListener('keydown', (e) => {
      if (trigger instanceof HTMLImageElement && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        trigger.click();
      }
    });
    (this.appendEl ?? input).after(trigger);
    this.trigger = trigger;
  }

  private setupAppendText(): void {
    this.appendEl?.remove();
    this.appendEl = null;
    if (!this.settings.appendText || !this.input) {
      return;
    }
    const span = document.createElement('span');
    span.className = 'yad-append';
    span.textContent = this.settings.appendText;
    this.input.after(span);
    this.appendEl = span;
    if (this.trigger) {
      span.after(this.trigger);
    }
  }

  private applyAutoSize(): void {
    if (!this.input || !this.settings.autoSize) {
      return;
    }
    if (this.saved.size === null) {
      this.saved.size = this.input.size;
    }
    const format = this.settings.dateFormat;
    const date = new Date(2009, 11, 20); // double-digit month and day
    const findMax = (names: string[]): number => {
      let max = 0;
      let maxI = 0;
      names.forEach((name, i) => {
        if (name.length > max) {
          max = name.length;
          maxI = i;
        }
      });
      return maxI;
    };
    if (/MM|M/.test(format)) {
      date.setMonth(findMax(/MM/.test(format) ? this.settings.monthNames : this.settings.monthNamesShort));
    }
    if (/DD|D/.test(format)) {
      // Choose a day of the week with the longest name
      const day = findMax(/DD/.test(format) ? this.settings.dayNames : this.settings.dayNamesShort);
      date.setDate(date.getDate() + day - date.getDay() + 7);
    }
    this.input.size = this.formatDate(date).length;
  }

  // ---------------------------------------------------------------------------------------------
  // Date helpers
  // ---------------------------------------------------------------------------------------------

  private get formatSettings(): FormatSettings & ParseSettings {
    const s = this.settings;
    return {
      dayNames: s.dayNames,
      dayNamesShort: s.dayNamesShort,
      monthNames: s.monthNames,
      monthNamesShort: s.monthNamesShort,
      shortYearCutoff: s.shortYearCutoff,
    };
  }

  private formatDate(date: Date | null, format = this.settings.dateFormat): string {
    return formatDate(format, date, this.formatSettings);
  }

  private resolveDate(spec: DateSpec, fallback: Date | null): Date | null {
    return determineDate(spec, fallback, this.settings.dateFormat, this.formatSettings);
  }

  private getDefaultDate(): Date | null {
    return this.clamp(this.resolveDate(this.settings.defaultDate, stripTime(new Date())));
  }

  private get minDate(): Date | null {
    return this.resolveDate(this.settings.minDate, null);
  }

  private get maxDate(): Date | null {
    const min = this.minDate;
    const max = this.resolveDate(this.settings.maxDate, null);
    return min && max && max < min ? min : max;
  }

  private clamp<T extends Date | null>(date: T): T {
    if (!date) {
      return date;
    }
    const min = this.minDate;
    const max = this.maxDate;
    if (min && date < min) {
      return new Date(min.getTime()) as T;
    }
    if (max && date > max) {
      return new Date(max.getTime()) as T;
    }
    return date;
  }

  private inRange(date: Date): boolean {
    const min = this.minDate;
    const max = this.maxDate;
    return (!min || date >= min) && (!max || date <= max);
  }

  private dayInfo(date: Date): BeforeShowDayResult {
    return this.settings.beforeShowDay?.(new Date(date.getTime())) ?? [true, ''];
  }

  private isSelectable(date: Date): boolean {
    return !this.disabled && this.inRange(date) && this.dayInfo(date)[0];
  }

  private get monthGrid(): [number, number] {
    const n = this.settings.numberOfMonths;
    return typeof n === 'number' ? [1, Math.max(1, n)] : [Math.max(1, n[0]), Math.max(1, n[1])];
  }

  private get monthCount(): number {
    const [rows, cols] = this.monthGrid;
    return rows * cols;
  }

  // ---------------------------------------------------------------------------------------------
  // State changes
  // ---------------------------------------------------------------------------------------------

  /** Read the input's value into `selected`, ignoring parse errors (like jQuery UI). */
  private syncFromInput(): void {
    if (!this.input) {
      return;
    }
    const value = this.input.value;
    try {
      this.selected = value ? this.clamp(parseDate(this.settings.dateFormat, value, this.formatSettings)) : null;
    } catch {
      this.selected = value ? this.selected : null;
    }
  }

  private setDateInternal(date: Date | null, fromUser: boolean): void {
    this.selected = date ? stripTime(date) : null;
    const text = this.formatDate(this.selected);
    if (this.input) {
      this.input.value = text;
    }
    this.updateAltField();
    if (date) {
      this.moveCursor(date, false);
    }
    if (fromUser) {
      this.settings.onSelect?.(text, this);
      if (this.input && text !== this.lastDateText) {
        this.input.dispatchEvent(new Event('input', { bubbles: true }));
        this.input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    this.lastDateText = text;
  }

  private updateAltField(): void {
    const { altField, altFormat, dateFormat } = this.settings;
    if (!altField) {
      return;
    }
    const field = typeof altField === 'string'
      ? document.querySelector<HTMLInputElement>(altField)
      : altField;
    if (field) {
      field.value = this.formatDate(this.selected, altFormat || dateFormat);
    }
  }

  /** Move the keyboard cursor and scroll the view so it is visible. */
  private moveCursor(date: Date, notify = true): void {
    this.cursor = this.clamp(stripTime(date));
    const first = new Date(this.viewYear, this.viewMonth, 1);
    const last = new Date(this.viewYear, this.viewMonth + this.monthCount, 0);
    if (this.cursor < first || this.cursor > last || !notify) {
      // Position so the cursor's month is shown at `showCurrentAtPos`.
      const view = new Date(this.cursor.getFullYear(), this.cursor.getMonth() -
        Math.min(this.settings.showCurrentAtPos, this.monthCount - 1), 1);
      if (this.cursor < first || this.cursor > last) {
        this.setView(view.getFullYear(), view.getMonth(), notify);
      } else if (!notify) {
        this.setView(view.getFullYear(), view.getMonth(), false);
      }
    }
  }

  private setView(year: number, month: number, notify = true): void {
    const date = new Date(year, month, 1);
    const changed = date.getFullYear() !== this.viewYear || date.getMonth() !== this.viewMonth;
    this.viewYear = date.getFullYear();
    this.viewMonth = date.getMonth();
    if (changed && notify) {
      const current = new Date(this.viewYear, this.viewMonth + Math.min(this.settings.showCurrentAtPos,
        this.monthCount - 1), 1);
      this.settings.onChangeMonthYear?.(current.getFullYear(), current.getMonth() + 1, this);
    }
  }

  /** Move the view (and the cursor) by a number of months, as the prev/next buttons do. */
  private stepView(months: number): void {
    if (months < 0 && !this.canGoPrev()) {
      return;
    }
    if (months > 0 && !this.canGoNext()) {
      return;
    }
    this.setView(this.viewYear, this.viewMonth + months);
    this.cursor = this.clamp(addMonths(this.cursor, months));
    this.render();
  }

  private canGoPrev(): boolean {
    const min = this.minDate;
    return !min || new Date(this.viewYear, this.viewMonth, 0) >= min;
  }

  private canGoNext(): boolean {
    const max = this.maxDate;
    return !max || new Date(this.viewYear, this.viewMonth + this.monthCount, 1) <= max;
  }

  private selectDate(date: Date): void {
    if (!this.isSelectable(date)) {
      return;
    }
    this.setDateInternal(date, true);
    if (this.inline) {
      this.render();
    } else {
      this.hide();
      this.suppressFocusShow = true;
      this.input?.focus();
      this.suppressFocusShow = false;
    }
  }

  private gotoToday(): void {
    const target = this.settings.gotoCurrent && this.selected ? this.selected : stripTime(new Date());
    this.moveCursor(target, true);
    this.setView(target.getFullYear(), target.getMonth() -
      Math.min(this.settings.showCurrentAtPos, this.monthCount - 1));
    this.render();
  }

  // ---------------------------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------------------------

  private render(): void {
    const s = this.settings;
    const [rows, cols] = this.monthGrid;
    const grid = this.container.querySelector('.yad-calendar');
    const focusInGrid = !!grid && grid.contains(document.activeElement);

    this.container.dir = s.isRTL ? 'rtl' : 'ltr';
    this.container.classList.toggle('yad--rtl', s.isRTL);
    this.container.classList.toggle('yad--multi', rows * cols > 1);
    this.container.style.setProperty('--yad-cols', String(cols));
    this.container.setAttribute('aria-label', this.formatTitle(this.viewYear, this.viewMonth));

    let html = '';
    for (let row = 0; row < rows; row++) {
      html += '<div class="yad-row">';
      for (let col = 0; col < cols; col++) {
        const index = row * cols + col;
        const date = new Date(this.viewYear, this.viewMonth + index, 1);
        html += this.renderMonth(date.getFullYear(), date.getMonth(), index, row, col);
      }
      html += '</div>';
    }
    html += this.renderButtonPane();
    this.container.innerHTML = html;

    if (focusInGrid) {
      this.focusCursor();
    }
  }

  private formatTitle(year: number, month: number): string {
    const s = this.settings;
    const monthText = s.monthNames[month];
    const yearText = String(year) + s.yearSuffix;
    return s.showMonthAfterYear ? `${yearText} ${monthText}` : `${monthText} ${yearText}`;
  }

  private navText(text: string, date: Date): string {
    return this.settings.navigationAsDateFormat ? this.formatDate(date, text) : text;
  }

  private renderHeader(year: number, month: number, index: number, row: number, col: number): string {
    const s = this.settings;
    const [, cols] = this.monthGrid;
    const isFirstCol = col === 0;
    const isLastCol = col === cols - 1;
    let html = '<div class="yad-header">';

    if (row === 0 && isFirstCol) {
      const enabled = this.canGoPrev() && !this.disabled;
      if (enabled || !s.hideIfNoPrevNext) {
        const text = this.navText(s.prevText, addMonths(new Date(this.viewYear, this.viewMonth, 1), -s.stepMonths));
        html += `<button type="button" class="yad-prev" data-action="prev" aria-label="${escapeHtml(text)}"` +
          ` title="${escapeHtml(text)}"${enabled ? '' : ' disabled'}><span class="yad-icon" aria-hidden="true"></span>` +
          `<span class="yad-nav-text">${escapeHtml(text)}</span></button>`;
      }
    }
    if (row === 0 && isLastCol) {
      const enabled = this.canGoNext() && !this.disabled;
      if (enabled || !s.hideIfNoPrevNext) {
        const text = this.navText(s.nextText, addMonths(new Date(this.viewYear, this.viewMonth, 1), s.stepMonths));
        html += `<button type="button" class="yad-next" data-action="next" aria-label="${escapeHtml(text)}"` +
          ` title="${escapeHtml(text)}"${enabled ? '' : ' disabled'}><span class="yad-icon" aria-hidden="true"></span>` +
          `<span class="yad-nav-text">${escapeHtml(text)}</span></button>`;
      }
    }

    const titleId = `${this.id}-title-${index}`;
    const monthHtml = this.renderMonthControl(year, month, index);
    const yearHtml = this.renderYearControl(year, index);
    html += `<div class="yad-title" id="${titleId}" aria-live="polite">` +
      (s.showMonthAfterYear ? yearHtml + monthHtml : monthHtml + yearHtml) +
      '</div></div>';
    return html;
  }

  private renderMonthControl(year: number, month: number, index: number): string {
    const s = this.settings;
    if (!s.changeMonth || index !== 0) {
      return `<span class="yad-month">${escapeHtml(s.monthNames[month])}</span>`;
    }
    const min = this.minDate;
    const max = this.maxDate;
    let html = `<select class="yad-month-select" data-action="month" data-index="${index}"` +
      ` aria-label="Month"${this.disabled ? ' disabled' : ''}>`;
    for (let m = 0; m < 12; m++) {
      const inRange = (!min || new Date(year, m + 1, 0) >= min) && (!max || new Date(year, m, 1) <= max);
      if (inRange || m === month) {
        html += `<option value="${m}"${m === month ? ' selected' : ''}>${escapeHtml(s.monthNamesShort[m])}</option>`;
      }
    }
    return html + '</select>';
  }

  private renderYearControl(year: number, index: number): string {
    const s = this.settings;
    if (!s.changeYear || index !== 0) {
      return `<span class="yad-year">${year}${escapeHtml(s.yearSuffix)}</span>`;
    }
    const thisYear = new Date().getFullYear();
    const determineYear = (value: string): number => {
      const match = value.match(/^c([+-]\d+)$/i);
      const year2 = match ? year + parseInt(match[1], 10)
        : /^[+-]/.test(value) ? thisYear + parseInt(value, 10)
          : parseInt(value, 10);
      return isNaN(year2) ? thisYear : year2;
    };
    const parts = s.yearRange.split(':');
    let start = determineYear(parts[0]);
    let end = Math.max(start, determineYear(parts[1] ?? parts[0]));
    const min = this.minDate;
    const max = this.maxDate;
    if (min) {
      start = Math.max(start, min.getFullYear());
    }
    if (max) {
      end = Math.min(end, max.getFullYear());
    }
    start = Math.min(start, year);
    end = Math.max(end, year);

    let html = `<select class="yad-year-select" data-action="year" data-index="${index}"` +
      ` aria-label="Year"${this.disabled ? ' disabled' : ''}>`;
    for (let y = start; y <= end; y++) {
      html += `<option value="${y}"${y === year ? ' selected' : ''}>${y}</option>`;
    }
    return html + '</select>' + (s.yearSuffix ? `<span class="yad-year-suffix">${escapeHtml(s.yearSuffix)}</span>` : '');
  }

  private renderMonth(year: number, month: number, index: number, row: number, col: number): string {
    const s = this.settings;
    const [, cols] = this.monthGrid;
    const today = stripTime(new Date());
    const titleId = `${this.id}-title-${index}`;
    const position = cols === 1 ? '' : col === 0 ? ' yad-group--first' : col === cols - 1 ? ' yad-group--last' : ' yad-group--middle';

    let html = `<div class="yad-group${position}">`;
    html += this.renderHeader(year, month, index, row, col);
    html += `<table class="yad-calendar" role="grid" aria-labelledby="${titleId}"><thead><tr>`;
    if (s.showWeek) {
      html += `<th scope="col" class="yad-week-col">${escapeHtml(s.weekHeader)}</th>`;
    }
    for (let i = 0; i < 7; i++) {
      const day = (i + s.firstDay) % 7;
      const weekend = day === 0 || day === 6 ? ' class="yad-week-end"' : '';
      html += `<th scope="col"${weekend}><abbr title="${escapeHtml(s.dayNames[day])}">` +
        `${escapeHtml(s.dayNamesMin[day])}</abbr></th>`;
    }
    html += '</tr></thead><tbody>';

    const leadDays = (new Date(year, month, 1).getDay() - s.firstDay + 7) % 7;
    const totalCells = Math.ceil((leadDays + daysInMonth(year, month)) / 7) * 7;
    let printDate = new Date(year, month, 1 - leadDays);

    for (let cell = 0; cell < totalCells; cell++) {
      if (cell % 7 === 0) {
        html += '<tr>';
        if (s.showWeek) {
          html += `<td class="yad-week-col">${s.calculateWeek(new Date(printDate.getTime()))}</td>`;
        }
      }
      html += this.renderDay(printDate, month, today);
      if (cell % 7 === 6) {
        html += '</tr>';
      }
      printDate = new Date(printDate.getFullYear(), printDate.getMonth(), printDate.getDate() + 1);
    }
    html += '</tbody></table></div>';
    return html;
  }

  private renderDay(date: Date, month: number, today: Date): string {
    const s = this.settings;
    const otherMonth = date.getMonth() !== month;
    if (otherMonth && !s.showOtherMonths) {
      return '<td class="yad-other-month yad-empty" role="gridcell"></td>';
    }
    const [selectable, extraClass = '', tooltip = ''] = this.dayInfo(date);
    const enabled = !this.disabled && this.inRange(date) && selectable &&
      (!otherMonth || s.selectOtherMonths);
    const isSelected = isSameDay(date, this.selected);
    const isCursor = isSameDay(date, this.cursor) && !otherMonth;
    const day = date.getDay();

    const classes = ['yad-day'];
    if (day === 0 || day === 6) classes.push('yad-week-end');
    if (otherMonth) classes.push('yad-other-month');
    if (!enabled) classes.push('yad-unselectable');
    if (isSameDay(date, today)) classes.push('yad-today');
    if (isSelected) classes.push('yad-selected');
    if (isCursor) classes.push('yad-highlight');
    if (extraClass) classes.push(...extraClass.split(/\s+/).filter(Boolean));

    const label = formatDate('DD, d MM yy', date, this.formatSettings);
    const titleAttr = tooltip ? ` title="${escapeHtml(tooltip)}"` : '';
    const content = otherMonth && !s.selectOtherMonths
      ? `<span class="yad-day-text">${date.getDate()}</span>`
      : `<button type="button" class="yad-day-btn" data-date="${dateKey(date)}" tabindex="${isCursor ? 0 : -1}"` +
        ` aria-label="${escapeHtml(label)}"${isSameDay(date, today) ? ' aria-current="date"' : ''}` +
        `${enabled ? '' : ' aria-disabled="true"'}>${date.getDate()}</button>`;

    return `<td role="gridcell" class="${classes.map(escapeHtml).join(' ')}"` +
      ` aria-selected="${isSelected}"${titleAttr}>${content}</td>`;
  }

  private renderButtonPane(): string {
    const s = this.settings;
    if (!s.showButtonPanel) {
      return '';
    }
    const today = stripTime(new Date());
    const target = s.gotoCurrent && this.selected ? this.selected : today;
    const currentText = this.navText(s.currentText, target);
    const todayEnabled = !this.disabled && this.inRange(target);
    let html = '<div class="yad-buttonpane">';
    html += `<button type="button" class="yad-current" data-action="today"${todayEnabled ? '' : ' disabled'}>` +
      `${escapeHtml(currentText)}</button>`;
    if (!this.inline) {
      html += `<button type="button" class="yad-close" data-action="close">${escapeHtml(s.closeText)}</button>`;
    }
    return html + '</div>';
  }

  private focusCursor(): void {
    const button = this.container.querySelector<HTMLButtonElement>(`.yad-day-btn[data-date="${dateKey(this.cursor)}"]`);
    button?.focus();
  }

  /**
   * Where the popup is mounted. Inside a modal (Bootstrap `.modal`, `<dialog>`, any `[aria-modal="true"]`)
   * it must live in the modal itself, otherwise the modal's focus trap pulls focus out of the calendar
   * and a top-layer `<dialog>` would render above it.
   */
  private popupHost(): HTMLElement {
    return this.input?.closest<HTMLElement>('dialog, .modal, [aria-modal="true"]') ?? document.body;
  }

  private position(): void {
    if (!this.input || this.inline) {
      return;
    }
    const input = this.input;
    // Inside a modal the popup lives in the (fixed) modal element, so position it in viewport space.
    let fixed = this.container.parentElement !== document.body;
    for (let el: HTMLElement | null = input; el; el = el.parentElement) {
      if (getComputedStyle(el).position === 'fixed') {
        fixed = true;
        break;
      }
    }
    const style = this.container.style;
    style.position = fixed ? 'fixed' : 'absolute';
    style.top = '0px';
    style.left = '0px';

    const rect = input.getBoundingClientRect();
    const width = this.container.offsetWidth;
    const height = this.container.offsetHeight;
    const viewWidth = document.documentElement.clientWidth || window.innerWidth;
    const viewHeight = document.documentElement.clientHeight || window.innerHeight;
    const scrollX = fixed ? 0 : window.scrollX;
    const scrollY = fixed ? 0 : window.scrollY;

    let left = this.settings.isRTL ? rect.right - width : rect.left;
    left = Math.max(0, Math.min(left, viewWidth - width));
    let top = rect.bottom;
    if (top + height > viewHeight && rect.top - height >= 0) {
      top = rect.top - height;
      this.container.classList.add('yad--above');
    } else {
      this.container.classList.remove('yad--above');
    }
    style.left = `${left + scrollX}px`;
    style.top = `${top + scrollY}px`;
  }

  // ---------------------------------------------------------------------------------------------
  // Event handlers (arrow functions so they can be removed again)
  // ---------------------------------------------------------------------------------------------

  private onInputFocus = (): void => {
    if (this.suppressFocusShow || this.settings.showOn === 'button') {
      return;
    }
    this.show();
  };

  private onInputInput = (): void => {
    if (!this.input) {
      return;
    }
    try {
      const date = parseDate(this.settings.dateFormat, this.input.value, this.formatSettings);
      if (date && this.inRange(date)) {
        this.selected = date;
        this.updateAltField();
        this.moveCursor(date, true);
        this.lastDateText = this.input.value;
        this.refresh();
      }
    } catch {
      // Incomplete input: keep the calendar as it is.
    }
  };

  private onInputKeyDown = (e: KeyboardEvent): void => {
    const s = this.settings;
    if (!this.visible) {
      if (e.key === 'ArrowDown' && (e.altKey || e.ctrlKey || e.metaKey) || e.key === 'Home' && e.ctrlKey) {
        e.preventDefault();
        this.show();
      } else if (s.constrainInput) {
        this.constrainKey(e);
      }
      return;
    }
    const ctrl = e.ctrlKey || e.metaKey;
    const rtl = s.isRTL ? -1 : 1;
    let handled = true;
    switch (e.key) {
      case 'Tab':
        this.hide();
        handled = false;
        break;
      case 'Escape':
        this.hide();
        break;
      case 'Enter':
        if (this.isSelectable(this.cursor)) {
          this.selectDate(this.cursor);
        } else {
          this.hide();
        }
        break;
      case 'PageUp':
        this.stepView(ctrl || e.shiftKey ? -12 : -s.stepMonths);
        break;
      case 'PageDown':
        this.stepView(ctrl || e.shiftKey ? 12 : s.stepMonths);
        break;
      case 'End':
        if (ctrl) {
          this.setDateInternal(null, true);
          this.hide();
        } else {
          handled = false;
        }
        break;
      case 'Home':
        if (ctrl) {
          this.gotoToday();
        } else {
          handled = false;
        }
        break;
      case 'ArrowLeft':
      case 'ArrowRight':
        if (ctrl) {
          this.moveCursorBy(e.key === 'ArrowLeft' ? -rtl : rtl);
        } else {
          handled = false;
        }
        break;
      case 'ArrowUp':
        if (ctrl) {
          this.moveCursorBy(-7);
        } else {
          handled = false;
        }
        break;
      case 'ArrowDown':
        if (ctrl) {
          this.moveCursorBy(7);
        } else {
          // Move focus into the calendar grid.
          this.focusCursor();
        }
        break;
      default:
        handled = false;
        if (s.constrainInput) {
          this.constrainKey(e);
        }
    }
    if (handled) {
      e.preventDefault();
    }
  };

  private onGridKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement;
    if (!target.classList.contains('yad-day-btn')) {
      if (e.key === 'Escape' && !this.inline) {
        e.preventDefault();
        this.closeAndFocusInput();
      }
      return;
    }
    const s = this.settings;
    const rtl = s.isRTL ? -1 : 1;
    let handled = true;
    switch (e.key) {
      case 'ArrowLeft':
        this.moveCursorBy(-rtl);
        break;
      case 'ArrowRight':
        this.moveCursorBy(rtl);
        break;
      case 'ArrowUp':
        this.moveCursorBy(-7);
        break;
      case 'ArrowDown':
        this.moveCursorBy(7);
        break;
      case 'Home': {
        const offset = (this.cursor.getDay() - s.firstDay + 7) % 7;
        this.moveCursorBy(-offset);
        break;
      }
      case 'End': {
        const offset = 6 - (this.cursor.getDay() - s.firstDay + 7) % 7;
        this.moveCursorBy(offset);
        break;
      }
      case 'PageUp':
        this.moveCursorTo(addMonths(this.cursor, e.shiftKey ? -12 : -1));
        break;
      case 'PageDown':
        this.moveCursorTo(addMonths(this.cursor, e.shiftKey ? 12 : 1));
        break;
      case 'Enter':
      case ' ':
        this.selectDate(parseKey(target.dataset.date!));
        break;
      case 'Escape':
        if (this.inline) {
          handled = false;
        } else {
          this.closeAndFocusInput();
        }
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
    }
  };

  private moveCursorBy(days: number): void {
    this.moveCursorTo(new Date(this.cursor.getFullYear(), this.cursor.getMonth(), this.cursor.getDate() + days));
  }

  private moveCursorTo(date: Date): void {
    this.moveCursor(date, true);
    this.render();
    if (this.container.contains(document.activeElement)) {
      this.focusCursor();
    }
  }

  private closeAndFocusInput(): void {
    this.hide();
    this.suppressFocusShow = true;
    this.input?.focus();
    this.suppressFocusShow = false;
  }

  /** Block characters that can never appear in a date of the current format. */
  private constrainKey(e: KeyboardEvent): void {
    if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) {
      return;
    }
    if (!this.allowedChars().includes(e.key)) {
      e.preventDefault();
    }
  }

  private allowedChars(): string {
    const format = this.settings.dateFormat;
    let chars = this.settings.constrainInput ? '0123456789' : '';
    let literal = false;
    for (let i = 0; i < format.length; i++) {
      const ch = format.charAt(i);
      if (literal) {
        if (ch === "'" && format.charAt(i + 1) !== "'") {
          literal = false;
        } else {
          chars += ch;
        }
      } else if ('dmyo@!'.includes(ch)) {
        // digits only
      } else if (ch === 'D' || ch === 'M') {
        const names = ch === 'D'
          ? [...this.settings.dayNames, ...this.settings.dayNamesShort]
          : [...this.settings.monthNames, ...this.settings.monthNamesShort];
        chars += names.join('') + names.join('').toUpperCase() + names.join('').toLowerCase();
      } else if (ch === "'") {
        if (format.charAt(i + 1) === "'") {
          chars += "'";
          i++;
        } else {
          literal = true;
        }
      } else {
        chars += ch;
      }
    }
    return chars;
  }

  private onClick = (e: MouseEvent): void => {
    if (this.disabled) {
      return;
    }
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action], [data-date]');
    if (!target || !this.container.contains(target)) {
      return;
    }
    if (target.dataset.date) {
      if (target.getAttribute('aria-disabled') !== 'true') {
        this.cursor = parseKey(target.dataset.date);
        this.selectDate(this.cursor);
      }
      return;
    }
    switch (target.dataset.action) {
      case 'prev':
        this.stepView(-this.settings.stepMonths);
        break;
      case 'next':
        this.stepView(this.settings.stepMonths);
        break;
      case 'today':
        this.gotoToday();
        break;
      case 'close':
        this.closeAndFocusInput();
        break;
    }
  };

  private onSelectChange = (e: Event): void => {
    const select = e.target as HTMLSelectElement;
    const action = select.dataset.action;
    if (action !== 'month' && action !== 'year') {
      return;
    }
    const index = Number(select.dataset.index ?? 0);
    const shown = new Date(this.viewYear, this.viewMonth + index, 1);
    const year = action === 'year' ? Number(select.value) : shown.getFullYear();
    const month = action === 'month' ? Number(select.value) : shown.getMonth();
    this.setView(year, month - index);
    this.cursor = this.clamp(new Date(year, month,
      Math.min(this.cursor.getDate(), daysInMonth(year, month))));
    this.render();
    this.container.querySelector<HTMLSelectElement>(`select[data-action="${action}"]`)?.focus();
  };

  private onContainerMouseDown = (e: MouseEvent): void => {
    // Keep focus in the input when clicking the popup with the mouse (selects need default handling).
    if (!this.inline && !(e.target as HTMLElement).closest('select')) {
      e.preventDefault();
    }
  };

  private onDocumentMouseDown = (e: MouseEvent): void => {
    const target = e.target as Node;
    if (this.container.contains(target) || this.input?.contains(target) || this.trigger?.contains(target)) {
      return;
    }
    this.hide();
  };

  private onFocusOut = (e: FocusEvent): void => {
    const next = e.relatedTarget as Node | null;
    if (!this.visible || !next) {
      return;
    }
    if (this.container.contains(next) || next === this.input || this.trigger?.contains(next)) {
      return;
    }
    this.hide();
  };

  private onWindowChange = (): void => {
    if (this.visible) {
      this.position();
    }
  };
}
