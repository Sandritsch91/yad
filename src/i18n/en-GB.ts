import type { RegionalSettings } from '../options';
import { en } from './en';

/** English (UK): day-first dates, weeks start on Monday, 24-hour time. */
export const enGB: Required<RegionalSettings> = {
  ...en,
  dateFormat: 'dd/mm/yy',
  firstDay: 1,
  timeFormat: 'HH:mm',
};
