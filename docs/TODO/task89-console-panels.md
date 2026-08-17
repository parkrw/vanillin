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

**Status:** COMPLETE  **Branch:** `feat/console-panels` (pushed)  **PR:** none, user declined  **Updated:** 2026-08-17

- **Landed:** `site/showcase/panels/index.js` exports `SupportPanel`, `SettingsPanel`, `StatusShowcase` — zero-prop, self-contained, `ackp-` prefixed, Acme Cloud branding. Sending a reply appends to the thread, attachments stage and unstage, every ticket row action toasts, the API key row reveals a placeholder, and eight widgets sweep 0-100% at durations from 3s to 20s.
- **Repo state:** clean, 3 commits. Suite **775/778** (`VANILLIN_TEST_PORT=5243 npm test`), the 3 failures being the known slider-cursor pair plus the navigation-menu hover flake; `npm run build` clean; `grep -ri cloudkey site/showcase/panels` empty.
- **Next:** supervisor wires the three exports into task 88's console slots after both branches merge. None of `site/showcase/console.*` was touched.
- **Gotchas:**
  - The panels have **no docs-site route**. They render from `site/showcase/panels/fixture.html`, which vite's dev server serves and the production build ignores (only `site/index.html` is a build input). If the supervisor gives them a real route, the fixture and its suite still work unchanged.
  - **No panel renders a `<Toaster/>`.** The host does that once; two toasters in one tree queue against each other. The console already has one.
  - The status sweep is a CSS animation on the registered `--ackp-progress` custom property; one rAF only mirrors that value into the readout text and `aria-valuenow`, so the animation stays the single source of truth. `prefers-reduced-motion` kills the animation and parks each widget on its own `--ackp-static`.
  - `.ackp-bar .progress-indicator` needs `!important`: `ui/progress` writes the indicator transform inline from `value`, and these widgets drive it from the animated property instead.
  - `docs/TODO/README.md` was **not** touched — it is shared with task 88's worker, so the row and Resume pointer are the supervisor's to update.
