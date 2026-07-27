# task21: calendar

**Goal:** Month grid with single/multiple/range selection — no react-day-picker.
**Branch:** feat/calendar (stacked on feat/scroll-area — shared registry.js)
**Deps:** none (task 22 date-picker depends on this)

## Design decisions

- **Live anatomy verified 2026-07-25:** upstream wraps **react-day-picker v9**
  and exports `Calendar` + `CalendarDayButton`. Root props it forwards:
  `mode`, `selected`/`onSelect`, `month`/`defaultMonth`/`onMonthChange`,
  `numberOfMonths`, `showOutsideDays` (default true), `showWeekNumber`,
  `captionLayout` (default `"label"`), `disabled`, `startMonth`/`endMonth`,
  `locale`, `buttonVariant` (default `"ghost"`). Day buttons carry
  `data-day`, `data-selected-single`, `data-range-start|middle|end`; the day
  cell carries `data-selected`/`data-focused`, and the nav chevrons flip
  under rtl.
- **Dates come from native `Date` + `Intl`:** weekday names and the caption
  from `Intl.DateTimeFormat`, first day of week from
  `Intl.Locale#getWeekInfo()` when the engine has it (Chrome does), else
  Sunday; `weekStartsOn` overrides. `locale` is a BCP-47 **string** here, not
  a date-fns object (deviation — we have no date library to hand one).
  Everything is local midnight; no timeZone prop.
- **A month is a `<table role="grid">`**: `<th scope="col" abbr>` weekday
  headers, one `<tr class="calendar-week">` per week, `<td class="calendar-day">`
  per day holding a `CalendarDayButton`. One tab stop per calendar (roving
  tabindex on the focused day, standard for a date grid); the grid is labelled
  by its caption.
- **Keyboard:** arrows ±1 day / ±1 week, Home/End to the week edges,
  PageUp/PageDown ±1 month, Shift+PageUp/PageDown ±1 year, Enter/Space
  select. Moving off the displayed month navigates it and keeps focus on the
  target day; rtl swaps the horizontal arrows.
- **Selection via `useControllableState`** (`selected`/`defaultSelected`/
  `onSelect`), one value shape per mode: `Date | undefined`, `Date[]`,
  `{ from, to }`. Range clicks: first click sets `from`, second completes
  (swapping if earlier), a third restarts. Re-clicking the single selected
  date clears it (rdp's `required={false}` default).
- **Matchers** for `disabled`: `Date`, `Date[]`, `{ from, to }`,
  `{ before }`/`{ after }`, or a predicate — one shared `matches()` helper so
  `disabled` and `modifiers`-ish checks share code. Outside days are rendered
  (`showOutsideDays`) but marked `data-outside`.
- **`captionLayout="dropdown"`** uses native `<select>`s (our
  `ui/native-select`) for month and year, bounded by
  `startMonth`/`endMonth` (defaulting to ±10 years around the displayed
  month). Upstream overlays a transparent native select on a styled label; we
  show the select itself — same behaviour, less machinery.
- **Deviations:** no custom `modifiers`/`modifiersClassNames`, no `min`/`max`
  range limits, no `required`, no `hidden` matcher, no week-number clicking,
  no `timeZone`/non-Gregorian calendars, `numberOfMonths` renders side by side
  with one shared nav (rdp's default too).

## Sub-tasks

- [x] 1. calendar core — single mode, month nav, caption label, weekday
  headers, outside days, disabled matchers, keyboard grid nav, ARIA;
  test: grid shape + weekday headers, day labels, select/deselect, nav
  buttons and dropdown-free caption, arrow/Home/End/PageUp keyboard walk
  including the month rollover, disabled dates ignore clicks, today marked,
  rtl arrow swap; files: `ui/calendar/calendar.jsx` + `.css`,
  `tests/calendar.test.mjs`, `site/pages/calendar.jsx`,
  `site/registry.js`.
- [x] 2. calendar modes — `mode="multiple"`, `mode="range"` (+ range
  data-attrs and hover preview), `numberOfMonths`, `showWeekNumber`,
  `captionLayout="dropdown"` with `startMonth`/`endMonth`; test: multiple
  toggling, range build/swap/restart, two-month layout shares one nav,
  week numbers column, dropdown month/year jumps.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#calendar` light/dark: cell grid aligns, today ring, range
  fill joins across weeks, dropdown caption, rtl month reads right-to-left.
