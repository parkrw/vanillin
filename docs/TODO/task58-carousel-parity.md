# task58: carousel-parity

**Goal:** Implement the three embla options `ui/carousel` currently accepts
and ignores: `opts.loop`, `opts.align`, and `plugins`.
**Branch:** feat/carousel-parity
**Deps:** none

## Why

`ui/carousel/carousel.jsx` says it in its own header (lines ~19–20):
`plugins` is stubbed, `opts.loop` is accepted but not implemented. Accepting
an option and silently ignoring it is worse than not accepting it — a
consumer copying the upstream example gets no loop and no error. This is the
last row in phase 2 and is explicitly nice-to-have; if it fights the
scroll-snap architecture, **cut scope and document the deviation** rather than
rebuilding the carousel.

## Design decisions

- **`opts.align` is cheap and should land first.** `start | center | end` maps
  directly onto `scroll-snap-align` on the slides. No JS. Do this even if the
  rest is cut.
- **`opts.loop` is the real work, and scroll-snap makes it awkward.** Embla
  loops by translating slides; a native scroll container cannot wrap.
  Two viable approaches — pick by prototyping, not by argument:
  1. **Clone-and-recentre.** Render clones of the leading/trailing slides at
     each end; when a snap settles on a clone, jump `scrollLeft` by one set
     width with `scroll-behavior: auto` so the jump is invisible. Well-trodden
     and robust; costs duplicated DOM, and clones must be `aria-hidden` and
     have their focusable content `inert` or keyboard order breaks.
  2. **Reorder on settle.** Move the first slide to the end and adjust
     `scrollLeft` compensatingly. No clones, but it moves real DOM nodes,
     which loses focus and breaks React key stability.
  Approach 1 is recommended: `inert` handles the a11y objection cleanly and
  React keys stay stable.
  - The recentre jump **must not fire during momentum scrolling** or it stutters
    — wait for `scrollend` (support-check it; fall back to a settle timeout).
  - Loop changes what "can scroll prev/next" means: `canScrollPrev` and
    `canScrollNext` are always `true` under loop. Update the buttons' disabled
    logic or the arrows go dead at the ends.
- **`plugins` needs a real contract or it should be dropped.** Do not ship a
  second stub. Minimum honest version: a plugin is
  `{ name, init(api, opts), destroy() }`, called on mount/unmount and given
  the same `api` object the carousel already exposes. Ship exactly one plugin
  to prove the contract is usable — **autoplay** (the one everyone wants),
  with pause-on-hover, pause-on-focus-within, pause when the page is hidden
  (`visibilitychange`), and a hard stop under `prefers-reduced-motion`.
  - If the contract cannot be made to carry autoplay cleanly, **remove
    `plugins` from the accepted props** and document that — an honest missing
    prop beats a stub.
- **Do not regress the deferred-capture swipe** (task 24: the 5px dead zone so
  clicks on slide content still fire, and the `e.buttons === 0` stale-drag
  guard). Re-read that code before touching pointer handling.

## Sub-tasks

- [ ] 1. `opts.align` → `scroll-snap-align`. Files: `ui/carousel/carousel.jsx`,
  `ui/carousel/carousel.css`.
- [ ] 2. `opts.loop` via clones + invisible recentre on settle; `aria-hidden` +
  `inert` clones; `canScrollPrev`/`canScrollNext` always true under loop.
  Files: `ui/carousel/carousel.jsx`, `ui/carousel/carousel.css`.
- [ ] 3. Plugin contract + the autoplay plugin, with all four pause
  conditions. Files: `ui/carousel/carousel.jsx`,
  `ui/carousel/plugins/autoplay.js`.
- [ ] 4. Demo sections for align, loop, and autoplay. Files:
  `site/pages/carousel.jsx`.
- [ ] 5. Test: each `align` value sets the expected `scroll-snap-align`;
  under loop, next from the last slide lands on the first and the arrows stay
  enabled; clones are `aria-hidden` and not tab-reachable; autoplay advances,
  pauses on hover and on `visibilitychange`, and never starts under reduced
  motion; the task-24 click-through behaviour still holds. Files:
  `tests/carousel.test.mjs` (extend).

## Verify / done

- `node tests/run.mjs` green (existing carousel suite unmodified);
  `npm run build` clean.
- Manual :5173 `#carousel`: loop past both ends repeatedly — no visible jump,
  no stutter mid-momentum. Tab through a looping carousel and confirm focus
  never lands on a clone.
- Whatever gets cut, record it in the log and remove the prop rather than
  leaving it stubbed.
