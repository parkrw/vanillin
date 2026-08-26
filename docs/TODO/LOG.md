# Adjustments log

Decisions, deviations and gotchas from each task, newest last. Split out of
`README.md` on 2026-07-25 to keep the task index scannable.

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
  upstream anatomy verified against live docs — Bubble/BubbleContent/
  BubbleReactions/BubbleGroup,
  Message/MessageGroup/MessageAvatar/MessageContent/
  MessageHeader/MessageFooter. Both CSS-only, no tests. Upstream's `render` prop →
  our `as`. Task 05 (attachment + message-scroller) will need scroll/state logic
  — verify its live anatomy the same way.
- 2026-07-22 — split task 05 into 05 attachment (CSS-only) + 06 message-scroller
  (stateful: Provider/Viewport/Content/Item/Button, stick-to-bottom autoscroll
  released on user scroll, 3 hooks — verified against live upstream docs); both in
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
  the message-scroller test fix). Live upstream drawer is now **Base UI, not
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
  applies). Upstream anatomy is Base UI: popover has Header/Title/Description, no
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
  hook is advisory). Per-item anchored panels = upstream's `viewport={false}`
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
  advisory), stacked on feat/select. Live upstream combobox is **Base UI, not
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
  feat/combobox. Live upstream command is **still cmdk** (not Base UI) — ported
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
  items and groups); `Command.Loading` not exported (not an upstream export).
  Gotchas: an item with no `value` derives it from `textContent`, so it lands
  in the DOM one render late — the auto-highlight/empty pass must depend on
  the item registration map, not just search/children, or the first paint
  keeps a stale highlight; combobox's `[hidden] { display: none }` restatement
  applies here too.
- 2026-07-25 — task 19 done on `feat/input-otp` (~480 net lines), stacked on
  feat/command. Upstream still wraps `input-otp` (guilhermerodz): one
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
  feat/input-otp. Upstream is Base UI here and exports only ScrollArea +
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
  stacked on feat/scroll-area. Upstream still wraps **react-day-picker v9** and
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
- 2026-07-25 — task 22 done on `feat/date-picker` (~358 net): live upstream
  date-picker is a composition pattern only (Popover + Calendar + Button —
  no DatePicker root). Pattern CSS `@import`s popover+calendar; demo covers
  single/range/dropdown-caption; 6 tests. chrono-node input + time-picker
  variants omitted (external deps).
- 2026-07-25 — task 23 done on `feat/toast` (~1359 net, 5 commits): live
  upstream toast page now wraps **Base UI Toast**, but the plan's
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
- 2026-07-25 — task 27 done on `feat/sidebar` (~1786 net): all 24 upstream
  exports implemented (no compat no-ops); `sidebar_state` cookie (7d),
  Cmd/Ctrl+B, variants sidebar/floating/inset × offcanvas/icon/none, mobile
  = ui/sheet, collapsed-icon tooltips via ui/tooltip; `--sidebar-*` tokens
  already existed in globals.css. Gotchas: scope the desktop `display: none`
  media rule to `.sidebar-wrapper > .sidebar` or it also hides the mobile
  sheet content (same class); demo frames the fixed-position sidebar with
  `contain: layout size` (component uses height 100%, not 100svh); the
  offcanvas rail pokes only a few px past the demo frame's overflow: hidden
  — click it via evaluate, not coordinates.
- 2026-07-25 — **phase 2 seeded (31–58) + docs resequenced.** User priorities:
  110% = config-file theming for consumer apps, Form, cursor affordance
  everywhere; 105% = every documented parity gap except carousel, badge status
  colours, a status-dot component; nice-to-have = carousel. Decisions taken:
  (a) **Form stays zero-dep** — react-hook-form is a third-party choice, not
  platform like react/react-dom, so `lib/use-form.js` clones the RHF-shaped
  surface (same precedent as `lib/use-data-table.js`); `ui/form/` reads a
  context and never imports the engine, so consumers already on real RHF pass
  their form object in unchanged, and the resolver contract stays
  `@hookform/resolvers`-compatible. (b) **Config is build-time**, not runtime:
  `van.config.json` + a stdlib-only generator emits static CSS — no FOUC,
  no runtime cost, but vanillin has to become installable, not just
  copy-paste. (c) **Tokenization is tiered and additive** — `.btn { --btn-bg:
  var(--primary); background: var(--btn-bg) }` renders byte-identical to
  today, so nothing breaks; ~22 core components first (34/35), long tail
  later. (d) **Docs split**: 29 docs-shell runs first but _thin_ (scaffold
  survives; install + theming prose gets rewritten by 37/38), 30 docs-content
  runs last, once — phase 2 changes ~10 components, adds 2, and gives ~22 a
  token table. (e) Platform features added as first-class differentiators:
  brand-colour derivation via relative color syntax, React 19 Actions in Form,
  container queries, an Intl formatting layer, density modes, View
  Transitions, Custom Highlight API, forced-colors. Every one of these is
  gated on a live browser-support check — progressive enhancement only.
  Console-kit backlog seeded but deliberately not scheduled.
- 2026-07-25 — task 28 done on `feat/dark-mode-pass`: all 62 playground pages
  screenshotted in `.dark` (axe-core color-contrast per page) plus a second
  pass with 16 overlays open. Fixes: (1) dark `--destructive-foreground` is
  now dark-on-light-red (white failed 2.76:1 on button/badge/input-group —
  same flip as dark `--primary`); (2) new `--input-background` token
  (transparent light, `color-mix(--input 30%)` dark = upstream `dark:bg-input/30`)
  applied to input, textarea, native-select, select trigger, checkbox, radio,
  otp slot, input-group, combobox group, and `.dark .btn--outline` — unchecked
  checkbox/radio were near-invisible on near-black; (3) date-picker popover
  `inline-size: auto` stretched to the viewport edge ([popover] UA `inset: 0`
  is masked by popover.css's fixed 18rem width until overridden) → fit-content.
  QA notes: near-white surfaces in dark (primary buttons, tooltip, own chat
  bubbles, progress/slider fills) are intentional upstream inversion — subagents
  reviewing screenshots repeatedly flagged them; verify flags yourself before
  fixing.
- 2026-07-25 — **task 38 distribution decided: git-sourced, `private: true`
  stays.** Corrects the phase-2 seed entry above, which assumed a CLI meant
  publishing to npm. It does not: `npx github:progrums/van add button`
  installs from the repo, and `private: true` only blocks `npm publish`, not
  git installs. Rationale: no registry name or semver contract to maintain
  (there is no runtime contract — consumers own the copied code); pinning to a
  tag pins *the source you copied from*, which is honest, where a semver range
  would imply a runtime dependency that does not exist; a CLI is dev-time and
  never ships to the browser, so distribution was never a zero-dep question.
  Costs: `npx github:` clones (slower) and there is no discoverability —
  publishing later is a one-line change (drop `private`, add `files`) and
  should be deferred until adoption actually matters. **Tag releases**, since
  untagged `main` as the default install target is a footgun. Task 38 is
  therefore no longer the irreversible step in phase 2; nothing in the plan is.
- 2026-07-25 — **planning mode: just-in-time, not upfront.** Rows in
  `README.md` are durable; task files are written when a task is picked up.
  Task files exist for 31/32/33/37/38/40/41 (architecture worth capturing while
  the reasoning was fresh); 34–36, 39, 42–58 get detailed on approach. Reasons:
  22–27 already shipped fine on rows alone; 37/38's outcomes reshape 39–58; and
  the platform-feature tasks (33, 39, 54, 55, 57) rest on browser-support facts
  that were ~14 months stale at plan time, so any spec written now bakes in
  assumptions that need re-checking regardless. Two rows are flagged
  under-specified in place: 46 (expect to split viewport from indicator) and 49
  (`content-visibility` may cover virtualization outright — measure first).
- 2026-07-25 — **this log split out of `README.md`.** It had grown to ~370 of
  485 lines and buried the task index. Append landed-task notes here, not to
  the README.
- 2026-07-25 — review follow-up to task 28, on
  `fix/popover-rtl-anchoring-and-dark-fill-gaps`. Four fixes: (1) **all**
  anchored layers snapped to the viewport edge under `dir="rtl"` on
  `<html>`/`<body>` — the `[popover]` UA `inset: 0` left `right: 0` in place,
  which over-constrains a definite-width box, and CSS 2.1 §10.3.7 then drops
  `left` under RTL. `positionAnchored` now clears `right`/`bottom`, fixing all 8
  consumers at once. Pre-existing for `width: 18rem` popovers; task 28's
  `fit-content` only made the date-picker join them. Only reachable via `dir` on
  the root — `DirectionProvider`'s inner wrapper never triggered it, which is
  why nothing caught it. Guarded by a popover test asserting `offsetLeft` tracks
  the inline `left` (not `getBoundingClientRect` — the enter transition's
  `scale()` skews it). (2) `.input-group-btn--outline` and (3)
  `.data-table-page-size > select` were the two controls the `--input-background`
  sweep missed. (4) destructive `:hover` mixed toward `transparent`, which
  *lightens* the red over a light page — white-on-red fell to 4.32:1. Mixing
  toward `--foreground` instead moves the surface away from
  `--destructive-foreground` in both themes: light 4.32 → 5.54:1, dark 5.20 →
  6.92:1. axe only samples rest state, so it never flagged this.
- 2026-07-25 — task 29 done on `feat/docs-shell` (~155 net, worktree): thin
  docs shell over the playground — new `docs` map in registry.js
  (introduction/installation/theming, pages under `pages/docs/`), sidebar nav
  grouped into "Get started" / "Components", empty hash now routes to
  `#introduction`. Component routes stay flat `#<slug>` (tests goto them
  directly). Install/theming pages are one-paragraph stubs — 37/38 rewrite
  them; 30 writes per-component prose against the final surface. Gotcha:
  several suites click a bare `locator("h2")` as an outside-click target, so
  the only h2 on a page must be the page title — the nav group label is a
  `div.pg-nav-label` (same call as ui/sidebar's SidebarGroupLabel), not a
  heading; adding any second h2 to the shell fails 7 tests across
  combobox/select/navigation-menu/input-otp.
- 2026-07-26 — **docs are written per task, not deferred to 30.** The phase-2
  seed put all per-component prose in task 30, to be written "against the final
  surface" after 58. Changed: every task now ships its docs in the same PR as
  its code, and 30 shrinks to a consistency/gap pass. Reasons: the surface
  knowledge is freshest at implementation time; 28 tasks of prose written in one
  lump at the end is the classic never-finished chore; and an undocumented API
  (task 40's `useForm` especially) is unusable in the interim. Cost, accepted:
  37/38 will force a rewrite of the install/theming pages, and some component
  prose will be revised by the tokenization tasks. Applied retroactively to the
  in-flight wave (31, 32, 33, 40).

## Phase 2, session of 2026-07-26 (concurrent worktree fan-out)

Tasks 31, 32, 33, 40, 42, 43, 45, 47, 53, 57 built as 10 concurrent worktree
agents and cherry-picked onto `feat/phase-2`. Suite 406/406, build clean.

- **Browser-support answers (task 33, Chrome 150, verified by round-trip not
  just `CSS.supports`):** `light-dark()`, relative color syntax, and
  `@property` are all safe — no fallback path needed. 37 and 39 can rely on
  this; re-check before assuming it holds for older targets.
- **`@property` changes computed-value representation.** oklch alpha `10%`
  becomes `0.1`, `0.625rem` becomes `10px`, `color-mix()` resolves fully. Token
  snapshot tests must normalise through a real CSS property, not string-compare.
  `initial-value` must be computationally independent — no `var()`, no `rem`.
- **`light-dark()` resolves at the declaring element's `color-scheme`.** A
  scoped `.dark` on a descendant does not re-resolve inherited tokens; `.dark`
  must sit on `<html>`. Matches current usage, but consumers need telling.
- **Indeterminate loops must not use motion tokens.** Task 32 shipped the
  `pending` pulse as `var(--motion-medium)`, which is `calc(200ms *
  var(--motion-scale))` — a ~2.5Hz strobe that also tracked `--motion-scale`,
  the one thing the spec forbade. Fixed to a literal `2s`, matching
  `ui/skeleton`. Precedent: `ui/spinner` `1s linear`, `ui/skeleton` `2s`.
- **`tests/run.mjs` imports every `tests/*.test.mjs` and calls its default
  export.** Pure-node tests must therefore be named `*.unit.mjs`
  (`parse-date`, `command-score`). One that was not aborted the entire browser
  suite and hid ~350 results. The runner now isolates per-file failures instead
  of dying, and reports a missing default export as a normal FAIL.
- **`message-scroller: button click returns to bottom` is a genuine
  pre-existing flake** — reproduced on a clean base (285/286, then 286/286 on
  identical code). Not caused by any phase-2 branch. Worth a dedicated fix; it
  is the second such flake after the combobox one in the 22–27 session.
- **Concurrency gotchas for the next fan-out session:** the test runner's port
  is now `VANILLIN_TEST_PORT` (was hard-coded 5199), and worktree
  `node_modules` symlinks need `node_modules` (no trailing slash) in
  `.git/info/exclude` or `git add -A` will stage them. Do not leave per-agent
  vite servers running — a dozen of them destabilises Chrome and produces
  test failures that look like real regressions.
- **zod/RHF devDependencies were added and then removed.** Task 40's spec
  called for verifying `@hookform/resolvers`' `zodResolver` against our
  resolver contract as a test-only dependency. It verified clean
  (`@hookform/resolvers` 5.5.3 + `zod` 4.4.3, 2026-07-26), but the agent also
  imported zod from a playground page, which broke `npm run build`. Decision:
  keep the verified result, drop all three packages, and guard our side of the
  contract with a hand-written RHF-shaped resolver instead — the zod test
  asserted zod's output, never that our engine consumed it correctly.
- **`@starting-style { transform: scale(0.96) }` corrupts
  `getBoundingClientRect`** taken right after `showPopover()` (task 43).
  Item-aligned select sets `transform: none` to measure, popper clears it.
- 2026-07-26 — task 52 landed (velocity threshold **1.0 px/ms**, not the
  spec's 0.5: Playwright's `mouse.move` produces ~0.65 px/ms for a short drag,
  which is indistinguishable from a slow deliberate swipe). Added a 16ms
  minimum-dt guard — velocity over a sub-frame interval is noise. Two testing
  gotchas: `dispatchEvent` on a modal `<dialog>` fires natively but React's
  delegated handlers never run, so drawer tests must use real Playwright
  pointer input (toast, not being modal, is fine with `dispatchEvent`); and
  `mouse.move({ steps: N })` varies 20–50ms run to run, so velocity assertions
  need wide margins.
- 2026-07-26 — task 54 done on `feat/view-transitions`. Browser support
  confirmed in Chrome 150 headless: `document.startViewTransition` and
  `view-transition-name` CSS both available. Cross-document transitions
  (`@view-transition { navigation: auto }`) exist in Chrome 126+ but are
  not relevant for SPA usage. Three call sites, all `withViewTransition`:
  theme toggle (circular clip-path wipe from button center), hash-route
  changes (default crossfade), list-detail shared-element demo. Duration
  and easing read from `--motion-medium`/`--motion-ease`; reduced motion
  skips the transition entirely. `setTransitionName` guarantees uniqueness
  by setting the name only on the active element at click time and clearing
  after. Pre-existing flakes: 2 resizable tests fail on the base commit
  (hover state timing, strict `>` where values are equal).
- 2026-07-26 — batch 49/61/62 landed via three concurrent worktrees,
  cherry-picked onto `feat/batch-49-61-62` with zero conflicts (written
  disjoint file lists held; 62 was sole owner of `registry.js`). One
  cross-task integration miss, fixed at the head: 62's Schema docs page made
  four docs-nav entries where `docs-shell.test.mjs` asserted three — workers
  correctly run only their own test files, so only the integrated suite
  caught it. Task 49: grouping + `manual*` modes; no windowing, no
  `content-visibility: auto`, per the measurements in the task file. Task 61:
  foregrounds now picked by measured WCAG contrast; object `brand` validates
  every key through `parseOklch` + `isSafeCSSValue`, unknown keys are errors;
  a primary-less object derives only the keys given (kit defaults fill the
  rest); string brand proven byte-identical to pre-61 output. Task 62:
  `lib/schema.js` + `schemaResolver`; zero new deps in either dependency
  block; pure-node tests correctly named `schema.unit.mjs`. Task file for 61
  named `tests/config-schema.test.mjs`; real file is `config-schema.unit.mjs`
  — caught at detail time, brief corrected it.
- 2026-07-26 — batch **59/60/63** dispatched to three worktrees. Chosen over
  64-first (HANDOFF's suggestion) because 64 records file hashes for every
  component and 39 rewrites every component's CSS: both conflict with 63's
  component edits and with each other, so each now runs alone after this batch.
  Task file for 59 written at detail time (it was the last unwritten one);
  design call recorded there — the bindings layer gets **its own slug**
  (`ui/form-fields/`) rather than a file inside `ui/form/`, because it imports
  `lib/use-form.js` and `ui/form` must stay copyable without the engine.
  File ownership assigned in writing, one owner per shared file:
  59 owns `site/registry.js`, 60 owns `styles/globals.css` + the theme
  scripts, 63 owns `ui/badge` / `ui/combobox` / `ui/data-table` /
  `lib/use-highlight.js`. Base commit suite: 583/583.
- 2026-07-26 — batch **59/60/63** all three passed supervision. Full suite run
  by the head in each worktree: 59 → 594/594, 60 → 589/589, 63 → 596/596; builds
  clean; ownership checks empty; 60's generator proved deterministic
  (`rm styles/defaults.css && npm run build` regenerates byte-identical). No
  rework sent. Three findings worth keeping:
  - **Task 59 found a live a11y bug it was posited to prevent.**
    `ui/select/select.jsx:41` destructures a fixed prop list with no `...props`,
    so the `id`/`aria-describedby`/`aria-invalid` that `FormControl` clones onto
    a `<Select>` vanish — the trigger has no id and `FormLabel`'s `htmlFor`
    points at nothing. Shipped and live in `site/pages/form.jsx:132-163`.
    `SelectField` wraps `SelectTrigger` instead. Fix for the demo page is written
    out in `docs/TODO/reports/task59.md`; giving `Select` a `...props` rest so
    the failure is loud belongs to 63/64.
  - **Task 63 found header column pinning was already broken on main.**
    `.data-table-sized .table-head { position: relative }` (0,2,0) out-specified
    `.data-table-pinned` (0,1,0), so pinned `<th>`s were never sticky. The
    existing test passed **vacuously** — it asserted computed
    `inset-inline-start === "0px"`, true for `relative` too. Fixed, and the test
    now asserts `scrollLeft > 0` and compares bounding rects.
  - **Task 60 revived a dead `prefers-contrast: more` border repair.**
    `forced-colors.css` was imported before globals' own `:root` at equal
    specificity (0,1,0) and lost on source order. New order is
    `defaults.css` → `forced-colors.css` → machinery, so the repair wins. A
    behaviour change nobody asked for; taken because the alternative was writing
    the order down while knowingly re-cementing a dead a11y repair.
  Task 60's `van.defaults.json` deliberately carries **no `theme.brand`** — the
  kit palette is greyscale and brand derivation produces different numbers, so
  the 53 colour tokens are literal light/dark pairs. Machinery that stayed
  hand-written: shadows, the radius/space/motion ramps, `--*-hover` relative-colour
  derivations, `color-scheme`.
- 2026-07-26 — batch 59/60/63 merged to `main` (`bc53d3cc3c42`). Integrated
  suite **613/613** = 583 base + 11 + 6 + 13; the three test sets were disjoint,
  so unlike the previous batch there was no cross-task integration miss. All
  three worktrees and local branches removed. Two operational lessons for the
  next `--spawn`, both now in HANDOFF's fan-out section: **never detect worker
  liveness by tmux `pane_title`** (claude overwrites it with its own status line
  within seconds, so the supervisor reports every pane dead immediately — match
  on `pane_id`), and **never poll with a bare zsh glob** (`for f in
  reports/*.done` aborts the whole monitor on `nomatch`).
- 2026-07-27 — task 64 (component-contracts) done on `feat/component-contracts`,
  8 commits, suite **667/667** (665 + the 2 known drawer flakes, 14/14 in
  isolation), build clean. `scripts/manifest.mjs` writes `ui/*/.van.json`
  sidecars (SRI-style hashes, unknown fields preserved, idempotent `--write`);
  `tests/conformance.unit.mjs` (19 checks) + `tests/manifest.unit.mjs` (15) now
  run inside `npm test` — `tests/run.mjs` executes every `*.unit.mjs` as a child
  process before the browser files. Findings the suite forced out:
  - **36 real ui→ui edges, not the 19 estimated** — and one was fiction:
    `data-table` imported `Checkbox` without using it. Dead import removed.
  - **7 stateful components had no tests at all** (accordion, checkbox,
    collapsible, radio-group, switch, tabs, toggle — the oldest components,
    pre-convention). 47 browser tests added.
  - **18 exported components destructured props without a rest.** 12 are
    provider-only (no DOM node) and sit in a reasoned `PROVIDER_COMPONENTS`
    allowlist; 6 were real: four data-table parts now spread rest, and
    `Select`/`Combobox` forward leftover root props to trigger/input via
    context — which fixes the live form-page bug where `FormControl`'s cloned
    `id`/`aria-describedby` vanished (task 59's finding; regression test in
    `tests/form.test.mjs`).
  - Every conformance rule was deliberately broken once to prove the failure
    names file, rule and fix; that exercise itself caught two holes (the
    registry-duplicate regex matched nothing against unquoted keys — now also
    asserts non-empty extraction — and one-line CSS rules evaded the motion
    checks).
  Docs: `site/pages/docs/contracts.jsx` (manifest format, lint-contract
  caveat, add-a-component checklist). Conformance keys allowlists by intent —
  indeterminate loops, static components, providers — each entry with a reason.
- 2026-07-27 — task 38 (cli) done on `feat/cli`, 8 commits, suite **669/669**,
  build clean. `bin/van.mjs` ships `init` / `add` / `diff` / `build` / `list`
  with `--cwd`, `--dry-run`, `--overwrite` (`--force` alias), `--yes`,
  `--silent`, `--no-color`; `registry.json` is generated by
  `scripts/build-registry.mjs` from the same `deriveRequires` the manifests use,
  so the upstream graph and the per-copy sidecars cannot disagree.
  `npm run contracts` refreshes both. Decisions and surprises:
  - **Sub-task 8 added mid-task, user-approved: framework awareness.** shadcn
    detects frameworks for four reasons; two cannot apply here (no Tailwind
    config, no npm deps) and two do. `init` sniffs `package.json` for
    next/vite/remix/astro, records `framework` + `rsc` as top-level config keys
    and puts stylesheets where that framework keeps them (`app/` for App
    Router, `src/styles/` for Vite). Under `rsc`, `add` prepends
    `"use client"` to copied JSX that calls a hook or `createContext`.
    **Zero of the 68 components carried the directive**, so before this every
    stateful component was broken in a Next App Router server component. The
    kit's own files stay directive-free: shipping them would make non-Next
    bundlers warn about module-level directives, and it would touch 60 files.
  - **The sidecar must hash the bytes written, not the kit's tree.** With RSC
    injection the copied file legitimately differs from `ui/<slug>/<slug>.jsx`,
    so recording kit hashes made every injected file read as consumer-edited on
    the next `add`. `fileState` now takes the expected *content*, and `diff`
    compares against `kitFileContent()` too — one transform, three call sites.
  - **Four per-file states, and only `edited` blocks**: `missing` /
    `identical` / `unmodified` (matches the record, so upstream moved — safe to
    overwrite) / `edited`. Atomicity is per component; other components in the
    same `add` still land.
  - **Path safety is an allowlist, not a filter** — slugs are looked up in the
    registry, so `../evil` fails as "unknown component" before touching a path.
    `paths.*` values are validated by `pathError()` (no absolute, no `..`, no
    backslashes) in both the schema and `loadProject`.
  - `van diff` on the kit's own checkout reports all 68 components matching —
    a free self-check that the registry, manifests and working tree agree.
  - **Verified from a bare clone with no `node_modules`** (`git clone` +
    `node <clone>/bin/van.mjs init && add button dialog data-table` → 28 files,
    `diff` clean), which is what the `npx github:` path reduces to. The
    over-the-network `npx github:parkrw/vanillin#feat/cli` check and rendering
    the result in a real app still need the branch pushed — user-gated.
  - Small parity items all landed in the same file: `--cwd`, shadcn's flag
    vocabulary, `@/*` resolution through `tsconfig`/`jsconfig`
    `compilerOptions.paths` (JSONC-tolerant), a registry `type` field, and a
    four-escape ANSI helper that disables itself when piped or `NO_COLOR` is set.
  Docs: `site/pages/docs/installation.jsx` and the README install section both
  said a CLI "is planned"; both now document the real thing.

## Task 39 — container queries (2026-07-27)

- **Support (Chrome 150, round-tripped, not just `CSS.supports`):**
  `container-type: inline-size`, `cqi` units and even `container-type:
  scroll-state` all resolve. No fallback path is needed for the target, but
  every rule is still written as a *narrow override* (`max-width`) so a browser
  without support renders the pre-task layout rather than a broken one. The one
  exception is `.field--responsive`, whose base state is the stacked layout and
  whose enhancement is `min-width` — no support there also means stacked, which
  is the safe direction.
- **An element never matches a query against a container it declares itself.**
  `@container (min-width: X) { .foo { … } }` where `.foo` also sets
  `container-type` resolves against `.foo`'s *ancestor* container, so it either
  matches the wrong box or (with no ancestor container) never matches at all.
  Verified empirically: `flexDirection` stayed `column` on a 300px self-querying
  container asking for `min-width: 200px`, while the same query on a child of a
  300px container gave `row`.
  - **This was a live bug in `ui/field`.** `.field--responsive` declared
    `container-type` and then queried itself, so it never switched to the
    horizontal layout on its own. It appeared to work only because
    `site/pages/field.jsx` wrapped the demo in an *outer* `containerType:
    inline-size` div, which the anonymous query then matched — the field was
    responding to the wrapper's width by accident. The wrapper's
    `containerType` is now removed and the field queries its own named
    container correctly.
  - **Consequence for the whole task: layout flips must be expressed as
    descendant properties.** `flex-direction`/`grid-template-columns` on the
    container's own box cannot respond to its width, so the pattern is
    `flex-wrap: wrap` (or the grid) declared unconditionally on the root and
    only the *children's* `flex-basis`/`grid-column` inside the query.
    `.field--responsive` uses `gap: var(--space-2) var(--space-3)` so row-gap
    serves the stacked layout and column-gap the side-by-side one, since `gap`
    is a root property and cannot be queried either.
- **Every container is named** (`vanillin-card`, `vanillin-item`,
  `vanillin-field`, …). A query naming a container that does not exist silently
  never matches — verified — so names must be exact, but the same property makes
  a mis-scoped query fail safe instead of claiming an unrelated ancestor.
- **Thresholds are literal `rem` values.** Container query conditions cannot
  read custom properties, so this is a deliberate exception to the tokens-only
  rule.
- **Stacked table mode lives in `ui/table`, not `ui/data-table`** — a deviation
  from the task file's file list. `.table--stack` is a modifier of `.table`, and
  `ui/data-table` does not render a table at all: it ships helpers and the
  consumer composes `TableRow`/`TableCell` itself. Putting the rules in
  `data-table.css` would have made a `ui/table` feature invisible to anyone
  using `ui/table` directly. `data-table.css` carries only the part that is
  genuinely its own — pinning and the resize handle standing down, since column
  features are meaningless once there are no columns. Those selectors are each
  one step more specific than the rule they switch off, because `@container`
  adds no specificity and the pinning rules run up to (0,4,0).
- **`ui/table` now sets explicit ARIA roles.** Changing `display` on table parts
  strips their table semantics, so a stacked row would be announced as orphaned
  text. Explicit `role="table"/"rowgroup"/"row"/"columnheader"/"cell"` survives
  the display change and is spread *before* `{...props}` so a consumer can still
  pass `role="rowheader"`. The header row is therefore visually hidden and never
  `display: none` — assistive tech keeps announcing the real column headers, and
  the `::before` label from `data-label` is decoration for sighted users only.
  `data-label` is the consumer's to set: `ui/table` never sees the column list.
- **Sheet headers stay start-aligned** (`.dialog.sheet .dialog-header`). Moving
  dialog reflow onto the container means a 20rem side sheet now qualifies as
  "narrow", and it would otherwise have picked up the centred-header treatment
  that only belongs to centred modals. Its footer does stack, which is the win.
- **Dialog reflow changed behaviour on purpose.** The header/footer switch was a
  viewport media query at 640px and is now a 24rem container query, so dialogs
  on viewports of roughly 416–640px get the roomy row layout they always had
  room for, and side sheets get the narrow one at any viewport. 24rem was chosen
  over a closer-parity 28rem for slack: the 32rem desktop dialog has 464px of
  content, and a density change that grows padding must not be able to flip it
  into the mobile layout.
- **`ui/sidebar` deliberately gets no container.** It swaps to a Sheet via
  `matchMedia` in JS with the CSS mirroring that same 768px breakpoint. A
  container query cannot drive a render decision, so a second mechanism would
  only desynchronise from `isMobile`.
- **Verification note:** the popover case does not assert which side the overlay
  opens on — collision handling flips it legitimately. It opens the same popover
  with containment on and then off and requires identical geometry relative to
  the trigger, which is the actual claim. Width is compared as a delta against
  the trigger because the popover's min-width tracks its anchor and dropping
  containment reflows the table's columns by a fraction of a pixel.

## mode-toggle + task 68 E1 — light/dark swap (2026-07-29)

Landed `ui/mode-toggle` + `lib/use-color-scheme.js` + a demo page; the nav toggle *is* the component now, which pays down ISSUES A2 for one component. Shape and the rejected alternatives are in `docs/DECISIONS.md`; what's worth keeping here is why E1's three defects were invisible:

- **The duration was silently pinned to a fallback.** `--motion-medium` is `calc(200ms * var(--motion-scale))` and is **not** `@property`-registered, so `getPropertyValue` returns that literal string and `parseFloat` gives `NaN`. The old code fell through to 200ms while the site runs `--motion-scale: 2.5`, i.e. everything else was 500ms.
- **A second clock raced the first.** `site.css` killed `animation` on `::view-transition-old/new(root)` but not on `::view-transition-group(root)`, which kept its 250ms UA default and outlasted the reveal. That was the mid-sweep stutter.
- **Two sources of truth for `.dark`** — `site/app.jsx` and the demo page each held `useState` and both wrote the class, so whichever rendered last won and clicking one then the other did nothing. Fixed by `site/color-scheme.js` (site plumbing, not kit API), which seeds from `systemPrefersDark()`.
- **The first version of these tests asserted the shape of the animation object and passed while nothing rendered.** Every motion assertion in `tests/mode-toggle.test.mjs` is now about rendered output — the swing read back as a computed rotation at sampled instants, the light as a screenshot diff.

## Task 68 — bug batch, sub-tasks 5/6/7 by concurrent fan-out (2026-07-30)

Three worktrees off `da1ea95caac5`, one commit each. Worktree shas were C5 `76c28b8da75b`, E2 `913325d47400`, C4 `6e0d45a6167c`; all three were **rebased on merge**, so on `main` they are C5 `ff6cac152716` + `6a18d1e31d51`, E2 `197b9a9d0afe` + `a9512c7946cf`, C4 `6f1470ab2948`. Mechanics and the lessons are in `AGENTS.md` under Fan-out. What the work itself established:

- **Two of the three stated diagnoses were wrong**, and both survived only because the workers were told to measure first and to stop rather than force the stated fix. E2's two suspected causes were falsified outright — the real cause is that `height: 0` cannot collapse a padded border-box, and a zero-height flex child keeps its `gap` slot. C4's cause held but its prescription needed `white-space: nowrap` added and `min-width: 0` dropped.
- **E2's fix landed in neither of its listed files**, because `ui/accordion` already implemented the contract `ui/collapsible` was missing. The two share the `usePresence` recipe almost line for line; the divergence looked accidental.
- **Three of the specified assertions would have passed against broken code** — written up under H1 in `docs/ISSUES.md` as the starting point for sub-task 9.
- The `files:` lists in task bodies are wishes, not inventories: two named test files did not exist, and two sub-tasks needed a demo-page fixture they didn't list.

## Task 68 — sub-task 8, D8 empty-state misalignment (2026-07-31)

One commit on `fix/empty-page-alignment`: `71aa0516b940`.

- **The stated diagnosis was wrong outright** — the third time in this task. `.pg-section` was already on every section of `site/pages/empty.jsx`, and the page's chrome measures pixel-identical to `card` and `alert`. Nothing about the page was misaligned; the demo just had no visible bounds, so `ui/empty`'s own centring read as drift against a column of left-anchored bordered demos.
- **The fix belonged to the docs site, not `ui/`.** Upstream leaves Empty full-bleed on purpose so it can fill a parent slot, and supplies the frame from its docs. `.pg-empty-frame` reuses `.pg-cq-panel`'s dashed convention.
- **Geometry could not have caught this.** The specified assertion passes against the broken code, and so does a left-edge check on the demo box — a container with `border-width: 0` reports the same rect as one that paints. Only a pixel sample distinguishes them, and a *dashed* border needs the whole edge scanned: a single mid-height sample lands in a gap and reads as unpainted.

## Task 68 — sub-task 9, H1 assertion sweep (2026-07-31)

One commit on `test/assertion-precondition-sweep`, `12cc896f9787` in the branch, **`c7f0664d119e` as merged**. Only `tests/` changed.

- **Four real instances out of twenty candidate files**, the rest already sound — the triage and the reason for each exclusion are under H1 in `docs/ISSUES.md`. Grepping for `eq(..., "none")` and friends over-reports badly: readouts of demo `textContent`, explicit opt-in values like `forced-color-adjust: none`, and reads of inline style or custom properties (which return `""` when absent) are all self-guarding.
- **`ui/scroll-area`'s overscroll squish had shipped with no real coverage.** Both tests asserted `transform: none`, no positive case existed, and deleting the feature left the suite green. Two independent causes, either alone sufficient: the gesture fired one `touchmove` when the transform is not written until a *later* move, and CDP's `Input.dispatchTouchEvent` delivers no touch events to the listeners in this harness at all.
- **`Input.dispatchTouchEvent` does not work here** — instrumented with listeners, zero events, `hasTouch` on or off. It was the suite's only CDP-touch user. Synthesise `TouchEvent` in-page instead; `tests/scroll-area.test.mjs` has the recipe.
- **The check that matters is deletion, not green.** Every amended assertion was confirmed by removing the feature and watching it fail — the squish (3 failures) and the status-dot pulse (2). An absence-assertion that survives deleting the thing it describes is not a test.
- Worth its own task, deliberately not absorbed: this swept assertions expecting an absence. The squish suggests the inverse question — which features have tests that never exercise them at all.

## Replan — 71/72/73 added, task 68 closed out (2026-07-31, `/cycle --adjust`)

No code. Three rows added and the index reconciled against what actually merged.

- **Order is now `68 ✓ → 71 → 72 → 73 → 65 → 66 → 67 → 69 → 70 → 30`.** 71 and 72 inherit 68's rationale — user-visible bugs before new features. 73 sits ahead of the CLI because H1's origin bug survived on `main` for months behind a passing test, but it is the one row here that can slide right.
- **71 is triage-only, deliberately.** Task 68's stated diagnoses were wrong three times out of nine and its `files:` lists were incomplete four times. Splitting find-and-measure from fix means 72 works from measured causes, and 71's output is what makes 72 estimable at all — `~L` on 72 is a placeholder until then.
- **The unswept surface is 42 pages, not "~40 components"** — `site/pages/form.jsx` through `view-transitions.jsx`. Counted, not estimated.
- **72 absorbs the residue 68 left unowned**: D1–D6, F1–F4, C6, E3, I1. G1–G4 stay out — load-dependent timing flakes need a reproduction approach, not a component fix.
- **Four recorded shas resolved to no branch.** C5, E2, C4 and H1 were each rebased before merge and the docs kept the pre-rebase sha; `git branch --contains` found them on nothing. Corrected in `docs/ISSUES.md`, `task68-bug-batch.md` and above. `docs/TODO/reports/` was left alone — it is point-in-time worker scratch and was accurate when written. **Record the sha after merge, not at commit time.**

## Task 71 — docs-site sweep (2026-08-01)

Branch `docs/site-sweep-triage`. Triage only: two new scripts, `docs/ISSUES.md` rewritten in the D/F/C/I sections, no `ui/`, `lib/` or `site/` change. Suite unchanged.

- **Swept 79 pages, not the 42 the banner named.** The banner counted `site/pages/form.jsx` onward and got 42 where the directory has 44; it also never counted the five `site/pages/docs/` pages. Routes come from `site/registry.js` now — a page file nothing routes to is unreachable, and a route is what the reader actually sees.
- **56 raw contrast hits and 38 cursor hits collapse into four root causes.** `--border` at 1.26:1 light / 1.48:1 dark (D9), `--muted-foreground` on `--muted` at 4.34:1 light (D10), seven component `cursor: default` declarations out-specifying the global element-selector rule (F5), and that rule listing ARIA roles but no native input types (F6). D1/D2/D3/D5 are all D9; F1/F2/F3 are all F5. 72 fixes four declarations, not twenty components.
- **axe cannot see the D family at all.** Its `color-contrast` rule measures text only, and every original D item is a border or a track — non-text, WCAG 1.4.11. A text-only sweep reports a design system with a 1.26:1 border token as clean. That is why `scripts/contrast-nontext.mjs` exists as a second tool rather than a flag on the first.
- **The control probe is what proved the diagnosis.** `.input`'s border was measured as a baseline nobody had complained about and failed identically to the four reported components. Without it the evidence reads as four component bugs. Add an unreported control to any sweep that is trying to tell "systemic" from "local" apart.
- **Two of the user's items did not reproduce as described** — re-aimed, not closed. D4 blames calendar borders, but `.calendar-day-button` is `border: none` (`ui/calendar/calendar.css:122`); what the eye saw was D9 on the surrounding frame. D6 blames the time text, which measures 19.80:1; the muddy element is `.time-picker-separator`, which is D10's token pair.
- **Computed colours come back as `oklch()`/`oklab()`.** The first version of the probe parsed the numbers out of the string and reported a uniform 1.00:1 for everything — plausible-looking garbage that would have sent 72 after every token in the kit. Convert via canvas `fillStyle` and composite alpha over the resolved backdrop. Any future colour measurement in this repo hits this.
- **Dark mode has zero text-contrast violations across all 79 pages.** The D items were written "light **and** dark unless noted"; for text that framing is wrong. Non-text still fails in both.
- **The screenshot half found almost nothing** — four opus agents over 88 images returned three defects, all docs-page markup (C7, C8), none in `ui/`. Machine measurement found everything else. Weight the next sweep accordingly.
- **K1 became task 74 rather than joining 72.** 73 of 79 pages overflow at 380px and nothing overflows at 1280; that is a reflow project across `site/pages/`, and it needs a scope call — whether the docs site targets phones — before anyone details it.

## Task 91 — console-ck-look (2026-08-25)

- **Scoped token overrides re-theme a whole subtree of kit components.** `.ck-console { --background: …; --primary: …; --sidebar: … }` gave tables, badges, cards and the panels the CloudKey palette with zero component CSS changes. Two traps: `--primary-hover` is derived at `:root` and must be re-derived alongside `--primary`, and `light-dark()` resolves where the token is declared, so a `color-scheme: dark` topbar still sees the light values and needs its own neutrals.
- **A custom property set on the element itself beats the ancestor override its API promises.** `live-value.css` first declared `--live-value-up` on `.live-value`; the console's orange never applied and the docs test passed because it probed a sibling. Read with `var(--x, fallback)`, and test overrides on the element with a forced attribute.
- **Fixed-width icon strips do not fit percent-sized ResizablePanels.** The folded rail renders outside the group; the group is keyed on the fold state so panels re-register cleanly.
- **The user's four open questions were answered by defaults after a 60s silence**: breadcrumb-only third bar, ring always pulses + badge glow opt-in, keep Acme Cloud, branch immediately. Recorded in the task file so the user can reverse any of them.

