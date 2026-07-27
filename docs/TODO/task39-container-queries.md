# task39: container-queries

**Goal:** Components respond to their container's width, not the viewport's.
**Branch:** feat/container-queries
**Deps:** 34, 35
**Browser-support gate:** container queries were on the partial list at plan
time — support-check first (they are widely available now, but verify, and
verify `cqi` units specifically).

## Why

A console puts a card in a 320px side panel and the same card in a 1200px main
region. Viewport media queries cannot tell those apart, so the component looks
wrong in one of them. This is a capability upstream cannot adopt — Tailwind's
responsive prefixes are viewport-bound by default — so it is a genuine
differentiator, not parity work.

## Design decisions

- **Opt-in containment, always.** `container-type: inline-size` establishes a
  containment context, which has real side effects: it makes the element a
  layout/style containment boundary and **breaks any child that relies on
  percentage heights or escaping overflow**. Never apply it globally. Each
  component that wants it declares it on its own root, and only where the
  layout is genuinely self-contained.
  - Do **not** put `container-type` on anything that hosts an anchored
    overlay — containment interacts badly with popover positioning. Check
    `ui/popover`, `ui/select`, `ui/dropdown-menu` consumers.
- **Name every container** (`container-name: vanillin-card` etc.). Anonymous
  containers get claimed by the nearest ancestor, which produces
  action-at-a-distance bugs when components nest.
- **Which components actually benefit** — keep the list short and justified:
  - `ui/card` — stack header/action vertically when narrow
  - `ui/data-table` — this is the big one; below a threshold, switch from a
    table layout to a stacked card-per-row layout. That is the single most
    requested responsive behaviour for tables.
  - `ui/dialog` / `ui/sheet` — content reflow at narrow widths
  - `ui/sidebar` — already has its own collapse logic; check for conflict
    before adding a second mechanism
  - `ui/item`, `ui/field` — label above vs beside
  Anything not on this list does not get a container.
- **`cqi` units are the second half of the feature** — fluid type and spacing
  that track the container. Use sparingly and always with `clamp()` bounds;
  unbounded `cqi` sizing produces unreadable extremes.
- **Progressive enhancement.** Where unsupported, components keep their
  current fixed layout. No JS fallback, no `ResizeObserver` polyfill — that
  trades a cosmetic gap for a performance problem.
- **Interaction with density (36):** both change spacing. Container queries
  must adjust *layout*, density adjusts *scale*. If a container query starts
  overriding `--space-*`, the two features are fighting; keep the concerns
  separate.

## Sub-tasks

- [x] 1. Support check for container queries and `cqi`; record in the log.
- [x] 2. `ui/card` + `ui/item` + `ui/field` containers and narrow-width
  layouts. Files: those components' `.css`.
- [x] 3. `ui/data-table` stacked-row mode below a threshold — the headline
  feature. Files: `ui/data-table/data-table.css`, and `data-table.jsx` only if
  the stacked layout needs `data-label` attributes on cells (it probably does;
  a stacked row needs its column name).
- [x] 4. `ui/dialog` / `ui/sheet` content reflow. Files: those `.css` files.
- [x] 5. Demo page: the same card and the same table rendered at three
  container widths on one page, side by side. This is the demo that sells the
  feature — a viewport-resize demo does not show it. Files:
  `site/pages/container-queries.jsx`, `site/registry.js`.
- [ ] 6. Test: a card in a 300px container computes a different layout than
  the same card in a 900px container **on the same page at the same viewport**
  (that assertion is the whole point); the table switches to stacked mode
  below its threshold and each stacked cell exposes its column name; no
  anchored overlay is inside a containment context. Files:
  `tests/container-queries.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Open a popover, select, and dropdown from inside every new container and
  confirm positioning is unaffected.
- Check the stacked table mode with a screen reader ordering pass — a stacked
  row must still read as label/value pairs, not as orphaned values.
