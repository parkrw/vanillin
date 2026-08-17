# task89: console-panels
**Goal:** Standalone showcase panels in new files: a polished Support panel (message thread, draft composer with attachments, tickets data-table), a Settings panel, and a status-widget set of huge multi-colored progress rings and bars animating 0-100% at varied speeds.  **Branch:** `feat/console-panels`  **Deps:** none
**Owns:** `site/showcase/panels/**`, `tests/showcase-panels.test.mjs`

User request 2026-08-17. These panels mount inside the home-page console mock, but **you never touch `site/showcase/console.*`** — task 88 is restructuring those files concurrently. Build panels that render standalone; the supervisor wires them into the console after both tasks merge.

## Contract (the supervisor integrates against this)

`site/showcase/panels/index.js` exports `SupportPanel`, `SettingsPanel`, `StatusShowcase`. Each is a zero-prop, self-contained component that imports its own CSS and data (`panels.css`, `panels-data.js` in the same directory). Brand is **Acme Cloud** (no "CloudKey", no version numbers, no OpenStack-specific wording). Class prefix `ackp-` to avoid colliding with the console's existing classes.

## Sub-tasks

- [x] 1. **SupportPanel.** Three regions: a messages thread (scrollable list of support-conversation bubbles — `ui/bubble` + `ui/message` exist from task 04); a draft area below it (kit `Textarea`, an `AttachmentGroup` queue of files staged on the draft with add/remove affordances that toast, a Send button that appends the draft to the thread in local state); and a "All tickets" `data-table` (via `lib/use-data-table.js` like the console does) with status `StatusDot`s and a per-row actions menu (Reply, Escalate, Assign, Close, Delete — each toasts). Make it look finished: header with open-ticket count badges, tooltips on icon controls.
- [x] 2. **SettingsPanel.** A settings page built from kit form components: profile card (name, email `ops@acme.cloud`), organization card, an API access card with a fake key row (reveal/copy buttons that toast, value is obviously fake like `ak_demo_0000…`), and a preferences card (Switches and Selects for notifications, density, language — none persist). Tooltips on anything icon-only.
- [x] 3. **StatusShowcase.** A grid of progress widgets: circular rings (SVG stroke-dasharray or conic-gradient, built here — the kit has no ring component) and kit `Progress` bars. Each widget animates 0% → 100% on a loop at its own speed (some slow ~20s, some fast ~3s) and carries a **huge** multi-colored `StatusDot` (scale it up in CSS; vary tones: success/warning/info/destructive) plus a percentage readout. Respect `prefers-reduced-motion`: animations pause or reduce to a static state.
- [x] 4. **panels.css.** Kit tokens only (var(--…) / color-mix over tokens, no raw hex); light and dark both work; include a `prefers-reduced-transparency` fallback if any glass is used.
- [x] 5. **Tests** in `tests/showcase-panels.test.mjs` (new file) against a minimal fixture page or direct component mount, however the existing test harness renders components: SupportPanel send appends a message to the thread; the tickets table renders its rows and a row action toasts; SettingsPanel renders its cards; StatusShowcase renders rings with accessible progress semantics (`role="progressbar"` or equivalent) and distinct animation durations.

## Verify / done

`npm run build` clean; `VANILLIN_TEST_PORT=5243 npm test` — baseline **760/763** (known failures: slider-cursor pair + intermittent navigation-menu hover flake) plus your new tests all green. `grep -ri cloudkey site/showcase/panels` returns nothing.

## Gotchas

- Look at how `tests/` renders things before writing tests — there may be no component-mount harness, in which case add a tiny hidden fixture route/page ONLY if the harness supports it without touching `site/pages/**` or `site/app.jsx`; if it does not, test through a static import + render into a scratch DOM the way the fastest existing non-Playwright test does. Do not touch files outside your Owns to make tests work — record the limitation in the report instead.
- No em dashes in user-visible prose.
- Fake data only: RFC 5737/private-range IPs, role-based names, no real companies or people.

## Handoff

**Status:** NOT STARTED
