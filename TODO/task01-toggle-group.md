# task01: toggle-group
**Goal:** Add the Toggle Group component with demo page and smoke test.
**Branch:** feat/pagination-toggle-group  **Deps:** none

Split 2026-07-22: pagination moved to task02 — TODO seed + toggle-group already put this branch at ~350 net lines (cap 500).

## Sub-tasks
- [x] 1. toggle-group — test: single-select toggles `data-state` (one on, click again deselects), multiple allows several on, arrow keys rove focus; files: `tests/toggle-group.test.mjs`, `ui/toggle-group/toggle-group.jsx` + `.css`, `playground/pages/toggle-group.jsx`, `playground/registry.js`.
  - Exports `ToggleGroup` (role="group", context: type/value/setValue/variant/size/disabled, `useRovingFocus` selector `.toggle-group-item`) + `ToggleGroupItem` (button, `aria-pressed`, `data-state` on/off, reuses `.toggle` classes from `ui/toggle/toggle.css` + `.toggle-group-item`).

## Verify / done
`node tests/run.mjs` — 26/26 green (runner boots its own vite on :5199). Playground page renders all variants; screenshot QA done.
