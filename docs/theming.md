# Theming

yad's look is controlled by CSS custom properties. Change a few of them to match your design, or load the
bundled Bootstrap 5 theme.

## CSS custom properties

Override them on `.yad`:

```css
.yad {
  --yad-accent: #e11d48;
  --yad-radius: 4px;
  --yad-font-size: 15px;
}
```

The defaults are declared with zero specificity (`:where(.yad)`), so a plain `.yad { … }` rule always wins,
whatever order the stylesheets load in.

| Property | Default (light) | Used for |
|---|---|---|
| `--yad-font` | `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` | Font family |
| `--yad-font-size` | `14px` | Base font size; most sizes scale with it |
| `--yad-bg` | `#fff` | Background |
| `--yad-fg` | `#1f2328` | Text |
| `--yad-muted` | `#8b949e` | Day headers, week numbers, other-month days, time labels |
| `--yad-border` | `#d0d7de` | Borders, separators, dropdown borders |
| `--yad-radius` | `8px` | Corner radius of the popup |
| `--yad-shadow` | `0 8px 24px rgba(31, 35, 40, 0.15)` | Popup shadow |
| `--yad-hover-bg` | `#eef2f6` | Hovered and highlighted days and buttons |
| `--yad-accent` | `#2563eb` | Selected day, focus outline, time sliders |
| `--yad-accent-fg` | `#fff` | Text on the selected day |
| `--yad-today-ring` | `#2563eb` | Ring around today |
| `--yad-range-bg` | accent at 16% | Days inside a [date range](date-ranges.md) |
| `--yad-weekend` | `#6e7781` | Weekend day numbers |
| `--yad-cell` | `2.25em` | Width and height of a day cell |
| `--yad-gap` | `12px` | Gap between months |
| `--yad-duration` | `200ms` | Animation length (set from the `duration` option) |
| `--yad-z` | `1000` | `z-index` of the popup |

### Scoping a theme

Style one picker by adding a class to its widget:

```js
const dp = new Yad('#date');
dp.widget().classList.add('brand-picker');
```

```css
.yad.brand-picker { --yad-accent: #16a34a; }
```

## Dark mode

The picker is **light by default**, whatever the operating system setting. Choose the mode with the
`theme` option:

| `theme` | Result |
|---|---|
| `'light'` (default) | Always light |
| `'dark'` | Always dark |
| `'auto'` | Follows the operating system (`prefers-color-scheme`). Use it when your page has a dark mode that also follows the system. |

```js
new Yad('#date', { theme: 'auto' });
Yad.setDefaults({ theme: 'auto' });    // for every picker
dp.option('theme', 'dark');            // switch later
```

The mode is written to the widget as `data-theme="light" | "dark" | "auto"`, and the browser's own
controls inside the picker (dropdown menus, sliders) follow it through CSS `color-scheme`.

The classes `yad--dark` and `yad--light` on the widget force a mode regardless of the option:

```js
dp.widget().classList.add('yad--dark');
```

To follow a dark-mode switch of your own (e.g. a `.dark` class on `<html>`), either call
`dp.option('theme', …)` when it changes, or set the colours in CSS:

```css
html.dark .yad {
  --yad-bg: #1c2128;
  --yad-fg: #e6edf3;
  --yad-muted: #6e7681;
  --yad-border: #373e47;
  --yad-hover-bg: #2d333b;
  --yad-accent: #4c8dff;
  --yad-today-ring: #4c8dff;
  --yad-weekend: #9198a1;
}
```

## Bootstrap 5 theme

Load it after Bootstrap and `yad.css`:

```js
import 'bootstrap/dist/css/bootstrap.min.css';
import '@sandritsch91/yad/yad.css';
import '@sandritsch91/yad/themes/bootstrap5.css';
```

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sandritsch91/yad@1.1.0/dist/yad.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@sandritsch91/yad@1.1.0/dist/themes/bootstrap5.css">
```

The theme:

- takes colours, radii, focus rings and shadows from Bootstrap's CSS variables, so a customised `$primary`
  and colour modes (`data-bs-theme="dark"`) apply automatically. The `theme` option has no effect with it:
  Bootstrap's colour mode decides
- styles the dropdowns like `.form-select-sm`, the buttons like `.btn-sm`, and the trigger button like
  `.btn-outline-secondary`
- works inside an `.input-group`:

  ```html
  <div class="input-group">
    <input class="form-control" id="date">
  </div>
  <script type="module">new Yad('#date', { showOn: 'both', buttonText: '📅' });</script>
  ```

- raises the popup's `z-index` to 1070 so it shows inside modals

The theme must load **after** `yad.css`: its rules have the same specificity as the base rules.

## Pickers inside modals

When the input is inside a Bootstrap `.modal`, a `<dialog>` or any element with `aria-modal="true"`, the popup
is mounted inside that element (instead of `<body>`) and positioned with `position: fixed`. This keeps
keyboard focus inside the modal's focus trap and keeps the popup above a `<dialog>` in the top layer.

## CSS classes

Use these to fine-tune the styling.

### Root element (`dp.widget()`)

| Class | When |
|---|---|
| `.yad` | Always |
| `.yad--popup` / `.yad--inline` | Popup or inline calendar |
| `.yad--open` | Popup is open (used for the show animation) |
| `.yad--above` | Popup opened above the input (not enough space below) |
| `.yad--multi` | More than one month |
| `.yad--rtl` | `isRTL` |
| `.yad--disabled` | Picker is disabled |
| `.yad--time` / `.yad--time-only` | Time picker enabled / time only |
| `.yad--light` / `.yad--dark` | Forced colour mode (you add these) |
| `[data-theme]` | `light`, `dark` or `auto`, from the `theme` option |

The root also has `data-anim="fade" | "slide" | "none"` for popups.

### Calendar

| Class | Element |
|---|---|
| `.yad-row` | A row of months |
| `.yad-group` (`--first`, `--middle`, `--last`) | One month |
| `.yad-header` | Month header |
| `.yad-prev`, `.yad-next` | Navigation buttons (`.yad-icon` inside) |
| `.yad-title` | Month and year (`.yad-month`, `.yad-year` or `.yad-month-select`, `.yad-year-select`) |
| `.yad-calendar` | The `<table>` grid |
| `.yad-week-col` | Week-number cells |
| `.yad-day` | A day `<td>` (`.yad-day-btn` button inside) |
| `.yad-week-end` | Saturday and Sunday |
| `.yad-other-month` | Day of the previous or next month |
| `.yad-unselectable` | Disabled day |
| `.yad-today` | Today |
| `.yad-selected` | Selected day |
| `.yad-range-start` / `.yad-range-end` | First / last day of a [date range](date-ranges.md) |
| `.yad-in-range` | Days between the start and end of a range |
| `.yad-highlight` | Keyboard cursor |
| `.yad-buttonpane` | Button panel (`.yad-current`, `.yad-close`) |

Classes returned by `beforeShowDay` are added to `.yad-day`.

### Time picker

| Class | Element |
|---|---|
| `.yad-time` | Time section |
| `.yad-time-row` | One row (label + control) |
| `.yad-time-label` | Label |
| `.yad-time-value` | Time readout (`<output>`) |
| `.yad-time-slider` | Range slider |
| `.yad-time-select` | Dropdown |

### Around the input

| Class | Element |
|---|---|
| `.yad-input` | Added to the input |
| `.yad-trigger` | Trigger button (`.yad-trigger--disabled` when disabled) |
| `.yad-append` | `appendText` |

## Animation

`showAnim: 'fade'` (default) or `'slide'` with `duration` in milliseconds. Users with *reduced motion* enabled
get no animation. To customise it, style `.yad--popup[data-anim]` and `.yad--popup.yad--open`.
