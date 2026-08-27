# task114: toast-announce
**Goal:** Toasts that screen readers actually announce, errors that interrupt, a queue that can't melt the page, and one shared timer instead of N polling loops.  **Branch:** `fix/toast-announce`  **Deps:** none
**Owns:** `ui/toast/**`, `tests/toast.test.mjs`, `site/pages/toast.jsx` (only if a fixture is needed)

Line numbers measured 2026-08-27; re-verify before editing.

## Findings

1. **The live region is born with its content.** `ui/toast/toast.jsx:216` (verified): `if (allToasts.length === 0) return null` — the `<section aria-label="Notifications">` and every `role="status" aria-live="polite"` item (`:432-433`) enter the DOM in the same commit as the first toast. Live regions must exist *before* content is inserted for most AT to announce the mutation; as shipped, toasts are very likely silent to screen readers. Fix: render the section (with an always-present, visually-hidden live region) unconditionally.
2. **Errors are `polite`.** `toast.error()` renders the same `role="status"`/`aria-live="polite"` as everything else. Errors should be `role="alert"` (implicit assertive). Map variant → role at the item.
3. **No queue cap.** `:245` renders `allToasts.map(...)` — all of them. `visibleToasts` (`:337`) only computes a CSS class; the DOM node, swipe handlers, and timer exist for every queued toast. A retry loop firing `toast.error()` per attempt degrades the whole page. Fix: cap the live queue (drop-oldest or coalesce beyond `visibleToasts * 2` — pick one and document it in the ApiReference), keep the imperative API returning ids that may already be dropped.
4. **Per-toast 50ms polling.** `:402` (verified): each toast reschedules `setTimeout(tick, Math.min(left, 50))` to implement hover/blur pause — 200 toasts = 4,000 timer fires/sec. `lib/use-ticker.js` already exists, is excellent, and shares one timer per interval across subscribers; move the countdown onto it (or event-driven pause/resume timestamps, which needs no ticking at all — prefer that if the math stays readable).
5. **Store churn (fix opportunistically, don't force it):** `notify`/`updateToast`/`dismissToast` (`:13-39`) copy/map the whole array and every `useSyncExternalStore` subscriber re-renders on any change. The queue cap bounds the damage; deeper per-toast subscription is backlog.

## Sub-tasks

- [ ] 1. Persistent `<section>` + hidden live region; toasts render inside it. Test: assert the live region exists in the DOM **before** any toast fires (red today), then that a fired toast's text lands inside it.
- [ ] 2. `role="alert"` for `error` (decide: `warning` too? — match sonner, document the choice). Test asserts the role per variant.
- [ ] 3. Queue cap + policy. Test: fire cap+5 toasts, assert DOM node count == cap and the newest are the survivors (or oldest, per the chosen policy).
- [ ] 4. Countdown off the 50ms poll — either `use-ticker` or timestamp-based pause/resume. Tests to keep green: hover-pause, blur-pause, swipe-dismiss, `duration: Infinity`. Assert rendered state, never timer objects (house rule: pixels/computed values, not animation objects).
- [ ] 5. `npm run contracts` — `ui/toast` edits change hashes.

## Verify / done

```sh
node tests/run.mjs toast
npm run contracts && git diff --exit-code registry.json ui/toast/.van.json
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: sub-task 1 and 3 tests were red first; the existing toast suite (queue, stacking, hover-pause, swipe) is green unmodified except where the cap legitimately changes counts; baseline unmoved.

## Out of scope

Per-toast store subscriptions, toast API surface changes (sonner parity is settled), `message-scroller` perf (backlog).

## Handoff

**Status:** NOT STARTED
