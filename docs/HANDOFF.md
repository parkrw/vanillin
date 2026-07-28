# HANDOFF

## Where things stand

Two branches in flight, **no PR on either**, both off `main` (679/679 there).

**`fix/bug-batch`** — 2 commits. `e13161c` refreshed this file and detailed task
68; `d8183de` is E1's first half. Task 68's other eight items are untouched.

**`feat/mode-toggle`** — branched off `fix/bug-batch`, so **merge that first**.
**All of it is uncommitted** (see below). New `ui/mode-toggle` + a demo page +
`lib/use-color-scheme.js`, and the nav toggle now *is* the component (pays down
BUGS A2 for one component). `mode-toggle` 7/7 in isolation, `npm run build`
clean.

**`npm test` exits 0 even with failures** — the runner isolates per-file
failures, so the `N/M` count is the only signal. Never read exit 0 as green, and
never pipe the run through `tail` (it discards the `FAIL` lines): use
`npm test > <file> 2>&1` then grep `^FAIL`.

Two runs on this branch: 682/686, then 685/686. The difference was the three
known flakes (two `drawer` swipe cases, `message-scroller: button click returns
to bottom` — full-suite order only, 14/14 in isolation). The one real failure was
`status-dot: badge: axe contrast check on all variants (light mode)`.

**Cause, and a landmine worth understanding:** seeding the site from
`systemPrefersDark()` made the initial theme depend on the *host machine's* OS
setting, because `resetPage()` in `tests/run.mjs` reset `colorScheme` to `null`
(= inherit the host's). On a dark-mode machine the whole suite silently tested
the wrong theme. `resetPage()` now pins `colorScheme: "light"`; suites wanting
dark emulate it or click the toggle. **A verification run on this repo is only
meaningful with that pin in place.**

### ⚠️ One failure open — finish this first

After the pin, the suite is **685/686** with a single failure:

```
FAIL  mode-toggle: the sweep actually paints partway through
      — the corner ends up a different colour expected false, got true
```

`start.equals(end)` is true: the sampled corner never changed colour. The same
file is **7/7 in isolation**, and it passed in full-suite order *before* the pin.
The pin reversed the sweep's direction (the run used to start dark, from the host
preference; it now starts light), so **the test depends on the starting theme in
a way it should not** — the defect is almost certainly in the test, not the
sweep, which was verified by eye on real frames.

Where to look, cheapest first:

1. Print the theme at the top of that case. If the page is already dark when it
   starts, the sweep goes dark→light and the corner it samples (`x: 820, y: 520`,
   60×60 on `#mode-toggle`) may be near-identical in both themes — pick a region
   with real contrast, or assert against a computed background colour instead of
   raw PNG bytes.
2. Make the case theme-agnostic: read the current scheme, and assert the corner
   changes *relative to it*, rather than assuming light→dark.
3. Check the viewport. The clip is hard-coded; if the runner's viewport is
   smaller than 880×580 the clip clamps and may sample a constant region.

**Do not weaken it to a keyframe check.** The whole point of this case is that
the previous `mask-image` implementation produced a flawless animation object and
painted nothing; only a pixel assertion caught it.

Uncommitted on `feat/mode-toggle`:

```
M  lib/view-transition.js  registry.json  site/app.jsx
M  site/registry.js  site/site.css  tests/view-transitions.test.mjs
?? lib/use-color-scheme.js  site/color-scheme.js
?? site/pages/mode-toggle.jsx  tests/mode-toggle.test.mjs  ui/mode-toggle/
```

`stash@{0}: On main: whoops` predates this session — not ours, left alone.

`docs/TODO/README.md` carries the durable plan and the settled order; per-task
decisions go in `docs/TODO/LOG.md` (task 39's entry is the newest). Read those
two before planning anything. **Neither branch has a LOG entry yet** — task 68's
and mode-toggle's decisions are only in this file.

### mode-toggle: the design, and why

The user asked for a component where "an icon or a boolean (switch, checkbox)"
could drive the swap. **That axis was argued down and they agreed:** one
component covering `<button aria-pressed>`, `role="switch"` and
`<input type=checkbox>` must import `ui/button` + `ui/switch` + `ui/checkbox`,
so every consumer copying one file gets three components and renders one. Shape
that landed instead:

- **`lib/use-color-scheme.js`** — `useControllableState` + the transition.
  **Owns no persistence and no DOM**: never writes `.dark`, never touches
  localStorage. An app on `next-themes` already does all three and a hook
  repeating them would fight it. Also exports `systemPrefersDark()`.
- **`ui/mode-toggle/`** — one rendering, an icon button. Sun/crescent glyph.
- **A switch or checkbox is a two-line consumer composition** over the hook,
  shown on the demo page. Do not add a `variant` prop for it.
- **`site/color-scheme.js`** is site plumbing, not kit API — the one place the
  docs site keeps the boolean, because the kit hook deliberately won't.

### E1 (light/dark sweep) — three real defects, all fixed

1. **Duration was silently pinned to a fallback.** `--motion-medium` is
   `calc(200ms * var(--motion-scale))` and is **not** `@property`-registered, so
   `getPropertyValue` returns that literal string and `parseFloat` gives NaN.
   The old code fell through to 200ms while the site runs `--motion-scale: 2.5`
   (i.e. everything else was 500ms). Now resolved by normalising through a real
   CSS property — the trick already in Gotchas below.
2. **A second clock raced the first.** `site.css` killed `animation` on
   `::view-transition-old/new(root)` but not on `::view-transition-group(root)`,
   which kept its 250ms UA default and outlasted the reveal. That is the
   mid-sweep stutter. All three are `animation: none` now.
3. **Two sources of truth for `.dark`** — `site/app.jsx` and the demo page each
   held `useState` and both wrote the class, so whichever rendered last won and
   clicking one then the other did nothing. Fixed by `site/color-scheme.js`.

**`mask-image` does not paint on view-transition pseudo-elements in Chrome.**
Verified with a side-by-side probe: `clip-path` clips visibly, an equivalent
`mask-image` shows nothing at all — the snapshot vanishes. A feathered edge is
therefore **not buildable** this way; do not retry it. The reveal is
`clip-path: ellipse()` (1.6× vertical bias, the "sunrise") plus an opacity ramp
from `0.15`, which blends the swept region with the outgoing theme so it passes
through grey. Tune `SUNRISE_BIAS` / `SUNRISE_DIM` / `SUNRISE_DURATION` in
`lib/view-transition.js`.

**The lesson worth keeping:** the first version of these tests asserted the
*shape of the animation object* and passed while nothing rendered. `mode-toggle`
now samples a viewport corner at start / mid-sweep / end and requires all three
to differ. **Motion assertions must be about pixels** — this is exactly the H1
defect class task 68 is meant to sweep.

Also landed since 39: **MIT `LICENSE` and a GitHub Pages deploy**
(`.github/workflows/deploy.yml`) — every push to `main` runs `npm ci && npm run
build` and publishes `site/dist`. **It does not run the tests**, so a red suite
still deploys.

The five absorbed branches are **deleted** — remote and local tracking refs both
gone. `origin/main` is the only remote branch.

### Waiting on the user

One verify item is still open: `npx github:parkrw/vanillin init` from a scratch
Vite app, then rendering the copied components. It targets **`main`** now (task
38's branch is merged). A bare `git clone` + `node <clone>/bin/van.mjs` was
verified locally, which is what `npx github:` reduces to.

**Merges are the user's to run.** `git merge` / `git rebase` / `git reset --hard`
are denied in settings. You cherry-pick; they fast-forward.

## Next step

**Fix the one open failure above (`mode-toggle: the sweep actually paints partway
through`), then land `feat/mode-toggle`**: commit it as one unit and push both
branches. It is all uncommitted and nothing else can proceed cleanly over it. The nav toggle is now an icon button rather than the old `dark mode` text
button — an intentional visual change to the docs site, worth flagging in the PR.

Then **task 68**, from `docs/TODO/task68-bug-batch.md` (written this session, 9
sub-tasks). E1 is done bar its LOG entry; **C2 is next**:

- ~~E1 light/dark sweep~~ — done, `d8183de` + the mode-toggle work
- **C2 `useFormContext()` throws and `FormContext` is unexported** —
  `lib/use-form.js:791-794`; the `try/catch` workaround is at
  `ui/form-fields/form-fields.jsx:36-38`. Add `useFormContextSafe()`.
- C3 stray `htmlFor` on radiogroup labels — `ui/form/form.jsx:119`; workaround
  at `ui/form-fields/form-fields.jsx:301,328`
- **D7 is not what BUGS.md thinks.** The Direction page *does* import
  `ui/switch`, and it is not the D1/D2 contrast family: `switch.css:37,42` moves
  the thumb with physical `translateX`, so a checked switch in RTL travels out
  of its track. It hits **every RTL consumer**. Use `:dir(rtl)`, as
  `ui/data-table/data-table.css:295,389-393` already does.
- C5 root cause found: the `mask-image` at `ui/attachment/attachment.css:198-206`
  fades to `transparent` at both edges, which is what eats the first and last
  cards' outer border. Keep the commented Chrome compositing workaround.
- C4 resize overlap, D8 empty-state alignment, E2 collapsible tail, H1 sweep

`docs/BUGS.md` says to **re-check every line number before acting** — they drift.

**`docs/BUGS.md` asks to be surfaced at the start of any session touching bugs:**
the user's docs-site sweep stopped at `form-fields`, so everything alphabetically
after it is unswept. Task 68 covers *known* bugs only, and expects to grow or
gain a sibling once the sweep finishes.

Order after that: 65 → 66 → 67 → 69 → 70 → 30 → console kit. Rationale is in
`docs/TODO/README.md`; don't re-derive it.

## What 38 and 39 shipped

**Task 39 (container-queries)** touched six components, not all of them — the
"it rewrites every component's CSS" premise the task ran alone on was wrong.

- **Stacked table mode lives in `ui/table`** (`.table--stack`), not
  `ui/data-table`, which renders no table at all. `data-table.css` carries only
  pinning and the resize handle standing down.
- **`ui/table` now sets explicit ARIA roles** — changing `display` strips table
  semantics. Spread *before* `{...props}`. The header row is visually hidden,
  never `display: none`; the `::before` label from consumer-set `data-label` is
  decoration for sighted users only.
- **Dialog reflow changed behaviour on purpose**: a 640px viewport media query
  became a **24rem container query**, so ~416–640px viewports get the roomy row
  layout and side sheets get the narrow one at any viewport. 24rem over 28rem
  for slack against density growth. Sheet headers stay start-aligned.
- **`ui/sidebar` deliberately gets no container** — it swaps to a Sheet via
  `matchMedia` in JS; a container query can't drive a render decision and would
  only desynchronise from `isMobile`.
- Both manifests and `registry.json` were regenerated (`npm run contracts`).

**Task 38 (CLI)** — `bin/van.mjs`: `init` / `add` / `diff` / `build` / `list`,
plus `--cwd`, `--dry-run`, `--overwrite` (`--force` alias), `--yes`, `--silent`,
`--no-color`. Node stdlib only.

- **`registry.json` is generated** by `scripts/build-registry.mjs` from the same
  `deriveRequires` the manifests use, so the upstream graph and the per-copy
  sidecars cannot disagree. `npm run contracts` refreshes manifests *and*
  registry — run it after any `ui/` edit or `npm test` fails.
- **`framework` and `rsc` joined `paths` as top-level config keys.** `init`
  sniffs `package.json` (next-app/next-pages/vite/remix/astro) and puts
  stylesheets where that framework keeps them. Under `rsc`, `add` prepends
  `"use client"` to copied JSX that calls a hook or `createContext` — **zero of
  the 68 components carry the directive**, deliberately, so non-Next bundlers
  never see a module-level directive.
- **The sidecar hashes the bytes written, not the kit's tree.** With RSC
  injection the copy legitimately differs from `ui/<slug>/<slug>.jsx`; recording
  kit hashes made every injected file read as consumer-edited on the next `add`.
  `fileState()` takes expected *content*; `diff` compares through
  `kitFileContent()`.
- **Four file states, only `edited` blocks**: `missing` / `identical` /
  `unmodified` (matches the record — upstream moved, safe to overwrite) /
  `edited`. Atomic per component; others in the same `add` still land.
- **Path safety is an allowlist** — slugs are looked up in the registry, so
  `../evil` fails as "unknown component". `paths.*` runs through `pathError()`.
- `van diff` on the kit's own checkout reports all 68 components matching — a
  free self-check.

## Durable facts

- **The docs site directory is `site/`** (renamed 2026-07-27). Older prose in
  `docs/TODO/` may still say `playground/`.
- **The `van` rename is done**: `van.config.json`, `styles/van.css`,
  `/* Generated by van */`. Deliberately *not* renamed: the package name, the
  `vanillin:resizable:*` localStorage key, the `vanillin-search` highlight key,
  docs-site prose.
- **`styles/van.css` must never be imported by `site/main.jsx`.** It is a
  *consumer's* theme; at equal specificity it wins on source order, re-themes
  the site and pins `--density-scale`. There is a comment saying so — leave it.
- **shadcn is named only on the introduction page.** Everywhere else says
  "upstream".
- **Every task ships its prose in the same PR as its code.** Task 30 is a final
  consistency/gap pass, not where docs get written. Put this in every brief.
- **Manifests are live**: every `ui/<slug>/` carries `.van.json`; conformance
  fails on stale hashes, so any `ui/` edit needs `npm run contracts`.
- **`npm test` runs `tests/*.unit.mjs`** as node child processes before the
  browser files; same substring filters. **Pure-node tests must be
  `*.unit.mjs`** or the runner tries to call a default export.
- **Conformance allowlists live at the top of `tests/conformance.unit.mjs`**,
  each entry with a reason. New exceptions go there, reasoned — never weaken a
  rule.
- **`forced-colors` CSS is correct** — the old failures were input-modality
  leakage between test files, fixed by `resetPage()` in `tests/run.mjs`.

## Decisions — do not re-litigate

- **A state-management library was rejected.** Off-mission; no component needs a
  global store. The fallback (extract the subscription primitive `use-form` and
  `use-data-table` shared) died on measurement — `use-data-table` is eight plain
  `useState` calls.
- **Composition is semantic, not universal.** A form field *is* a field, so
  `ui/form` uses `ui/field` and `ui/label`; a carousel arrow merely *looks like*
  a button and must not import `ui/button`. Test: would a consumer copying this
  one file be surprised by what came with it? Copy-paste independence is a real
  property being protected.
- **`FormItem` deliberately does not compose `Field`** — `Field` renders
  `role="group"`, and a group per form field changes the a11y tree.
- **Independent release windows, one monotonic `kitVersion`.** Per-component
  semver is refused: copy-paste has no escape hatch for the diamond problem.
- **The chip lives in `ui/badge` as `Chip`**, not its own slug.
- **Each `CSS.highlights` consumer gets its own registry name** — one global
  registry, so `ui/data-table` uses `vanillin-table-search`.
- **`van.defaults.json` carries no `theme.brand`** — the kit palette is
  greyscale, so its 53 colour tokens are literal light/dark pairs.
- **No `h1` pass.** No WCAG criterion requires one; "one `h1` per page" is best
  practice only, and fixing it would retarget every `h2` assertion in the suite.
- **No HTTP registry for the CLI.** `npx github:` already ships the whole tree.

## Conventions (must match)

- `ui/<slug>/<slug>.jsx` + `.css`; block class = component name, variants
  `block--modifier`, subparts `.block-part`. Tokens only (`var(--…)` from
  `globals.css`), `color-mix(in oklab, …)` for opacity, no hex. No
  `--shadow-xs` — use `--shadow-sm`.
- **Motion: never hard-code durations/easings** — `var(--motion-fast|medium)` +
  `var(--motion-ease)`, reduced-motion guard on keyframes. **Indeterminate loops
  are the exception: fixed literal** (they must not track `--motion-scale`).
- `cn()` from `lib/cn.js`; `as` prop instead of `asChild`; upstream's exact
  export names.
- Stateful: `useControllableState` + `data-state` (`ui/toggle/`, `ui/tabs/`).
  Disclosure: `usePresence` + measured-height keyframes + `fill-mode: forwards`
  on close (`ui/accordion/`, `ui/collapsible/`).
- Tests: `tests/<slug>.test.mjs` per interactive component, default-exporting
  `async ({ page, baseUrl, test, eq, near })`. `node tests/run.mjs` self-hosts
  vite (`VANILLIN_TEST_PORT`, default 5199), playwright-core, `channel: "chrome"`.
- Demo page `site/pages/<slug>.jsx` + `page: lazy(...)` in `site/registry.js`;
  the page imports its component CSS. **The demo page is the docs page.**

## Gotchas

- **Known flakes:** `drawer` swipe tests (`long slow drag ending in flick`,
  `held still before lift`) and `message-scroller: button click returns to
  bottom` fail in full-suite order only, 14/14 in isolation. Treat a drawer
  timeout as this flake until proven otherwise.
- `@property` changes computed-value representation (alpha `10%` → `0.1`,
  `0.625rem` → `10px`). Token tests must normalise through a real CSS property.
  `initial-value` must be computationally independent — no `var()`, no `rem`.
- `light-dark()` resolves at the declaring element's `color-scheme`; `.dark`
  must be on `<html>`.
- `@starting-style { transform: scale(0.96) }` corrupts
  `getBoundingClientRect` taken right after `showPopover()`.
- `dispatchEvent` on a modal `<dialog>` fires natively but React's delegated
  handlers never run — use real Playwright pointer input.
- For motion QA, emulate `no-preference`. Don't "fix" missing-animation reports
  without checking this first.
- Site styles use child combinators (`.pg-section > h3`). Several suites click a
  bare `locator("h2")` as an outside-click target, so a page must have exactly
  one `h2` — its title.
- `styles/globals.css` has **no `p`/margin reset**. A bare `<p>` keeps its UA
  `margin-block: 1em`, and flex items don't collapse margins, so it *adds* to
  the parent's `gap`. Set `margin: 0` on prose elements you add.
- **zsh does not word-split unquoted `$var`.** A newline-separated file list in
  `git diff … -- $files` becomes one bogus pathspec matching nothing, and an
  empty diff reads as "no differences" — it fails silently and reassuringly. Use
  `git diff -z --name-only … | xargs -0 git diff …`.
- `git merge-base` trips the `git merge` deny rule — use `git diff a...b`.
- **`git branch -a` lists branches deleted on the remote** until `git remote
  prune origin` — another failure that reads reassuringly. Confirm against
  GitHub before reporting branch state.
- `site/dist/` is stale untracked build output; it pollutes `grep -r`. The Pages
  workflow builds its own copy in CI.
- Visual QA: `npm run dev` (:5173); dark mode = click `.pg-theme-toggle`. Hash
  routes are `#<slug>`.

## Fan-out lessons (if you spawn workers again)

The job is coordination. **Absorb work so your agents don't have to** —
pre-create each worktree, symlink `node_modules`, assign each a distinct
`VANILLIN_TEST_PORT` (they all collide on :5199 otherwise), and put
`node_modules` in `.git/info/exclude` (`.gitignore`'s `node_modules/` does not
match a symlink).

- **Assign disjoint files, in writing.** This is why 11 branches cherry-picked
  with zero conflicts. Two agents needing `styles/globals.css` were told
  "append at the very END" and "stay in the token blocks above it"; both obeyed.
- **Brief them to reuse named components.** The file-ownership discipline that
  produced clean merges also *prevented composition* — task 63 exists to pay
  that debt down. `ui/data-table` still doesn't use `ui/scroll-area`.
- **Own the verification gate yourself.** Workers run only the files covering
  what they touched; the head runs the full suite once per integration.
- **Verify claims, don't relay them.** One agent reported a spec-compliant pulse
  that used `var(--motion-medium)` — a ~2.5Hz strobe tracking `--motion-scale`,
  exactly what its spec forbade.
- **Fix small things yourself; round-trip only what's big.**
- **Guard the zero-dependency rule actively.** An agent once added `zod` +
  `react-hook-form` as devDependencies and imported zod from a docs page,
  breaking the build. A devDependency in a shipped page is a runtime dependency.
- **Never detect worker liveness by tmux `pane_title`** — `claude` overwrites it
  within seconds. Keep the task → `pane_id` map. And don't poll with a bare zsh
  glob; `nomatch` aborts the monitor.

## Session preferences (user-stated)

- **Do not invoke any skills.** Exception: `handoff` at ~15% context, then
  prompt for a new session.
- Be concise everywhere — chat, docs, commit messages, PR descriptions.
- **No AI attribution in commits** — no `Co-Authored-By`, no trailers.
- The ~500-net-line branch-size hook is advisory. Never split work over it.
- Tests are required but never test-driven: implementation first, then tests,
  one green run.
