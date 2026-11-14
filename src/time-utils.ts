/**
 * Time formatting / parsing compatible with the jQuery UI Timepicker addon (Trent Richardson).
 *
 * Format tokens:
 *   H    hour, 24h, no leading zero       HH   hour, 24h, two digit
 *   h    hour, 12h, no leading zero       hh   hour, 12h, two digit
 *   m    minute, no leading zero          mm   minute, two digit
 *   s    second, no leading zero          ss   second, two digit
 *   l    milliseconds, three digit
 *   t    a / p (first char of am/pm name, lower case)   T   A / P
 *   tt   am / pm (lower case)                            TT  AM / PM
 *   '...' literal text                                   ''  single quote
 */

export interface TimeParts {
  hour: number;
  minute: number;
  second: number;
  millisec: number;
}

export interface TimeSettings {
  amNames?: string[];
  pmNames?: string[];
}

const DEFAULT_AM = ['AM', 'A'];
const DEFAULT_PM = ['PM', 'P'];

type Token =
  | { kind: 'H' | 'HH' | 'h' | 'hh' | 'm' | 'mm' | 's' | 'ss' | 'l' | 't' | 'T' | 'tt' | 'TT' }
  | { kind: 'literal'; text: string };

const TOKENS = ['HH', 'hh', 'mm', 'ss', 'TT', 'tt', 'H', 'h', 'm', 's', 'l', 'T', 't'] as const;

function tokenize(format: string): Token[] {
  const tokens: Token[] = [];
  let literal = '';
  const flush = (): void => {
    if (literal) {
      tokens.push({ kind: 'literal', text: literal });
      literal = '';
    }
  };
  for (let i = 0; i < format.length;) {
    if (format[i] === "'") {
      if (format[i + 1] === "'") {
        literal += "'";
        i += 2;
        continue;
      }
      const end = format.indexOf("'", i + 1);
      literal += format.slice(i + 1, end === -1 ? format.length : end);
      i = end === -1 ? format.length : end + 1;
      continue;
    }
    const token = TOKENS.find((t) => format.startsWith(t, i));
    if (token) {
      flush();
      tokens.push({ kind: token });
      i += token.length;
    } else {
      literal += format[i];
      i++;
    }
  }
  flush();
  return tokens;
}

function pad(value: number, length: number): string {
  return String(value).padStart(length, '0');
}

/** Which units a format displays. */
export function timeFormatUnits(format: string): { hour: boolean; minute: boolean; second: boolean; millisec: boolean; ampm: boolean } {
  const kinds = tokenize(format).map((t) => t.kind);
  const has = (...k: string[]): boolean => kinds.some((kind) => k.includes(kind));
  return {
    hour: has('H', 'HH', 'h', 'hh'),
    minute: has('m', 'mm'),
    second: has('s', 'ss'),
    millisec: has('l'),
    ampm: has('t', 'T', 'tt', 'TT'),
  };
}

export function formatTime(format: string, time: Partial<TimeParts> | null | undefined, settings?: TimeSettings): string {
  if (!time) {
    return '';
  }
  const hour = time.hour ?? 0;
  const minute = time.minute ?? 0;
  const second = time.second ?? 0;
  const millisec = time.millisec ?? 0;
  const ampm = hour < 12 ? (settings?.amNames ?? DEFAULT_AM)[0] : (settings?.pmNames ?? DEFAULT_PM)[0];
  const hour12 = hour % 12 || 12;

  return tokenize(format).map((token) => {
    switch (token.kind) {
      case 'H': return String(hour);
      case 'HH': return pad(hour, 2);
      case 'h': return String(hour12);
      case 'hh': return pad(hour12, 2);
      case 'm': return String(minute);
      case 'mm': return pad(minute, 2);
      case 's': return String(second);
      case 'ss': return pad(second, 2);
      case 'l': return pad(millisec, 3);
      case 't': return ampm.charAt(0).toLowerCase();
      case 'T': return ampm.charAt(0).toUpperCase();
      case 'tt': return ampm.toLowerCase();
      case 'TT': return ampm.toUpperCase();
      default: return token.text;
    }
  }).join('');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse a time string. Returns null if it does not match `format` (unlike parseDate, which throws),
 * mirroring the timepicker addon's `$.datepicker.parseTime`.
 */
export function parseTime(format: string, value: string | null | undefined, settings?: TimeSettings): TimeParts | null {
  if (value == null) {
    return null;
  }
  const amNames = settings?.amNames ?? DEFAULT_AM;
  const pmNames = settings?.pmNames ?? DEFAULT_PM;
  const markers = [...amNames, ...pmNames]
    .flatMap((name) => [name, name.charAt(0)])
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp);

  const tokens = tokenize(format);
  const groups: Token['kind'][] = [];
  let pattern = '^\\s*';
  for (const token of tokens) {
    if (token.kind === 'literal') {
      pattern += escapeRegExp(token.text);
      continue;
    }
    groups.push(token.kind);
    switch (token.kind) {
      case 'HH': case 'hh': case 'mm': case 'ss':
        pattern += '(\\d{1,2})';
        break;
      case 'H': case 'h': case 'm': case 's':
        pattern += '(\\d{1,2})';
        break;
      case 'l':
        pattern += '(\\d{1,3})';
        break;
      default:
        pattern += `(${markers.join('|')})`;
    }
  }
  pattern += '\\s*$';

  const match = new RegExp(pattern, 'i').exec(String(value));
  if (!match) {
    return null;
  }

  const time: TimeParts = { hour: 0, minute: 0, second: 0, millisec: 0 };
  let twelveHour = false;
  let pm: boolean | null = null;
  groups.forEach((kind, i) => {
    const raw = match[i + 1];
    switch (kind) {
      case 'H': case 'HH':
        time.hour = Number(raw);
        break;
      case 'h': case 'hh':
        time.hour = Number(raw);
        twelveHour = true;
        break;
      case 'm': case 'mm':
        time.minute = Number(raw);
        break;
      case 's': case 'ss':
        time.second = Number(raw);
        break;
      case 'l':
        time.millisec = Number(raw);
        break;
      default: {
        const lower = raw.toLowerCase();
        const isName = (names: string[]): boolean =>
          names.some((name) => name.toLowerCase() === lower || name.charAt(0).toLowerCase() === lower);
        pm = isName(pmNames) && !isName(amNames) ? true : isName(amNames) ? false : null;
      }
    }
  });

  if (twelveHour) {
    if (time.hour < 1 || time.hour > 12) {
      return null;
    }
    if (pm !== null) {
      time.hour = (time.hour % 12) + (pm ? 12 : 0);
    }
  } else if (pm === true && time.hour < 12) {
    time.hour += 12;
  }

  if (time.hour > 23 || time.minute > 59 || time.second > 59 || time.millisec > 999) {
    return null;
  }
  return time;
}

export function timeOf(date: Date): TimeParts {
  return {
    hour: date.getHours(),
    minute: date.getMinutes(),
    second: date.getSeconds(),
    millisec: date.getMilliseconds(),
  };
}

export function withTime(date: Date, time: TimeParts): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.hour, time.minute, time.second,
    time.millisec);
}

export function compareTime(a: TimeParts, b: TimeParts): number {
  return (a.hour - b.hour) || (a.minute - b.minute) || (a.second - b.second) || (a.millisec - b.millisec);
}
