# task72: bug-batch-2

**Goal:** Fix what task 71's sweep found — four root causes in the contrast and cursor families, plus the docs-page and component bugs behind them.
**Branch:** `fix/task72-contrast-cursors`  **Deps:** 71 ✓
**Owns:** `van.defaults.json`, `styles/**`, `ui/**`, `site/**`, `scripts/contrast-nontext.mjs`, `tests/**`, `docs/ISSUES.md`

## Settled 2026-08-01: D9 is option B, not the footnote's blanket bump

The footnote in `docs/TODO/README.md` reads D9 as "raise `--border`". **That reading is rejected.** The kit already has two tokens holding the same value, inherited verbatim from upstream:

- `--input` — 17 call sites, every one a **control** boundary (input, checkbox, switch, radio, select, textarea, toggle, input-otp, date-input, time-picker, native-select, combobox, input-group, button, data-table).
- `--border` — 227 call sites, all **surfaces**: cards, table rules, separators, dialogs, menus, sidebar.

Every element 71 measured as failing uses `--input`, except `.attachment`. WCAG 1.4.11 asks 3:1 for "visual information **required to identify** UI components and states" — a control boundary qualifies, a card frame does not. So raising `--input` alone is the *correct* fix, not a partial one, and it leaves 227 surface call sites at upstream's value.

Verified by rendering all three options against the real kit (screenshots, not mockups): raising `--input` changes inputs, checkboxes, switches, radios, selects and outline buttons; `ui/table` is byte-identical because `table.css:22,39,105,112` uses only `--border`.

**The user's stance, on the record:** vanillin takes upstream's good ideas and adds its own — it is not trying to be pixel-identical. Divergence from upstream is acceptable when it is justified; parity is not a goal in itself. A consumer who wants upstream's exact greys sets them in `van.config.json`, which is what the generator is for.

## Sub-tasks

- [x] 1. **D9 — `--input` to ≥3:1.** Light `oklch(0.922 0 0)` → `oklch(0.65 0 0)` (1.26:1 → 3.23:1). Dark value set by measurement, not by arithmetic — the dark token is translucent (`oklch(1 0 0 / 15%)`) and composites in sRGB. Edit `van.defaults.json` (light block ~line 30 region, dark ~line 79 region), then `npm run theme:defaults` — **`styles/defaults.css` is generated, never hand-edit it**. Re-run `node scripts/contrast-nontext.mjs` before touching any component; D1/D2/D3/D5 should all clear at once. Test asserts the *measured ratio*, not the token string (H1 precedent).
- [ ] 2. **D3 — re-point `.attachment`.** `ui/attachment/attachment.css:9` uses `var(--border)`; it is a control boundary, so move it to `var(--input)`. This is the one D-family element sub-task 1 does not reach. Separately, `attachment.css:113`'s destructive-tinted border measures 2.12:1 light / 1.95:1 dark and needs its own value.
- [ ] 3. **D13 — focus ring (new, found 2026-08-01, not in 71's sweep).** `--ring` light `oklch(0.708 0 0)` = **2.59:1** on white, fails 1.4.11. Dark is 4.18:1 and passes. Worse in practice: `input.css:22`, `button.css:28` and `checkbox.css:26` composite it at 50% alpha for the glow, and `styles/globals.css:222` uses it as a bare 2px outline. A failing focus indicator outranks a faint checkbox — do this with sub-task 1, same file, same regeneration.
  **Amended 2026-08-02: token half done, glow half blocked on a design call.** The 50% glow is 28 declarations across ~24 components, and wherever it is the sole focus indicator (button, checkbox, toggle, badge, tabs, …) it measures ~1.7:1 light with the raised token — no alpha short of solid reaches 3:1 over white. Options: solid `var(--ring)` glow (keeps geometry, loses softness) or stop suppressing the global 2px outline on glow-only components. See the D13 update in `docs/ISSUES.md`. `tests/contrast.test.mjs` has a placeholder comment where the `.btn:focus-visible` row goes once decided.
- [ ] 4. **Extend `scripts/contrast-nontext.mjs`.** Add rows for the focus ring and for graphical objects (status dots, progress track, slider rail, chart series) — the probe has 8 rows and covers none of them. Annotate the `.switch:disabled` row (`contrast-nontext.mjs:38`) as **WCAG-exempt**: 1.4.11 explicitly excludes inactive components, so nobody should "fix" it.
- [ ] 5. **D10 — `--muted-foreground` on `--muted` to ≥4.5:1 light.** Currently 4.34:1; light-mode only, dark passes. Closes D6 (`ui/time-picker/time-picker.css:56-57`). Eight components pair these tokens.
- [ ] 6. **F5 — seven `cursor: default` declarations.** Delete or override; the global rule (`styles/globals.css:227-244`) selects `button` by element so any class wins. Sites listed in `docs/ISSUES.md` §F5. **Keep the three `not-allowed` disabled-state rules** (`select.css:40`, `combobox.css:54`, `:97`).
- [ ] 7. **F6 — native input types in the global rule.** `styles/globals.css:227-244` lists ARIA roles but only `button`/`summary`/`label[for]`/`a[href]`/`select` as elements. Add `input[type=checkbox|radio|file|submit|button|reset]`. **This is where F4's slider decision gets made** (`grab`/`grabbing` vs `pointer` for a draggable thumb).
- [ ] 8. **D11 — `ui/bubble` destructive text** 4.15:1 (`bubble.css:59-61`), light only.
- [ ] 9. **D12 — the site's active nav link** 3.82:1 (`site/site.css:88-91`). Site chrome, one line, independent of everything above.
- [ ] 10. **C7/C8 — docs-page markup.** `site/pages/use-form.jsx:205` and `:524` render adjacent `<span>`s as `false{}{}` / `falsetrue`; `site/pages/input.jsx:41` has a Density heading with no `<Input>`.
- [ ] 11. **C6, E3, I1 — the pre-existing tail.** C6 is a component-behaviour call (`flexRender` fallback vs. demo `cell`). E3 is the `scrollHeight` sub-pixel step, which also hits `ui/accordion`. I1 is reproduce-or-close.

**Out of scope:** G1–G4 (load-dependent timing flakes need their own reproduction approach), K1 (became task 74), D4 (not a fix — the calendar has no border of its own; what the eye saw was D9).

## Verify / done

```bash
node scripts/contrast-nontext.mjs     # every probed boundary ≥3:1 light and dark
node scripts/sweep-pages.mjs          # cursor hits gone; no new console errors
node tests/run.mjs                    # suite green (708/708 at task 71)
npm run build
```

`npm run theme:defaults` must leave `styles/defaults.css` matching `van.defaults.json` — a dirty diff after regeneration means the file was hand-edited.

## Handoff

**Status:** IN PROGRESS
**Branch:** `fix/task72-contrast-cursors`  **PR:** none  **Updated:** 2026-08-01

- **Landed:** nothing yet — this session was the decision. D9's scope is settled as option B (`--input` only, `--border` untouched), justified by 1.4.11's "required to identify" wording rather than by taste, and confirmed against rendered screenshots of the real kit.
- **Found:** **D13**, a new item not in 71's sweep — `--ring` is 2.59:1 in light mode, so the focus indicator fails 1.4.11. Filed in `docs/ISSUES.md`.
- **Repo state:** branch created off `main`, only this task file plus the `ISSUES.md` D13 block. (`stash@{0} "whoops"` is old and not ours.)
- **Next:** sub-task 1 — `--input` in `van.defaults.json`, then `npm run theme:defaults`, then `node scripts/contrast-nontext.mjs` before touching any component.
- **Gotchas:** `styles/defaults.css` is generated — edit `van.defaults.json`. The dark `--input` is translucent, so pick its value by measuring, not by arithmetic on the light one. Read `docs/TODO/notes/measuring-colour.md` before writing anything that reads a computed colour.
