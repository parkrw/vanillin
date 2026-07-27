# task46: navigation-menu-viewport

**Goal:** Add the shared morphing viewport and the sliding indicator to
`ui/navigation-menu`, turning the two compat no-ops into real components.
**Branch:** feat/navigation-menu-viewport (see split note)
**Deps:** none (task 15 landed viewport-less mode)

## Split this task

The index flags this row as under-specified and expects a split. Confirmed on
approach: **land the viewport first, the indicator second**, as two branches.
The indicator's position is derived from the active trigger and its *size* is
only meaningful once the viewport exists to point at, so building them
together means debugging two coordinate systems at once.

- `feat/navigation-menu-viewport` — sub-tasks 1–4
- `feat/navigation-menu-indicator` — sub-tasks 5–7, branched off the first

## Why

`ui/navigation-menu`'s header says it plainly: per-item panels only,
`viewport` swallowed, `NavigationMenuViewport` and `NavigationMenuIndicator`
are no-ops (lines ~15, ~351, ~357). Upstream's default is the *viewport* mode —
one shared panel that morphs between menu contents. Consumers who copy
upstream's markup get a silently different look today.

## Design decisions

- **Viewport mode is the default, matching upstream, but the existing
  viewport-less mode must survive untouched** behind `viewport={false}`. Task
  15's per-item panels are the better pattern for wide menus and the demo
  should keep showing both. Flipping the default is the only behaviour change
  this task is allowed to make; call it out in the log.
- **One viewport element, content teleported into it.** The open item's
  content renders into the shared viewport rather than under its own trigger.
  Use the existing `lib/portal.jsx` — do not invent a second portal.
  - Keep every item's content mounted-but-hidden as today, or typeahead and
    link prefetch break; teleport only the *active* one.
- **The morph is a size + position animation, and it is the whole feature.**
  - Measure the incoming content with a `ResizeObserver` and drive
    `--viewport-width` / `--viewport-height` custom properties on the
    viewport; animate `width`/`height` from the previous values.
  - Animating `width`/`height` directly is a layout animation on every frame.
    Prefer animating a `transform: scale()` on a wrapper with the content
    counter-scaled, **or** measure and use `interpolate-size`/`calc-size` if
    the live support check says they are safe. Decide by measuring, not by
    preference — a janky morph is worse than no morph.
  - Durations/easings from `var(--motion-medium)` / `var(--motion-ease)`
    (HANDOFF motion rule). The morph must be suppressed under
    `prefers-reduced-motion` — content swaps instantly, no size animation.
  - **First open does not morph** (there is no previous size to morph from);
    it fades/scales in like the current panels do.
- **Directional awareness.** Moving from a left trigger to a right one should
  slide content in from the right. Track the previous active index and set
  `data-motion="from-start" | "from-end" | "to-start" | "to-end"` — Radix's
  exact attribute and values, so upstream's CSS ports over.
- **The indicator is an arrow/underline that slides to the active trigger.**
  - Position from the trigger's `offsetLeft`/`offsetWidth` (logical
    properties under RTL — see the popover RTL gotcha in the log; do not
    assume `left` works).
  - It lives in the viewport's coordinate space, so it must reposition on
    trigger resize and on container scroll. Reuse the `ResizeObserver` from
    the viewport work rather than adding another.
  - `aria-hidden` — it is decoration; the active state is already conveyed by
    `data-state` on the trigger.
- **RTL is a first-class case, not a follow-up.** Both the directional morph
  and the indicator invert. Test under `dir="rtl"` on `<html>`, which is the
  configuration that caught the popover bug.

## Sub-tasks

- [ ] 1. Live support check for `interpolate-size` / `calc-size`; pick the
  morph technique and record the finding in the log.
- [ ] 2. Real `NavigationMenuViewport` — shared element, active content
  teleported via `lib/portal.jsx`, `viewport={false}` preserves today's
  behaviour. Files: `ui/navigation-menu/navigation-menu.jsx`.
- [ ] 3. Size morph + `data-motion` directional attributes + reduced-motion
  suppression + no-morph-on-first-open. Files:
  `ui/navigation-menu/navigation-menu.jsx`, `.css`.
- [ ] 4. Demo: viewport mode and `viewport={false}` side by side. Files:
  `site/pages/navigation-menu.jsx`.
- [ ] 5. Real `NavigationMenuIndicator` — slides to the active trigger, RTL
  correct, `aria-hidden`. Files: `ui/navigation-menu/navigation-menu.jsx`,
  `.css`.
- [ ] 6. Demo section for the indicator. Files:
  `site/pages/navigation-menu.jsx`.
- [ ] 7. Test: viewport is a single element reused across items; content
  teleports and the source item stays mounted; `data-motion` matches the
  traversal direction and inverts under RTL; no size animation under reduced
  motion; `viewport={false}` renders per-item panels exactly as before;
  indicator's inline offset tracks the active trigger in both directions.
  Files: `tests/navigation-menu.test.mjs` (extend).

## Verify / done

- `node tests/run.mjs` green — the existing navigation-menu suite must pass
  **unmodified**, since it was written against viewport-less mode and that
  mode still exists; if a test needs changing, the default flip is leaking.
- `npm run build` clean.
- Manual :5173 `#navigation-menu`: traverse triggers quickly in both
  directions, both modes, both themes, and under `dir="rtl"`. Watch for a
  flash of the wrong size on rapid traversal — that is the classic morph bug.
