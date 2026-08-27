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

- [ ] 1. Align the 61 initial-values; regenerate defaults (`npm run theme:defaults` must be diff-clean afterwards — the values move in `globals.css`, not the generated file); the agreement unit test.
- [ ] 2. The `light-dark()` floor decision + its artifact (README/DECISIONS + marker rule, or generator fallback emission).
- [ ] 3. The scoped-`.dark` measurement test + whichever documentation/re-aim it dictates.
- [ ] 4. The `overlay` decision recorded in DECISIONS; QUIRKS entry; follow-up task seeded if "fix".
- [ ] 5. Re-run `scripts/contrast-nontext.mjs` — the initial-value alignment must not change any *measured* ratio (values now match shipped, so nothing rendered moves; the probe proves it).

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

**Status:** NOT STARTED
