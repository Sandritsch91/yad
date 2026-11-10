import type { Yad } from './yad';
import { iso8601Week } from './date-utils';
import { en } from './i18n/en';

export type DateSpec = Date | number | string | null;

/** Return value of `beforeShowDay`: [selectable, cssClass?, tooltip?] */
export type BeforeShowDayResult = [boolean, string?, string?];

/** Texts and conventions that differ by locale (jQuery UI's "regional" settings). */
export interface RegionalSettings {
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

export interface YadOptions extends RegionalSettings {
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
}

/** Default localisation (English, US). */
export const REGIONAL_EN: RegionalSettings = en;

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
};
