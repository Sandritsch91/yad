import type { RegionalSettings } from '../options';

/** English (US). This is the default localisation. */
export const en: Required<RegionalSettings> = {
  closeText: 'Done',
  prevText: 'Prev',
  nextText: 'Next',
  currentText: 'Today',
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'],
  monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
  weekHeader: 'Wk',
  dateFormat: 'mm/dd/yy',
  firstDay: 0,
  isRTL: false,
  showMonthAfterYear: false,
  yearSuffix: '',
  timeOnlyTitle: 'Choose Time',
  timeText: 'Time',
  hourText: 'Hour',
  minuteText: 'Minute',
  secondText: 'Second',
  millisecText: 'Millisecond',
  nowText: 'Now',
  amNames: ['AM', 'A'],
  pmNames: ['PM', 'P'],
  timeFormat: 'hh:mm TT',
};

/** English (UK): day-first dates, weeks start on Monday. */
export const enGB: Required<RegionalSettings> = {
  ...en,
  dateFormat: 'dd/mm/yy',
  firstDay: 1,
  timeFormat: 'HH:mm',
};
