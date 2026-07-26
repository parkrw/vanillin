# task51: scroll-area-parity

**Goal:** Overflow-edge affordances, overscroll squish, and snap suspension in
`ui/scroll-area`.
**Branch:** feat/scroll-area-parity
**Deps:** none (task 20 landed the overlay-bar base)

## Design decisions

- **`overflowEdgeThreshold` + `data-overflow-*` is the load-bearing feature.**
  Base UI exposes whether content is clipped at each edge so consumers can
  render a fade mask or a "scroll for more" hint. Without it, an overflowing
  panel looks identical to a full one — the single most common console UI bug.
  - Set `data-overflow-start` / `data-overflow-end` (logical, per axis:
    `data-overflow-x-start` etc.) on the root when scrolled content extends
    past that edge by more than `overflowEdgeThreshold` px (default 0).
  - Drive it with an `IntersectionObserver` on zero-size sentinels at each
    edge, **not** a scroll handler — the existing thumb sync is already
    imperative on scroll; adding more work there is the wrong direction.
    Threshold maps to an observer `rootMargin`.
  - Recompute on resize via the `ResizeObserver` the component should already
    have for thumb sizing; reuse it rather than adding a second.
  - Ship a demo showing the intended use (a CSS `mask-image` fade keyed off
    the attributes) — the attributes are useless without a worked example.
- **Overscroll squish** is the iOS-style rubber-band on a non-scrollable edge.
  - Only under `prefers-reduced-motion: no-preference`, and only for touch/pen
    pointers — a trackpad already has native overscroll on macOS and doubling
    it feels broken.
  - Implement as a transform on the content wrapper with a damped
    displacement (`delta * 0.3`, clamped), released with a spring back on
    pointerup via `var(--motion-medium)` / `var(--motion-ease)`. No hard-coded
    durations (HANDOFF motion rule).
  - **Must not hijack a real scroll:** only engage when the scroller is
    already at the extreme *and* the gesture continues past it. Reuse
    `lib/use-swipe.js` rather than writing another pointer state machine.
- **Snap suspension.** A scroll-snap container fights programmatic scrolling
  and drag-based thumb movement — the browser re-snaps mid-interaction.
  Suspend `scroll-snap-type: none` for the duration of a thumb drag or a
  programmatic scroll, restore on settle (`scrollend` where available, a
  timeout fallback where not — check support).
  - This matters because `ui/carousel` and `ui/attachment` both use scroll
    snap and both can sit inside a scroll area.

## Sub-tasks

- [ ] 1. Edge sentinels + `overflowEdgeThreshold` + `data-overflow-*`, reusing
  the existing `ResizeObserver`. Files: `ui/scroll-area/scroll-area.jsx`,
  `ui/scroll-area/scroll-area.css`.
- [ ] 2. Snap suspension around thumb drags and programmatic scrolls, with the
  `scrollend` support check and fallback. Files:
  `ui/scroll-area/scroll-area.jsx`.
- [ ] 3. Overscroll squish via `lib/use-swipe.js`, touch/pen only, reduced-
  motion guarded. Files: `ui/scroll-area/scroll-area.jsx`,
  `ui/scroll-area/scroll-area.css`.
- [ ] 4. Demo: a fade-mask example driven by `data-overflow-*`, a snap-content
  example, and the squish. Files: `playground/pages/scroll-area.jsx`.
- [ ] 5. Test: attributes appear/disappear at each edge and respect a non-zero
  threshold; both axes; attributes update after content shrinks to fit;
  `scroll-snap-type` is `none` during a thumb drag and restored after; squish
  does not engage for a mouse pointer nor under reduced motion. Files:
  `tests/scroll-area.test.mjs` (extend).

## Verify / done

- `node tests/run.mjs` green (existing scroll-area suite unmodified);
  `npm run build` clean.
- Manual :5173 `#scroll-area` with a trackpad: native overscroll only, no
  double rubber-band.
- Nested case: a snapping carousel inside a scroll area — dragging the outer
  thumb must not re-snap the inner one.
