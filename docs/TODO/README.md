# Cycle: finish vanillin — remaining 33 shadcn/ui components + dark-mode pass

Plan: `~/.claude/plans/vanillin-zero-dep-shadcn-ui-recreation.md`. 31 of 64
components done in `ui/` at seed time (chart excluded; toast+sonner = one slug).

| #   | Slug                | Est | Status | Notes                                                                       |
| --- | ------------------- | --- | ------ | --------------------------------------------------------------------------- |
| 01  | toggle-group        | ~S  | [x]    | roving tabindex; reuses ui/toggle css                                       |
| 02  | pagination          | ~S  | [x]    | reuses .btn classes                                                         |
| 03  | field-direction     | ~M  | [x]    | Field family + RTL demo/test + logical-CSS sweep                            |
| 04  | chat-message-bubble | ~M  | [x]    | ui/bubble + ui/message, CSS-only                                            |
| 05  | attachment          | ~M  | [x]    | deps: 04; CSS-only incl. AttachmentGroup scroll-snap row                    |
| 06  | message-scroller    | ~M  | [x]    | two stacked PRs: core + button/hooks                                        |
| 07  | dialog              | ~L  | [x]    | native `<dialog>` pattern-setter — see task file for overlay recipe         |
| 08  | alert-dialog-sheet  | ~M  | [x]    | thin reuses of ui/dialog (compound classes + `dismissible`)                 |
| 09  | drawer              | ~M  | [x]    | stacked on 08 branch; Base UI anatomy (swipeDirection), not vaul            |
| 10  | popover-tooltip     | ~L  | [x]    | anchored-overlay pattern-setter — see task file for popover recipe          |
| 11  | hover-card          | ~S  | [x]    | deps: 10; tooltip recipe + shared root timers for content-hover grace       |
| 12  | dropdown-menu       | ~L  | [x]    | menu-overlay pattern-setter for 13/14/16 — see task file + log              |
| 13  | context-menu        | ~M  | [x]    | deps: 12; all parts re-export dropdown-menu; see Chrome contextmenu gotcha  |
| 14  | menubar             | ~M  | [x]    | deps: 12; all item parts re-export dropdown-menu; see click-toggle gotcha   |
| 15  | navigation-menu     | ~M  | [x]    | deps: 10; per-item panels (viewport-less mode); Viewport/Indicator no-ops   |
| 16  | select              | ~L  | [x]    | deps: 10, 12; popper-only (no alignItemWithTrigger); dropdown race fixed    |
| 17  | combobox            | ~M  | [x]    | deps: 16; Base UI anatomy; single-select only (chips/multiple deferred)     |
| 18  | command             | ~M  | [x]    | deps: 17; still cmdk anatomy; substring filter (no score/re-sort)           |
| 19  | input-otp           | ~M  | [x]    | transparent input over slots; caret parks at end of value                   |
| 20  | scroll-area         | ~M  | [x]    | overlay bars over a native scroller; imperative thumb sync                  |
| 21  | calendar            | ~L  | [x]    | ARIA grid, native Date/Intl; single/multiple/range, dropdown caption        |
| 22  | date-picker         | ~S  | [x]    | composition pattern only — no DatePicker root; pattern CSS + demo + tests   |
| 23  | toast               | ~L  | [x]    | sonner-shaped imperative API; queue, stacking, hover-pause, swipe           |
| 24  | carousel            | ~M  | [x]    | scroll-snap + deferred-capture swipe; embla api surface docs use            |
| 25  | resizable           | ~M  | [x]    | v4 anatomy (data-separator); drag + keyboard, collapsible                   |
| 26  | data-table          | ~L  | [x]    | lib/use-data-table.js replaces tanstack surface; checkbox tri-state         |
| 27  | sidebar             | ~L  | [x]    | all 24 exports real; mobile = sheet; Cmd+B; sidebar_state cookie            |
| 28  | dark-mode-pass      | ~M  | [x]    | axe contrast sweep + screenshot QA; `--input-background` token              |
| 29  | docs-shell          | ~M  | [ ]    | deps: 28; playground → docs app: nav, getting-started, theming/motion pages |
| 30  | docs-content        | ~L  | [ ]    | deps: 29; per-component usage/props/data-state prose on demo pages          |

## Refs

- Test: `node tests/run.mjs` — boots its own vite on :5199, drives local Chrome;
  one `tests/<slug>.test.mjs` per interactive component. (Dev server on :5173
  only needed for manual/screenshot QA.)
- Build: `npm run build`. No lint configured.
- Conventions + gotchas: `docs/HANDOFF.md` (block classes, tokens-only CSS,
  `cn()`, `as` prop, `useControllableState` + `data-state`, `usePresence`, demo
  page + `playground/registry.js` entry per component).
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
  BubbleReactions/BubbleGroup,
  Message/MessageGroup/MessageAvatar/MessageContent/
  MessageHeader/MessageFooter. Both CSS-only, no tests. shadcn's `render` prop →
  our `as`. Task 05 (attachment + message-scroller) will need scroll/state logic
  — verify its live anatomy the same way.
- 2026-07-22 — split task 05 into 05 attachment (CSS-only) + 06 message-scroller
  (stateful: Provider/Viewport/Content/Item/Button, stick-to-bottom autoscroll
  released on user scroll, 3 hooks — verified against live shadcn docs); both in
  one PR would blow the 500-line cap given task 04 landed ~490 for two CSS-only
  components. Renumbered 06→29 to 07→30, dep refs shifted.
- 2026-07-22 — task 05 done on `feat/attachment` (~446 net lines). Gotcha:
  `mask-image` directly on a scrolling element makes Chrome paint the whole pane
  white in dark mode (invisible in light!) — mask a static wrapper, scroll an
  inner viewport. Applies to any future edge-fade scroller (scroll-area 20,
  carousel 24, sidebar 27). QA dark mode via clip screenshots or after the fix,
  not just light.
- 2026-07-22 — task 08 done on `feat/alert-dialog-sheet` (~428 net lines). Reuse
  worked as planned: both components re-export dialog parts; DialogContent grew
  `dismissible` + role passthrough; component CSS `@import`s dialog.css so pages
  stay single-import. Gotchas: UA gives `<dialog>` height/width `fit-content` —
  edge sheets need explicit height/width (drawer 09 too); animated-position
  tests must await `el.getAnimations()` `.finished` before measuring geometry;
  fixed a pre-existing message-scroller race (assert on component state, not
  scroll position).
- 2026-07-22 — task 07 done on `feat/dialog` (~468 net lines). Overlay recipe
  for 08/09: `showModal()` gives top layer + focus containment + inert
  background — no Portal/useFocusTrap/useDismissableLayer. Esc = `cancel` event,
  `preventDefault()` + route through state so exit animation plays; `::backdrop`
  is the overlay (DialogOverlay/DialogPortal are compat no-ops); `showModal()`
  in a plain `useEffect` declared _after_ `useReturnFocus` so focus capture runs
  before focus moves; backdrop click = pointer coords vs `getBoundingClientRect`
  (padding clicks stay inside).
- 2026-07-22 — task 09 done on `feat/drawer` (~440 net lines excl. docs),
  stacked on `feat/alert-dialog-sheet` (shares registry.js/dialog.jsx edits +
  the message-scroller test fix). Live shadcn drawer is now **Base UI, not
  vaul**: `swipeDirection` (up|right|down|left) + `DrawerSwipeHandle` — verify
  live anatomy before every task. Velocity/flick dismiss dropped —
  nondeterministic under synthetic pointer timing; threshold-only (25%).
  Gotchas: passing `onPointerDown` to DialogContent _replaces_ its
  backdrop-click dismissal (handlers sit before the props spread) — repeat the
  outside-coordinate check; exit keyframes without `from` start from the inline
  drag transform, so swipe hands off to the close animation for free; dialog.jsx
  now exports `useDialog()` for recipe reuses. Message-scroller button test
  flaked once mid-session despite the 08 fix — watch it.
- 2026-07-22 — task 10 done on `feat/popover-tooltip` (~926 net lines, one
  branch — size hook is advisory). Anchored-overlay recipe for 11/12/15/16:
  native Popover API (`auto` = light dismiss, `manual` = hover-managed) +
  `useAnchorPosition`; content stays **always mounted** — light dismiss can't be
  cancelled (`beforetoggle` only cancelable on open), so state syncs from the
  native `toggle` event, and exit motion is `@starting-style` + `allow-discrete`
  transitions (keyframes can't play after `hidePopover`); transition `overlay`
  too or the element leaves the top layer before the exit fade. Tooltip:
  provider delay + 300ms skip window; focus opens instantly (hover delay never
  applies). shadcn anatomy is Base UI: popover has Header/Title/Description, no
  Anchor/Portal.
- 2026-07-22 — task 11 done on `feat/hover-card` (~432 net lines). Delta vs
  tooltip: open/close timers live in the root context so trigger _and_ content
  share them — pointer entering the content cancels the pending close (the
  closeDelay grace); content is `popover="manual"` with pointer handlers, no
  `pointer-events: none`. Trigger defaults to `<a>`; no
  role=tooltip/aria-describedby (Radix sighted-preview stance). Radix defaults
  kept: openDelay 700 / closeDelay 300. Process note: red run was compromised
  (impl written while the suite was mid-run); green verified clean, 97/97.
- 2026-07-22 — task 06 done as two stacked branches (`feat/message-scroller`
  383 + `feat/message-scroller-hooks` 223 net lines; together over the 500 cap).
  Gotchas: Chrome native scroll anchoring doubles manual prepend preservation —
  set `overflow-anchor: none` on any self-managed scroller (scroll-area 20,
  carousel 23); release-on-intent = wheel/touch/keys/ scrollbar-pointerdown
  listeners, re-engage when scroll reaches the end.
- 2026-07-23 — task 12 done on `feat/dropdown-menu` (~2250 net lines, one branch
  — size hook is advisory). Menu recipe for 13/14/16: popover-recipe content
  with role="menu"; in-component arrow nav scoped via
  `closest('[role="menu"]') === thisMenu` (NOT useRovingFocus — nested
  SubContent items would leak into the parent's list); checkbox/radio items
  compose DropdownMenuItem (role/aria-checked/data-state as props, onSelect
  wrapped). Submenus: SubContent must stay DOM-nested (nested popover="auto"
  stays open only via DOM ancestry when showPopover() is called manually) +
  double keydown-bubbling defense (stopPropagation in sub, closest-check in
  parent). **Safe-triangle race** (lib/use-safe-triangle.js): the content's
  pointerenter fires a fraction before the rect check sees the pointer inside,
  so an inside-triangle move can re-arm the close AFTER enter cancelled it — the
  hook's resolve path must cancel the pending close (`onResolve`), and the
  regression test must move the mouse SLOWER than the close delay (fast `steps:`
  moves beat the timer and prove nothing). Process change (user-directed): no
  red-first TDD — write tests with the implementation, verify with one green
  run.
- 2026-07-23 — task 13 done on `feat/context-menu` (~590 net lines — size hook
  is advisory). Reuse worked: every part re-exports dropdown-menu (root wraps
  DropdownMenu; content passes a virtual pointer-coord anchor via new
  DropdownMenuContent `anchorRef` prop; useAnchorPosition skips ResizeObserver
  for non-Element anchors). Gotchas: **Chrome hides all auto popovers while
  processing `contextmenu` even when prevented** — open in `setTimeout(0)`; on
  right-click-while-open, re-show the natively hidden popover directly (the
  hide's toggle event is queued; hide+show coalesce to open→open, ignored by the
  state sync). Fixed latent useControllableState bug: ref now syncs on
  uncontrolled writes, so two setter calls in one task see each other (was
  swallowing close-then-reopen).
- 2026-07-23 — task 13 follow-up: opening while the pointer is still down loses
  to light dismiss — macOS fires `contextmenu` on the press, and the
  gesture-ending pointerup hit-tests against the entry-transition rect (scale
  0.96), landing outside the menu; any hand drift makes it worse. The old
  "cursor 2px inside the corner" trick only survived releases slower than the
  animation. Fix: `openOnGestureEnd` defers the open to pointerup/pointercancel
  (press point stays the anchor); dropdown-menu's show/hide effect now gates on
  live `:popover-open` instead of a shadow showingRef that drifted after native
  light dismiss (stranded menus). Testing note: Playwright clicks are instant
  and pixel-still — races with light dismiss need a held press + small drift to
  reproduce.
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
  closed, then click re-toggles it open at human speeds (Playwright's instant
  click passes either way and proves nothing) — snapshot open-state at
  pointerdown. dropdown-menu's own trigger has the same latent race
  (click-to-close untested there); fix it when touched, e.g. select (16).
- 2026-07-23 — task 15 done on `feat/navigation-menu` (~860 net lines — size
  hook is advisory). Per-item anchored panels = shadcn's `viewport={false}`
  mode (documented deviation): shared morphing viewport + sliding Indicator
  are non-goals, exported as compat no-ops. Content = task-10 popover recipe
  (auto light dismiss, toggle sync with menubar's ownership guard); hover =
  root-owned shared timers (hover-card) + tooltip's skip window. Gotchas:
  stamp the skip-window timestamp only on real open→closed transitions —
  value starts "", so a mount stamp makes any hover within 300ms of load open
  instantly (flaky first test); inside the skip window a Playwright click's
  own pointerenter hover-opens the menu and the click then closes it (Radix
  parity — hover-opened trigger + click = close), so click-to-open tests
  must sit out 350ms after a close.
- 2026-07-23 — task 16 done on `feat/select` (~1080 net lines — size hook is
  advisory), stacked on feat/navigation-menu. Select-specific roles
  (combobox/listbox/option) over task-12 mechanics; deviations: popper
  placement only (`alignItemWithTrigger` swallowed), no scroll buttons
  (listbox scrolls), hidden `<input>` for forms (no constraint validation).
  Items register value→label in root context so SelectValue works without
  the listbox ever opening; `items` prop consulted first. Typeahead in both
  states (closed sets value directly, native parity) — gotcha: reset the
  query buffer on every open/close transition, or a query typed in one
  state prefix-poisons matches in the other (Radix resets too). Also fixed
  dropdown-menu's trigger click-toggle race (task-14 note) with a held-press
  regression test — Playwright's instant click can't reproduce it.
  Message-scroller button test flaked once again (passed on rerun).
- 2026-07-25 — task 17 done on `feat/combobox` (~1010 net lines — size hook is
  advisory), stacked on feat/select. Live shadcn combobox is **Base UI, not
  Popover+Command** — new ui/combobox on select-16 mechanics with the combobox
  delta: focus never leaves the input (aria-activedescendant +
  data-highlighted root state, no real focus on options); `query` separate
  from `inputValue` (close resets query so the selected label never filters
  the reopened list); items stay mounted and toggle `hidden`, groups auto-hide
  via CSS `:has()`. Deviations: single-select only (chips/multiple/showClear
  deferred), blur does not close (item pointerdown-preventDefault would break
  scrollbar drags; Tab + light dismiss cover exit). Gotchas: **`display: flex`
  on an item silently defeats the `hidden` attribute** — restate
  `[hidden] { display: none }` and assert computed display in tests, not just
  the attribute (screenshot QA caught it, the suite didn't); input click while
  open must re-show the natively light-dismissed popup directly (task-13
  coalesce pattern) since the queued toggle ordering vs click isn't
  guaranteed; the runner's `eq` is strict `===` — array assertions must
  join/measure first (two "equal-looking" failures were reference compares).
- 2026-07-25 — task 18 done on `feat/command` (~700 net lines), stacked on
  feat/combobox. Live shadcn command is **still cmdk** (not Base UI) — ported
  its API onto combobox-17 highlight mechanics, inline (no popover) with
  CommandDialog = ui/dialog. Deltas from combobox: root `value` is the
  _highlighted_ item (activation calls the item's `onSelect`, nothing
  persists), Empty renders whenever nothing is visible (not only while
  searching), and every search change re-highlights the top result — a
  "highlight only moves when it filters out" rule looks right until you
  search past the current highlight and Enter fires a stale item. Enter
  activates by calling `el.click()` on the highlighted option, so there is no
  callback registry. Deviations: substring filter over value + keywords +
  label, DOM order preserved (cmdk's fuzzy `command-score` also re-sorts
  items and groups); `Command.Loading` not exported (not a shadcn export).
  Gotchas: an item with no `value` derives it from `textContent`, so it lands
  in the DOM one render late — the auto-highlight/empty pass must depend on
  the item registration map, not just search/children, or the first paint
  keeps a stale highlight; combobox's `[hidden] { display: none }` restatement
  applies here too.
- 2026-07-25 — task 19 done on `feat/input-otp` (~480 net lines), stacked on
  feat/command. shadcn still wraps `input-otp` (guilhermerodz): one
  transparent real `<input>` over div slots, so native caret/selection/IME
  and `autocomplete="one-time-code"` autofill come free and arrows/Backspace
  need no code — the slot render just mirrors `value[index]` plus the input's
  selection. Caret parks at the end of the typed value on focus/click
  (upstream parity: no hole-in-the-middle state); pattern rejects a whole
  failing change instead of filtering characters. Gotchas: the slots render
  _after_ the input in the DOM, so they swallow every click until the input
  gets `z-index` and the slots `pointer-events: none` (Playwright's
  `click()` times out on the hit-target check — the failure looks like an
  invisible-element problem, not a stacking one); measuring
  `[data-active]` ring styles right after a keystroke reads mid-transition
  values under the playground's 2.5× motion scale — wait for the transition
  before asserting computed colors.
- 2026-07-25 — task 20 done on `feat/scroll-area` (~700 net lines), stacked on
  feat/input-otp. shadcn is Base UI here and exports only ScrollArea +
  ScrollBar; horizontal usage passes `<ScrollBar orientation="horizontal" />`
  as a **child**, so it renders inside the viewport — it stays put only
  because it is absolutely positioned against the root, which sits outside
  the scroller (verified by test, not by eye). Native scroller with
  `scrollbar-width: none`; all per-frame geometry is written straight to the
  DOM (`--scroll-area-thumb-height/-width` on the bar, `translate3d` on the
  thumb), so scrolling re-renders nothing — React state is only overflow /
  scrolling / hovering. Base UI parity kept: 500ms scroll timeout, 16px min
  thumb, thumb drag via pointer capture, track click centres the thumb,
  `keepMounted`, corner vars. Gotchas: **React's `onWheel` is passive**, so
  wheel-over-the-bar needs a native non-passive listener or the page scrolls
  instead; rtl needs the negated horizontal thumb offset (flex start is the
  right edge) and normalized negative `scrollLeft` for progress, but the
  drag math needs no rtl branch (pointer delta and negative scrollLeft move
  together); the demo page is lazy-loaded _and_ bars mount only after the
  first measurement, so the suite's first assertion must `waitFor` the bar
  (a bare `count()` reads 0), and a hover test must park the mouse at 0,0
  first — pointer position carries over from the previous test file.
  Deviations: no `overflowEdgeThreshold`/`data-overflow-*-start|end`, no
  overscroll thumb squish, no thumb-margin compensation, no scroll-snap
  suspension during drag.
- 2026-07-25 — task 21 done on `feat/calendar` (~920 net lines, two commits),
  stacked on feat/scroll-area. shadcn still wraps **react-day-picker v9** and
  exports only `Calendar` + `CalendarDayButton`, so the whole day-picker core
  is ours: `Date`/`Intl` only, weeks built from the locale's first day
  (`Intl.Locale#getWeekInfo()`, Sunday fallback), a `<table role="grid">` per
  month with one roving tab stop, single/multiple/range selection through
  `useControllableState`, rdp's matcher shapes (`Date`, list, predicate,
  `{from,to}`, `{before,after}`, `{dayOfWeek}`) behind one `matches()`.
  Gotchas: **DOM focus arriving any other way than our own keyboard move must
  feed state** — arrows are computed from `activeDate`, so without an
  `onFocus` on the day button a test (or a real Tab) that focuses a day walks
  from the wrong origin and the failure looks like broken arrow math; a
  **same-URL `page.goto` is a same-document hash navigation**, so a test
  cannot use it to reset the page mid-file (navigate back with keys instead);
  ISO week numbers must be taken from the **row's Thursday**, not its first
  cell, or a Sunday-start row of late December labels itself week 52 next to
  January's days. Range bands read as one strip because the day buttons fill
  their cells and only the inner corners are squared (logical radii, so rtl
  mirrors for free); the hover preview marks `data-range-*` but never
  `aria-selected`. Known flake, pre-existing: combobox's "Escape reverts
  typed text" test failed twice today and passed on rerun — the revert only
  runs on an open→closed transition, so a stray queued native toggle that
  already closed the popup leaves the typed text in place.
- 2026-07-25 — combobox Escape flake fixed on `fix/combobox-escape-revert`:
  Escape now checks `:popover-open` as well as state, hides a stale-open popup
  itself, and calls a shared `revertInput()` directly — the transition-keyed
  revert raced queued native toggles. 3× green.
- 2026-07-25 — tasks 22–27 fanned out to six concurrent worktree agents (4 at
  a time — timing-sensitive suites flake under too many parallel Chrome/vite
  instances; each worktree ran tests on its own port via an uncommitted
  tests/run.mjs PORT edit). Every branch got: convention greps, coordinator
  suite reruns, and an independent review pass; review findings fixed on the
  branch before sign-off.
- 2026-07-25 — task 22 done on `feat/date-picker` (~358 net): live shadcn
  date-picker is a composition pattern only (Popover + Calendar + Button —
  no DatePicker root). Pattern CSS `@import`s popover+calendar; demo covers
  single/range/dropdown-caption; 6 tests. chrono-node input + time-picker
  variants omitted (external deps).
- 2026-07-25 — task 23 done on `feat/toast` (~1359 net, 5 commits): live
  shadcn toast page now wraps **Base UI Toast**, but the plan's
  "toast+sonner = one slug" kept the sonner-shaped API — module-level store,
  imperative `toast()`/`.success`/`.error`/`.warning`/`.info`/`.loading`/
  `.promise`/`.dismiss`/`.custom`, `<Toaster />` with position/visibleToasts/
  duration/closeButton/expand/richColors. Swipe threshold-only (drawer
  lesson); exit keyframes omit `from`; window blur pauses timers; new
  semantic tokens `--success/--warning/--info` (+foreground/background/
  border) in globals.css both modes. Review caught two timer bugs the tests
  missed: (1) pausing never banked elapsed time, so a long hover dismissed
  instantly on unhover — bank remaining and null the segment start on pause;
  (2) the type-reset effect was declared AFTER the timer effect, so on
  promise loading→success the timer initialized refs and the reset nulled
  them — the next tick computed `null - 0 = 0` and dismissed the success
  state in ~50ms. Lessons: effect declaration order is load-bearing when
  effects share refs; pause/dismiss-timer tests must assert survival after
  the pause ends, not just eventual dismissal; a module-level store persists
  across Toaster remounts (intentional, sonner parity). (~830 net incl. review fixes):
  scroll-snap track + mouse swipe; embla api surface implemented as far as
  the docs' examples use it (scrollSnapList/selectedScrollSnap/on-select;
  `plugins`, `opts.loop`, `opts.align` stubbed, documented). Review caught:
  `preventDefault()` on pointerdown suppresses compatibility clicks —
  interactive slide content went dead. Capture is now deferred past a 5px
  dead zone (plain clicks never capture) + `e.buttons === 0` guard drops a
  stale drag when release happened outside pre-capture. Lesson: never
  preventDefault pointerdown on a bubbling swipe surface, and always test a
  button INSIDE the swipeable area.
- 2026-07-25 — task 25 done on `feat/resizable` (~1145 net):
  react-resizable-panels **v4** shapes — `data-separator` (v2's
  data-resize-handle-* is gone), separator `aria-orientation` is the
  OPPOSITE of group direction, 5% keyboard step, Enter toggles collapse,
  aria-valuenow via max-delta simulation. Skipped (not in docs examples):
  autoSaveId/storage, onResize/onCollapse callbacks, F6 cycling,
  hitAreaMargins, cascading resize. Test helper: same-URL goto is
  same-document (calendar gotcha) — reset by navigating away, waitFor
  detached, navigate back.
- 2026-07-25 — task 26 done on `feat/data-table` (~1100 net, two commits):
  zero-dep `lib/use-data-table.js` (+`flexRender`) replaces exactly the
  tanstack surface the payments example uses (core/sorted/filtered/
  pagination row models, visibility, selection with header tri-state);
  ui/checkbox grew backward-compatible indeterminate (`aria-checked=mixed`).
  Filter/pageSize changes reset pageIndex (review-verified no out-of-range).
  Skipped: multi-sort, global/faceted filter, pinning, resizing, grouping,
  virtualization, server-side.
- 2026-07-25 — task 27 done on `feat/sidebar` (~1786 net): all 24 shadcn
  exports implemented (no compat no-ops); `sidebar_state` cookie (7d),
  Cmd/Ctrl+B, variants sidebar/floating/inset × offcanvas/icon/none, mobile
  = ui/sheet, collapsed-icon tooltips via ui/tooltip; `--sidebar-*` tokens
  already existed in globals.css. Gotchas: scope the desktop `display: none`
  media rule to `.sidebar-wrapper > .sidebar` or it also hides the mobile
  sheet content (same class); demo frames the fixed-position sidebar with
  `contain: layout size` (component uses height 100%, not 100svh); the
  offcanvas rail pokes only a few px past the demo frame's overflow: hidden
  — click it via evaluate, not coordinates.
- 2026-07-25 — task 28 done on `feat/dark-mode-pass`: all 62 playground pages
  screenshotted in `.dark` (axe-core color-contrast per page) plus a second
  pass with 16 overlays open. Fixes: (1) dark `--destructive-foreground` is
  now dark-on-light-red (white failed 2.76:1 on button/badge/input-group —
  same flip as dark `--primary`); (2) new `--input-background` token
  (transparent light, `color-mix(--input 30%)` dark = shadcn `dark:bg-input/30`)
  applied to input, textarea, native-select, select trigger, checkbox, radio,
  otp slot, input-group, combobox group, and `.dark .btn--outline` — unchecked
  checkbox/radio were near-invisible on near-black; (3) date-picker popover
  `inline-size: auto` stretched to the viewport edge ([popover] UA `inset: 0`
  is masked by popover.css's fixed 18rem width until overridden) → fit-content.
  QA notes: near-white surfaces in dark (primary buttons, tooltip, own chat
  bubbles, progress/slider fills) are intentional shadcn inversion — subagents
  reviewing screenshots repeatedly flagged them; verify flags yourself before
  fixing.
