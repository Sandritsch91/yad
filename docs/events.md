# Events and callbacks

yad reports changes in two ways: **callbacks** passed as options (the jQuery UI way), and standard **DOM
events** on the input (for frameworks, form libraries and `addEventListener`).

## Callbacks

### `onSelect(dateText, inst)`

Called when the **user** selects a value:

- clicking a day, or pressing Enter/Space on a focused day
- pressing Enter in the input
- clearing with Ctrl+End (`dateText` is `''`)
- with the time picker: releasing a slider, changing a time dropdown, clicking **Now**

`dateText` is the formatted value as written to the input (date, time or both). `inst` is the picker:
use `inst.getDate()` for a `Date`.

`setDate()` and `option()` do **not** call `onSelect`.

```js
new Yad('#date', {
  onSelect(dateText, inst) {
    console.log(`Picked ${dateText}`, inst.getDate());
  },
});
```

### `onClose(dateText, inst)`

Called when a popup closes, for any reason (selection, Done, Escape, Tab, clicking outside, `hide()`).
`dateText` is the input's current value.

```js
// A date range: the end date cannot be before the start date
const start = new Yad('#start', {
  onClose(text) { end.option('minDate', text || null); },
});
const end = new Yad('#end', {
  onClose(text) { start.option('maxDate', text || null); },
});
```

### `onChangeMonthYear(year, month, inst)`

Called when the displayed month changes through navigation (buttons, dropdowns, keyboard, Today button).
`month` is **1–12**. With several months it refers to the month at `showCurrentAtPos`.

Useful to load data for the visible month:

```js
new Yad('#cal', {
  onChangeMonthYear(year, month, inst) {
    loadBookings(year, month).then(() => inst.refresh());
  },
});
```

### `beforeShow(input, inst)`

Called before a popup opens. Return an options object to change settings (they stay changed), or nothing.

```js
new Yad('#date', {
  beforeShow(input) {
    return { minDate: input.dataset.min || null };
  },
});
```

### `beforeShowDay(date)`

Called for each displayed day while rendering. Return `[selectable, cssClass, tooltip]`:

| Index | Type | Description |
|---|---|---|
| 0 | `boolean` | Whether the day can be selected. |
| 1 | `string` (optional) | Extra CSS classes for the day's `<td>`. |
| 2 | `string` (optional) | Tooltip (`title`) for the day. |

```js
const booked = new Set(['2026-12-01', '2026-12-02']);
new Yad('#date', {
  beforeShowDay(date) {
    const key = Yad.formatDate('yy-mm-dd', date);
    return booked.has(key) ? [false, 'is-booked', 'Already booked'] : [true, ''];
  },
});
```

```css
.yad .is-booked .yad-day-btn { background: #fde2e2; }
```

Keep it fast: it runs for up to 42 days per displayed month on every render. Call `refresh()` when its data
changes.

## DOM events

Popups dispatch standard, bubbling events on their `<input>` when the **user** changes the value:

| Event | When |
|---|---|
| `input` | The value changed, including continuously while a time slider is dragged. |
| `change` | The value was committed: a day selected, a time slider released, a time dropdown changed, Now clicked, cleared with Ctrl+End. Fired only if the text actually changed. |

This makes yad work with frameworks and form libraries that listen to these events (Vue `v-model`,
React `onChange` via a ref, Alpine, htmx, form validation, ...).

```js
document.querySelector('#date').addEventListener('change', (e) => {
  console.log('new value', e.target.value);
});
```

Programmatic changes with `setDate()` and `option()` do not fire DOM events, just like setting
`input.value` in JavaScript does not.

> **Difference from jQuery UI:** jQuery UI only triggers `change` when no `onSelect` callback is set.
> yad always fires `input` and `change`, and also calls `onSelect`.

## Order of events for one selection

1. The input's `value` and the `altField` are updated.
2. `onSelect(dateText, inst)` is called.
3. `input` and `change` are dispatched on the input.
4. For a date-only popup, the popup closes and `onClose` is called.
