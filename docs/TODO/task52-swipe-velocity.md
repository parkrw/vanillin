# task52: swipe-velocity

**Goal:** Flick-to-dismiss for `ui/toast` and `ui/drawer` — a fast short swipe
dismisses, the same as a slow long one.
**Branch:** feat/swipe-velocity
**Deps:** none

## Why

`lib/use-swipe.js` already computes and reports `velocity` (px/ms) in its
`onEnd` payload — see its `@param` doc and the `delta / elapsed` line. Both
consumers currently ignore it and dismiss on distance alone, so a quick flick
that does not travel far snaps back. That is the one interaction people notice
immediately on touch.

## Design decisions

- **Dismiss if `distance > threshold` OR `velocity > velocityThreshold`.** Not
  a blended score — two independent gates are predictable and easy to tune.
  Start at `0.5` px/ms (≈ a deliberate flick, well above an accidental drag)
  and tune against the real demo on a trackpad and a touchscreen.
- **Direction must agree.** A fast swipe *back toward* the resting position is
  not a dismissal. Gate on `Math.sign(velocity) === Math.sign(delta)` and on
  the sign matching the component's dismiss direction, or a sloppy return
  gesture will fire a dismiss.
- **Velocity must be measured over a recent window, not the whole gesture.**
  `delta / elapsed` across a two-second drag that ends with a flick reports a
  near-zero velocity. Change `use-swipe.js` to compute velocity over the last
  ~100ms of pointer samples (keep a small ring buffer of
  `{ time, position }`), and keep reporting the same `velocity` field name so
  neither consumer's call site changes shape.
  - **This is the actual work of the task.** The consumers are two small
    conditionals; the sampling fix is what makes them behave.
  - Guard the degenerate cases: a single sample, a zero-duration gesture, and
    a gesture whose last samples are all identical (finger held still before
    lift → velocity 0, which is correct and must not divide by zero).
- **The exit animation should follow the flick.** A dismissal at high velocity
  animates out faster than a threshold-crossing drag — but per the HANDOFF
  motion rule, do not hard-code a duration: scale `var(--motion-fast)` via a
  CSS custom property set from JS, and keep the easing token.
- **Reduced motion:** a flick still dismisses; it just does not animate.
  Existing reduced-motion guards in toast/drawer must keep working.

## Sub-tasks

- [ ] 1. Windowed velocity sampling in `lib/use-swipe.js` (ring buffer, ~100ms
  window, degenerate-case guards), same `onEnd` payload shape. Files:
  `lib/use-swipe.js`.
- [ ] 2. `velocityThreshold` gate + direction agreement in toast and drawer;
  velocity-scaled exit. Files: `ui/toast/toast.jsx`, `ui/toast/toast.css`,
  `ui/drawer/drawer.jsx`, `ui/drawer/drawer.css`.
- [ ] 3. Test: a synthesised fast short swipe dismisses where the same
  distance dragged slowly does not; a fast swipe in the wrong direction does
  not dismiss; velocity is measured from the recent window (a long slow drag
  ending in a flick dismisses); held-still-then-lift does not. Drive with
  Playwright `dispatchEvent` pointer sequences with explicit timestamps so the
  timing is deterministic. Files: `tests/toast.test.mjs`,
  `tests/drawer.test.mjs` (extend both).

## Verify / done

- `node tests/run.mjs` green (existing toast/drawer suites unmodified);
  `npm run build` clean.
- Manual :5173 `#toast` and `#drawer`: flick, slow drag, and a drag that
  returns to rest — all three feel right, and a plain click on toast content
  still does not dismiss.
