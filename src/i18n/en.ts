import type { RegionalSettings } from '../options';

/** English (US). This is the default localisation. */
export const en: RegionalSettings = {
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
};

/** English (UK): day-first dates, weeks start on Monday. */
export const enGB: RegionalSettings = {
  ...en,
  dateFormat: 'dd/mm/yy',
  firstDay: 1,
};
