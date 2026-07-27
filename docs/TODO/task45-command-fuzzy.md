# task45: command-fuzzy

**Goal:** Replace `ui/command`'s substring filter with cmdk's scoring
algorithm, re-sort items and groups by score, and add `Command.Loading`.
**Branch:** feat/command-fuzzy
**Deps:** none

## Why

`ui/command`'s `defaultFilter` is a case-insensitive substring match that
preserves DOM order (documented in the file's own comment). cmdk's is a fuzzy
score that also *re-sorts*, which is why typing "gp" in cmdk surfaces "Git
Push". Without re-sorting, a command palette is just a filtered list.

## Design decisions

- **Port `command-score`, do not invent a scorer.** cmdk's algorithm is a
  small, well-tuned recursive matcher (MIT). Porting it verbatim is the
  correct call — a hand-rolled scorer will rank plausibly on the demo and
  badly on real data. Keep its constants and its comments; note the provenance
  and licence in the file header.
  - It is recursive with memoisation; keep the memo table, and cap input
    length so a pathological paste cannot blow the stack.
- **Score, then sort — in that order, in one pass per search change.** Items
  compute a score; groups take the max score of their visible items; both are
  re-ordered. Ties keep DOM order (stable sort) so the empty search renders
  exactly the authored order.
- **Re-sorting must not thrash the DOM.** The current implementation hides
  non-matching items in place. Sorting means reordering real nodes, which
  loses focus and breaks the highlight if done naively. Reorder via CSS
  `order` on a flex list rather than moving nodes — the highlighted element
  stays the same DOM node, and `scrollIntoView` still works. Verify keyboard
  navigation follows *visual* order, not DOM order, once `order` is in play
  (it does not for free — arrow keys walk the DOM, so the nav helper must sort
  by computed `order`).
- **`shouldFilter={false}`** must keep working untouched: async/server-filtered
  palettes own their own ordering and this task must not reorder for them.
- **A custom `filter` prop returning a 0–1 score** is cmdk's contract and is
  already the shape of our `defaultFilter`, so custom filters get sorting for
  free. Document that a filter returning only 0/1 yields DOM order — that is
  the back-compat story for anyone who wrote one.
- **`Command.Loading`** — renders its children while an async filter is in
  flight, `aria-live="polite"` with a `role="status"`, and must not be counted
  by `CommandEmpty`'s "no results" check. Small, but it is the missing piece
  for server-backed palettes.

## Sub-tasks

- [ ] 1. Port `command-score` as `lib/command-score.js` with provenance
  header, memoisation, and an input-length cap. Files: `lib/command-score.js`,
  `tests/command-score.test.mjs` (pure function — table-driven cases from
  cmdk's own fixtures).
- [ ] 2. Wire scoring + `order`-based re-sort for items and groups; make
  keyboard navigation follow visual order. Files: `ui/command/command.jsx`,
  `ui/command/command.css`.
- [ ] 3. `Command.Loading`. Files: `ui/command/command.jsx`,
  `ui/command/command.css`.
- [ ] 4. Demo sections: fuzzy example that only works with scoring ("gp" →
  "Git Push"), plus an async/loading example. Files:
  `site/pages/command.jsx`.
- [ ] 5. Test: "gp" ranks "Git Push" first; groups re-order by best member;
  ties keep authored order; `shouldFilter={false}` does not reorder; arrow
  keys traverse visual order after a re-sort; `Command.Loading` announces and
  does not trigger `CommandEmpty`. Files: `tests/command.test.mjs` (extend).

## Verify / done

- `node tests/run.mjs` green (existing command suite unmodified and still
  green); `npm run build` clean.
- Type a long nonsense string into the demo palette — no jank, empty state
  shows, no console errors.
- Confirm the highlighted item survives a re-sort (it must stay highlighted,
  not jump to whatever landed in its old position).
