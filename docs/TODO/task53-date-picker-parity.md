# task53: date-picker-parity

**Goal:** Typeable dates — a natural-language input that parses "tomorrow",
"next fri", "3/4/25" — plus a time picker.
**Branch:** feat/date-picker-parity
**Deps:** none (task 22 landed the composition pattern)

## Why

Task 22 shipped date-picker as a composition pattern only: `ui/popover` +
`ui/calendar`, no root component. Picking a date three months out by clicking
through a calendar is slow, and every serious date field lets you type. Upstream
demonstrates this with `chrono-node` (~40kB); we need a subset, zero-dep.

## Design decisions

- **Parse a deliberate subset, and reject everything else clearly.** A partial
  natural-language parser that guesses wrong is worse than one that declines.
  In scope:
  - relative keywords: `today`, `tomorrow`, `yesterday`
  - weekday names, bare and with `next`/`last` (`next fri`, `last monday`)
  - `in N days|weeks|months`, `N days ago`
  - numeric dates in the **locale's** order — this is the trap: `3/4/25` is
    March 4 in `en-US` and 4 March in `en-GB`. Derive the field order from
    `Intl.DateTimeFormat(locale).formatToParts()`; never hard-code M/D/Y.
  - month-name forms: `4 mar`, `mar 4`, `march 4 2025`, localised month names
    from `Intl.DateTimeFormat(locale, { month: "long" })`
  - two-digit years resolve to a sliding window (current year −80/+20), the
    convention everything else uses
  Out of scope, documented: time-of-day inside the date string, date ranges in
  one string, "the first monday of next month", any other language's grammar
  beyond what `Intl` month/weekday names give for free.
- **Parsing lives in `lib/parse-date.js` as a pure function** —
  `parseDate(input, { locale, referenceDate })` returning
  `{ date, confidence }` or `null`. Pure and injectable-clock means it is
  properly testable; a parser tested through a rendered component is a parser
  with untested branches.
- **The input echoes its interpretation.** On blur (not per keystroke), the
  field reformats to the canonical localised date and the calendar jumps to
  it. An unparseable value stays as typed and sets `aria-invalid` with a
  message — never silently discard what the user wrote.
  - Announce the interpretation in a live region: typing "next fri" and having
    the field silently become "Mar 7, 2025" is disorienting for screen-reader
    users.
- **`ui/time-picker` is a separate component, not a calendar mode.** Anatomy:
  hour / minute / (second) / meridiem segments, each an `<input>` with
  `inputMode="numeric"`, arrow keys stepping, auto-advance on completion,
  overflow rolling into the next segment.
  - 12h vs 24h comes from the locale (`Intl.DateTimeFormat(locale).resolvedOptions().hour12`),
    overridable by prop.
  - Do **not** use `<input type="time">` — its UI is unstyleable and diverges
    per browser, which is the whole reason upstream users reach for a component.
  - Expose `step` (minutes) and clamp with `min`/`max`.
- **Timezones are out of scope and must be stated.** Everything is local-time
  `Date`. A timezone-aware picker needs `Temporal`; note it as a future task
  rather than half-solving it.

## Sub-tasks

- [ ] 1. `lib/parse-date.js` — locale-derived field order, the keyword and
  relative grammars, two-digit-year window, injectable reference date. Files:
  `lib/parse-date.js`, `tests/parse-date.test.mjs` (table-driven, several
  locales, fixed reference date).
- [ ] 2. `ui/date-input` — typeable field wired to parsing, blur
  canonicalisation, `aria-invalid` + live-region announcement. Files:
  `ui/date-input/date-input.jsx` + `.css`.
- [ ] 3. `ui/time-picker` — segmented input, keyboard stepping, auto-advance,
  locale hour cycle, `step`/`min`/`max`. Files:
  `ui/time-picker/time-picker.jsx` + `.css`.
- [ ] 4. Demo: date-input + calendar popover composed, and a datetime
  composition. Files: `site/pages/date-picker.jsx`,
  `site/registry.js`.
- [ ] 5. Test: parser cases per locale; blur canonicalisation and calendar
  jump; unparseable input keeps its text and marks invalid; time segments
  roll over and clamp; 12h/24h from locale. Files:
  `tests/date-picker.test.mjs` (extend), `tests/time-picker.test.mjs`.

## Verify / done

- `node tests/run.mjs` green (existing date-picker suite unmodified);
  `npm run build` clean.
- axe on the demo including the invalid state.
- Try `en-GB` and `de-DE` in the demo: `3/4/25` must resolve differently in
  `en-US` and `en-GB`, and the reformatted output must match the locale.
