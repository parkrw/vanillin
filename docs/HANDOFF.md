# HANDOFF

## What landed (session 2 of 2026-07-26, phase-2 wave two)

**15 more tasks on `feat/phase-2`.** Suite was 538/550 before task 48 was
added; **12 known failures, all cross-task, being fixed by an agent that was
still running when this session ended** (see "In flight" below). `main` is at
`6bfe4d63be91` and untouched.

Done this session: **34** tokenize-core-a, **35** tokenize-core-b, **36**
density-modes, **37** config-generator, **41** form-component, **44**
combobox-multi, **46** navigation-menu-viewport, **48** data-table-columns,
**50** resizable-parity, **51** scroll-area-parity, **54** view-transitions,
**55** highlight-api, **56** forced-colors, **58** carousel-parity.

Plus, not from the task list:
- `--space-1-5` / `--space-2-5` added to the ramp. Tasks 34 and 35
  independently hit the same hole and each rounded inconsistently, always
  downward, silently tightening eight components at default density.
- `lib/use-swipe.js` had **zero consumers** while `ui/drawer` and `ui/toast`
  each hand-copied its windowed-velocity algorithm. Now one primitive with
  conditional pointer capture; both consume it. +3 net lines, tests unmodified.
- Carousel `opts.loop` cloned all N slides both sides (3N nodes). Now measures
  the viewport; a 50-image gallery went 150 nodes → ~56.
- `message-scroller` flake root-caused (test watched upstream state, not the
  downstream observable) and `tests/run.mjs` gained a subset filter.

Specs written: **30** (docs consistency pass), **44**, **48**, **49**.

Per-task decisions, deviations and gotchas: `docs/TODO/LOG.md` (append there,
not to the TODO README).

## In flight when this session ended

One agent on branch `fix/phase-2-integration` (worktree
`../vanillin-wt/integration-fix`) fixing the 12 failures. Its brief forbids
weakening any assertion. Check `git -C ../vanillin-wt/integration-fix log
--oneline feat/phase-2..HEAD` for commits and cherry-pick them. **Note its
target of 550/550 predates task 48's four commits**, so the true total is
higher now — re-run the suite yourself rather than trusting its number.

The three root-cause groups:
- **4 `tokens` failures** — task 37 wires `styles/vanillin.css` into
  `playground/main.jsx` after `globals.css`, and the committed demo config
  re-declares `--accent`/`--primary`/`--radius` at `:root` with a blue hue-265
  brand. It re-themes the whole playground and invalidates 34/35's visual
  baselines. **Decision already made:** scope the generated output to a
  preview container; the kit's default rendering must be byte-identical to
  pre-37. Do not edit the token snapshot tests.
- **6 `forced-colors` failures** — all report `outline-style: none`, i.e. task
  56's `!important` repair rules never apply. The `@import` *is* correctly at
  line 1 of `globals.css` (verified), so it is not being dropped. Prime
  suspect is test isolation: `tests/run.mjs` shares one Playwright page across
  every file in alphabetical order, and 56's final commit added an
  `about:blank` flush to stop `emulateMedia` leaking. If instead the layer
  genuinely fails in a browser, that is an accessibility bug and outranks the
  test.
- **2 `density` failures** — compact and comfortable both resolve to the
  *compact* value. Likely cause: the half-step tokens above were added after
  task 36's spec, so its `[data-density]` block may re-declare only the
  original six `--space-*`, leaving the ramp half-broken in every mode.

## The composition problem — read this before fanning out again

Twenty branches cherry-picked with almost zero conflicts, and that number is
misleading. **The file-ownership discipline that produced it actively
prevented components from composing.** Every agent was told which files it
alone owned and to report rather than touch anything else, so no agent ever
reused another's work. The result:

- `ui/form` reimplements label, description and message instead of using
  `ui/field` and `ui/label` (verified: it imports only React, `react-dom`,
  `lib/cn.js`).
- `ui/data-table` never uses `ui/scroll-area` despite needing horizontal
  scrolling; it relies on `ui/table`'s raw `overflow: auto`.
- Task 44 built its own chips because I told it not to extend `ui/badge` —
  a merge-conflict decision that added a third chip-like thing to the kit.
- `lib/use-swipe.js` sat unused while two components duplicated it.
- `date-input`, `date-picker` and `time-picker` are three real components
  sharing one demo page via three registry aliases.

The fix is not less parallelism — it is briefing agents to *reuse named
components* and assigning a shared file to exactly one owner with the others
reporting requests. When two tasks need the same component, sequence them
instead of duplicating. Cohesion is a design property; it does not survive
being treated as a merge-conflict problem.

### The merge is yours to run

`git merge` / `git rebase` / `git reset --hard` are denied in user settings, so
integration was done by cherry-pick and **`main` must be fast-forwarded by
hand**:

```bash
git checkout main && git merge --ff-only feat/phase-2
```

It is a true fast-forward — `feat/phase-2` branched from `main` and only adds
commits. Afterwards, clean up: `git worktree remove ../vanillin-wt/<name>` for
each, then delete the per-task branches.

## Next step

1. **Land the in-flight integration fix** and get the full suite green. Nothing
   else should start before that.
2. **Task 59 — form bindings (new, user-requested, spec not yet written).**
   The user explicitly asked for this. `ui/form` is deliberately
   engine-agnostic and must stay that way — it may never import
   `lib/use-form.js`. Keep that boundary; add a **third layer above both**
   that ships the wiring nobody currently gets: a `ui/form-bindings/` (name
   is yours) that composes `lib/use-form.js` + `ui/form` + the existing
   `ui/field` / `ui/label` / `ui/input` / `ui/select` / `ui/checkbox`
   controls into a one-import path, so a consumer writes a form without
   hand-rolling glue. shadcn ships `useForm` + `Form` working together; we
   currently ship a context and a to-do. **This task is also where `ui/form`
   should stop reimplementing label/description/message and start using
   `ui/field` and `ui/label`.**
3. **Remaining plan tasks:** **39** container-queries (deps 34, 35 ✓ — hold
   until 48's data-table work is stable, both rewrite `ui/data-table`), **38**
   cli (deps 37 ✓), **49** data-table-scale (deps 48 ✓, spec written, verdict
   is *no windowing layer* — measured), then **30** docs pass last.
4. **Composition backlog** (from the section above, none of it owned by any
   task): `ui/data-table` → `ui/scroll-area`; the `date-input` /
   `date-picker` / `time-picker` shared-page aliasing; the third chip
   implementation in `ui/combobox` vs `ui/badge`; wiring
   `lib/use-highlight.js` into `ui/data-table` (task 55 deferred it and its
   report says exactly what the follow-up needs).

Task files exist for 38, 39, 49, 30 — ready to dispatch as-is.

**Docs policy changed 2026-07-26:** every task now ships its prose in the same
PR as its code. Task 30 is no longer where docs get written — it is a final
consistency/gap pass. Put this in every agent brief.

## Managing the fan-out — read this before dispatching anyone

The job is coordination, not implementation. **The best thing you can do is
absorb work so your agents don't have to.** Every minute you spend removing an
obstacle up front saves an agent ten minutes of flailing, and flailing is
invisible to you until it shows up as a stalled task. Take the extra work.

**Prepare the ground before you launch anything.** This session launched first
and fixed infrastructure second, which was backwards. Before dispatching:

- Pre-create each worktree and symlink `node_modules` into it. Never make an
  agent set up its own environment.
- `tests/run.mjs` honours `VANILLIN_TEST_PORT` — assign each agent a distinct
  port explicitly. Without it they all collide on :5199.
- `node_modules` (no trailing slash) must be in `.git/info/exclude`, or the
  symlink is untracked and `git add -A` stages it. `.gitignore`'s
  `node_modules/` does not match a symlink.

**Assign disjoint files, in writing.** This is the single highest-leverage
thing you can do, and it is why 11 branches cherry-picked with *zero*
conflicts. Two agents needed `styles/globals.css`; one was told "append one
section at the very END", the other "confine yourself to the token blocks above
it, do not reformat". Both obeyed and git merged them silently. Do the same for
`playground/registry.js` ("add your one line, change nothing else").

**Tell them what NOT to touch, and give them somewhere to put it instead.**
"Do not edit `styles/globals.css`; if a token is genuinely missing, report it
rather than adding it" turns a merge conflict into a line in a report.

**Own the verification gate yourself.** Do not make 11 agents each run a
286-test suite; have them run only the files covering what they touched, and
run the full suite once per integration. It is dramatically faster and you
need the integrated result anyway.

**But clean up carefully.** Agents were told to boot long-lived vite servers;
a dozen of them destabilised Chrome and produced failures that looked exactly
like real regressions (the crash point moved between runs — that is the tell).
Worse, the cleanup `pkill -f "vite --port 53"` matched a *still-active* agent's
port and stalled it. Namespace your ports and kill precisely.

**Broadcast conventions the moment you discover them.** `tests/run.mjs`
imports every `tests/*.test.mjs` and calls its default export, so pure-node
tests must be named `*.unit.mjs`. That rule was written down nowhere. One agent
worked it out; another didn't, and its file aborted the entire browser suite
and hid ~350 results. When you learn something like this, `SendMessage` it to
every live agent immediately — do not wait for them to trip over it.

**Read the diagnostics stream while they work.** Unused-variable warnings
surfaced a `useFieldArray` with `insert`/`update`/`replace` declared but unwired,
and a dropped constant in the `command-score` port — both before the agents
reported. Relay these as questions ("check whether X is actually implemented"),
not accusations.

**Verify claims; do not relay them.** Three agents reported the
`message-scroller` failure as "a pre-existing flake". It was — confirmed by
running the base twice (285/286, then 286/286 on identical code). But task 32
also reported a spec-compliant-sounding pulse that was wrong: it used
`var(--motion-medium)`, which is `calc(200ms * var(--motion-scale))`, giving a
~2.5Hz strobe that tracked `--motion-scale` — precisely what its spec
forbade. Cheap checks catch expensive mistakes. Indeterminate loops use fixed
literals here (`ui/spinner` `1s`, `ui/skeleton` `2s`).

**Fix small things yourself; round-trip only what's big.** The pulse was a
one-line CSS fix plus a regression test — faster to do than to explain. The
zod removal touched six files and needed the agent's context, so it went back.

**Guard the zero-dependency rule actively.** An agent added `zod`,
`@hookform/resolvers` and `react-hook-form` as devDependencies (its spec
sanctioned that for a compatibility test) and then imported zod from a
*playground page*, breaking `npm run build`. All three are now removed; the
contract is tested with a hand-written RHF-shaped resolver instead. Runtime
code was never affected. Watch this boundary — a devDependency in a shipped
page is a runtime dependency.

**Cherry-picked commits get new SHAs**, so `git log feat/phase-2..feat/x` keeps
listing commits you already applied. For follow-up fixes, cherry-pick the
explicit SHA, not the range. Also: `git merge-base` trips the `git merge` deny
rule — use `git diff a...b` instead.

## Conventions (must match)

- **Composition: compose when the relationship is semantic, duplicate when it's
  incidental.** A form field genuinely *is* a field, so `ui/form` must use
  `ui/field` and `ui/label`. A carousel arrow merely *looks like* a button, so it
  should not import `ui/button`. The test: would a consumer copying this one file
  be surprised by what came with it? Copy-paste independence is a real property
  we are protecting — "components must use each other everywhere" would destroy
  it, and shadcn duplicates some things deliberately for the same reason.
  **Brief agents to reuse named components**, and give any shared file exactly
  one owner with the others reporting requests. Task 63 tracks the outstanding
  debt.
- `ui/<slug>/<slug>.jsx` + `.css`; block class = component name, variants
  `block--modifier`, subparts `.block-part`. Tokens only (`var(--…)` from
  globals.css), `color-mix(in oklab, …)` for opacity, no hex. No `--shadow-xs`
  — use `--shadow-sm`.
- **Motion: never hard-code durations/easings** — `var(--motion-fast)` /
  `var(--motion-medium)` + `var(--motion-ease)`, reduced-motion guard on
  keyframes. **Indeterminate loops are the exception: fixed literal, never a
  motion token** (they must not track `--motion-scale`).
- `cn()` from `lib/cn.js`; `as` prop instead of asChild; shadcn's exact export
  names.
- Stateful: `useControllableState` + `data-state` (`ui/toggle/`, `ui/tabs/`).
  Disclosure: `usePresence` + measured-height keyframes + `fill-mode: forwards`
  on close (`ui/accordion/`, `ui/collapsible/`).
- Tests: `tests/<slug>.test.mjs` per interactive component, default-exporting
  `async ({ page, baseUrl, test, eq, near })`. **Pure-node tests must be
  `*.unit.mjs`** or the runner will try to call them. `node tests/run.mjs`
  self-hosts vite (port via `VANILLIN_TEST_PORT`, default 5199), playwright-core,
  `channel: "chrome"`.
- Demo page `playground/pages/<slug>.jsx` + `page: lazy(...)` in
  `playground/registry.js`; page imports its component CSS. **The demo page is
  the docs page** — it carries the prose.

## Gotchas

- **Known flake:** `message-scroller: button click returns to bottom and
  re-engages follow` fails intermittently on a clean tree. Pre-existing, not
  phase-2. Second such flake after the combobox one; worth a dedicated fix.
- `@property` changes computed-value representation (oklch alpha `10%` → `0.1`,
  `0.625rem` → `10px`, `color-mix()` resolves). Token tests must normalise
  through a real CSS property, not string-compare. `initial-value` must be
  computationally independent — no `var()`, no `rem`.
- `light-dark()` resolves at the declaring element's `color-scheme`; `.dark`
  must be on `<html>`, a scoped `.dark` on a descendant will not re-resolve
  inherited tokens.
- `@starting-style { transform: scale(0.96) }` corrupts `getBoundingClientRect`
  taken right after `showPopover()`.
- `dispatchEvent` on a modal `<dialog>` fires natively but React's delegated
  handlers never run — use real Playwright pointer input there.
- For motion QA, emulate `no-preference` (Playwright already does). Don't
  "fix" missing-animation reports without checking this first.
- Playground styles: child combinators only (`.pg-section > h3`). Several
  suites click a bare `locator("h2")` as an outside-click target, so a page
  must have exactly one h2 — its title.
- Roving tabindex only for tabs/radio/toolbars; positioning is always-JS
  (`lib/use-anchor-position.js`).
- Visual QA: `npm run dev` (:5173); dark mode = click `.pg-theme-toggle`.
  Hash routes are `#<slug>` (no slash).

## Session preferences (user-stated)

- **Do not invoke any skills.** Exception: `handoff` at ~15% context, then
  prompt the user to start a new session.
- Be concise everywhere — chat, docs, commit messages, PR descriptions.
- **No AI attribution in commits** — no `Co-Authored-By`, no trailers.
- The ~500-net-line branch-size hook is advisory. Never split work over it.
- Tests are required but never test-driven: implementation first, then tests,
  one green run.
