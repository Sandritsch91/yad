# Keyboard and accessibility

yad can be used completely with the keyboard and with screen readers.

## Keyboard

### In the input (popup open)

These are jQuery UI's shortcuts, so users of jQuery UI pickers will feel at home.

| Key | Action |
|---|---|
| <kbd>↓</kbd> | Move focus into the calendar grid |
| <kbd>Enter</kbd> | Select the highlighted day and close |
| <kbd>Esc</kbd> | Close |
| <kbd>Tab</kbd> | Close and move to the next field |
| <kbd>PageUp</kbd> / <kbd>PageDown</kbd> | Previous / next month (`stepMonths`) |
| <kbd>Ctrl</kbd>+<kbd>PageUp</kbd> / <kbd>PageDown</kbd> (or <kbd>Shift</kbd>) | Previous / next year |
| <kbd>Ctrl</kbd>+<kbd>Home</kbd> | Go to today's month |
| <kbd>Ctrl</kbd>+<kbd>End</kbd> | Clear the value and close |
| <kbd>Ctrl</kbd>+<kbd>←</kbd> / <kbd>→</kbd> | Highlight the previous / next day |
| <kbd>Ctrl</kbd>+<kbd>↑</kbd> / <kbd>↓</kbd> | Highlight the same day of the previous / next week |

On macOS <kbd>⌘</kbd> works instead of <kbd>Ctrl</kbd>.

### In the input (popup closed)

| Key | Action |
|---|---|
| <kbd>Alt</kbd>+<kbd>↓</kbd> or <kbd>Ctrl</kbd>+<kbd>↓</kbd> | Open the popup |
| <kbd>Ctrl</kbd>+<kbd>Home</kbd> | Open the popup |

The popup also opens when the input gets focus (`showOn: 'focus'`, the default).

### In the calendar grid

| Key | Action |
|---|---|
| <kbd>←</kbd> / <kbd>→</kbd> | Previous / next day (swapped with `isRTL`) |
| <kbd>↑</kbd> / <kbd>↓</kbd> | Same day of the previous / next week |
| <kbd>Home</kbd> / <kbd>End</kbd> | First / last day of the week (respects `firstDay`) |
| <kbd>PageUp</kbd> / <kbd>PageDown</kbd> | Same day of the previous / next month |
| <kbd>Shift</kbd>+<kbd>PageUp</kbd> / <kbd>PageDown</kbd> | Same day of the previous / next year |
| <kbd>Enter</kbd> / <kbd>Space</kbd> | Select the day |
| <kbd>Esc</kbd> | Close and return focus to the input |
| <kbd>Tab</kbd> | Move to the time controls and buttons |

Moving past the visible months scrolls the calendar. Days outside `minDate`/`maxDate` cannot be reached.

### Time controls

Sliders are native `<input type="range">`: <kbd>←</kbd>/<kbd>→</kbd> or <kbd>↑</kbd>/<kbd>↓</kbd> change the value
by one step, <kbd>PageUp</kbd>/<kbd>PageDown</kbd> by larger amounts, <kbd>Home</kbd>/<kbd>End</kbd> jump to the
limits. Dropdowns work like any `<select>`. <kbd>Esc</kbd> closes the popup.

## Screen readers

| Part | Markup |
|---|---|
| Input | `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` pointing to the popup |
| Popup | `role="dialog"`, `aria-modal="false"`, `aria-label` with the displayed month |
| Month grid | `<table role="grid">`, labelled by the month title; the title is an `aria-live="polite"` region, so month changes are announced |
| Column headers | `<th scope="col">` with an `<abbr title="Monday">` around the short name |
| Days | `<td role="gridcell" aria-selected>` containing a `<button>` labelled with the full date ("Tuesday, 3 February 2026" in the picker's language) |
| Today | `aria-current="date"` |
| Disabled days | `aria-disabled="true"` (they stay focusable so arrow-key navigation is predictable) |
| Navigation | Buttons labelled with `prevText` / `nextText` |
| Time section | `role="group"` labelled with `timeText`; each control has a `<label>`; sliders announce their value in the time format via `aria-valuetext` (e.g. "03 PM") |

The grid uses a *roving tabindex*: only the highlighted day is in the tab order, so <kbd>Tab</kbd> moves past
the grid in one step.

## Focus handling

- Clicking the calendar with the mouse keeps focus in the input, so typing still works.
- Inside a modal (Bootstrap `.modal`, `<dialog>`, `aria-modal="true"`) the popup is mounted inside the modal,
  so the modal's focus trap does not pull focus out of the calendar.
- Closing with <kbd>Esc</kbd> or **Done** returns focus to the input.

## Motion

The popup animation is disabled for users with `prefers-reduced-motion: reduce`.
