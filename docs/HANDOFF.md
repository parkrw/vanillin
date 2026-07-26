# HANDOFF

## What landed (session of 2026-07-26, phase-2 fan-out)

**11 tasks on `feat/phase-2`, 65 commits, suite 421/421, `npm run build`
clean.** Built by 11 concurrent worktree agents, cherry-picked onto the
integration branch. `main` is untouched at `cbb2041`.

Done: **31** cursor-affordance, **32** status-colors, **33** token-foundation,
**40** use-form-core, **42** format-intl, **43** select-parity, **45**
command-fuzzy, **47** data-table-filtering, **52** swipe-velocity, **53**
date-picker-parity, **57** platform-polish.

Per-task decisions, deviations and gotchas: `docs/TODO/LOG.md` (append there,
not to the TODO README).

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

Phase 2 continues. Remaining: **34, 35** (tokenize-core, both deps 33 ✓) →
**36, 37, 39** → **38**; plus independents **41** (deps 40 ✓), **44** (deps 43
✓), **46**, **48** (deps 47 ✓), **49**, **50**, **51**, **54**, **55**, **56**,
**58**. Then **30** last.

Task files exist for 37, 38, 41, 46, 50, 51, 54, 55, 56, 58 — most written this
session, ready to dispatch as-is. **Missing and must be written first: 34, 35,
36, 39, 44, 48, 49, 30.**

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
