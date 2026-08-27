# task116: bug-batch-3
**Goal:** Four unrelated, individually-small foundation bugs from the 2026-08-27 audit, batched like 68/72: iOS scroll lock, controllable-state edge cases, sidebar hydration + dead cookie, unguarded platform APIs.  **Branch:** `fix/bug-batch-3`  **Deps:** none
**Owns:** `lib/scroll-lock.js`, `lib/use-controllable-state.js`, `ui/sidebar/sidebar.jsx`, `lib/schema.js`, `lib/format.js`, plus their test files

Line numbers measured 2026-08-27; re-verify before editing. Each sub-task is independently verifiable; land them as separate commits.

## 1. scroll-lock does not lock iOS Safari

`lib/scroll-lock.js:10-13` (verified): `body { overflow: hidden }` + `padding-right` compensation. On iOS Safari, `overflow: hidden` on body **does not prevent touch scrolling** — the page pans under every open dialog/sheet/drawer on the most common mobile browser. Canonical fix: on lock, save `scrollY`, set `body { position: fixed; top: -scrollY; left: 0; right: 0 }`; on unlock, restore styles then `scrollTo` the saved offset. Keep the existing scrollbar-width compensation for desktop (`window.innerWidth - clientWidth`, `:10`) and note it correctly no-ops under `scrollbar-gutter: stable`. Also: the hardcoded `paddingRight` ignores RTL scrollbar placement — use the logical `paddingInlineEnd`? **No** — the scrollbar side is a UA/platform question, not a text-direction one; measure which side via `document.documentElement` position or accept the desktop-LTR compensation and document the RTL gap in a comment. Decide, write the reason down.

- [ ] Fix + test. The browser suite runs desktop Chrome, which can't reproduce iOS touch scroll — so the test asserts the *mechanism*: lock applies `position: fixed` with the correct `top`, unlock restores the exact scroll position (scroll to 500, lock, unlock, assert 500). Nested locks (`lockCount`, `:8`) must still work — test a dialog-over-dialog.

## 2. use-controllable-state: swallowed repeats, stale functional updates

`lib/use-controllable-state.js:22` (verified): `if (Object.is(resolved, currentRef.current)) return` — `onChange` never fires when the resolved value equals the current one. A controlled parent that *rejected* the previous change (kept `value` the same) can never be re-driven to that value: the user's second click on the same item is dropped. Radix fires `onValueChange` regardless. Second bug: `currentRef.current` is only written in the uncontrolled branch (`:24-27`), so in controlled mode two `setValue(fn)` calls in one task both compute from the same stale base.

- [ ] Fire `onChange` even when the value is unchanged **in controlled mode** (uncontrolled can keep the skip — no render would result; match Radix exactly, read their behavior first and pin it in the test).
- [ ] Sync `currentRef` in controlled mode too (render-time sync when `value` prop changes), so chained functional updates compose.
- [ ] Dev-only warn on controlled↔uncontrolled flips (`value` transitioning `undefined`↔defined) — the classic `value={data?.x}` trap. Warn-once pattern from task115.
- [ ] 24 components ride this hook: full suite is the regression net. Targeted tests on `ui/select` (re-select same item fires `onValueChange`) and `ui/toggle`.

## 3. sidebar: render-time Math.random + write-only cookie

- `ui/sidebar/sidebar.jsx:448` (verified): `Math.floor(Math.random() * 40) + 50` in a `useMemo` during render — guaranteed hydration mismatch in the Next App Router projects the CLI explicitly targets (`rsc` injection exists for exactly them). Fix: deterministic widths (hash the index into the 50–90% range) — visually indistinguishable, hydration-stable.
- `:90` (verified): writes `document.cookie = sidebar_state=…` and **nothing ever reads it** — grep confirms the only other occurrence is the constant at `:33`. Persistence looks implemented and isn't. Fix: read it in the provider's initial state (lazy `useState` initializer parsing `document.cookie`, SSR-safe via `typeof document` guard). If the decision is instead "cookie is for the consumer's server code to read, shadcn parity" — then *say that in a comment* and add the read to the docs page example. Either close the loop or document the half.
- [ ] Both, + a test: set the cookie, mount, assert collapsed state honored.

## 4. Unguarded platform APIs in schema/format

- `lib/schema.js:234` (verified): bare `URL.canParse` — on Safari <17 / Node <18.17 the *validator itself* throws `TypeError` instead of returning invalid. Guard: `typeof URL.canParse === "function" ? URL.canParse(v) : (() => { try { new URL(v); return true } catch { return false } })()`.
- `lib/format.js:31` (verified): `hasDurationFormat` is computed per-runtime; Node 22 has `Intl.DurationFormat`, many shipping browsers don't → SSR renders the `:142` branch, client renders the fallback → hydration mismatch text. Fix: keep the capability check but make both branches produce identical output where feasible; where not feasible, document `suppressHydrationWarning` on `<Duration>` in the docs page. Same file, `:55`: `formatRelativeTime` defaults `now` to `Date.now()` — already injectable; the fix is documentation (SSR consumers must pass `now`) + make `<RelativeTime>` accept and forward it.
- [ ] Guards + unit tests (pure Node: `tests/*.unit.mjs`), simulating the missing API by deleting it from a scratch realm or wrapping the check.

## Verify / done

```sh
node tests/run.mjs sidebar select toggle dialog drawer sheet
node tests/schema.unit.mjs && node tests/format.unit.mjs   # or however run.mjs picks unit files: node tests/run.mjs schema format
npm run contracts && git diff --exit-code registry.json
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: four commits, each with its red-then-green test, baseline unmoved, contracts fresh.

## Out of scope

`use-swipe` `lostpointercapture` (backlog), `usePresence` first-transitionend unmount (backlog — needs a design note on multi-property exits), anchor-position work (backlog), `use-form` (task111).

## Handoff

**Status:** NOT STARTED
