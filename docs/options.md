# Options

Options are passed to the constructor, changed later with [`option()`](methods.md#option), or set for all new
pickers with [`Yad.setDefaults()`](methods.md#yadsetdefaultsoptions).

```js
const dp = new Yad('#date', { dateFormat: 'yy-mm-dd', minDate: 0 });
dp.option('maxDate', '+1m');
dp.option({ numberOfMonths: 2, showWeek: true });
```

Option names and behaviour match jQuery UI's datepicker (and the Timepicker addon for time options), so
existing jQuery UI configurations can usually be reused as they are.

Several options take a **date spec** (`DateSpec`). Wherever you see that type, you can pass:

| Value | Meaning |
|---|---|
| `Date` | That date (the time part is ignored, except by the [time picker](time-picker.md)) |
| `number` | Days from today: `0` today, `7` in a week, `-1` yesterday |
| `string` in `dateFormat` | e.g. `'2026-12-24'` with `dateFormat: 'yy-mm-dd'` |
| relative `string` | Offsets from today with units `d` (days), `w` (weeks), `m` (months), `y` (years), combinable: `'+1m'`, `'-2w'`, `'+1y -1d'`. A number without unit means days. |
| `null` | Not set |

**Contents:** [Date format and value](#date-format-and-value) ·
[Selectable range](#selectable-range) · [Calendar layout](#calendar-layout) ·
[Navigation](#navigation) · [Button panel](#button-panel) · [Input and trigger](#input-and-trigger) ·
[Alternative field](#alternative-field) · [Animation](#animation) · [Callbacks](#callbacks) ·
[Locale texts](#locale-texts) · [Time picker](#time-picker)

## Date format and value

| Option | Type | Default | Description |
|---|---|---|---|
| `dateFormat` | `string` | `'mm/dd/yy'` | Format of the date in the input. See [Date formats](formats.md#date-format-tokens). Changing it reformats the current value. |
| `defaultDate` | `DateSpec` | `null` (today) | Date highlighted when the picker opens with an empty input, and the initial selection of an inline calendar. |
| `shortYearCutoff` | `number \| string` | `'+10'` | Cut-off for two-digit years (`y` in `dateFormat`). A number is absolute (`50`: 00–50 → 20xx, 51–99 → 19xx). A string like `'+10'` is relative to the current year. |
| `constrainInput` | `boolean` | `true` | Block typing characters that can never occur in `dateFormat` (and the time format, when the time picker is on). |

## Selectable range

| Option | Type | Default | Description |
|---|---|---|---|
| `minDate` | `DateSpec` | `null` | Earliest selectable date. Earlier days are shown but disabled, and navigation stops at its month. |
| `maxDate` | `DateSpec` | `null` | Latest selectable date. If it is before `minDate`, `minDate` is used. |
| `beforeShowDay` | `(date: Date) => [boolean, string?, string?]` | `null` | Called for every displayed day. Return `[selectable, cssClass, tooltip]`. Use [`Yad.noWeekends`](methods.md#yadnoweekendsdate) to disable Saturdays and Sundays. |

```js
// Only weekdays, today until 3 months ahead, holidays marked
const holidays = ['2026-12-24', '2026-12-25', '2026-12-31'];
new Yad('#date', {
  minDate: 0,
  maxDate: '+3m',
  beforeShowDay(date) {
    const iso = Yad.formatDate('yy-mm-dd', date);
    if (holidays.includes(iso)) return [false, 'holiday', 'Public holiday'];
    return Yad.noWeekends(date);
  },
});
```

`setDate()` and typed input are clamped into the range: a date before `minDate` becomes `minDate`.
For a range that includes a time of day, use [`minDateTime` / `maxDateTime`](time-picker.md#limiting-the-time).

## Calendar layout

| Option | Type | Default | Description |
|---|---|---|---|
| `numberOfMonths` | `number \| [rows, cols]` | `1` | How many months to show. `3` shows three side by side, `[2, 3]` two rows of three. |
| `showCurrentAtPos` | `number` | `0` | With several months, the position (0-based) at which the current month is shown. `1` shows the previous month first. |
| `firstDay` | `number` | `0` | First day of the week: `0` Sunday, `1` Monday, ... |
| `showWeek` | `boolean` | `false` | Show a week-number column. |
| `calculateWeek` | `(date: Date) => number` | `Yad.iso8601Week` | Computes the week number. Receives the first day shown in each row. |
| `showOtherMonths` | `boolean` | `false` | Show the days of the previous and next month that fill the first and last week. |
| `selectOtherMonths` | `boolean` | `false` | Make those days selectable (requires `showOtherMonths`). |
| `isRTL` | `boolean` | `false` | Right-to-left layout. Also swaps the meaning of the left and right arrow keys. |
| `showMonthAfterYear` | `boolean` | `false` | Show "2026 November" instead of "November 2026". |
| `yearSuffix` | `string` | `''` | Text after the year in the header (e.g. `'年'`). |

## Navigation

| Option | Type | Default | Description |
|---|---|---|---|
| `changeMonth` | `boolean` | `false` | Show a month dropdown in the header. Months outside `minDate`/`maxDate` are omitted. With several months, only the first gets dropdowns. |
| `changeYear` | `boolean` | `false` | Show a year dropdown in the header. |
| `yearRange` | `string` | `'c-10:c+10'` | Years in the year dropdown, as `from:to`. Each part is relative to the displayed year (`c-10`, `c+5`), relative to the current year (`-10`, `+5`) or absolute (`2020`). Mixing works: `'1950:c+0'`. Clipped to `minDate`/`maxDate`. |
| `stepMonths` | `number` | `1` | Months moved by the previous/next buttons and PageUp/PageDown. |
| `hideIfNoPrevNext` | `boolean` | `false` | Hide the previous/next buttons (instead of disabling them) when navigation is not possible. |
| `navigationAsDateFormat` | `boolean` | `false` | Treat `prevText`, `nextText` and `currentText` as [date formats](formats.md#date-format-tokens) of the target month, e.g. `prevText: '< M'` shows "< Oct". |

## Button panel

| Option | Type | Default | Description |
|---|---|---|---|
| `showButtonPanel` | `boolean` | `false` | Show a panel with a **Today** button (`currentText`) and, for popups, a **Done** button (`closeText`). Always shown when the time picker is on, with **Now** (`nowText`) instead of Today. |
| `gotoCurrent` | `boolean` | `false` | Make the Today button go to the selected date instead of today. |

The Today button only navigates to today's month, as in jQuery UI. It does not select a date. (The time
picker's **Now** button does select the current date and time.)

## Input and trigger

These options only apply to popups (pickers attached to an `<input>`).

| Option | Type | Default | Description |
|---|---|---|---|
| `showOn` | `'focus' \| 'button' \| 'both'` | `'focus'` | When the popup opens: when the input gets focus, when the trigger button is clicked, or both. `'button'` and `'both'` add a trigger button after the input. |
| `buttonText` | `string` | `'...'` | Text (and accessible label) of the trigger button. |
| `buttonImage` | `string` | `''` | Image URL shown inside the trigger button. |
| `buttonImageOnly` | `boolean` | `false` | Use the image itself as the trigger, without a button around it. |
| `appendText` | `string` | `''` | Text shown after the input, e.g. a format hint `'(yyyy-mm-dd)'`. Rendered as `<span class="yad-append">`. |
| `autoSize` | `boolean` | `false` | Set the input's `size` to fit the longest possible value in `dateFormat` (and the time format). |
| `beforeShow` | `(input, inst) => Partial<YadOptions> \| void` | `null` | Called right before the popup opens. Returned options are applied (permanently) before rendering. |

```js
new Yad('#date', { showOn: 'both', buttonText: 'Choose date', appendText: '(dd.mm.yyyy)' });
```

The input gets `autocomplete="off"`, `aria-haspopup="dialog"`, `aria-expanded` and `aria-controls`. `destroy()`
restores the previous `autocomplete` value.

## Alternative field

| Option | Type | Default | Description |
|---|---|---|---|
| `altField` | `string \| HTMLInputElement \| null` | `null` | Selector or element of another input that receives the selected date in `altFormat`. Typical use: show a friendly format to the user and submit a machine-readable one. |
| `altFormat` | `string` | `''` | Format for `altField`. Empty means `dateFormat`. |
| `altTimeFormat` | `string` | `''` | Time format for `altField` when the time picker is on. Empty means `timeFormat`. |
| `altSeparator` | `string` | `''` | Text between date and time in `altField`. Empty means `separator`. |

```html
<input id="date">
<input type="hidden" name="date" id="date-iso">
<script type="module">
  new Yad('#date', { dateFormat: 'DD, d MM yy', altField: '#date-iso', altFormat: 'yy-mm-dd' });
</script>
```

## Animation

| Option | Type | Default | Description |
|---|---|---|---|
| `showAnim` | `'fade' \| 'slide' \| 'none' \| ''` | `'fade'` | How the popup appears. `'none'` or `''` disables the animation. Users with *reduced motion* enabled never see it. |
| `duration` | `number` | `200` | Animation length in milliseconds. `0` disables the animation. |

## Callbacks

| Option | Signature | Description |
|---|---|---|
| `onSelect` | `(dateText: string, inst: Yad) => void` | The user selected a date (or time). |
| `onClose` | `(dateText: string, inst: Yad) => void` | The popup closed. |
| `onChangeMonthYear` | `(year: number, month: number, inst: Yad) => void` | The displayed month changed. `month` is 1–12. |
| `beforeShow` | `(input, inst) => Partial<YadOptions> \| void` | See [Input and trigger](#input-and-trigger). |
| `beforeShowDay` | `(date) => [boolean, string?, string?]` | See [Selectable range](#selectable-range). |

Details and the DOM events yad fires: [Events and callbacks](events.md).

## Locale texts

These options are part of each [locale](localization.md) in `Yad.regional`. You can also set them one by one.
Defaults shown are English (US).

| Option | Type | Default | Description |
|---|---|---|---|
| `closeText` | `string` | `'Done'` | Close button in the button panel. |
| `prevText` | `string` | `'Prev'` | Label of the previous-month button (shown as tooltip and to screen readers). |
| `nextText` | `string` | `'Next'` | Label of the next-month button. |
| `currentText` | `string` | `'Today'` | Today button. |
| `monthNames` | `string[12]` | `['January', ...]` | Full month names (header, `MM` format token). |
| `monthNamesShort` | `string[12]` | `['Jan', ...]` | Short month names (month dropdown, `M` token). |
| `dayNames` | `string[7]` | `['Sunday', ...]` | Full day names, starting with Sunday (`DD` token, tooltips). |
| `dayNamesShort` | `string[7]` | `['Sun', ...]` | Short day names (`D` token). |
| `dayNamesMin` | `string[7]` | `['Su', ...]` | Column headers of the calendar. |
| `weekHeader` | `string` | `'Wk'` | Header of the week-number column. |
| `dateFormat` | `string` | `'mm/dd/yy'` | See [above](#date-format-and-value). |
| `firstDay` | `number` | `0` | See [Calendar layout](#calendar-layout). |
| `isRTL` | `boolean` | `false` | See [Calendar layout](#calendar-layout). |
| `showMonthAfterYear` | `boolean` | `false` | See [Calendar layout](#calendar-layout). |
| `yearSuffix` | `string` | `''` | See [Calendar layout](#calendar-layout). |

Time picker texts (`timeText`, `hourText`, `nowText`, `amNames`, ...) are listed in [Time picker](#time-picker).

## Time picker

All time options are described in detail, with examples, in [Time picker](time-picker.md).

| Option | Type | Default | Description |
|---|---|---|---|
| `showTime` | `boolean` | `false` | Add time controls below the calendar. |
| `timeOnly` | `boolean` | `false` | Show only time controls, no calendar. |
| `timeFormat` | `string` | `'hh:mm TT'` (en), `'HH:mm'` (en-GB, de, fr) | [Time format](formats.md#time-format-tokens). Also decides which units get a control. |
| `separator` | `string` | `' '` | Text between date and time in the input. |
| `controlType` | `'slider' \| 'select'` | `'slider'` | Range sliders or dropdowns. |
| `showHour` / `showMinute` / `showSecond` / `showMillisec` | `boolean \| null` | `null` | Force a unit's control on or off. `null` decides from `timeFormat`. |
| `stepHour` / `stepMinute` / `stepSecond` / `stepMillisec` | `number` | `1` | Step of each unit. Values snap to it. |
| `hourMin` / `hourMax` | `number` | `0` / `23` | Allowed hours on every day. |
| `minuteMin` / `minuteMax` | `number` | `0` / `59` | Allowed minutes. |
| `secondMin` / `secondMax` | `number` | `0` / `59` | Allowed seconds. |
| `millisecMin` / `millisecMax` | `number` | `0` / `999` | Allowed milliseconds. |
| `hour` / `minute` / `second` / `millisec` | `number` | `0` | Initial time when the value is empty. |
| `minDateTime` | `Date \| null` | `null` | Earliest selectable date **and time**. |
| `maxDateTime` | `Date \| null` | `null` | Latest selectable date **and time**. |
| `timeOnlyTitle` | `string` | `'Choose Time'` | Header of a time-only picker. |
| `timeText` | `string` | `'Time'` | Label of the time readout. |
| `hourText` / `minuteText` / `secondText` / `millisecText` | `string` | `'Hour'`, `'Minute'`, `'Second'`, `'Millisecond'` | Labels of the controls. |
| `nowText` | `string` | `'Now'` | Button that selects the current date and time. |
| `amNames` | `string[]` | `['AM', 'A']` | Accepted AM markers. The first is used for output. |
| `pmNames` | `string[]` | `['PM', 'P']` | Accepted PM markers. The first is used for output. |

Time options that only matter for the alternative field (`altTimeFormat`, `altSeparator`) are listed under
[Alternative field](#alternative-field).
