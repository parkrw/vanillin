# Cycle: finish vanillin — remaining 33 shadcn/ui components + dark-mode pass

Plan: `~/.claude/plans/vanillin-zero-dep-shadcn-ui-recreation.md`. 31 of 64
components done in `ui/` at seed time (chart excluded; toast+sonner = one slug).
One task = one PR (≤500 net lines vs main).

| #   | Slug                     | Est | Status | Notes                                                             |
| --- | ------------------------ | --- | ------ | ----------------------------------------------------------------- |
| 01  | toggle-group             | ~S  | [x]    | roving tabindex; reuses ui/toggle css                             |
| 02  | pagination               | ~S  | [ ]    | reuses .btn classes; branch from main after 01 merges             |
| 03  | field-direction          | ~M  | [ ]    | direction = RTL context (lib)                                     |
| 04  | chat-message-bubble      | ~M  | [ ]    | chat set part 1                                                   |
| 05  | chat-attachment-scroller | ~M  | [ ]    | deps: 04                                                          |
| 06  | dialog                   | ~L  | [ ]    | pattern-setter: `<dialog>` + focus-scope + scroll-lock + presence |
| 07  | alert-dialog-sheet       | ~M  | [ ]    | deps: 06                                                          |
| 08  | drawer                   | ~M  | [ ]    | deps: 06; swipe-to-dismiss                                        |
| 09  | popover-tooltip          | ~L  | [ ]    | Popover API + use-anchor-position                                 |
| 10  | hover-card               | ~S  | [ ]    | deps: 09                                                          |
| 11  | dropdown-menu            | ~L  | [ ]    | menu roles, submenus, safe-triangle                               |
| 12  | context-menu             | ~M  | [ ]    | deps: 11; pointer-coord anchor                                    |
| 13  | menubar                  | ~M  | [ ]    | deps: 11                                                          |
| 14  | navigation-menu          | ~M  | [ ]    | deps: 09                                                          |
| 15  | select                   | ~L  | [ ]    | hardest; deps: 09, 11                                             |
| 16  | combobox                 | ~M  | [ ]    | deps: 15                                                          |
| 17  | command                  | ~M  | [ ]    | deps: 16                                                          |
| 18  | input-otp                | ~M  | [ ]    | hidden input + segments                                           |
| 19  | scroll-area              | ~M  | [ ]    | overlay synced thumb                                              |
| 20  | calendar                 | ~L  | [ ]    | ARIA grid, native Date/Intl                                       |
| 21  | date-picker              | ~S  | [ ]    | deps: 09, 20                                                      |
| 22  | toast                    | ~L  | [ ]    | queue, stacking, hover-pause, swipe                               |
| 23  | carousel                 | ~M  | [ ]    | scroll-snap + pointer swipe                                       |
| 24  | resizable                | ~M  | [ ]    | role=separator, keyboard resize                                   |
| 25  | data-table               | ~L  | [ ]    | pattern page over ui/table                                        |
| 26  | sidebar                  | ~L  | [ ]    | deps: 07 (mobile = sheet); Cmd+B                                  |
| 27  | dark-mode-pass           | ~M  | [ ]    | deps: all; visual QA every component in `.dark`                   |

## Refs

- Test: `node tests/run.mjs` — boots its own vite on :5199, drives local Chrome;
  one `tests/<slug>.test.mjs` per interactive component. (Dev server on :5173
  only needed for manual/screenshot QA.)
- Build: `npm run build`. No lint configured.
- Conventions + gotchas: `HANDOFF.md` (block classes, tokens-only CSS, `cn()`,
  `as` prop, `useControllableState` + `data-state`, `usePresence`, demo page +
  `playground/registry.js` entry per component).
- Load-bearing files: `styles/globals.css` (tokens), `lib/` primitives,
  `ui/toggle/` (stateful pattern), `ui/tabs/` (roving tabindex), `ui/accordion/`
  (disclosure/presence), `playground/registry.js`.
- Git gates (hooks): no commits on main — `<type>/<kebab>` branch first; PR cap
  500 net lines vs main.

## Adjustments log

- 2026-07-22 — seeded from plan file + HANDOFF.md inventory (31/64 done).
- 2026-07-22 — split task 01 (pagination-toggle-group) into 01 toggle-group + 02
  pagination; TODO seed + toggle-group hit ~350 net lines on one branch (cap
  500). Renumbered 02→03 … 26→27. Runner note: tests self-host on :5199, no dev
  server needed.
