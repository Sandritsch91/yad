# Migrating from jQuery UI

yad keeps jQuery UI's option names, defaults, format tokens and locale structure. Most migrations only
change how pickers are created and how methods are called.

## Calls

| jQuery UI | yad |
|---|---|
| `$('#d').datepicker(opts)` | `new Yad('#d', opts)` |
| `$('.d').datepicker(opts)` | `Yad.attach('.d', opts)` |
| `$('#d').datepicker('option', 'minDate')` | `dp.option('minDate')` |
| `$('#d').datepicker('option', 'minDate', 0)` | `dp.option('minDate', 0)` |
| `$('#d').datepicker('option', { … })` | `dp.option({ … })` |
| `$('#d').datepicker('getDate')` | `dp.getDate()` |
| `$('#d').datepicker('setDate', '+1w')` | `dp.setDate('+1w')` |
| `$('#d').datepicker('show')` / `'hide'` | `dp.show()` / `dp.hide()` |
| `$('#d').datepicker('refresh')` | `dp.refresh()` |
| `$('#d').datepicker('enable')` / `'disable'` | `dp.enable()` / `dp.disable()` |
| `$('#d').datepicker('isDisabled')` | `dp.isDisabled()` |
| `$('#d').datepicker('widget')` | `dp.widget()` (an element, not a jQuery object) |
| `$('#d').datepicker('destroy')` | `dp.destroy()` |
| `$.datepicker.setDefaults(opts)` | `Yad.setDefaults(opts)` |
| `$.datepicker.regional['de']` | `Yad.regional.de` |
| `$.datepicker.formatDate(f, d, s)` | `Yad.formatDate(f, d, s)` |
| `$.datepicker.parseDate(f, t, s)` | `Yad.parseDate(f, t, s)` |
| `$.datepicker.iso8601Week(d)` | `Yad.iso8601Week(d)` |
| `$.datepicker.noWeekends` | `Yad.noWeekends` |

Where jQuery UI looks the instance up from the element each time, keep the `Yad` object, or get it back with
`Yad.getInstance('#d')`.

### Timepicker addon

| Timepicker addon | yad |
|---|---|
| `$('#d').datetimepicker(opts)` | `Yad.datetimepicker('#d', opts)` |
| `$('#d').timepicker(opts)` | `Yad.timepicker('#d', opts)` |
| `$.datepicker.formatTime(f, t, s)` | `Yad.formatTime(f, t, s)` |
| `$.datepicker.parseTime(f, t, s)` | `Yad.parseTime(f, t, s)` |
| `$.timepicker.regional['de']` | Part of `Yad.regional.de` |

See [Time picker](time-picker.md#differences-from-the-timepicker-addon) for the options that are not
implemented.

## Example

Before:

```js
$.datepicker.setDefaults($.datepicker.regional['de']);

$('#from').datepicker({
  minDate: 0,
  numberOfMonths: 2,
  onClose(selected) {
    $('#to').datepicker('option', 'minDate', selected);
  },
});
$('#to').datepicker({ numberOfMonths: 2 });
```

After:

```js
import { Yad } from '@sandritsch91/yad';
import '@sandritsch91/yad/yad.css';

Yad.setDefaults(Yad.regional.de);

const to = new Yad('#to', { numberOfMonths: 2 });
new Yad('#from', {
  minDate: 0,
  numberOfMonths: 2,
  onClose(selected) {
    to.option('minDate', selected);
  },
});
```

## Callbacks

Callbacks get the same arguments, except that `inst` is the `Yad` instance (jQuery UI passes an internal
state object) and `this` is not bound to the input. Use the `inst` argument or a closure instead of `this`.

```js
// jQuery UI
onSelect(dateText) { $(this).trigger('blur'); }

// yad
onSelect(dateText, inst) { inst.input.blur(); }
```

## Differences

| Topic | jQuery UI | yad |
|---|---|---|
| `change` event | Only triggered when `onSelect` is not set | `input` and `change` always fire on user selection, in addition to `onSelect` ([Events](events.md#dom-events)) |
| Keyboard | Ctrl shortcuts in the input | The same, plus arrow-key navigation inside the calendar grid ([Keyboard](keyboard-and-accessibility.md)) |
| Markup | `<a>` elements in a table | `<button>` elements in an ARIA grid |
| Styling | jQuery UI ThemeRoller (`ui-datepicker-*` classes) | CSS custom properties and `yad-*` classes ([Theming](theming.md)) |
| Dark mode | Separate theme | Automatic |
| Modals | Popup appended to `<body>` | Mounted inside the enclosing modal or `<dialog>` |
| `showAnim` | Any jQuery UI effect | `'fade'`, `'slide'` or `'none'` |
| `showOptions` | Effect options | Not supported |
| `dialog` method | Opens a picker in a dialog | Not supported |
| Time picker | Separate addon | Built in |

## Styling

jQuery UI ThemeRoller themes do not apply. Map your theme colours to [CSS custom properties](theming.md):

| ThemeRoller | yad |
|---|---|
| `.ui-state-active` background | `--yad-accent` |
| `.ui-state-highlight` (today) | `--yad-today-ring` |
| `.ui-state-hover` background | `--yad-hover-bg` |
| `.ui-widget-content` background / colour | `--yad-bg` / `--yad-fg` |
| `.ui-widget-content` border | `--yad-border` |
| `.ui-corner-all` radius | `--yad-radius` |

Custom classes from `beforeShowDay` keep working; they are added to the day's `<td class="yad-day">`.
