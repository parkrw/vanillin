# Quirks

Traps that cost someone a debugging session. Rules and commands live in `AGENTS.md`; settled calls in `DECISIONS.md`.

## CSS and rendering

- `@property` changes computed-value representation (alpha `10%` → `0.1`, `0.625rem` → `10px`). Token tests must normalise through a real CSS property, and `initial-value` must be computationally independent — no `var()`, no `rem`.
- `light-dark()` resolves at the declaring element's `color-scheme`, so `.dark` must be on `<html>`.
- `@starting-style { transform: scale(0.96) }` corrupts a `getBoundingClientRect` taken right after `showPopover()`.
- `height: 0` cannot collapse a `border-box` element that carries padding, and a zero-height flex child still occupies its slot in the parent's `gap`. Both remainders are released in one frame when React unmounts the node, outside any animation. Disclosure spacing therefore goes on an **inner wrapper** — `ui/accordion` does this, `ui/collapsible`'s demos had to be fixed to match (ISSUES E2).
- A border under a `mask-image`, filter or transform still reports full `border-width` in `getComputedStyle` while painting nothing. Assert pixels for anything those can suppress.
- `styles/globals.css` has **no `p`/margin reset**. A bare `<p>` keeps its UA `margin-block: 1em`, and flex items don't collapse margins, so it *adds* to the parent's `gap`. Set `margin: 0` on prose you add.
- `styles/van.css` must never be imported by `site/main.jsx` — it is a *consumer's* theme and at equal specificity wins on source order, re-theming the site and pinning `--density-scale`. There is a comment saying so; leave it.

## Tests

- `resetPage()` pins `colorScheme: "light"`. Keep it pinned: the site seeds its theme from `prefers-color-scheme`, so resetting to `null` makes every suite depend on whether the developer's OS is in dark mode.
- Assert motion in pixels, never animation objects. To catch a mid-frame, set `--motion-scale` high (25 works) and screenshot — Playwright does capture view-transition pseudos.
- For motion QA emulate `no-preference`. Don't act on a missing-animation report before checking this.
- `dispatchEvent` on a modal `<dialog>` fires natively but React's delegated handlers never run. Use real Playwright pointer input.
- A page must have exactly one `h2` — its title. Several suites click a bare `locator("h2")` as an outside-click target. Site styles use child combinators (`.pg-section > h3`), so page structure matters.
- Concurrent suites each need their own `VANILLIN_TEST_PORT`; the runner pins one port with `--strictPort`. CPU contention manufactures flakes — see ISSUES G before believing a timing failure, and re-run the file in isolation.
- **`forced-colors` CSS is correct.** Those failures were input-modality leakage between test files, fixed by `resetPage()` in `tests/run.mjs`. Don't re-fix the CSS.

## Shell and git

- **zsh does not word-split unquoted `$var`.** A newline-separated file list in `git diff … -- $files` becomes one bogus pathspec matching nothing, and an empty diff reads as "no differences" — it fails silently and reassuringly. Use `git diff -z --name-only … | xargs -0 git diff …`.
- `merge.conflictStyle` is `zdiff3`, so conflicts carry a third section (`||||||| <sha>`) holding the common ancestor. It is context, **never a resolution** — in lazygit it is a selectable hunk, and picking it reverts the region to the ancestor.
- `git branch -a` lists branches already deleted on the remote until `git remote prune origin`. Confirm against GitHub before reporting branch state.
- `site/dist/` is stale untracked build output and pollutes `grep -r`. The Pages workflow builds its own copy in CI.
- Visual QA: `npm run dev` (:5173), hash routes are `#<slug>`, dark mode is the `.pg-theme-toggle` button.
