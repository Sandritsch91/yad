/**
 * Date formatting / parsing compatible with jQuery UI's $.datepicker.formatDate / parseDate.
 *
 * Format tokens:
 *   d    day of month (no leading zero)      dd   day of month (two digit)
 *   o    day of the year (no leading zeros)  oo   day of the year (three digit)
 *   D    day name short                      DD   day name long
 *   m    month of year (no leading zero)     mm   month of year (two digit)
 *   M    month name short                    MM   month name long
 *   y    year (two digit)                    yy   year (four digit)
 *   @    Unix timestamp (ms since 01/01/1970)
 *   !    Windows ticks (100ns since 01/01/0001)
 *   '...' literal text                      ''   single quote
 */

export interface FormatSettings {
  dayNamesShort?: string[];
  dayNames?: string[];
  monthNamesShort?: string[];
  monthNames?: string[];
}

export interface ParseSettings extends FormatSettings {
  /** Number (absolute, e.g. 50) or string (relative to current year, e.g. "+10"). */
  shortYearCutoff?: number | string;
}

export const DEFAULT_NAMES = {
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
};

/** Ticks (100ns intervals) between 0001-01-01 and 1970-01-01. */
const TICKS_TO_1970 = (((1970 - 1) * 365 + Math.floor(1970 / 4) - Math.floor(1970 / 100) +
  Math.floor(1970 / 400)) * 24 * 60 * 60 * 10000000);

const MS_PER_DAY = 86400000;

/** Strip the time portion (local time). Returns a new Date. */
export function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function daysInMonth(year: number, month: number): number {
  return 32 - new Date(year, month, 32).getDate();
}

/** Create a date, correcting for DST quirks where midnight does not exist. */
export function daylightSavingAdjust(date: Date | null): Date | null {
  if (!date) {
    return null;
  }
  date.setHours(date.getHours() > 12 ? date.getHours() + 2 : 0);
  return date;
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.round((stripTime(date).getTime() - start.getTime()) / MS_PER_DAY) + 1;
}

/** ISO 8601 week number of the year for the given date. */
export function iso8601Week(date: Date): number {
  const checkDate = new Date(date.getTime());
  // Find Thursday of this week starting on Monday
  checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));
  const time = checkDate.getTime();
  checkDate.setMonth(0);
  checkDate.setDate(1);
  return Math.floor(Math.round((time - checkDate.getTime()) / MS_PER_DAY) / 7) + 1;
}

/**
 * Suitable as a `beforeShowDay` callback: disables Saturdays and Sundays.
 */
export function noWeekends(date: Date): [boolean, string] {
  const day = date.getDay();
  return [day > 0 && day < 6, ''];
}

export function formatDate(format: string, date: Date | null | undefined, settings?: FormatSettings): string {
  if (!date) {
    return '';
  }
  const dayNamesShort = settings?.dayNamesShort ?? DEFAULT_NAMES.dayNamesShort;
  const dayNames = settings?.dayNames ?? DEFAULT_NAMES.dayNames;
  const monthNamesShort = settings?.monthNamesShort ?? DEFAULT_NAMES.monthNamesShort;
  const monthNames = settings?.monthNames ?? DEFAULT_NAMES.monthNames;

  let iFormat = 0;
  let output = '';
  let literal = false;

  const lookAhead = (match: string): boolean => {
    const matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) === match;
    if (matches) {
      iFormat++;
    }
    return matches;
  };
  const formatNumber = (match: string, value: number, len: number): string => {
    let num = String(value);
    if (lookAhead(match)) {
      while (num.length < len) {
        num = '0' + num;
      }
    }
    return num;
  };
  const formatName = (match: string, value: number, shortNames: string[], longNames: string[]): string =>
    lookAhead(match) ? longNames[value] : shortNames[value];

  for (; iFormat < format.length; iFormat++) {
    const ch = format.charAt(iFormat);
    if (literal) {
      if (ch === "'" && !lookAhead("'")) {
        literal = false;
      } else {
        output += ch;
      }
      continue;
    }
    switch (ch) {
      case 'd':
        output += formatNumber('d', date.getDate(), 2);
        break;
      case 'D':
        output += formatName('D', date.getDay(), dayNamesShort, dayNames);
        break;
      case 'o':
        output += formatNumber('o', dayOfYear(date), 3);
        break;
      case 'm':
        output += formatNumber('m', date.getMonth() + 1, 2);
        break;
      case 'M':
        output += formatName('M', date.getMonth(), monthNamesShort, monthNames);
        break;
      case 'y':
        output += lookAhead('y')
          ? date.getFullYear()
          : (date.getFullYear() % 100 < 10 ? '0' : '') + (date.getFullYear() % 100);
        break;
      case '@':
        output += date.getTime();
        break;
      case '!':
        output += date.getTime() * 10000 + TICKS_TO_1970;
        break;
      case "'":
        if (lookAhead("'")) {
          output += "'";
        } else {
          literal = true;
        }
        break;
      default:
        output += ch;
    }
  }
  return output;
}

/**
 * Parse a string according to `format`. Returns null for empty input and throws on invalid input,
 * mirroring jQuery UI's behaviour.
 */
export function parseDate(format: string, value: string | null | undefined, settings?: ParseSettings): Date | null {
  if (format == null || value == null) {
    throw new Error('Invalid arguments');
  }
  value = String(value);
  if (value === '') {
    return null;
  }

  const cutoffSetting = settings?.shortYearCutoff ?? '+10';
  const shortYearCutoff = typeof cutoffSetting !== 'string'
    ? cutoffSetting
    : (new Date().getFullYear() % 100) + parseInt(cutoffSetting, 10);
  const dayNamesShort = settings?.dayNamesShort ?? DEFAULT_NAMES.dayNamesShort;
  const dayNames = settings?.dayNames ?? DEFAULT_NAMES.dayNames;
  const monthNamesShort = settings?.monthNamesShort ?? DEFAULT_NAMES.monthNamesShort;
  const monthNames = settings?.monthNames ?? DEFAULT_NAMES.monthNames;

  let year = -1;
  let month = -1;
  let day = -1;
  let doy = -1;
  let literal = false;
  let iValue = 0;
  let iFormat = 0;

  const lookAhead = (match: string): boolean => {
    const matches = iFormat + 1 < format.length && format.charAt(iFormat + 1) === match;
    if (matches) {
      iFormat++;
    }
    return matches;
  };
  const getNumber = (match: string): number => {
    const isDoubled = lookAhead(match);
    const size = match === '@' ? 14 : match === '!' ? 20
      : match === 'y' && isDoubled ? 4 : match === 'o' ? 3 : 2;
    const minSize = match === 'y' ? size : 1;
    const digits = new RegExp('^\\d{' + minSize + ',' + size + '}');
    const num = value!.substring(iValue).match(digits);
    if (!num) {
      throw new Error('Missing number at position ' + iValue);
    }
    iValue += num[0].length;
    return parseInt(num[0], 10);
  };
  const getName = (match: string, shortNames: string[], longNames: string[]): number => {
    const names = (lookAhead(match) ? longNames : shortNames)
      .map((name, index) => ({ index, name }))
      .sort((a, b) => b.name.length - a.name.length);
    for (const { index, name } of names) {
      if (value!.substring(iValue, iValue + name.length).toLowerCase() === name.toLowerCase()) {
        iValue += name.length;
        return index + 1;
      }
    }
    throw new Error('Unknown name at position ' + iValue);
  };
  const checkLiteral = (): void => {
    if (value!.charAt(iValue) !== format.charAt(iFormat)) {
      throw new Error('Unexpected literal at position ' + iValue);
    }
    iValue++;
  };

  for (; iFormat < format.length; iFormat++) {
    const ch = format.charAt(iFormat);
    if (literal) {
      if (ch === "'" && !lookAhead("'")) {
        literal = false;
      } else {
        checkLiteral();
      }
      continue;
    }
    switch (ch) {
      case 'd':
        day = getNumber('d');
        break;
      case 'D':
        getName('D', dayNamesShort, dayNames);
        break;
      case 'o':
        doy = getNumber('o');
        break;
      case 'm':
        month = getNumber('m');
        break;
      case 'M':
        month = getName('M', monthNamesShort, monthNames);
        break;
      case 'y':
        year = getNumber('y');
        break;
      case '@': {
        const date = new Date(getNumber('@'));
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
        break;
      }
      case '!': {
        const date = new Date((getNumber('!') - TICKS_TO_1970) / 10000);
        year = date.getFullYear();
        month = date.getMonth() + 1;
        day = date.getDate();
        break;
      }
      case "'":
        if (lookAhead("'")) {
          checkLiteral();
        } else {
          literal = true;
        }
        break;
      default:
        checkLiteral();
    }
  }

  if (iValue < value.length) {
    const extra = value.substring(iValue);
    if (!/^\s+/.test(extra)) {
      throw new Error('Extra/unparsed characters found in date: ' + extra);
    }
  }

  if (year === -1) {
    year = new Date().getFullYear();
  } else if (year < 100) {
    year += new Date().getFullYear() - (new Date().getFullYear() % 100) +
      (year <= shortYearCutoff ? 0 : -100);
  }

  if (doy > -1) {
    month = 1;
    day = doy;
    for (;;) {
      const dim = daysInMonth(year, month - 1);
      if (day <= dim) {
        break;
      }
      month++;
      day -= dim;
    }
  }

  const date = daylightSavingAdjust(new Date(year, month - 1, day))!;
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    throw new Error('Invalid date');
  }
  return date;
}

/**
 * Resolve a jQuery UI style date spec into a Date:
 *   - Date object
 *   - number: days from today
 *   - string: parsed with `format`, or relative offsets like "+1m -7d", "+2w", "-1y"
 *   - null/undefined/'': returns `defaultDate`
 */
export function determineDate(
  spec: Date | number | string | null | undefined,
  defaultDate: Date | null,
  format?: string,
  settings?: ParseSettings,
): Date | null {
  const offsetNumeric = (offset: number): Date => {
    const date = stripTime(new Date());
    date.setDate(date.getDate() + offset);
    return date;
  };
  const offsetString = (offset: string): Date => {
    if (format) {
      try {
        const parsed = parseDate(format, offset, settings);
        if (parsed) {
          return parsed;
        }
      } catch {
        // fall through to relative parsing
      }
    }
    const date = stripTime(new Date());
    let year = date.getFullYear();
    let month = date.getMonth();
    let day = date.getDate();
    const pattern = /([+-]?[0-9]+)\s*(d|D|w|W|m|M|y|Y)?/g;
    let matches = pattern.exec(offset.toLowerCase());
    while (matches) {
      const amount = parseInt(matches[1], 10);
      switch (matches[2] || 'd') {
        case 'd':
          day += amount;
          break;
        case 'w':
          day += amount * 7;
          break;
        case 'm':
          month += amount;
          day = Math.min(day, daysInMonth(year, month));
          break;
        case 'y':
          year += amount;
          day = Math.min(day, daysInMonth(year, month));
          break;
      }
      matches = pattern.exec(offset.toLowerCase());
    }
    return new Date(year, month, day);
  };

  let newDate: Date | null;
  if (spec == null || spec === '') {
    newDate = defaultDate;
  } else if (typeof spec === 'string') {
    newDate = offsetString(spec);
  } else if (typeof spec === 'number') {
    newDate = isNaN(spec) ? defaultDate : offsetNumeric(spec);
  } else {
    newDate = new Date(spec.getTime());
  }

  if (newDate && newDate.toString() === 'Invalid Date') {
    newDate = defaultDate;
  }
  if (newDate) {
    newDate = stripTime(newDate);
  }
  return daylightSavingAdjust(newDate);
}
