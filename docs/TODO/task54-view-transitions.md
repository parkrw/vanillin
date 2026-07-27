# task54: view-transitions

**Goal:** `startViewTransition` for theme toggling, route changes, and
list→detail navigation — as progressive enhancement.
**Branch:** feat/view-transitions
**Deps:** none

## Design decisions

- **Step 0 is a live support check** (browser-support gate in the index).
  `document.startViewTransition` for same-document transitions and
  `@view-transition { navigation: auto }` for cross-document are separate
  features with separate support. Probe both, record findings in the log.
- **Every call site is `withViewTransition(fn)`, one helper, never inline.**
  Put it in `lib/view-transition.js`:
  ```js
  export function withViewTransition(update, options) {
    if (!document.startViewTransition || prefersReducedMotion()) { update(); return }
    return document.startViewTransition(() => flushSync(update))
  }
  ```
  - **`flushSync` is mandatory, not optional.** React 18+ batches; without it
    the DOM has not updated when the browser snapshots the "after" state and
    the transition captures nothing. This is the single most common way View
    Transitions silently do nothing in React.
  - Reduced motion short-circuits to a plain update. Do not merely shorten the
    duration — users who ask for no motion get no motion.
- **Theme toggle is the flagship.** A circular wipe from the toggle button
  reads as intentional in a way a crossfade does not: capture the click
  coordinates, animate `clip-path: circle()` on
  `::view-transition-new(root)`. Fall back to the default crossfade when
  `clip-path` on pseudo-elements misbehaves.
  - Gotcha: the root snapshot is the whole page, so a long page makes the wipe
    radius huge — compute the radius from the viewport diagonal relative to
    the click point, not the document.
- **List → detail uses `view-transition-name` on the shared element.** Names
  must be **unique per document at transition time** — two elements sharing a
  name aborts the transition with a console error. Assign the name only to the
  participating row (set on click, cleared after), never to every row.
- **Route transitions in the playground** are the demo vehicle: the hash
  router in `site/registry.js` wraps its state update. Keep this in the
  playground; do not push routing opinions into `ui/`.
- **Durations from tokens** (`var(--motion-medium)`, `var(--motion-ease)`) per
  the HANDOFF motion rule — view-transition pseudo-elements are styled in CSS,
  so this is easy to get right and easy to forget.
- **Nothing may depend on it.** Every affected interaction must be fully
  correct with the API absent; the transition is decoration. Test both paths.

## Sub-tasks

- [ ] 1. Support check for same-document and cross-document view transitions;
  record findings in the log. Files: none (log entry).
- [ ] 2. `lib/view-transition.js` — `withViewTransition` with `flushSync`,
  reduced-motion and unsupported short-circuits, and a `viewTransitionName`
  helper that guarantees uniqueness. Files: `lib/view-transition.js`.
- [ ] 3. Theme toggle circular wipe from the click origin. Files:
  `site/site.css`, the theme-toggle call site.
- [ ] 4. Playground route transition + a list→detail shared-element demo.
  Files: `site/registry.js`, `site/pages/view-transitions.jsx`.
- [ ] 5. Test: with the API stubbed out, every interaction still produces the
  right final DOM; with it present, `startViewTransition` is called once per
  update and not at all under reduced motion; shared-element names are unique
  during a transition and cleared after. Files:
  `tests/view-transitions.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173: toggle the theme repeatedly and fast — no stuck overlay, no
  doubled transition. Rapid re-entry is where this API breaks.
- Emulate reduced motion and confirm instant updates with no console errors.
