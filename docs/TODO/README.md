# Cycle: vanillin — component build-out (01–30), then config/parity/platform (31–61)

Plan: `~/.claude/plans/vanillin-zero-dep-shadcn-ui-recreation.md`. 31 of 64
components done in `ui/` at seed time (chart excluded; toast+sonner = one slug).

Phase 1 (01–28) is component parity with shadcn/ui. Phase 2 (31–58) is the
consumer story: config-driven theming, Form, the deferred parity gaps, and
platform features shadcn cannot adopt (Tailwind/Radix/React-18 bound).

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
| 29  | docs-shell          | ~M  | [x]    | grouped nav (Get started / Components); intro + install/theming stubs; empty hash → #introduction |
| 30 (do last)  | docs-content        | ~M  | [ ]    | **runs last**, after 58; now a consistency/gap pass only — each task writes its own docs (2026-07-26) |

## Phase 2 — config, form, parity, platform

Sequence: 28 → 29 (thin) → 31…61 → 30. Rationale in the 2026-07-25 log entry.
Tasks are detailed just-in-time; only the rows below are durable.

59–63 were added 2026-07-26, after 31–58 landed: 59 and 62 from the user
directly, 60/61/63 from reviewing what phase 2 actually shipped. **61 before
60** — the default config in 60 can only express a one-colour brand until 61
lands.

**Considered and rejected 2026-07-26: a vanillin state-management library**
(zustand-shaped `create()` over `useSyncExternalStore`). Off-mission for a
component kit; no vanillin component needs a global store, so unlike form
validation there is no hole to fill; and a consumer already on zustand or Redux
would end up with two stores, which inverts the zero-dependency argument. The
fallback idea — extract the fine-grained subscription primitive that `use-form`
and `use-data-table` supposedly shared — died on measurement: `use-data-table` is
eight plain `useState` calls (`lib/use-data-table.js:38-48`) with no listeners,
proxy or subscription engine, so there is nothing shared to extract. Do not
revive either without new evidence.

**Every task writes its own docs** (2026-07-26) — prose lands in the same PR as
the code, on the component's playground page or the relevant
`playground/pages/docs/` page. Task 30 is no longer where documentation gets
written; it is a final consistency and gap pass.

| #   | Slug                     | Est | Status | Notes                                                                                            |
| --- | ------------------------ | --- | ------ | ------------------------------------------------------------------------------------------------ |
| 31  | cursor-affordance        | ~S  | [x]    | global interactive-cursor rule + per-component sweep (grab, resize)                                |
| 32  | status-colors            | ~M  | [x]    | badge success/warning/info/destructive + new `ui/status-dot`                                         |
| 33  | token-foundation         | ~M  | [x]    | `@property`, `light-dark()`, relative-color brand derivation, density scaffold                         |
| 34  | tokenize-core-a          | ~M  | [x]    | deps: 33; form controls — button, badge, input, textarea, checkbox, radio, switch, label, field, native-select |
| 35  | tokenize-core-b          | ~M  | [x]    | deps: 33; surfaces — card, dialog, alert, popover, tooltip, toast, table, avatar, separator, progress, slider, tabs |
| 36  | density-modes            | ~S  | [x]    | deps: 34, 35; `compact`, `comfortable`, `spacious` over tokenized components |
| 37  | config-generator         | ~L  | [x]    | deps: 34, 35; `vanillin.config.json` schema + zero-dep generator → `vanillin.css`; **output not wired into the playground — see 60** |
| 38  | cli                      | ~L  | [ ]    | deps: 37, **64** (manifest format — `add` writes the sidecar); `bin/vanillin.mjs` init/add/build/list + `registry.json`; **git-sourced, stays `private: true`** |
| 39  | container-queries        | ~M  | [ ]    | deps: 34, 35; components size to container, not viewport (console panels)    |
| 40  | use-form-core            | ~L  | [x]    | zero-dep `lib/use-form.js`, RHF-shaped; resolver contract = `@hookform/resolvers` compatible |
| 41  | form-component           | ~M  | [x]    | deps: 40; `ui/form/` engine-agnostic (context, never imports the engine) + React 19 Actions path |
| 42  | format-intl              | ~M  | [x]    | `lib/format.js` + `<RelativeTime>` `<Bytes>` `<Duration>` `<Cost>`; pure Intl |
| 43  | select-parity            | ~M  | [x]    | `alignItemWithTrigger`, scroll buttons, constraint validation                |
| 44  | combobox-multi           | ~M  | [x]    | deps: 43; `multiple` + chips + `showClear`                                   |
| 45  | command-fuzzy            | ~S  | [x]    | port cmdk `command-score`, re-sort items + groups, `Command.Loading`         |
| 46  | navigation-menu-viewport | ~L  | [x]    | shared morphing viewport + sliding Indicator (drops the 15 no-ops); **under-specified — expect to split into viewport + indicator on approach** |
| 47  | data-table-filtering     | ~M  | [x]    | global filter, faceted filter, multi-sort                                    |
| 48  | data-table-columns       | ~M  | [x]    | deps: 47; column pinning + resizing                                          |
| 49  | data-table-scale         | ~L  | [ ]    | deps: 48; grouping, virtualization, `manual*` server-side modes; **unresolved: `content-visibility` may cover virtualization outright — measure before building a windowing layer** |
| 50  | resizable-parity         | ~M  | [x]    | `autoSaveId`/storage, `onResize`/`onCollapse`, F6 cycling, `hitAreaMargins`  |
| 51  | scroll-area-parity       | ~M  | [x]    | `overflowEdgeThreshold` + `data-overflow-*`, overscroll squish, snap suspension |
| 52  | swipe-velocity           | ~S  | [x]    | flick dismiss for toast + drawer — `useSwipe` already returns velocity       |
| 53  | date-picker-parity       | ~M  | [x]    | natural-language input parsing (zero-dep chrono subset) + time picker        |
| 54  | view-transitions         | ~M  | [x]    | `startViewTransition` for route/detail/theme-toggle; reduced-motion guard    |
| 55  | highlight-api            | ~S  | [x]    | CSS Custom Highlight for search matches (table, command, log) — no DOM mutation |
| 56  | forced-colors            | ~M  | [x]    | `forced-colors`, `prefers-contrast`, `prefers-reduced-transparency` sweep    |
| 57  | platform-polish          | ~S  | [x]    | Speculation Rules prefetch, `field-sizing: content` on textarea              |
| 58  | carousel-parity          | ~S  | [x]    | nice-to-have; `plugins`, `opts.loop`, `opts.align` (currently stubbed)       |
| 59  | form-bindings            | ~M  | [ ]    | deps: 40, 41; user-requested. Third layer composing `use-form` + `ui/form` + controls into one import; `ui/form` must still never import the engine. Also where `ui/form` stops reimplementing label/description/message |
| 60  | generated-defaults       | ~L  | [ ]    | deps: 37, 61; kit's own theme generated from a default config — one authoritative `:root`. Resolves task 37's spec contradiction (import the output vs. stay pixel-identical) |
| 61  | brand-multicolor         | ~M  | [ ]    | deps: 37; `brand` as string-or-object (primary/secondary/accent/neutral); **sub-task 1 is an a11y fix — foregrounds picked by measured contrast, not a lightness threshold — and ships independently** |
| 62  | schema-core              | ~L  | [ ]    | `lib/schema.js` — zero-dep zod-shaped validation + `schemaResolver` adapter. Pairs with 59; neither blocks the other, the resolver contract is already the seam. Runtime only — no TS inference story |
| 63  | composition-pass         | ~M  | [~]    | components reuse each other where the relationship is **semantic**, not everywhere — a blanket rule would destroy copy-paste independence. Sub-task 1 (date demo split) landed `0f48e2fe84de` |
| 64  | component-contracts      | ~L  | [ ]    | per-copy `ui/<slug>/.vanillin.json` manifest (provenance + `requires` + file hashes) **+** a conformance suite that keeps it true. **Do before 38** — `add` consumes the format. Independent release windows, one monotonic `kitVersion` |
| 65  | component-update         | ~L  | [ ]    | deps: 64, 38; `vanillin update` with 3-way merge (base = recorded `kitVersion`). Biggest payoff — shadcn cannot take upstream fixes into an edited component — and the easiest to make destructive. Own task, own tests |

**Browser-support gate:** 33, 39, 54, 55, 57 depend on features that were
partially supported at plan time (relative color syntax, `light-dark()`,
container queries, View Transitions, Custom Highlight API, Speculation Rules,
`field-sizing`). Each task's first step is a live support check — degrade to
progressive enhancement, never a hard requirement.

## Backlog — console kit

Components a cloud console needs that shadcn has no answer for. Not scheduled;
detail just-in-time after 58 lands. Rough order of usefulness:

- `copy-field` — resource IDs, ARNs, connection strings (~S)
- `key-value` — resource detail pane, definition-list semantics (~S)
- `stat-tile` — metric + delta + inline SVG sparkline (~M)
- `log-viewer` — follow-tail (reuse `message-scroller`), ANSI colour, 55 highlight (~L)
- `code-block` — copy, line numbers, diff; highlight via Custom Highlight API (~M)
- `quota-meter` — usage bar with threshold colours from the 32 status tokens (~S)
- `json-tree` — `<details>`-based, zero JS (~M)
- `filter-bar` — query builder over `use-data-table` filters (~L)
- `timeline` — audit log / event history (~M)
- `connection-status` — live SSE/WebSocket indicator (~S)
- `region-picker` — grouped select with latency hints (~S)

## Refs

- **Per-task decisions, deviations and gotchas: `docs/TODO/LOG.md`.** Append
  there when a task lands — not to this file. This index stays scannable.
- Planning is **just-in-time**: the rows above are durable, task files are
  written when a task is picked up. Task files now exist for every task except
  22–29 (landed before the convention) and 59 (still to be written).
  Unstarted-but-specified and ready to dispatch: 30, 38, 39, 49, 60, 61.
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
