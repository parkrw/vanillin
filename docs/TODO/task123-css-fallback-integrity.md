# task123: css-fallback-integrity
**Goal:** The token system's fallback paths tell the truth: `@property` initial-values agree with the shipped theme, `light-dark()` has a stated degradation story, scoped `.dark` is either real or documented away, and the Chromium-only `overlay` polish gets an explicit decision.  **Branch:** `fix/css-fallbacks`  **Deps:** 84 (both own `styles/globals.css` `@property` blocks — serialize behind it, or coordinate if 84 hasn't run)
**Owns:** `styles/globals.css`, `van.defaults.json` (regenerated `styles/defaults.css` via `npm run theme:defaults`), `tests/tokens.test.mjs`, `docs/QUIRKS.md` (one entry if sub-task 3 confirms)

Line numbers measured 2026-08-27; re-verify.

## Findings

1. **`@property` initial-values are the pre-contrast-fix shadcn numbers.** Verified drift: `--input` initial `oklch(0.922 0 0)` (`globals.css:61`) vs shipped light `oklch(0.65 0 0)` (`defaults.css:29`); `--ring` `0.708` (`:63`) vs `0.65` (`:40`); `--muted-foreground` `0.556` (`:55`) vs `0.54` (`:34`). The tightened values are deliberate WCAG repairs (tasks 71/72, `scripts/contrast-nontext.mjs`). Every fallback path — Safari 17.0–17.4, an invalid consumer token, a missing `defaults.css` — silently reinstates the exact non-text-contrast failures the project already fixed, with nothing visibly broken to signal it. `tests/tokens.test.mjs:209-246` verifies fallback *happens* but never that the fallback *value* matches. Fix: align all 61 registrations with `defaults.css` light values, and add the agreement test (parse both files, assert per-token equality) so they can never drift again — that test is the durable deliverable.
2. **`light-dark()` has no fallback layer.** All 47 color tokens are bare `light-dark()` in `defaults.css` with no preceding plain declaration and no `@supports` guard: Firefox ≤127 (ESR 115 included) and stale Safari get invalid colors kit-wide — hard failure, not degradation. Decide the floor explicitly: **(a)** accept it — then this task's work is the README floor statement (task110 wrote it; verify it names `light-dark()` as hard-required) plus an `@supports not (color: light-dark(#000,#fff))` marker rule that makes the failure *diagnosable* (a visible dev-console-detectable custom property, not a repair); or **(b)** soften it — emit a plain light-value declaration before each `light-dark()` line from the generator (mechanical: `build-theme.mjs` writes `defaults.css`; one extra line per token, dark mode then requires the `.dark`-class JS path on old engines). (b) is real support for Firefox ESR at the cost of doubling the token block; recommend (a) now, (b) only if a consumer actually asks — but the *decision* lands here either way, in `docs/DECISIONS.md`.
3. **Scoped `.dark` subtrees are probably broken and untested.** The dark theme rides `light-dark()` re-resolution, but registered custom properties compute on `:root` and inherit *already resolved* — a `<div class="dark">` likely gets light colors with dark form controls. Every existing test toggles only `documentElement`; meanwhile `button.css:70`, `input-group.css:195`, `native-select.css:42` ship `.dark X` descendant rules implying subtree support. **Measure first** (house rule): one test toggling `.dark` on a wrapper div, asserting a child card's computed background. If it fails: document root-only dark in README + QUIRKS, and re-aim those three descendant rules; if it passes: keep the test as the guard and delete this paragraph's fear.
4. **The `overlay` transition property is Chromium-only** (14 sites: popover, select, dropdown, tooltip, hover-card, combobox, nav-menu…). Safari/Firefox drop the panel from the top layer the instant `hidePopover()` runs — exit animations clip or vanish. Options: accept (document per-engine polish, cheapest), or keep panels alive through exit via the existing `usePresence`/JS-delayed `hidePopover` path (real work, one pattern-setter then re-exports). This task makes the decision and lands the *cheap* half (documentation + a QUIRKS entry); if the decision is "fix", the fix is seeded as its own follow-up task with task122's WebKit evidence in hand — don't bundle it here.

## Sub-tasks

- [x] 1. Align the 61 initial-values; regenerate defaults (`npm run theme:defaults` must be diff-clean afterwards — the values move in `globals.css`, not the generated file); the agreement unit test.
- [x] 2. The `light-dark()` floor decision + its artifact (README/DECISIONS + marker rule, or generator fallback emission).
- [x] 3. The scoped-`.dark` measurement test + whichever documentation/re-aim it dictates.
- [x] 4. The `overlay` decision recorded in DECISIONS; QUIRKS entry; follow-up task seeded if "fix".
- [x] 5. Re-run `scripts/contrast-nontext.mjs` — the initial-value alignment must not change any *measured* ratio (values now match shipped, so nothing rendered moves; the probe proves it).

## Verify / done

```sh
node tests/run.mjs tokens contrast
node scripts/contrast-nontext.mjs
npm run theme:defaults && git diff --exit-code styles/defaults.css
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: the agreement test exists and passes (red against today's values), sub-task 3's question has a measured answer recorded in the Handoff, and both decisions (floor, overlay) are in DECISIONS with reasoning.

## Out of scope

Cascade layers / class prefixing (policy, task124), the `prefers-contrast` token-repair-vs-consumer-override ordering (file in ISSUES if not present — needs a design that survives `van.css` loading last), forced-colors (already solid), token payload dedup.

## Handoff

**Status:** DONE — branch `fix/css-fallbacks`, uncommitted.

### Sub-task 3's measured answer

**Scoped `.dark` is broken, as suspected.** A `<div class="dark">` gets `color-scheme: dark` on the subtree, so form controls darken, but `--card` on a child computes to `oklch(1 0 0)` — the light arm — and the child renders white. Registered custom properties resolve at `:root` against the root's light `color-scheme` and inherit *already resolved*, so `light-dark()` never re-resolves down-tree. Root-only dark is now the documented, decided model (DECISIONS "Browser floor"), pinned by two tests: one asserting the subtree stays light, one asserting root `.dark` goes dark.

The three `.dark X` descendant rules were **not** re-aimed: `ui/button/button.css:70`, `ui/input-group/input-group.css:195`, `ui/native-select/native-select.css:42` are outside this task's `Owns` list and outside the batch's `styles/`-only grant. Filed as #57. Recipe for whoever takes it: use `:where(html).dark X`. Both `:root.dark X` (0,3,0) and `html.dark X` (0,2,1) outrank the sibling `.btn--outline:hover` (0,2,0) and would silently kill hover in dark mode; `:where()` contributes zero specificity and keeps the existing (0,2,0) tie, which source order already resolves in hover's favour.

### Two defects found that the findings did not predict

1. **`--typeset-size` and `--typeset-flow` were never registered at all.** Their `initial-value` was `1rem`/`1.5rem`, and a non-computationally-independent `initial-value` makes the browser drop the entire `@property` rule. Measured by listing accepted `CSSPropertyRule`s: 63 accepted against 65 declared. Both tokens had no type guard and no fallback — the exact hole task 84 exists to close, sitting inside task 84's own file. Fixed to `16px`/`24px`; a test now diffs declared against accepted on every run.
2. **`@property … syntax: "*"` provides no fallback whatsoever.** Task 84's three `--typeset-font-*` registrations are decorative. Measured against a `cursive` control: with the token invalidated, a `p` using it renders `cursive` (inherited), not the mono stack. A `<color>` token in the same test lands on its `initial-value` correctly. The misleading comment in `globals.css` has been corrected and the behaviour pinned; the repair (a `var()` fallback at each of 11 consumption sites, 5 of them in `ui/`) is **not** done — out of ownership, filed as #56.

### Also worth knowing

The repo's pre-existing fallback tests passed vacuously. `setProperty(name, "not-a-color")` on a registered property is rejected at *parse* time, so no fallback ever occurred; the test then read the shipped value, which happened to equal the `initial-value`. Reaching a real `initial-value` needs `var(--undefined-token)` **on the root element** — on a child, `inherits: true` yields the inherited value instead. Those tests are repaired, and a control value distinct from both is now used so a coincidence cannot read as a pass.

Finding 2's browser figure was wrong and is corrected in the decision: `light-dark()` shipped in **Firefox 120**, not 129, so ESR 115 is the hard-fail case. The "≤127" figure belongs to `@property` token *interpolation*, a separate and much softer limit — README.md's support table already had both right.

Note also that `scripts/contrast-nontext.mjs` **exits 0 even when it reports FAIL lines**, so the `contrast-nontext && check-tokens` chain in the Verify block does not gate on contrast. Read its output, do not trust its exit code.

`scripts/contrast-nontext.mjs` reports **5 pre-existing FAILs** (progress track, slider rail, and three others) on `main` as well as here — byte-identical output before and after this task's changes. Not caused by this work and not in its scope.
