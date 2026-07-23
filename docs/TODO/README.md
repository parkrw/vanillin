# Cycle: finish vanillin — remaining 33 shadcn/ui components + dark-mode pass

Plan: `~/.claude/plans/vanillin-zero-dep-shadcn-ui-recreation.md`. 31 of 64
components done in `ui/` at seed time (chart excluded; toast+sonner = one slug).

| #   | Slug                     | Est | Status | Notes                                                                       |
| --- | ------------------------ | --- | ------ | --------------------------------------------------------------------------- |
| 01  | toggle-group             | ~S  | [x]    | roving tabindex; reuses ui/toggle css                                       |
| 02  | pagination               | ~S  | [x]    | reuses .btn classes                                                         |
| 03  | field-direction          | ~M  | [x]    | Field family + RTL demo/test + logical-CSS sweep                            |
| 04  | chat-message-bubble      | ~M  | [x]    | ui/bubble + ui/message, CSS-only                                            |
| 05  | attachment               | ~M  | [x]    | deps: 04; CSS-only incl. AttachmentGroup scroll-snap row                    |
| 06  | message-scroller         | ~M  | [x]    | two stacked PRs: core + button/hooks                                        |
| 07  | dialog                   | ~L  | [x]    | native `<dialog>` pattern-setter — see task file for overlay recipe         |
| 08  | alert-dialog-sheet       | ~M  | [x]    | thin reuses of ui/dialog (compound classes + `dismissible`)                                                                    |
| 09  | drawer                   | ~M  | [x]    | stacked on 08 branch; Base UI anatomy (swipeDirection), not vaul            |
| 10  | popover-tooltip          | ~L  | [x]    | anchored-overlay pattern-setter — see task file for popover recipe          |
| 11  | hover-card               | ~S  | [x]    | deps: 10; tooltip recipe + shared root timers for content-hover grace       |
| 12  | dropdown-menu            | ~L  | [x]    | menu-overlay pattern-setter for 13/14/16 — see task file + log              |
| 13  | context-menu             | ~M  | [x]    | deps: 12; all parts re-export dropdown-menu; see Chrome contextmenu gotcha  |
| 14  | menubar                  | ~M  | [x]    | deps: 12; all item parts re-export dropdown-menu; see click-toggle gotcha   |
| 15  | navigation-menu          | ~M  | [ ]    | deps: 10                                                                    |
| 16  | select                   | ~L  | [ ]    | hardest; deps: 10, 12                                                       |
| 17  | combobox                 | ~M  | [ ]    | deps: 16                                                                    |
| 18  | command                  | ~M  | [ ]    | deps: 17                                                                    |
| 19  | input-otp                | ~M  | [ ]    | hidden input + segments                                                     |
| 20  | scroll-area              | ~M  | [ ]    | overlay synced thumb                                                        |
| 21  | calendar                 | ~L  | [ ]    | ARIA grid, native Date/Intl                                                 |
| 22  | date-picker              | ~S  | [ ]    | deps: 10, 21                                                                |
| 23  | toast                    | ~L  | [ ]    | queue, stacking, hover-pause, swipe                                         |
| 24  | carousel                 | ~M  | [ ]    | scroll-snap + pointer swipe                                                 |
| 25  | resizable                | ~M  | [ ]    | role=separator, keyboard resize                                             |
| 26  | data-table               | ~L  | [ ]    | pattern page over ui/table                                                  |
| 27  | sidebar                  | ~L  | [ ]    | deps: 08 (mobile = sheet); Cmd+B                                            |
| 28  | dark-mode-pass           | ~M  | [ ]    | deps: all; visual QA every component in `.dark`                             |
| 29  | docs-shell               | ~M  | [ ]    | deps: 28; playground → docs app: nav, getting-started, theming/motion pages |
| 30  | docs-content             | ~L  | [ ]    | deps: 29; per-component usage/props/data-state prose on demo pages          |

## Refs

- Test: `node tests/run.mjs` — boots its own vite on :5199, drives local Chrome;
  one `tests/<slug>.test.mjs` per interactive component. (Dev server on :5173
  only needed for manual/screenshot QA.)
- Build: `npm run build`. No lint configured.
- Conventions + gotchas: `docs/HANDOFF.md` (block classes, tokens-only CSS, `cn()`,
  `as` prop, `useControllableState` + `data-state`, `usePresence`, demo page +
  `playground/registry.js` entry per component).
- Load-bearing files: `styles/globals.css` (tokens), `lib/` primitives,
  `ui/toggle/` (stateful pattern), `ui/tabs/` (roving tabindex), `ui/accordion/`
  (disclosure/presence), `playground/registry.js`.
- Git gates (hooks): no commits on main — `<type>/<kebab>` branch first. The
  ~500-net-line branch-size hook is advisory only — never split or restructure
  work because of it.

## Adjustments log

- 2026-07-22 — seeded from plan file + HANDOFF.md inventory (31/64 done).
- 2026-07-22 — added 28 docs-shell + 29 docs-content: evolve playground into a
  docs app (install/usage/config incl. motion knobs) after the component cycle.
- 2026-07-22 — split task 01 (pagination-toggle-group) into 01 toggle-group + 02
  pagination; TODO seed + toggle-group hit ~350 net lines on one branch (cap
  500). Renumbered 02→03 … 26→27. Runner note: tests self-host on :5199, no dev
  server needed.
- 2026-07-22 — task 03 done on `feat/field-direction` (~476 net lines): Field is
  CSS-only (no test, like item); direction lib pre-existed — task became demo
  page + RTL test + physical→logical CSS sweep (button-group, typography).
  Slider already handled RTL fully. New components: use logical properties
  (`inline-start`/`margin-inline`/`text-align: start`) from the start.
- 2026-07-22 — task 04 done on `feat/chat-message-bubble` (~490 net lines):
  shadcn anatomy verified against live docs — Bubble/BubbleContent/
  BubbleReactions/BubbleGroup, Message/MessageGroup/MessageAvatar/MessageContent/
  MessageHeader/MessageFooter. Both CSS-only, no tests. shadcn's `render` prop →
  our `as`. Task 05 (attachment + message-scroller) will need scroll/state logic
  — verify its live anatomy the same way.
- 2026-07-22 — split task 05 into 05 attachment (CSS-only) + 06 message-scroller
  (stateful: Provider/Viewport/Content/Item/Button, stick-to-bottom autoscroll
  released on user scroll, 3 hooks — verified against live shadcn docs); both in
  one PR would blow the 500-line cap given task 04 landed ~490 for two CSS-only
  components. Renumbered 06→29 to 07→30, dep refs shifted.
- 2026-07-22 — task 05 done on `feat/attachment` (~446 net lines). Gotcha:
  `mask-image` directly on a scrolling element makes Chrome paint the whole
  pane white in dark mode (invisible in light!) — mask a static wrapper,
  scroll an inner viewport. Applies to any future edge-fade scroller
  (scroll-area 20, carousel 24, sidebar 27). QA dark mode via clip screenshots
  or after the fix, not just light.
- 2026-07-22 — task 08 done on `feat/alert-dialog-sheet` (~428 net lines).
  Reuse worked as planned: both components re-export dialog parts;
  DialogContent grew `dismissible` + role passthrough; component CSS
  `@import`s dialog.css so pages stay single-import. Gotchas: UA gives
  `<dialog>` height/width `fit-content` — edge sheets need explicit
  height/width (drawer 09 too); animated-position tests must await
  `el.getAnimations()` `.finished` before measuring geometry; fixed a
  pre-existing message-scroller race (assert on component state, not
  scroll position).
- 2026-07-22 — task 07 done on `feat/dialog` (~468 net lines). Overlay recipe
  for 08/09: `showModal()` gives top layer + focus containment + inert
  background — no Portal/useFocusTrap/useDismissableLayer. Esc = `cancel`
  event, `preventDefault()` + route through state so exit animation plays;
  `::backdrop` is the overlay (DialogOverlay/DialogPortal are compat no-ops);
  `showModal()` in a plain `useEffect` declared *after* `useReturnFocus` so
  focus capture runs before focus moves; backdrop click = pointer coords vs
  `getBoundingClientRect` (padding clicks stay inside).
- 2026-07-22 — task 09 done on `feat/drawer` (~440 net lines excl. docs),
  stacked on `feat/alert-dialog-sheet` (shares registry.js/dialog.jsx edits +
  the message-scroller test fix). Live shadcn drawer is now **Base UI, not
  vaul**: `swipeDirection` (up|right|down|left) + `DrawerSwipeHandle` — verify
  live anatomy before every task. Velocity/flick dismiss dropped —
  nondeterministic under synthetic pointer timing; threshold-only (25%).
  Gotchas: passing `onPointerDown` to DialogContent *replaces* its
  backdrop-click dismissal (handlers sit before the props spread) — repeat the
  outside-coordinate check; exit keyframes without `from` start from the
  inline drag transform, so swipe hands off to the close animation for free;
  dialog.jsx now exports `useDialog()` for recipe reuses. Message-scroller
  button test flaked once mid-session despite the 08 fix — watch it.
- 2026-07-22 — task 10 done on `feat/popover-tooltip` (~926 net lines, one
  branch — size hook is advisory). Anchored-overlay recipe for 11/12/15/16:
  native Popover API (`auto` = light dismiss, `manual` = hover-managed) +
  `useAnchorPosition`; content stays **always mounted** — light dismiss can't
  be cancelled (`beforetoggle` only cancelable on open), so state syncs from
  the native `toggle` event, and exit motion is `@starting-style` +
  `allow-discrete` transitions (keyframes can't play after `hidePopover`);
  transition `overlay` too or the element leaves the top layer before the
  exit fade. Tooltip: provider delay + 300ms skip window; focus opens
  instantly (hover delay never applies). shadcn anatomy is Base UI: popover
  has Header/Title/Description, no Anchor/Portal.
- 2026-07-22 — task 11 done on `feat/hover-card` (~432 net lines). Delta vs
  tooltip: open/close timers live in the root context so trigger *and*
  content share them — pointer entering the content cancels the pending
  close (the closeDelay grace); content is `popover="manual"` with pointer
  handlers, no `pointer-events: none`. Trigger defaults to `<a>`; no
  role=tooltip/aria-describedby (Radix sighted-preview stance). Radix
  defaults kept: openDelay 700 / closeDelay 300. Process note: red run was
  compromised (impl written while the suite was mid-run); green verified
  clean, 97/97.
- 2026-07-22 — task 06 done as two stacked branches (`feat/message-scroller`
  383 + `feat/message-scroller-hooks` 223 net lines; together over the 500
  cap). Gotchas: Chrome native scroll anchoring doubles manual prepend
  preservation — set `overflow-anchor: none` on any self-managed scroller
  (scroll-area 20, carousel 23); release-on-intent = wheel/touch/keys/
  scrollbar-pointerdown listeners, re-engage when scroll reaches the end.
- 2026-07-23 — task 12 done on `feat/dropdown-menu` (~2250 net lines, one
  branch — size hook is advisory). Menu recipe for 13/14/16: popover-recipe
  content with role="menu"; in-component arrow nav scoped via
  `closest('[role="menu"]') === thisMenu` (NOT useRovingFocus — nested
  SubContent items would leak into the parent's list); checkbox/radio items
  compose DropdownMenuItem (role/aria-checked/data-state as props, onSelect
  wrapped). Submenus: SubContent must stay DOM-nested (nested popover="auto"
  stays open only via DOM ancestry when showPopover() is called manually) +
  double keydown-bubbling defense (stopPropagation in sub, closest-check in
  parent). **Safe-triangle race** (lib/use-safe-triangle.js): the content's
  pointerenter fires a fraction before the rect check sees the pointer inside,
  so an inside-triangle move can re-arm the close AFTER enter cancelled it —
  the hook's resolve path must cancel the pending close (`onResolve`), and the
  regression test must move the mouse SLOWER than the close delay (fast
  `steps:` moves beat the timer and prove nothing). Process change
  (user-directed): no red-first TDD — write tests with the implementation,
  verify with one green run.
- 2026-07-23 — task 13 done on `feat/context-menu` (~590 net lines — size
  hook is advisory). Reuse worked: every part re-exports dropdown-menu
  (root wraps DropdownMenu; content passes a virtual pointer-coord anchor
  via new DropdownMenuContent `anchorRef` prop; useAnchorPosition skips
  ResizeObserver for non-Element anchors). Gotchas: **Chrome hides all auto
  popovers while processing `contextmenu` even when prevented** — open in
  `setTimeout(0)`; on right-click-while-open, re-show the natively hidden
  popover directly (the hide's toggle event is queued; hide+show coalesce to
  open→open, ignored by the state sync). Fixed latent useControllableState
  bug: ref now syncs on uncontrolled writes, so two setter calls in one task
  see each other (was swallowing close-then-reopen).
- 2026-07-23 — task 13 follow-up: opening while the pointer is still down
  loses to light dismiss — macOS fires `contextmenu` on the press, and the
  gesture-ending pointerup hit-tests against the entry-transition rect
  (scale 0.96), landing outside the menu; any hand drift makes it worse.
  The old "cursor 2px inside the corner" trick only survived releases
  slower than the animation. Fix: `openOnGestureEnd` defers the open to
  pointerup/pointercancel (press point stays the anchor); dropdown-menu's
  show/hide effect now gates on live `:popover-open` instead of a shadow
  showingRef that drifted after native light dismiss (stranded menus).
  Testing note: Playwright clicks are instant and pixel-still — races with
  light dismiss need a held press + small drift to reproduce.
- 2026-07-23 — task 14 done on `feat/menubar` (~707 net lines — size hook is
  advisory). Reuse: item parts re-export dropdown-menu; MenubarMenu wraps a
  controlled DropdownMenu keyed by the root value; native auto-popover
  exclusivity does the menu handoff on switch. Dropdown root context grew
  one-shot `skipItemFocusRef` (hover switch focuses the menu, not an item);
  `focusLastRef` now self-resets after the open effect. Cross-menu
  ArrowRight/Left ride the Sub stopPropagation pattern: a next-key reaching
  MenubarContent is always a cross-menu move, even from inside a submenu.
  Gotcha: **trigger click-toggle races the queued light-dismiss toggle** —
  pointerdown light-dismisses the popover, the queued toggle syncs state to
  closed, then click re-toggles it open at human speeds (Playwright's
  instant click passes either way and proves nothing) — snapshot open-state
  at pointerdown. dropdown-menu's own trigger has the same latent race
  (click-to-close untested there); fix it when touched, e.g. select (16).
