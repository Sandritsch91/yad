# Date ranges

A range uses two pickers: one for the start and one for the end. `Yad.range()` creates both and keeps them
consistent, so you don't have to wire up `onSelect`/`onClose` to set each other's `minDate` and `maxDate`.

```html
<input id="from"> – <input id="to">
```

```js
const { from, to } = Yad.range('#from', '#to', { minDate: 0, numberOfMonths: 2 });

from.getDate();   // start, or null
to.getDate();     // end, or null
```

## What it does

- **The end cannot be before the start.** In the end picker, days before the start are disabled, and the
  calendar opens at the start date if no end is chosen yet.
- **The start cannot be after the end.** In the start picker, days after the end are disabled.
- **The range is highlighted** in both calendars. The first and last day get the selected-day style, and the
  days in between get a lighter background.
- **The other picker is updated immediately**, whether the change comes from a click, typing in the input,
  dragging a time slider or `setDate()`.
- **A one-day range is allowed:** start and end may be the same day.

When the start and end are both already chosen, the user can move the start only up to the end, and the end
only down to the start. To move the whole range later, change the end first. jQuery UI's from/to example works
the same way.

## Options

`options` are passed to both pickers. Their `minDate`/`maxDate` (and `minDateTime`/`maxDateTime`) limit the
whole range. The other picker's value only narrows them further:

```js
// Book between tomorrow and 6 months ahead, weekdays only
Yad.range('#check-in', '#check-out', {
  minDate: 1,
  maxDate: '+6m',
  beforeShowDay: Yad.noWeekends,
});
```

To give one side different options, change that picker afterwards. Each side is a normal `Yad` instance:

```js
const { from, to } = Yad.range('#from', '#to', { dateFormat: 'yy-mm-dd' });
to.option('defaultDate', '+7d');
```

Callbacks such as `onSelect` are shared too. Use the `inst` argument to tell the two sides apart:

```js
const { from, to } = Yad.range('#from', '#to', {
  onSelect(text, inst) {
    console.log(inst === from ? 'start' : 'end', text);
  },
});
```

## With the time picker

With `showTime`, the range limits the time as well as the day. On the start day, the end picker's time sliders
start at the start time. On the end day, the start picker's sliders stop at the end time:

```js
Yad.range('#depart', '#return', { showTime: true, timeFormat: 'HH:mm', stepMinute: 15 });
```

If only one of the two pickers shows a time, only the days are limited.

## Inline calendars

`Yad.range()` also works with two `<div>`s:

```js
Yad.range('#from-calendar', '#to-calendar');
```

An inline calendar normally has today selected. In a range, the end calendar starts with nothing selected, so
the start can be chosen freely.

## Existing values

If the inputs already contain values, they are kept. If the end is before the start, the end is moved to the
start.

## Unlinking

`destroy()` on either picker removes the link; the other picker then works on its own. Calling `Yad.range()`
again with one of the same elements links it to its new partner and frees the old one.

## Styling

| Class | Day |
|---|---|
| `.yad-range-start` | First day of the range |
| `.yad-range-end` | Last day of the range |
| `.yad-in-range` | Days in between |

The days in between use `--yad-range-bg`. Its default is the accent colour at 16% opacity. See
[Theming](theming.md).

```css
.yad { --yad-range-bg: #dbeafe; }
```
