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
| 08  | alert-dialog-sheet       | ~M  | [ ]    | deps: 07                                                                    |
| 09  | drawer                   | ~M  | [ ]    | deps: 07; swipe-to-dismiss                                                  |
| 10  | popover-tooltip          | ~L  | [ ]    | Popover API + use-anchor-position                                           |
| 11  | hover-card               | ~S  | [ ]    | deps: 10                                                                    |
| 12  | dropdown-menu            | ~L  | [ ]    | menu roles, submenus, safe-triangle                                         |
| 13  | context-menu             | ~M  | [ ]    | deps: 12; pointer-coord anchor                                              |
| 14  | menubar                  | ~M  | [ ]    | deps: 12                                                                    |
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
- 2026-07-22 — task 07 done on `feat/dialog` (~468 net lines). Overlay recipe
  for 08/09: `showModal()` gives top layer + focus containment + inert
  background — no Portal/useFocusTrap/useDismissableLayer. Esc = `cancel`
  event, `preventDefault()` + route through state so exit animation plays;
  `::backdrop` is the overlay (DialogOverlay/DialogPortal are compat no-ops);
  `showModal()` in a plain `useEffect` declared *after* `useReturnFocus` so
  focus capture runs before focus moves; backdrop click = pointer coords vs
  `getBoundingClientRect` (padding clicks stay inside).
- 2026-07-22 — task 06 done as two stacked branches (`feat/message-scroller`
  383 + `feat/message-scroller-hooks` 223 net lines; together over the 500
  cap). Gotchas: Chrome native scroll anchoring doubles manual prepend
  preservation — set `overflow-anchor: none` on any self-managed scroller
  (scroll-area 20, carousel 23); release-on-intent = wheel/touch/keys/
  scrollbar-pointerdown listeners, re-engage when scroll reaches the end.
