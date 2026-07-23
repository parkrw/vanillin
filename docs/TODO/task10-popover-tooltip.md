# task10: popover-tooltip

**Goal:** Popover and Tooltip on the native Popover API + `useAnchorPosition` — the anchored-overlay pattern-setter for 11/12/15/16.
**Branch:** feat/popover-tooltip  **Deps:** none

## Design decisions

- **Live anatomy verified 2026-07-22 (Base UI, not Radix):**
  - Popover: Popover, PopoverTrigger, PopoverContent, PopoverHeader,
    PopoverTitle, PopoverDescription. No PopoverAnchor/Portal in the Base UI
    variant. shadcn's `render` prop → our `as`.
  - Tooltip: TooltipProvider (app-level, shared delay), Tooltip,
    TooltipTrigger, TooltipContent. shadcn's provider sets `delayDuration=0`;
    keep that default, prop-configurable.
- **Top layer via Popover API, not `<dialog>`:** non-modal — no focus trap, no
  inert background. Popover uses `popover="auto"` → native light dismiss
  (outside click + Esc) and top-layer stacking for free. Tooltip uses
  `popover="manual"` (hover-managed; must not join the auto light-dismiss
  stack).
- **State sync:** light dismiss can't be cancelled (`beforetoggle` is only
  cancelable when opening), so the dialog trick (cancel → route through state)
  doesn't apply. Instead: `useControllableState` drives
  `showPopover()`/`hidePopover()` in an effect; the `toggle` event
  (newState "closed") syncs native dismissal back into state.
- **Motion — transitions, not keyframes (documented deviation):** an element
  hidden by `hidePopover()` leaves the top layer immediately, so exit
  keyframes can't play. Use `@starting-style` + `transition-behavior:
  allow-discrete` on opacity/transform/display — the modern-CSS enter/exit
  path for popovers. Motion tokens still apply (`--motion-fast`,
  `--motion-ease`); no reduced-motion guard needed (transitions are the
  repo's reduced-motion-safe tier).
- **Placement:** `useAnchorPosition(open, triggerRef, contentRef, {side,
  align, sideOffset})` — first ui/ consumer. `positionAnchored` already stamps
  `data-side`/`data-align` for placement-aware slide-in origin.
- **Tooltip behavior:** opens on pointerenter/focus, closes on
  pointerleave/blur/Esc; `role="tooltip"` + `aria-describedby` on the
  trigger. Provider context: `delayDuration` + a skip-delay window (moving
  between tooltips within ~300ms opens instantly). Never opens from touch
  pointer type.
- **A11y (popover):** trigger gets `aria-expanded` + `aria-haspopup="dialog"`
  and `aria-controls`; content labelled by PopoverTitle/Description ids when
  present (context-provided ids, dialog precedent).
- **Non-goals:** arrows, collision-aware `align` shifting beyond the existing
  clamp, PopoverAnchor (detached anchors), tooltip `disableHoverableContent`.

## Sub-tasks

- [x] 1. popover — test: trigger click opens (`:popover-open`, `data-state`,
  positioned below trigger by default, `data-side` set), `side`/`align`
  props respected, outside click + Esc close and state stays in sync,
  controlled open/onOpenChange works, focus is NOT trapped; files:
  `ui/popover/popover.jsx` + `.css`, `tests/popover.test.mjs`,
  `playground/pages/popover.jsx`, `playground/registry.js`.
- [ ] 2. tooltip — test: hover opens after provider delay (0 default),
  leave closes, focus/blur opens/closes, Esc closes, trigger has
  `aria-describedby` pointing at content, moving to a second trigger within
  the skip window opens instantly; files: `ui/tooltip/tooltip.jsx` + `.css`,
  `tests/tooltip.test.mjs`, `playground/pages/tooltip.jsx`,
  `playground/registry.js`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#popover` / `#tooltip` light/dark: placement flips near
  viewport edges, fade/scale enter+exit both play, tooltip delay feels right.
