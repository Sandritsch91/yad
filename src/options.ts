import type { Yad } from './yad';
import { iso8601Week } from './date-utils';
import { en } from './i18n/en';

export type DateSpec = Date | number | string | null;

/** Return value of `beforeShowDay`: [selectable, cssClass?, tooltip?] */
export type BeforeShowDayResult = [boolean, string?, string?];

/** Locale texts for the time picker (the timepicker addon's regional settings). */
export interface TimeRegionalSettings {
  /** Header shown when `timeOnly` is set. */
  timeOnlyTitle: string;
  timeText: string;
  hourText: string;
  minuteText: string;
  secondText: string;
  millisecText: string;
  /** Label of the button that selects the current date and time (replaces `currentText` when time is shown). */
  nowText: string;
  /** Names accepted for AM; the first one is used when formatting. */
  amNames: string[];
  /** Names accepted for PM; the first one is used when formatting. */
  pmNames: string[];
  timeFormat: string;
}

/**
 * Texts and conventions that differ by locale (jQuery UI's "regional" settings). The time texts are
 * optional so locales written for date-only use keep working; missing ones fall back to English.
 */
export interface RegionalSettings extends Partial<TimeRegionalSettings> {
  closeText: string;
  prevText: string;
  nextText: string;
  currentText: string;
  monthNames: string[];
  monthNamesShort: string[];
  dayNames: string[];
  dayNamesShort: string[];
  dayNamesMin: string[];
  weekHeader: string;
  dateFormat: string;
  firstDay: number;
  isRTL: boolean;
  showMonthAfterYear: boolean;
  yearSuffix: string;
}

export type TimeControlType = 'slider' | 'select';

/** Colour mode: always light, always dark, or follow the operating system. */
export type YadTheme = 'light' | 'dark' | 'auto';

export interface YadOptions extends Required<RegionalSettings> {
  /** Selector or element of an input to also receive the selected date (in `altFormat`). */
  altField: string | HTMLInputElement | null;
  altFormat: string;
  /** Text displayed after each date field (e.g. a format hint). */
  appendText: string;
  /** Size the input to fit the longest date in `dateFormat`. */
  autoSize: boolean;
  /** Called before the picker opens; return an options object to update settings. */
  beforeShow: ((input: HTMLInputElement, inst: Yad) => Partial<YadOptions> | void) | null;
  /** Called for each day; return [selectable, cssClass, tooltip]. */
  beforeShowDay: ((date: Date) => BeforeShowDayResult) | null;
  buttonImage: string;
  buttonImageOnly: boolean;
  buttonText: string;
  calculateWeek: (date: Date) => number;
  changeMonth: boolean;
  changeYear: boolean;
  /** Only allow characters valid for `dateFormat` to be typed. */
  constrainInput: boolean;
  defaultDate: DateSpec;
  /** Animation duration in ms (0 disables animation). */
  duration: number;
  /** When true, the "Today" button selects the current selection instead of today. */
  gotoCurrent: boolean;
  hideIfNoPrevNext: boolean;
  maxDate: DateSpec;
  minDate: DateSpec;
  navigationAsDateFormat: boolean;
  numberOfMonths: number | [number, number];
  onChangeMonthYear: ((year: number, month: number, inst: Yad) => void) | null;
  onClose: ((dateText: string, inst: Yad) => void) | null;
  onSelect: ((dateText: string, inst: Yad) => void) | null;
  selectOtherMonths: boolean;
  shortYearCutoff: number | string;
  /** 'fade' | 'slide' | 'none' (CSS based). */
  showAnim: 'fade' | 'slide' | 'none' | '';
  showButtonPanel: boolean;
  showCurrentAtPos: number;
  /** 'focus' | 'button' | 'both' */
  showOn: 'focus' | 'button' | 'both';
  showOtherMonths: boolean;
  showWeek: boolean;
  stepMonths: number;
  /** Range of years in the year dropdown, e.g. "c-10:c+10", "-nn:+nn", "nnnn:nnnn". */
  yearRange: string;
  /** Colour mode: 'light' (default), 'dark', or 'auto' to follow the operating system setting. */
  theme: YadTheme;

  // --- Time picker (option names follow the jQuery UI Timepicker addon) ---------------------------

  /** Add time selection below the calendar (a date + time picker). */
  showTime: boolean;
  /** Show only the time controls, no calendar. */
  timeOnly: boolean;
  /** Text between the date and the time in the input. */
  separator: string;
  /** Use range sliders or dropdowns for the time units. */
  controlType: TimeControlType;
  /** Show the unit's control. `null` decides from `timeFormat` (e.g. seconds only when it contains `s`). */
  showHour: boolean | null;
  showMinute: boolean | null;
  showSecond: boolean | null;
  showMillisec: boolean | null;
  stepHour: number;
  stepMinute: number;
  stepSecond: number;
  stepMillisec: number;
  hourMin: number;
  hourMax: number;
  minuteMin: number;
  minuteMax: number;
  secondMin: number;
  secondMax: number;
  millisecMin: number;
  millisecMax: number;
  /** Initial time when no value is set. */
  hour: number;
  minute: number;
  second: number;
  millisec: number;
  /** Earliest selectable date and time. Also limits the selectable days like `minDate`. */
  minDateTime: Date | null;
  /** Latest selectable date and time. Also limits the selectable days like `maxDate`. */
  maxDateTime: Date | null;
  /** Format of the time written to `altField` (defaults to `timeFormat`). */
  altTimeFormat: string;
  /** Text between date and time in `altField` (defaults to `separator`). */
  altSeparator: string;
}

/** Default localisation (English, US). */
export const REGIONAL_EN: Required<RegionalSettings> = en;

export const BASE_DEFAULTS: Omit<YadOptions, keyof RegionalSettings> = {
  altField: null,
  altFormat: '',
  appendText: '',
  autoSize: false,
  beforeShow: null,
  beforeShowDay: null,
  buttonImage: '',
  buttonImageOnly: false,
  buttonText: '...',
  calculateWeek: iso8601Week,
  changeMonth: false,
  changeYear: false,
  constrainInput: true,
  defaultDate: null,
  duration: 200,
  gotoCurrent: false,
  hideIfNoPrevNext: false,
  maxDate: null,
  minDate: null,
  navigationAsDateFormat: false,
  numberOfMonths: 1,
  onChangeMonthYear: null,
  onClose: null,
  onSelect: null,
  selectOtherMonths: false,
  shortYearCutoff: '+10',
  showAnim: 'fade',
  showButtonPanel: false,
  showCurrentAtPos: 0,
  showOn: 'focus',
  showOtherMonths: false,
  showWeek: false,
  stepMonths: 1,
  yearRange: 'c-10:c+10',
  theme: 'light',
  showTime: false,
  timeOnly: false,
  separator: ' ',
  controlType: 'slider',
  showHour: null,
  showMinute: null,
  showSecond: null,
  showMillisec: null,
  stepHour: 1,
  stepMinute: 1,
  stepSecond: 1,
  stepMillisec: 1,
  hourMin: 0,
  hourMax: 23,
  minuteMin: 0,
  minuteMax: 59,
  secondMin: 0,
  secondMax: 59,
  millisecMin: 0,
  millisecMax: 999,
  hour: 0,
  minute: 0,
  second: 0,
  millisec: 0,
  minDateTime: null,
  maxDateTime: null,
  altTimeFormat: '',
  altSeparator: '',
};
