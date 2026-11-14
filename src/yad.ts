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
import { formatTime, parseTime, timeFormatUnits, timeOf, withTime } from './time-utils';
import type { TimeParts, TimeSettings } from './time-utils';
import { en } from './i18n/en';

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

type TimeUnit = keyof TimeParts;
const TIME_UNITS: TimeUnit[] = ['hour', 'minute', 'second', 'millisec'];

/** Round `value` to the step grid starting at `base`, staying within [min, max]. */
function snap(value: number, min: number, max: number, base: number, step: number): number {
  step = Math.max(1, step);
  let v = base + Math.round((value - base) / step) * step;
  if (v < min) {
    v = base + Math.ceil((min - base) / step) * step;
  }
  if (v > max) {
    v = base + Math.floor((max - base) / step) * step;
  }
  // If no value on the grid fits, fall back to the bound.
  return Math.max(min, Math.min(max, v));
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

  /**
   * Localisations. Only English is built in (`''`, `en`, `en-US`, the default); add others from
   * `@sandritsch91/yad/i18n`, e.g. `Yad.regional.de = de` or `Object.assign(Yad.regional, locales)`.
   */
  static regional: Record<string, RegionalSettings> = { '': REGIONAL_EN, en, 'en-US': en };

  static formatDate = formatDate;
  static parseDate = parseDate;
  static iso8601Week = iso8601Week;
  static noWeekends = noWeekends;
  static formatTime = formatTime;
  static parseTime = parseTime;

  /** Date and time picker, like the timepicker addon's `$(el).datetimepicker(options)`. */
  static datetimepicker(target: Target, options: Partial<YadOptions> = {}): Yad {
    return new Yad(target, { ...options, showTime: true });
  }

  /** Time-only picker, like the timepicker addon's `$(el).timepicker(options)`. */
  static timepicker(target: Target, options: Partial<YadOptions> = {}): Yad {
    return new Yad(target, { ...options, timeOnly: true });
  }

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
  /** Selected time of day (only used when the time picker is enabled). */
  private time!: TimeParts;
  /** Set while yad dispatches events on its own input, so it does not re-parse its own writes. */
  private writing = false;

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
    this.time = this.defaultTime();

    this.container = document.createElement('div');
    this.container.id = this.id;
    this.container.className = 'yad';
    this.container.addEventListener('click', this.onClick);
    this.container.addEventListener('change', this.onSelectChange);
    this.container.addEventListener('input', this.onTimeInput);
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
      if (['autoSize', 'dateFormat', 'timeFormat', 'showTime', 'timeOnly', 'separator'].some((k) => k in changes)) {
        this.applyAutoSize();
      }
    }
    if ('defaultDate' in changes && this.inline && !this.selected) {
      this.moveCursor(this.getDefaultDate() ?? new Date(), false);
    }
    const reformat = ['dateFormat', 'minDate', 'maxDate', 'monthNames', 'monthNamesShort', 'dayNames',
      'dayNamesShort', 'altFormat', 'showTime', 'timeOnly', 'timeFormat', 'separator', 'amNames', 'pmNames',
      'minDateTime', 'maxDateTime', 'stepHour', 'stepMinute', 'stepSecond', 'stepMillisec', 'hourMin', 'hourMax',
      'minuteMin', 'minuteMax', 'secondMin', 'secondMax', 'millisecMin', 'millisecMax', 'altTimeFormat',
      'altSeparator'];
    if (date && reformat.some((k) => k in changes)) {
      // Re-format and re-clamp the current value under the new settings.
      this.setDateInternal(this.clamp(stripTime(date)), false, timeOf(date));
    }
    this.refresh();
    return this;
  }

  /** The currently selected date (including the time when the time picker is enabled), or null. */
  getDate(): Date | null {
    if (this.input) {
      this.syncFromInput();
    }
    if (!this.selected) {
      return null;
    }
    return this.hasTime ? withTime(this.selected, this.time) : new Date(this.selected.getTime());
  }

  /**
   * Set the date. Accepts a Date, a number of days from today, a formatted or relative string, or null.
   * With the time picker enabled, a Date's time and a formatted "date time" string set the time too.
   */
  setDate(date: DateSpec): this {
    let resolved: Date | null = null;
    let time: TimeParts | undefined;
    if (date != null && date !== '') {
      if (this.hasTime && date instanceof Date) {
        resolved = stripTime(date);
        time = timeOf(date);
      } else if (this.hasTime && typeof date === 'string') {
        const parsed = this.parseValue(date);
        resolved = parsed?.date ?? null;
        time = parsed?.time ?? undefined;
      }
      resolved ??= this.resolveDate(date, null);
    }
    this.setDateInternal(resolved ? this.clamp(resolved) : null, false, time);
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
    let text = this.formatDate(date);
    if (this.hasTime) {
      const timeText = this.formatTimeText({ hour: 23, minute: 59, second: 59, millisec: 999 });
      text = this.settings.timeOnly ? timeText : text + this.settings.separator + timeText;
    }
    this.input.size = text.length;
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

  /** First selectable day: the later of `minDate` and the day of `minDateTime`. */
  private get minDate(): Date | null {
    const min = this.resolveDate(this.settings.minDate, null);
    const minDT = this.settings.minDateTime ? stripTime(this.settings.minDateTime) : null;
    return min && minDT ? (min > minDT ? min : minDT) : min ?? minDT;
  }

  /** Last selectable day: the earlier of `maxDate` and the day of `maxDateTime`. */
  private get maxDate(): Date | null {
    const min = this.minDate;
    let max = this.resolveDate(this.settings.maxDate, null);
    const maxDT = this.settings.maxDateTime ? stripTime(this.settings.maxDateTime) : null;
    max = max && maxDT ? (max < maxDT ? max : maxDT) : max ?? maxDT;
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
  // Time helpers
  // ---------------------------------------------------------------------------------------------

  private get hasTime(): boolean {
    return this.settings.showTime || this.settings.timeOnly;
  }

  private get timeSettings(): TimeSettings {
    return { amNames: this.settings.amNames, pmNames: this.settings.pmNames };
  }

  /** Which time units get a control (`showHour` etc., or decided by `timeFormat`). */
  private get timeUnits(): Record<TimeUnit, boolean> {
    const s = this.settings;
    const fromFormat = timeFormatUnits(s.timeFormat);
    return {
      hour: s.showHour ?? fromFormat.hour,
      minute: s.showMinute ?? fromFormat.minute,
      second: s.showSecond ?? fromFormat.second,
      millisec: s.showMillisec ?? fromFormat.millisec,
    };
  }

  private defaultTime(): TimeParts {
    const s = this.settings;
    return { hour: s.hour, minute: s.minute, second: s.second, millisec: s.millisec };
  }

  private unitConfig(unit: TimeUnit): { min: number; max: number; step: number; text: string } {
    const s = this.settings;
    switch (unit) {
      case 'hour': return { min: s.hourMin, max: s.hourMax, step: s.stepHour, text: s.hourText };
      case 'minute': return { min: s.minuteMin, max: s.minuteMax, step: s.stepMinute, text: s.minuteText };
      case 'second': return { min: s.secondMin, max: s.secondMax, step: s.stepSecond, text: s.secondText };
      default: return { min: s.millisecMin, max: s.millisecMax, step: s.stepMillisec, text: s.millisecText };
    }
  }

  /**
   * Allowed range of `unit` on `day`, on the unit's step grid. `minDateTime` / `maxDateTime` narrow the
   * range on their own day; a lower unit is only narrowed while all higher units sit exactly on the bound.
   */
  private timeLimits(unit: TimeUnit, day: Date | null, time: TimeParts): [number, number] {
    const s = this.settings;
    const { min, max, step } = this.unitConfig(unit);
    let lo = min;
    let hi = max;
    const narrow = (bound: Date | null, isMin: boolean): void => {
      if (!bound || !day || !isSameDay(bound, day)) {
        return;
      }
      const b = timeOf(bound);
      for (const u of TIME_UNITS) {
        if (u === unit) {
          if (isMin) {
            lo = Math.max(lo, b[u]);
          } else {
            hi = Math.min(hi, b[u]);
          }
          return;
        }
        if (time[u] !== b[u]) {
          return;
        }
      }
    };
    narrow(s.minDateTime, true);
    narrow(s.maxDateTime, false);
    return [snap(lo, lo, hi, min, step), snap(hi, lo, hi, min, step)];
  }

  /** Snap each unit to its step and range, highest unit first. */
  private clampTime(time: TimeParts, day: Date | null): TimeParts {
    const result = { ...time };
    for (const unit of TIME_UNITS) {
      const [lo, hi] = this.timeLimits(unit, day, result);
      const { min, step } = this.unitConfig(unit);
      result[unit] = snap(result[unit], lo, hi, min, step);
    }
    return result;
  }

  private formatTimeText(time = this.time, format = this.settings.timeFormat): string {
    return formatTime(format, time, this.timeSettings);
  }

  /** The text shown in the input: the date, the time, or both. */
  private formatValue(date: Date | null): string {
    if (!date) {
      return '';
    }
    const s = this.settings;
    if (s.timeOnly) {
      return this.formatTimeText();
    }
    const dateText = this.formatDate(date);
    return s.showTime ? dateText + s.separator + this.formatTimeText() : dateText;
  }

  /** Parse input text. Returns null while it cannot be parsed (e.g. incomplete typing). */
  private parseValue(value: string): { date: Date | null; time: TimeParts | null } | null {
    const s = this.settings;
    if (!value) {
      return { date: null, time: null };
    }
    if (s.timeOnly) {
      const time = parseTime(s.timeFormat, value, this.timeSettings);
      return time ? { date: stripTime(new Date()), time } : null;
    }
    const tryDate = (text: string): Date | null => {
      try {
        return parseDate(s.dateFormat, text, this.formatSettings);
      } catch {
        return null;
      }
    };
    if (s.showTime && s.separator) {
      // The separator can also occur inside the date or time format, so try every split position.
      for (let i = value.indexOf(s.separator); i !== -1; i = value.indexOf(s.separator, i + 1)) {
        const date = tryDate(value.slice(0, i));
        const time = date && parseTime(s.timeFormat, value.slice(i + s.separator.length), this.timeSettings);
        if (date && time) {
          return { date, time };
        }
      }
    }
    const date = tryDate(value);
    return date ? { date, time: null } : null;
  }

  /** Label of a value in a unit's control, e.g. "03 PM" for hour 15 with a 12-hour format. */
  private unitLabel(unit: TimeUnit, value: number): string {
    if (unit === 'hour' && timeFormatUnits(this.settings.timeFormat).ampm) {
      return formatTime('hh TT', { hour: value }, this.timeSettings);
    }
    return String(value).padStart(unit === 'millisec' ? 3 : 2, '0');
  }

  /** The day the time applies to: the selection, else today (time-only) or the highlighted day. */
  private get timeDay(): Date {
    return this.selected ?? (this.settings.timeOnly ? stripTime(new Date()) : this.cursor);
  }

  // ---------------------------------------------------------------------------------------------
  // State changes
  // ---------------------------------------------------------------------------------------------

  /** Read the input's value into `selected`, ignoring parse errors (like jQuery UI). */
  private syncFromInput(): void {
    if (!this.input) {
      return;
    }
    // Unparseable text (e.g. half-typed) keeps the previous selection, like jQuery UI.
    const parsed = this.parseValue(this.input.value);
    if (parsed) {
      this.selected = parsed.date ? this.clamp(parsed.date) : null;
      if (parsed.time) {
        this.time = this.clampTime(parsed.time, this.selected);
      }
    }
  }

  private setDateInternal(date: Date | null, fromUser: boolean, time?: TimeParts): void {
    this.selected = date ? stripTime(date) : null;
    if (this.hasTime) {
      this.time = this.clampTime(time ?? this.time, this.selected);
    }
    const text = this.formatValue(this.selected);
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
        this.dispatchOnInput('input', 'change');
      }
    }
    this.lastDateText = text;
  }

  private dispatchOnInput(...types: string[]): void {
    this.writing = true;
    try {
      for (const type of types) {
        this.input?.dispatchEvent(new Event(type, { bubbles: true }));
      }
    } finally {
      this.writing = false;
    }
  }

  private updateAltField(): void {
    const s = this.settings;
    if (!s.altField) {
      return;
    }
    const field = typeof s.altField === 'string'
      ? document.querySelector<HTMLInputElement>(s.altField)
      : s.altField;
    if (!field) {
      return;
    }
    let text = '';
    if (this.selected) {
      const datePart = s.timeOnly ? '' : this.formatDate(this.selected, s.altFormat || s.dateFormat);
      const timePart = this.hasTime ? this.formatTimeText(this.time, s.altTimeFormat || s.timeFormat) : '';
      text = datePart && timePart ? datePart + (s.altSeparator || s.separator) + timePart : datePart || timePart;
    }
    field.value = text;
  }

  /** Change one time unit from a slider or dropdown. `commit` is false while a slider is being dragged. */
  private updateTimeUnit(unit: TimeUnit, value: number, commit: boolean): void {
    if (this.disabled) {
      return;
    }
    const day = this.timeDay;
    this.time = this.clampTime({ ...this.time, [unit]: value }, day);
    // Changing the time without a selected day selects the highlighted day (today for time-only pickers).
    if (!this.settings.timeOnly && !this.isSelectable(day)) {
      this.updateTimeDisplay();
      return;
    }
    if (commit) {
      this.setDateInternal(day, true);
      this.render();
      return;
    }
    // Live update while dragging. No re-render: it would interrupt the drag.
    this.selected = day;
    if (this.input) {
      this.input.value = this.formatValue(day);
      this.dispatchOnInput('input');
    }
    this.updateAltField();
    this.updateTimeDisplay();
  }

  /** Update the time readout and slider ranges in place (limits can change with the hour). */
  private updateTimeDisplay(): void {
    const panel = this.container.querySelector('.yad-time');
    if (!panel) {
      return;
    }
    const output = panel.querySelector('.yad-time-value');
    if (output) {
      output.textContent = this.formatTimeText();
    }
    for (const control of Array.from(panel.querySelectorAll<HTMLInputElement>('input[data-unit]'))) {
      const unit = control.dataset.unit as TimeUnit;
      const [min, max] = this.timeLimits(unit, this.timeDay, this.time);
      control.min = String(min);
      control.max = String(max);
      control.value = String(this.time[unit]);
      control.setAttribute('aria-valuetext', this.unitLabel(unit, this.time[unit]));
    }
  }

  private selectNow(): void {
    const now = new Date();
    // "Now" means today: if today cannot be selected, do nothing (rather than picking the nearest day).
    const day = stripTime(now);
    if (!this.settings.timeOnly && !this.isSelectable(day)) {
      return;
    }
    this.setDateInternal(day, true, timeOf(now));
    this.render();
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
    // With the time picker the popup stays open so the time can be set; "Done" or clicking outside closes it.
    if (this.inline || this.hasTime) {
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
    const focusedUnit = this.container.contains(document.activeElement)
      ? (document.activeElement as HTMLElement).dataset.unit
      : undefined;

    this.container.dir = s.isRTL ? 'rtl' : 'ltr';
    this.container.dataset.theme = s.theme;
    this.container.classList.toggle('yad--rtl', s.isRTL);
    this.container.classList.toggle('yad--multi', !s.timeOnly && rows * cols > 1);
    this.container.classList.toggle('yad--time', this.hasTime);
    this.container.classList.toggle('yad--time-only', s.timeOnly);
    this.container.style.setProperty('--yad-cols', String(cols));
    this.container.setAttribute('aria-label',
      s.timeOnly ? s.timeOnlyTitle : this.formatTitle(this.viewYear, this.viewMonth));

    let html = '';
    if (s.timeOnly) {
      html += `<div class="yad-header"><div class="yad-title">${escapeHtml(s.timeOnlyTitle)}</div></div>`;
    } else {
      for (let row = 0; row < rows; row++) {
        html += '<div class="yad-row">';
        for (let col = 0; col < cols; col++) {
          const index = row * cols + col;
          const date = new Date(this.viewYear, this.viewMonth + index, 1);
          html += this.renderMonth(date.getFullYear(), date.getMonth(), index, row, col);
        }
        html += '</div>';
      }
    }
    if (this.hasTime) {
      html += this.renderTime();
    }
    html += this.renderButtonPane();
    this.container.innerHTML = html;

    if (focusInGrid) {
      this.focusCursor();
    } else if (focusedUnit) {
      this.container.querySelector<HTMLElement>(`[data-unit="${focusedUnit}"]`)?.focus();
    }
  }

  private renderTime(): string {
    const s = this.settings;
    const units = this.timeUnits;
    const day = this.timeDay;
    const time = this.clampTime(this.time, day);
    let html = `<div class="yad-time" role="group" aria-label="${escapeHtml(s.timeText)}">` +
      `<div class="yad-time-row yad-time-current"><span class="yad-time-label">${escapeHtml(s.timeText)}</span>` +
      `<output class="yad-time-value">${escapeHtml(this.formatTimeText(time))}</output></div>`;
    for (const unit of TIME_UNITS) {
      if (!units[unit]) {
        continue;
      }
      const id = `${this.id}-${unit}`;
      const { min: base, step, text } = this.unitConfig(unit);
      const [min, max] = this.timeLimits(unit, day, time);
      const disabled = this.disabled ? ' disabled' : '';
      html += `<div class="yad-time-row"><label class="yad-time-label" for="${id}">${escapeHtml(text)}</label>`;
      if (s.controlType === 'select') {
        html += `<select class="yad-time-select" id="${id}" data-unit="${unit}"${disabled}>`;
        for (let v = base; v <= max; v += Math.max(1, step)) {
          if (v >= min) {
            html += `<option value="${v}"${v === time[unit] ? ' selected' : ''}>` +
              `${escapeHtml(this.unitLabel(unit, v))}</option>`;
          }
        }
        html += '</select>';
      } else {
        html += `<input type="range" class="yad-time-slider" id="${id}" data-unit="${unit}" min="${min}"` +
          ` max="${max}" step="${Math.max(1, step)}" value="${time[unit]}"` +
          ` aria-valuetext="${escapeHtml(this.unitLabel(unit, time[unit]))}"${disabled}>`;
      }
      html += '</div>';
    }
    return html + '</div>';
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
    if (!s.showButtonPanel && !this.hasTime) {
      return '';
    }
    const today = stripTime(new Date());
    let html = '<div class="yad-buttonpane">';
    if (this.hasTime) {
      // "Now" selects the current date and time (the timepicker addon's behaviour).
      const nowEnabled = !this.disabled && (s.timeOnly || this.isSelectable(today));
      html += `<button type="button" class="yad-current" data-action="now"${nowEnabled ? '' : ' disabled'}>` +
        `${escapeHtml(s.nowText)}</button>`;
    } else {
      const target = s.gotoCurrent && this.selected ? this.selected : today;
      const currentText = this.navText(s.currentText, target);
      const todayEnabled = !this.disabled && this.inRange(target);
      html += `<button type="button" class="yad-current" data-action="today"${todayEnabled ? '' : ' disabled'}>` +
        `${escapeHtml(currentText)}</button>`;
    }
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
    if (!this.input || this.writing) {
      return;
    }
    // Incomplete input does not parse: keep the calendar as it is.
    const parsed = this.parseValue(this.input.value);
    if (parsed?.date && this.inRange(parsed.date)) {
      this.selected = parsed.date;
      if (parsed.time) {
        this.time = this.clampTime(parsed.time, parsed.date);
      }
      this.updateAltField();
      this.moveCursor(parsed.date, true);
      this.lastDateText = this.input.value;
      this.refresh();
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
        if (!this.settings.timeOnly && this.isSelectable(this.cursor)) {
          this.selectDate(this.cursor);
        }
        this.hide();
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
    if (this.hasTime) {
      const s = this.settings;
      const ampm = [...s.amNames, ...s.pmNames].join('');
      // Literal characters of the time format (e.g. ":"), the separator and the am/pm names.
      chars += s.separator + s.timeFormat.replace(/[HhmslTt']/g, '') + ampm.toUpperCase() + ampm.toLowerCase();
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
      case 'now':
        this.selectNow();
        break;
      case 'close':
        this.closeAndFocusInput();
        break;
    }
  };

  /** Slider moved (fires continuously while dragging). */
  private onTimeInput = (e: Event): void => {
    const control = e.target as HTMLInputElement;
    if (control.type === 'range' && control.dataset.unit) {
      this.updateTimeUnit(control.dataset.unit as TimeUnit, Number(control.value), false);
    }
  };

  private onSelectChange = (e: Event): void => {
    const select = e.target as HTMLSelectElement;
    if (select.dataset.unit) {
      // Time dropdown changed, or slider released: commit (onSelect, change event).
      this.updateTimeUnit(select.dataset.unit as TimeUnit, Number(select.value), true);
      return;
    }
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
    // Keep focus in the input when clicking the popup with the mouse (form controls need default handling).
    if (!this.inline && !(e.target as HTMLElement).closest('select, input')) {
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
