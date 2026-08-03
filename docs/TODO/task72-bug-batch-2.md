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
- [x] 2. **D3 — re-point `.attachment`.** `ui/attachment/attachment.css:9` uses `var(--border)`; it is a control boundary, so move it to `var(--input)`. This is the one D-family element sub-task 1 does not reach. Separately, `attachment.css:113`'s destructive-tinted border measures 2.12:1 light / 1.95:1 dark and needs its own value.
- [x] 3. **D13 — focus ring (new, found 2026-08-01, not in 71's sweep).** `--ring` light `oklch(0.708 0 0)` = **2.59:1** on white, fails 1.4.11. Dark is 4.18:1 and passes. Worse in practice: `input.css:22`, `button.css:28` and `checkbox.css:26` composite it at 50% alpha for the glow, and `styles/globals.css:222` uses it as a bare 2px outline. A failing focus indicator outranks a faint checkbox — do this with sub-task 1, same file, same regeneration.
  **Amended 2026-08-02: token half done, glow half blocked on a design call.** The 50% glow is 28 declarations across ~24 components, and wherever it is the sole focus indicator (button, checkbox, toggle, badge, tabs, …) it measures ~1.7:1 light with the raised token — no alpha short of solid reaches 3:1 over white. Options: solid `var(--ring)` glow (keeps geometry, loses softness) or stop suppressing the global 2px outline on glow-only components. See the D13 update in `docs/ISSUES.md`. `tests/contrast.test.mjs` has a placeholder comment where the `.btn:focus-visible` row goes once decided.
  **Done 2026-08-02: settled as solid glow.** All 28 declarations → `var(--ring)`; `.btn--destructive:focus-visible` → solid `var(--destructive)`. The five `aria-invalid` 40% glows and the `.status-dot--ring` halos stay (decoration over a compliant solid border / decorative variant). `.btn:focus-visible` row added to `tests/contrast.test.mjs` (waits out the box-shadow transition before measuring).
- [x] 4. **Extend `scripts/contrast-nontext.mjs`.** Add rows for the focus ring and for graphical objects (status dots, progress track, slider rail, chart series) — the probe has 8 rows and covers none of them. Annotate the `.switch:disabled` row (`contrast-nontext.mjs:38`) as **WCAG-exempt**: 1.4.11 explicitly excludes inactive components, so nobody should "fix" it.
  **Done 2026-08-02.** Probe rows take optional `{ focus }` / `{ exempt }` flags; exempt rows print `exmp`, never FAIL. D13's outline ring measures 3.23:1 light / 4.18:1 dark. No chart component exists (excluded at plan time). The new graphical rows surfaced three findings filed as **D14** (warning dot 2.31:1 light) and **D15** (progress track ~1.5:1, slider rail ~1.1:1, both modes) — token design calls, out of this batch.
- [x] 5. **D10 — `--muted-foreground` on `--muted` to ≥4.5:1 light.** Currently 4.34:1; light-mode only, dark passes. Closes D6 (`ui/time-picker/time-picker.css:56-57`). Eight components pair these tokens.
- [x] 6. **F5 — seven `cursor: default` declarations.** Delete or override; the global rule (`styles/globals.css:227-244`) selects `button` by element so any class wins. Sites listed in `docs/ISSUES.md` §F5. **Keep the three `not-allowed` disabled-state rules** (`select.css:40`, `combobox.css:54`, `:97`).
- [x] 7. **F6 — native input types in the global rule.** `styles/globals.css:227-244` lists ARIA roles but only `button`/`summary`/`label[for]`/`a[href]`/`select` as elements. Add `input[type=checkbox|radio|file|submit|button|reset]`. **This is where F4's slider decision gets made** (`grab`/`grabbing` vs `pointer` for a draggable thumb).
  **Done 2026-08-02.** F4 settled as a split: `grab`/`grabbing` on `input[type="range"]`, but `.slider-thumb` gets **no cursor** — the hand hides the thumb's hover/focus glow (user call; see ISSUES §F4). The F6 sibling (disabled calendar day) settled as an oversight — `calendar.css` now uses `not-allowed` like disabled select/combobox. The sweep's 16 residual cursor hits are tool heuristic gaps (single-side resize cursors, `[tabindex]` over-match), filed as **F7**; `scripts/sweep-pages.mjs` is outside this task's Owns.
- [x] 8. **D11 — `ui/bubble` destructive text** 4.15:1 (`bubble.css:59-61`), light only.
- [x] 9. **D12 — the site's active nav link** 3.82:1 (`site/site.css:88-91`). Site chrome, one line, independent of everything above.
- [x] 10. **C7/C8 — docs-page markup.** `site/pages/use-form.jsx:205` and `:524` render adjacent `<span>`s as `false{}{}` / `falsetrue`; `site/pages/input.jsx:41` has a Density heading with no `<Input>`.
  **Done 2026-08-02.** Labels added outside the `data-pg` spans (tests read span text only, all 46 use-form/input tests green); Density section renders compact/comfortable/spacious `<Input>`s via `ui/density`.
- [x] 11. **C6, E3, I1 — the pre-existing tail.** C6 is a component-behaviour call (`flexRender` fallback vs. demo `cell`). E3 is the `scrollHeight` sub-pixel step, which also hits `ui/accordion`. I1 is reproduce-or-close.
  **Done 2026-08-02.** C6: `flexRender` falls back to the context's `getValue()` (tanstack's default cell) — behaviour change for all consumers, tested. E3: both recipe copies measure `getBoundingClientRect().height` with the animation suppressed for the frame; fractional-height test added. I1: closed, does not reproduce — one range registers for a contiguous match, fuzzy-only matches unpainted as documented.

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

**Status:** COMPLETE
**Branch:** `fix/task72-contrast-cursors` (merged to main, pushed)  **PR:** none — merged locally  **Updated:** 2026-08-02

- **Landed:** all 11 sub-tasks — the four contrast/cursor root causes (D9/D10/F5/F6), the docs and component tail (C6/C7/C8, E3, D11/D12), D13 both halves (token + solid glow), probe extended (focus/exempt rows). Suite 730/730, build clean; the 5 probe FAILs are the filed D14/D15 rows, by design.
- **Repo state:** clean; `stash@{0} "whoops"` is old and not ours.
- **Next:** task 73 (coverage probe) — see the Handoff in `docs/TODO/README.md`.
- **Gotchas:** `styles/defaults.css` is generated — edit `van.defaults.json`; `npm run contracts` after any `ui/**` edit or the conformance suite goes red. Sweep flags `.slider-thumb` as a cursor miss — deliberate, see ISSUES §F4. Do not "fix" D14/D15 without a token design call.
