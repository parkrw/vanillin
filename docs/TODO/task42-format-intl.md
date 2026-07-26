# task42: format-intl

**Goal:** `lib/format.js` plus four display components — the formatting layer a
console needs, built on `Intl` alone.
**Branch:** feat/format-intl
**Deps:** none

## Why

Every console renders the same four things badly: "3 minutes ago", "1.4 GB",
"2h 14m", "$12.40". Each is a one-liner in `Intl` and a bug farm by hand
(pluralisation, locale decimal separators, binary vs decimal bytes, negative
durations). shadcn has no answer, so this is net-new surface.

## Design decisions

- **`lib/format.js` is pure functions; the components are thin.** The
  functions must be callable from a table cell formatter or a `title`
  attribute without rendering anything.
- **Locale comes from context, not props.** Add a locale to the existing
  `lib/direction.jsx` provider rather than minting a second provider — `dir`
  and locale travel together. Default to `undefined`, which makes `Intl` use
  the runtime locale; never hard-code `"en-US"`.
- **`RelativeTime`** — `Intl.RelativeTimeFormat`. Renders a `<time dateTime>`
  so the machine-readable timestamp survives; the absolute time goes in
  `title`. Live-updating is opt-in (`live` prop) with **one shared interval
  for all mounted instances**, not a timer per component — a log table with
  400 rows must not schedule 400 timers. Tick cadence backs off with
  magnitude (seconds → every 5s, minutes → every 30s, hours+ → every 5min).
- **`Bytes`** — `Intl.NumberFormat` with `notation: "compact"` is wrong here
  (it gives "1.4K", not "1.4 kB"). Use `style: "unit"` where the unit is
  supported and fall back to manual suffixing where it is not; verify which
  byte units Chrome actually accepts before relying on them. Support both
  `si` (1000) and `iec` (1024) via a `base` prop, defaulting to `iec` with the
  correct `KiB`/`MiB` suffixes — mislabelling 1024-based values as `kB` is the
  single most common bug in this widget.
- **`Duration`** — `Intl.DurationFormat` is the right API but was not
  universally available at plan time. **Support-check it first**; degrade to a
  hand-rolled `Intl.NumberFormat` + `Intl.ListFormat` composition, which is
  locale-correct enough and has no availability question.
- **`Cost`** — `Intl.NumberFormat` currency style, with the console-specific
  wrinkle that cloud prices need more than 2 fraction digits
  (`$0.0000012/req`). Take `minimumFractionDigits`/`maximumFractionDigits`
  overrides and pick a sensible default from magnitude.
- **Formatter instances are cached.** `new Intl.NumberFormat(...)` per render
  per cell is measurably slow; memoise by `(locale, options)` key in a module
  map. This is the only performance decision in the task and it matters at
  table scale.
- **SSR/hydration:** a `live` `RelativeTime` must render the same string on
  server and first client paint, then update after mount. Compute from the
  prop, not `Date.now()`, on the initial render.

## Sub-tasks

- [ ] 1. `lib/format.js` — `formatRelativeTime`, `formatBytes`,
  `formatDuration`, `formatCost`, the formatter cache, and the
  `Intl.DurationFormat` support check with its fallback. Files:
  `lib/format.js`.
- [ ] 2. Locale on the direction provider. Files: `lib/direction.jsx`.
- [ ] 3. `ui/format/` — `RelativeTime`, `Bytes`, `Duration`, `Cost`, plus the
  shared tick scheduler. Files: `ui/format/format.jsx` + `.css` (minimal —
  these are inline text, likely `font-variant-numeric: tabular-nums` and
  little else).
- [ ] 4. Demo page + registry entry. Files: `playground/pages/format.jsx`,
  `playground/registry.js`.
- [ ] 5. Test: each formatter against a fixed locale and fixed clock; `iec`
  vs `si` suffixes; negative and zero durations; `<time dateTime>` present;
  one shared interval for N live instances (assert the timer count, not the
  rendered text); locale from context changes output. Files:
  `tests/format.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Spot-check a non-English locale (`de-DE` — comma decimal separator) and an
  RTL locale (`ar`) in the demo; numerals must not break the text direction.
- No timer leaks: unmounting every live instance clears the shared interval.
