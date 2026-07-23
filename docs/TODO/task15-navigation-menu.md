# task15: navigation-menu

**Goal:** NavigationMenu — a horizontal nav of hover/click triggers, each with an
anchored links panel, on the task-10 popover recipe.
**Branch:** feat/navigation-menu  **Deps:** 10

## Design decisions

- **Live anatomy verified 2026-07-23 (shadcn registry, Radix + Base UI
  variants agree on parts):** NavigationMenu, NavigationMenuList,
  NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent,
  NavigationMenuLink, NavigationMenuIndicator, NavigationMenuViewport,
  `navigationMenuTriggerStyle()`. Trigger ships a rotating chevron.
- **Viewport-less model (documented deviation):** shadcn's root takes
  `viewport={false}` to render each Content as its own panel under its item —
  we implement exactly that mode. The shared morphing viewport + sliding
  Indicator arrow are non-goals; NavigationMenuViewport/NavigationMenuIndicator
  are compat no-ops (DialogOverlay precedent), root swallows `viewport`.
- **Content = task-10 popover recipe:** `popover="auto"` (native light dismiss:
  outside click + Esc), always mounted, `toggle` event syncs native dismissal
  back into state with menubar's ownership guard (`prev === mine ? "" : prev`
  — a hover switch has already handed the value to the next item). Native auto
  exclusivity does the panel handoff. Enter/exit via `@starting-style` +
  allow-discrete transitions; anchored `side="bottom" align="start"
  sideOffset=6` via useAnchorPosition.
- **Root state = open item's value** ("" closed), `value`/`defaultValue`/
  `onValueChange` via useControllableState; item value defaults to useId
  (menubar precedent).
- **Hover: root-owned shared timers** (hover-card precedent) so trigger and
  content cancel each other's pending close. `delayDuration=200` +
  `skipDelayDuration=300` (Radix defaults; re-hover within the skip window
  after a full close opens instantly). While any item is open, entering
  another trigger switches immediately. `closeDelay=150` grace on leave.
  Touch pointers never hover-open.
- **Click-toggle race:** trigger snapshots open-state at pointerdown (task-14
  gotcha) — pointerdown light-dismisses the auto popover, so the click must
  mean "close", not re-open.
- **Keyboard:** triggers/links in the list are all natively tabbable (no
  roving — that's tabs/radio/toolbars only). ArrowRight/Left (dir-aware) move
  focus within the list; ArrowDown on a trigger opens and focuses the first
  link; ArrowDown/Up cycle links inside a panel; Esc closes and refocuses the
  trigger. Trigger has aria-expanded + aria-controls (no aria-haspopup — a
  links panel is not a menu; no role=menu anywhere, Radix parity).
- **Link:** `<a>` by default (`as` prop), `active` prop → `data-active` +
  `aria-current="page"`; clicking a link closes the menu.
  `navigationMenuTriggerStyle()` returns the trigger class string for
  styling a bare Link like a trigger.

## Sub-tasks

- [x] 1. navigation-menu — test: hover opens after delay (not immediately) and
  leave closes after grace; hover to a second trigger switches with a single
  panel open; pointer into content keeps it open; click toggles open/close;
  outside click + Esc close and sync state (Esc refocuses trigger); ArrowDown
  opens and focuses first link, arrows cycle links; link click closes;
  controlled value/onValueChange; files: `ui/navigation-menu/navigation-menu.jsx`
  + `.css`, `tests/navigation-menu.test.mjs`,
  `playground/pages/navigation-menu.jsx`, `playground/registry.js`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#navigation-menu` light/dark: chevron rotates, panel
  enter/exit fades play, hover feel (delay/grace/skip window) matches shadcn.
