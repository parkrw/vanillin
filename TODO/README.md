# Cycle: finish vanillin — remaining 33 shadcn/ui components + dark-mode pass

Plan: `~/.claude/plans/vanillin-zero-dep-shadcn-ui-recreation.md`. 31 of 64 components done in `ui/` (chart excluded; toast+sonner = one slug). One task = one PR (≤500 net lines vs main).

| # | Slug | Est | Status | Notes |
|---|------|-----|--------|-------|
| 01 | pagination-toggle-group | ~M | [ ] | toggle-group uses roving tabindex |
| 02 | field-direction | ~M | [ ] | direction = RTL context (lib) |
| 03 | chat-message-bubble | ~M | [ ] | chat set part 1 |
| 04 | chat-attachment-scroller | ~M | [ ] | deps: 03 |
| 05 | dialog | ~L | [ ] | pattern-setter: `<dialog>` + focus-scope + scroll-lock + presence |
| 06 | alert-dialog-sheet | ~M | [ ] | deps: 05 |
| 07 | drawer | ~M | [ ] | deps: 05; swipe-to-dismiss |
| 08 | popover-tooltip | ~L | [ ] | Popover API + use-anchor-position |
| 09 | hover-card | ~S | [ ] | deps: 08 |
| 10 | dropdown-menu | ~L | [ ] | menu roles, submenus, safe-triangle |
| 11 | context-menu | ~M | [ ] | deps: 10; pointer-coord anchor |
| 12 | menubar | ~M | [ ] | deps: 10 |
| 13 | navigation-menu | ~M | [ ] | deps: 08 |
| 14 | select | ~L | [ ] | hardest; deps: 08, 10 |
| 15 | combobox | ~M | [ ] | deps: 14 |
| 16 | command | ~M | [ ] | deps: 15 |
| 17 | input-otp | ~M | [ ] | hidden input + segments |
| 18 | scroll-area | ~M | [ ] | overlay synced thumb |
| 19 | calendar | ~L | [ ] | ARIA grid, native Date/Intl |
| 20 | date-picker | ~S | [ ] | deps: 08, 19 |
| 21 | toast | ~L | [ ] | queue, stacking, hover-pause, swipe |
| 22 | carousel | ~M | [ ] | scroll-snap + pointer swipe |
| 23 | resizable | ~M | [ ] | role=separator, keyboard resize |
| 24 | data-table | ~L | [ ] | pattern page over ui/table |
| 25 | sidebar | ~L | [ ] | deps: 06 (mobile = sheet); Cmd+B |
| 26 | dark-mode-pass | ~M | [ ] | deps: all; visual QA every component in `.dark` |

## Refs

- Test: `node tests/run.mjs` (needs `npm run dev` on :5173 first); one `tests/<slug>.test.mjs` per interactive component.
- Build: `npm run build`. No lint configured.
- Conventions + gotchas: `HANDOFF.md` (block classes, tokens-only CSS, `cn()`, `as` prop, `useControllableState` + `data-state`, `usePresence`, demo page + `playground/registry.js` entry per component).
- Load-bearing files: `styles/globals.css` (tokens), `lib/` primitives, `ui/toggle/` (stateful pattern), `ui/tabs/` (roving tabindex), `ui/accordion/` (disclosure/presence), `playground/registry.js`.
- Git gates (hooks): no commits on main — `<type>/<kebab>` branch first; PR cap 500 net lines vs main.

## Adjustments log

- 2026-07-22 — seeded from plan file + HANDOFF.md inventory (31/64 done).
