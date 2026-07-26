# task35: tokenize-core-b

**Goal:** Same migration as task 34, for the surface and feedback components.
**Branch:** feat/tokenize-core-b
**Deps:** 33 (landed). Independent of 34 — different files, run them concurrently.
**Scope:** card, dialog, alert, popover, tooltip, toast, table, avatar,
separator, progress, slider, tabs

## Design decisions

Read `docs/TODO/task34-tokenize-core-a.md` first — the two substitutions
(spacing ramp, derived hover tokens), the no-visual-change bar, and the
"report a missing token, never add one to globals.css" rule are identical and
are not repeated here.

Surface-specific concerns:

- **Overlay components have a transparency budget that is deliberate.** Dialog
  and sheet scrims, and the translucent popover/tooltip surfaces, are *meant*
  to be `color-mix(… , transparent)`. Do **not** migrate those to opaque
  derived tokens. The rule is: transparency that lets the page show through
  **as a design intent** stays; transparency used as a cheap *hover shade*
  goes. Judge per declaration, and list any you were unsure about.
- **Padding on surfaces is the highest-value part of this task**, because
  card/dialog/table padding is exactly what a consumer wants density control
  over. Get the ramp right here even where it means rounding a value.
- **`table` is the density-sensitive one.** Row padding drives how many rows
  fit on screen, which is the whole reason a console wants compact mode. Make
  sure `th`/`td` padding goes through the ramp.
- **`progress` and `slider` fills** are intentional shadcn inversions (see the
  2026-07-25 log entry — subagents have repeatedly "fixed" these by mistake).
  Verify against that entry before changing any fill colour.
- **`toast` brought its own `--success`/`--warning`/`--info` families** in task
  23 and task 32 now uses them too. Do not re-derive; just consume.
- **Motion tokens are out of scope** — this task is colour and spacing only.
  Leave every `var(--motion-*)` alone.

## Sub-tasks

- [ ] 1. Screenshot baseline of every affected demo page in both modes, before
  any edit.
- [ ] 2. card + alert + separator + avatar. Files: those four `.css` files.
- [ ] 3. dialog + popover + tooltip — spacing only; preserve the deliberate
  overlay transparency. Files: those three `.css` files.
- [ ] 4. table + tabs. Files: `ui/table/table.css`, `ui/tabs/tabs.css`.
- [ ] 5. toast + progress + slider. Files: those three `.css` files.
- [ ] 6. Test: table cell padding tracks `--density-scale`; a dialog scrim is
  still translucent (guards against over-migration); tabs and toast padding
  resolve through the ramp. Files: `tests/tokens.test.mjs` (extend — coordinate
  with task 34, which extends the same file; keep your additions in a clearly
  separated block to avoid a cherry-pick conflict).

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Screenshot comparison against the baseline: identical, with any deliberate
  change listed.
- `--density-scale: 0.875` visibly tightens table rows and card padding.
- Open a dialog and a sheet and confirm the scrim still reads as a scrim.
