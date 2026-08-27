# Cycle: vanillin — components (01–30), config/parity/platform (31–79), docs site + console kit (80–104)

**Resume:** Handoff section below — **batch A (84, 92, 93) is in flight since 2026-08-27** in tmux window `cycle-a`. Everything through **91** is merged; `main` == `origin/main` at `07961519da8d`; **74 is parked by the user** ("no mobile yet", 2026-08-24). Next: when the three reports land, `/cycle --adjust` to reconcile, then `/cycle --spawn 3` → batch B (94, 95, 96).

**History:** per-task detail lives in each task file's `## Handoff` and in `docs/TODO/LOG.md` (the long index history through 90 moved there on 2026-08-27). Milestones: batches 1–6 (76–89) landed 2026-08-06 → 08-17; 90 console-route 08-19; ci gate + F4 cursor fix `9c483ea` 08-24; 91 console-ck-look `d70e7c66` 08-25; G4 removed and G2 fixed 08-25; data-table C11–C16 fixed 08-26.

## Handoff — batch A in flight (84, 92, 93); then batches B–E (console kit 94–104)

**Status:** IN PROGRESS (batch A spawned)  **Branch:** `docs/cycle-spawn-a-2026-08-27`  **PR:** none  **Updated:** 2026-08-27

- **In flight (spawned 2026-08-27):** tmux window `cycle-a` (`@52`), one pane each, layout even-horizontal. 84 token-guard — `fix/token-guard`, `../vanillin-task84-token-guard`, pane `%146`, port 5201. 92 glow-pulse — `feat/glow-pulse`, `../vanillin-task92-glow-pulse`, pane `%147`, port 5202. 93 copy-field — `feat/copy-field`, `../vanillin-task93-copy-field`, pane `%148`, port 5203. All three branch from `bf986f8f9d7e` on the docs branch, so each carries the task files; the user merges each into `main` (the docs commit comes along once). Workers report to `docs/TODO/reports/task{84,92,93}.md` and touch the matching `.done`; the head reviews each (delegated diff read, `Owns` assertion, verify re-run in the worktree) before ticking. **Run `/cycle --adjust` to reconcile after the batch lands.** If the head died mid-batch: read the reports, check each worktree (`git log`, task file `## Handoff`, pushed?), tick what passed, `git worktree remove` the passed ones (approval-gated), then spawn batch B.
- **Repo state:** `main` == `origin/main` (`07961519da8d`); three batch-A worktrees listed above. `stash@{0}` (`fix/console-ck-look-tests` WIP) is superseded by `d70e7c66` and droppable; `stash@{1,2}` are old and unrelated. User-deletable remotes: `docs/shell-width-gap`, `docs/usage-order`, `feat/console-panels`, `feat/console-rebrand-nav`. `docs/TODO/reports/` is untracked scratch; the stale `task88.done`/`task89.done` were removed 2026-08-27 so the next monitor cannot fire on them.
- **Suite baseline:** 811/811 on 2026-08-27 (`07961519da8d`, idle machine, `node tests/run.mjs`, exit 0) — no failing tests; the slider-cursor pair and the nav-menu hover flake are gone (F4 fix, G4 removal). Re-measure before every spawn and name the failing tests — a bare count is not evidence.
- **74 mobile-views is parked** (user, 2026-08-24). Do not schedule it.
- **Spawn schedule** (cap 3 workers + head = 4 agents; every batch's `Owns` pairwise disjoint; each batch branches from post-merge `main`):
  - **A:** 84 token-guard (+ H4 harness guard) + 92 glow-pulse + 93 copy-field
  - **B:** 94 log-viewer + 95 key-value + 96 quota-meter
  - **C:** 97 code-block + 98 stat-tile + 99 json-tree
  - **D:** 100 filter-bar + 101 timeline + 102 connection-status
  - **E:** 103 region-picker + 104 menu-destructive-item (two workers)
- **Console-worker `Owns` (default for 93–103):** `ui/<slug>/**` (incl. `.van.json`), `site/pages/<slug>.jsx`, `tests/<slug>.test.mjs`, one `site/registry.js` line, and the regenerated `registry.json`. The head resolves the `site/registry.js` line conflict at merge and re-runs `npm run contracts` — CI gates on manifest/registry freshness with `git diff --exit-code`. `site/showcase/**` and `site/site.css` are shared and outside every worker's scope: the head wires `#console` mounts post-merge (88/89 precedent); page styles go in the component's CSS. `VANILLIN_TEST_PORT` 5201/5202/5203 per worker (`tests/run.mjs` pins `:5199 --strictPort`).
- **Gotchas:** 92 glow-pulse lives in the components themselves (91 precedent: `ui/badge`, `ui/status-dot`), never `styles/globals.css` — that file is 84's in the same batch. 96 quota-meter and 102 connection-status compose the badge/status-dot glow, so both sit after A merges. 94 log-viewer reuses `ui/message-scroller` and 100 filter-bar reuses `use-data-table` read-only — neither may edit them.

Two notes for reading anything below: the docs site directory is **`site/`** (renamed 2026-07-27), so older prose here saying `playground/` means `site/`. And `docs/HANDOFF.md` is gone — its durable content is in `AGENTS.md`, `docs/QUIRKS.md` and `docs/DECISIONS.md`; live state belongs in each task file's `## Handoff`.

Plan: `~/.claude/plans/vanillin-zero-dep-shadcn-ui-recreation.md`. 31 of 64
components done in `ui/` at seed time (chart excluded; toast+sonner = one slug).

Phase 1 (01–28) is component parity with upstream. Phase 2 (31–58) is the
consumer story: config-driven theming, Form, the deferred parity gaps, and
platform features upstream cannot adopt (Tailwind/Radix/React-18 bound).

| #            | Slug                | Est | Status | Notes                                                                                             |
| ------------ | ------------------- | --- | ------ | ------------------------------------------------------------------------------------------------- |
| 01           | toggle-group        | ~S  | [x]    | roving tabindex; reuses ui/toggle css                                                             |
| 02           | pagination          | ~S  | [x]    | reuses .btn classes                                                                               |
| 03           | field-direction     | ~M  | [x]    | Field family + RTL demo/test + logical-CSS sweep                                                  |
| 04           | chat-message-bubble | ~M  | [x]    | ui/bubble + ui/message, CSS-only                                                                  |
| 05           | attachment          | ~M  | [x]    | deps: 04; CSS-only incl. AttachmentGroup scroll-snap row                                          |
| 06           | message-scroller    | ~M  | [x]    | two stacked PRs: core + button/hooks                                                              |
| 07           | dialog              | ~L  | [x]    | native `<dialog>` pattern-setter — see task file for overlay recipe                               |
| 08           | alert-dialog-sheet  | ~M  | [x]    | thin reuses of ui/dialog (compound classes + `dismissible`)                                       |
| 09           | drawer              | ~M  | [x]    | stacked on 08 branch; Base UI anatomy (swipeDirection), not vaul                                  |
| 10           | popover-tooltip     | ~L  | [x]    | anchored-overlay pattern-setter — see task file for popover recipe                                |
| 11           | hover-card          | ~S  | [x]    | deps: 10; tooltip recipe + shared root timers for content-hover grace                             |
| 12           | dropdown-menu       | ~L  | [x]    | menu-overlay pattern-setter for 13/14/16 — see task file + log                                    |
| 13           | context-menu        | ~M  | [x]    | deps: 12; all parts re-export dropdown-menu; see Chrome contextmenu gotcha                        |
| 14           | menubar             | ~M  | [x]    | deps: 12; all item parts re-export dropdown-menu; see click-toggle gotcha                         |
| 15           | navigation-menu     | ~M  | [x]    | deps: 10; per-item panels (viewport-less mode); Viewport/Indicator no-ops                         |
| 16           | select              | ~L  | [x]    | deps: 10, 12; popper-only (no alignItemWithTrigger); dropdown race fixed                          |
| 17           | combobox            | ~M  | [x]    | deps: 16; Base UI anatomy; single-select only (chips/multiple deferred)                           |
| 18           | command             | ~M  | [x]    | deps: 17; still cmdk anatomy; substring filter (no score/re-sort)                                 |
| 19           | input-otp           | ~M  | [x]    | transparent input over slots; caret parks at end of value                                         |
| 20           | scroll-area         | ~M  | [x]    | overlay bars over a native scroller; imperative thumb sync                                        |
| 21           | calendar            | ~L  | [x]    | ARIA grid, native Date/Intl; single/multiple/range, dropdown caption                              |
| 22           | date-picker         | ~S  | [x]    | composition pattern only — no DatePicker root; pattern CSS + demo + tests                         |
| 23           | toast               | ~L  | [x]    | sonner-shaped imperative API; queue, stacking, hover-pause, swipe                                 |
| 24           | carousel            | ~M  | [x]    | scroll-snap + deferred-capture swipe; embla api surface docs use                                  |
| 25           | resizable           | ~M  | [x]    | v4 anatomy (data-separator); drag + keyboard, collapsible                                         |
| 26           | data-table          | ~L  | [x]    | lib/use-data-table.js replaces tanstack surface; checkbox tri-state                               |
| 27           | sidebar             | ~L  | [x]    | all 24 exports real; mobile = sheet; Cmd+B; sidebar_state cookie                                  |
| 28           | dark-mode-pass      | ~M  | [x]    | axe contrast sweep + screenshot QA; `--input-background` token                                    |
| 29           | docs-shell          | ~M  | [x]    | grouped nav (Get started / Components); intro + install/theming stubs; empty hash → #introduction |
| 30           | site-chrome          | ~L  | [x]    | shell overhaul: top navbar (navigation-menu), ⌘K command palette, home page, component categories, breadcrumbs |

## Phase 2 — config, form, parity, platform

Tasks are detailed just-in-time; only the rows below are durable.

**Order from here (settled 2026-07-27, after 38 landed):**

```
39 ✓ → 68 ✓ → 71 ✓ → 72 ✓ → 73 ✓ → 65 ✓ → 66 ✓ → 67 ✓ → 69 ✓ → 70 ✓ → 30 ✓ → 75 ✓ → 76 ✓ → 78 ✓ → 77 A+B ✓ + 79 ✓ (batch 2) → 80 ✓ + 77 C+D ✓ (batch 3) → 81 + 82 (batch 4 — Owns disjoint) → 74 (mobile, deps 81) → console kit
```

**Batch 4 = 81 + 82**, added 2026-08-07 after the user reviewed the finished docs
site. 77 templated every page; it did not make the site *look* finished. The two
tasks split cleanly by the shell/content seam — 81 owns the layout files, 82 owns
`site/pages/**` — so they spawn together. **Neither is a redo of 77**: 81 is
geometry nobody owned, and 82 is the pages 76/77 never reached plus the system
pages whose licensed deviation read as neglect.

- **39 landed 2026-07-27 and unblocked everything after it.** It ran alone on the
  premise that it rewrites every component's CSS; in the event it touched six
  components, so that premise was wrong — see [^39]. The order below stands
  regardless.
- **68 before the remaining CLI work.** Known code bugs, including one
  high-priority motion glitch, should not sit under new features.
- **71 ✓ → 72 → 73 before the CLI work, for the same reason** (added 2026-07-31;
  71 landed 2026-08-01).
  68's scope was *known* bugs; 71 finishes the sweep that decides what "known"
  means, 72 fixes it, and 73 answers which features nothing would have caught
  anyway. **73 is the one row here that can slide right** if the CLI is wanted
  sooner — it is test quality, not a user-visible defect. 71 and 72 should not.
- **69 and 70 before 30.** They rewrite the docs pages that 30 then proofreads.
- **30 is now the site chrome overhaul** (top navbar, ⌘K palette, home page,
  component categories, breadcrumbs), not a consistency pass. The docs-content
  work that was task 30 is now split across 75–78. A3 (code examples) is 75+76+77;
  B1–B6 are distributed across 76 (B5, B6, C8), 77 (B2–B4, C7), and 78 (B1, A5).
- **75 → 76 → 77 is the critical path.** 78 (Get Started, config reference,
  voice pass) can run in parallel with 76 — their `Owns` globs are disjoint
  (78 owns `site/pages/docs/*.jsx`, 76 owns the 15 component pages).
- **77 is spawn-ready** — ~59 pages, disjoint files, 3-4 workers by category.
- **The console kit comes after 77** — new components want settled docs
  conventions and post-39 CSS. Cheap now: 64 + 38 generate the manifest,
  registry entry and sidecar.

**`docs/ISSUES.md` is the triage inbox, not a plan.** Items graduate into rows
here. **The unfinished-sweep banner is gone as of 2026-08-01** — 71 swept all 79
pages, so the file is now complete rather than a partial pass, and no session
needs to warn about unswept pages any more.

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

66–67 were added 2026-07-27, split out of 38 while scoping it. Task 38 also took
on six shadcn-parity items in the same pass (`diff`, `--cwd`, shadcn's flag
vocabulary, `@/*` resolution via tsconfig paths, a registry `type` field, minimal
ANSI) — all cheap, all in `bin/van.mjs`. **An HTTP registry was rejected**:
`npx github:` already ships the whole tree, so it would buy only speed and
third-party registries, and distribution was settled in task 38's own spec. See
`docs/TODO/task38-cli.md`.

**Every task writes its own docs** (2026-07-26) — prose lands in the same PR as
the code, on the component's docs-site page or the relevant
`site/pages/docs/` page. Tasks 75–78 are the docs site rebuild: code display
infrastructure (75), per-component shadcn-style docs (76+77), and content/Get
Started refresh (78). Task 30 is the site chrome overhaul that enables them.

| #   | Slug                     | Est | Status | Notes                                                                  |
| --- | ------------------------ | --- | ------ | ---------------------------------------------------------------------- |
| 31  | cursor-affordance        | ~S  | [x]    | global interactive-cursor rule + per-component sweep (grab, resize)    |
| 32  | status-colors            | ~M  | [x]    | badge success/warning/info/destructive + new `ui/status-dot`           |
| 33  | token-foundation         | ~M  | [x]    | `@property`, `light-dark()`, brand derivation, density [^33]           |
| 34  | tokenize-core-a          | ~M  | [x]    | deps: 33; the ten form controls [^34]                                  |
| 35  | tokenize-core-b          | ~M  | [x]    | deps: 33; the twelve surfaces [^35]                                    |
| 36  | density-modes            | ~S  | [x]    | deps: 34, 35; `compact` / `comfortable` / `spacious` [^36]             |
| 37  | config-generator         | ~L  | [x]    | deps: 34, 35; `van.config.json` → `van.css` generator [^37]            |
| 38  | cli                      | ~L  | [x]    | `bin/van.mjs` init/add/diff/build/list + framework detection [^38]     |
| 39  | container-queries        | ~M  | [x]    | deps: 34, 35; components size to container, not viewport [^39]         |
| 40  | use-form-core            | ~L  | [x]    | zero-dep `lib/use-form.js`, RHF-shaped [^40]                           |
| 41  | form-component           | ~M  | [x]    | deps: 40; `ui/form/` engine-agnostic + Actions path [^41]              |
| 42  | format-intl              | ~M  | [x]    | `lib/format.js` + four components; pure Intl [^42]                     |
| 43  | select-parity            | ~M  | [x]    | `alignItemWithTrigger`, scroll buttons, constraint validation          |
| 44  | combobox-multi           | ~M  | [x]    | deps: 43; `multiple` + chips + `showClear`                             |
| 45  | command-fuzzy            | ~S  | [x]    | port cmdk `command-score`, re-sort items + groups, `Command.Loading`   |
| 46  | navigation-menu-viewport | ~L  | [x]    | shared morphing viewport + sliding Indicator [^46]                     |
| 47  | data-table-filtering     | ~M  | [x]    | global filter, faceted filter, multi-sort                              |
| 48  | data-table-columns       | ~M  | [x]    | deps: 47; column pinning + resizing                                    |
| 49  | data-table-scale         | ~L  | [x]    | deps: 48; grouping + `manual*` modes; windowing rejected [^49]         |
| 50  | resizable-parity         | ~M  | [x]    | `autoSaveId`, `onResize`/`onCollapse`, F6, `hitAreaMargins` [^50]      |
| 51  | scroll-area-parity       | ~M  | [x]    | `overflowEdgeThreshold`, overscroll squish, snap suspension [^51]      |
| 52  | swipe-velocity           | ~S  | [x]    | flick dismiss for toast + drawer — `useSwipe` already returns velocity |
| 53  | date-picker-parity       | ~M  | [x]    | natural-language input parsing (zero-dep chrono subset) + time picker  |
| 54  | view-transitions         | ~M  | [x]    | `startViewTransition` for route/detail/theme-toggle [^54]              |
| 55  | highlight-api            | ~S  | [x]    | CSS Custom Highlight for search matches [^55]                          |
| 56  | forced-colors            | ~M  | [x]    | `forced-colors`, `prefers-contrast`, reduced-transparency [^56]        |
| 57  | platform-polish          | ~S  | [x]    | Speculation Rules prefetch, `field-sizing: content` on textarea        |
| 58  | carousel-parity          | ~S  | [x]    | nice-to-have; `plugins`, `opts.loop`, `opts.align` (currently stubbed) |
| 59  | form-bindings            | ~M  | [x]    | `ui/form-fields/` — deps: 40, 41; third layer over engine + `ui/form`  |
| 60  | generated-defaults       | ~L  | [x]    | deps: 37, 61; `van.defaults.json` → `styles/defaults.css` [^60]        |
| 61  | brand-multicolor         | ~M  | [x]    | deps: 37; `brand` as string-or-object [^61]                            |
| 62  | schema-core              | ~L  | [x]    | `lib/schema.js` — zod-shaped validation + resolver [^62]               |
| 63  | composition-pass         | ~M  | [x]    | reuse only where the relationship is **semantic** [^63]                |
| 64  | component-contracts      | ~L  | [x]    | per-copy `.van.json` manifest + conformance suite [^64]                |
| 65  | component-update          | ~L  | [x]    | deps: 64, 38; `van update` — 3-way merge via git merge-file [^65] |
| 66  | config-schema-json       | ~M  | [x]    | deps: 38; generated `van.schema.json` + `$schema` [^66]                |
| 67  | cli-picker               | ~S  | [x]    | deps: 38; interactive multi-select for a bare `add` [^67]              |
| 68  | bug-batch                | ~M  | [x]    | deps: 39; all 9 done and merged; suite 708/708 [^68]                    |
| 69  | docs-site-dogfood        | ~M  | [x]    | ISSUES A2 — the site is built out of the kit [^69]                       |
| 70  | typography-system        | ~L  | [x]    | ISSUES A4 — a real typeset scale, not per-page sizes [^70]               |
| 71  | docs-site-sweep          | ~M  | [x]    | all 79 pages swept; 2 tools committed; D/F collapse to 4 causes [^71]  |
| 72  | bug-batch-2              | ~M  | [x]    | merged 2026-08-02, no PR (local merge); all 11 sub-tasks; +F7/D14/D15 filed [^72] |
| 74  | mobile-views             | ~L  | [ ]    | deps: 81; scope call answered — mobile via kit sheet/drawer [^74]       |
| 73  | coverage-probe           | ~L  | [x]    | 26 probed, 5 gaps fixed, 20 caught, 1 skipped; suite 735 [^73]          |
| 75  | docs-code-infra          | ~M  | [x]    | landed on `fix/docs-nav-rework` (`27a1410`); sub-task 5 (page convention) delegated to 76 [^75] |
| 76  | docs-pages-core          | ~L  | [x]    | landed 2026-08-06 on `docs/pages-core` (18 commits, local merge); B5/B6/C8 fixed [^76] |
| 77  | docs-pages-rest          | ~XL | [x]    | deps: 76; all 59 pages templated — A+B 2026-08-06, C+D 2026-08-07 [^77]  |
| 78  | docs-content             | ~M  | [x]    | landed 2026-08-06 on `docs/content` (6 commits, local merge); B1 + CLI page [^78] |
| 79  | docs-right-rail          | ~M  | [x]    | landed 2026-08-06 on `feat/docs-right-rail`; TOC rail + drag resize; stretch (code panel) skipped [^79] |
| 80  | dialog-modal-positioning | ~M  | [x]    | landed 2026-08-07 on `fix/dialog-modal-positioning`; one-line CSS fix, 2 new tests [^80] |
| 81  | docs-layout-measure      | ~M  | [x]    | merged 2026-08-16 — column centred/68rem + 62ch measure, rhythm contract, topnav 3.6:1; post-merge suite 760/762 [^81] |
| 82  | docs-completeness        | ~L  | [x]    | complete 2026-08-16 — all pages to standard, em-dash sweep at 0, sheet.jsx finished last; suite 760/762 [^82] |
| 83  | overlay-stacking         | ~S  | [x]    | merged 2026-08-16 — nav-menu viewport z-index + regression test; probe covers all ten overlays [^83] |
| 84  | token-guard              | ~S  | [x]    | complete 2026-08-27 on `fix/token-guard`, **PR #8**, review PASS; `scripts/check-tokens.mjs` gates `npm run build` (0 findings, 17-assertion unit suite), `@property` for the three `--typeset-font-*` tokens, vite-exit fail-fast closes H4; head re-run 812/812. Two findings for ISSUES: Chrome drops `@property --typeset-size/--typeset-flow` (`rem` initial-value is not computationally independent); JS-set tokens are 19 not 17, so a `var()` with a fallback is never a finding [^84] |
| 85  | shell-width-gap          | ~S  | [x]    | complete 2026-08-16 on `docs/shell-width-gap` — gutter 40→80px, cap 68→72rem, one `--pg-gutter` token; suite 761/763 |
| 86  | usage-section-order      | ~M  | [x]    | complete 2026-08-17 — Default→Usage on every page, 7 documented exceptions, PR #7; suite 759/762 [^86] |
| 87  | home-console-showcase    | ~L  | [x]    | merged 2026-08-17 from `feat/home-console-showcase` — CloudKey console mock below hero, kit-only, glass; suite 760/762 on branch |
| 88  | console-rebrand-nav      | ~L  | [x]    | complete 2026-08-17 on `feat/console-rebrand-nav` (9 commits, pushed, no PR by user choice); suite 768/771 known-failures-only; Acme Cloud 1.0.0, grouped sidebar (collapsed), decorative theme toggle, tooltips, row actions, attachments; panel slots at `console.jsx` for 89; filed ISSUES C10 (no destructive menu-item variant) + `notes/tooltip-composition.md` |
| 89  | console-panels           | ~L  | [x]    | complete 2026-08-17 on `feat/console-panels` (5 commits, pushed, no PR by user choice); suite 775/778 known-failures-only; SupportPanel/SettingsPanel/StatusShowcase from `site/showcase/panels/index.js`, `ackp-` prefix, container-query sized; head integrates after 88 merges |
| 90  | console-route            | ~S  | [x]    | complete 2026-08-19 on `feat/console-route` (one commit); Platform open by default, `#console` route full-bleed via `pg-main--console`, home link; suite 785/788 |
| 91  | console-ck-look          | ~L  | [x]    | merged `d70e7c66` 2026-08-25; CloudKey palette + navy chrome scoped on `.ck-console`, two folding rails, breadcrumb bar, live drift; new `ui/live-value` + `lib/use-ticker`; `status-dot` ring pulses, `badge` gains `glow`; suite 803/804 at build, 810/810 on 08-26 |
| 92  | glow-pulse               | ~S  | [ ]    | remainder after 91: progress-bar glow, speed + brightness controls on badge/status-dot/progress; owns `ui/{progress,badge,status-dot}/**` + their pages + tests; **+ indeterminate progress paints nothing today** (folded in 2026-08-27); batch A, spawned 2026-08-27 |
| 93  | copy-field               | ~S  | [ ]    | resource IDs, ARNs, connection strings; middle truncation, `secret` mask, composes `ui/button`; batch A, spawned 2026-08-27 |
| 94  | log-viewer               | ~L  | [ ]    | follow-tail via `ui/message-scroller` (read-only dep), ANSI colour, highlight via 55's Custom Highlight API; batch B |
| 95  | key-value                | ~S  | [ ]    | resource detail pane, `<dl>` semantics; batch B |
| 96  | quota-meter              | ~S  | [ ]    | usage bar, threshold colours from 32's status tokens; composes 91's glow; batch B |
| 97  | code-block               | ~M  | [ ]    | copy, line numbers, diff; highlight via 55's Custom Highlight API; batch C |
| 98  | stat-tile                | ~M  | [ ]    | metric + delta + inline SVG sparkline; batch C |
| 99  | json-tree                | ~M  | [ ]    | `<details>`-based, zero JS; batch C |
| 100 | filter-bar               | ~L  | [ ]    | query builder over `use-data-table` filters (read-only dep); batch D |
| 101 | timeline                 | ~M  | [ ]    | audit log / event history; batch D |
| 102 | connection-status        | ~S  | [ ]    | live SSE/WebSocket indicator; composes 91's glow; batch D |
| 103 | region-picker            | ~S  | [ ]    | grouped `ui/select` with latency hints; batch E |
| 104 | menu-destructive-item    | ~S  | [ ]    | ISSUES C10: `variant="destructive"` on `DropdownMenuItem` → `data-variant`, two rules in `dropdown-menu.css`; context-menu + menubar inherit; owns `ui/dropdown-menu/**` + page + test; batch E |

[^33]: `@property`, `light-dark()`, relative-color brand derivation, density
    scaffold.

[^34]: deps: 33; form controls — button, badge, input, textarea, checkbox,
    radio, switch, label, field, native-select.

[^35]: deps: 33; surfaces — card, dialog, alert, popover, tooltip, toast,
    table, avatar, separator, progress, slider, tabs.

[^36]: deps: 34, 35; `compact`, `comfortable`, `spacious` over tokenized
    components.

[^37]: deps: 34, 35; `van.config.json` schema + zero-dep generator →
    `van.css`; **output not wired into the docs site — see 60**.

[^38]: deps: 37, **64** (manifest format — `add` writes the sidecar);
    `bin/van.mjs` init/add/diff/build/list + generated `registry.json`;
    git-sourced, stays `private: true`. Sub-task 8 (framework detection +
    `"use client"` injection under `rsc`) was added mid-task; `framework` and
    `rsc` join `paths` as top-level config keys. Over-the-network
    `npx github:` and the render-in-a-real-app check remain user-gated — a bare
    clone was verified locally.

[^39]: deps: 34, 35; components size to container, not viewport (console
    panels). Containers on `ui/card`, `ui/item`, `ui/field`, `ui/table`'s scroll
    wrapper and `ui/dialog` (so `ui/sheet` too); **not** `ui/sidebar`, whose
    breakpoint is a JS render decision. Headline feature is `.table--stack`.
    **It touched far less CSS than the plan assumed** — six components, not all
    68 — so the "39 rewrites every component's CSS" premise behind sequencing 68
    and the console kit after it turned out to be false. Kept the order anyway:
    68 is unblocked either way. `cqi` units were **not** used; no component
    needed fluid type, and the task file's own warning about unbounded `cqi`
    applies. Remaining: the screen-reader ordering pass on stacked rows is
    user-gated.

[^40]: zero-dep `lib/use-form.js`, RHF-shaped; resolver contract =
    `@hookform/resolvers` compatible.

[^41]: deps: 40; `ui/form/` engine-agnostic (context, never imports the
    engine) + React 19 Actions path.

[^42]: `lib/format.js` + `<RelativeTime>` `<Bytes>` `<Duration>` `<Cost>`;
    pure Intl.

[^46]: shared morphing viewport + sliding Indicator (drops the 15 no-ops);
    **under-specified — expect to split into viewport + indicator on
    approach**.

[^49]: deps: 48; grouping, virtualization, `manual*` server-side modes;
    **unresolved: `content-visibility` may cover virtualization outright —
    measure before building a windowing layer**.

[^50]: `autoSaveId`/storage, `onResize`/`onCollapse`, F6 cycling,
    `hitAreaMargins`.

[^51]: `overflowEdgeThreshold` + `data-overflow-*`, overscroll squish, snap
    suspension.

[^54]: `startViewTransition` for route/detail/theme-toggle; reduced-motion
    guard.

[^55]: CSS Custom Highlight for search matches (table, command, log) — no DOM
    mutation.

[^56]: `forced-colors`, `prefers-contrast`, `prefers-reduced-transparency`
    sweep.

    `ui/form` + controls into one import; `ui/form` must still never import
    the engine. Also where `ui/form` stops reimplementing
    label/description/message.

[^60]: deps: 37, 61; kit's own theme generated from a default config — one
    authoritative `:root`. Resolves task 37's spec contradiction (import the
    output vs. stay pixel-identical).

[^61]: deps: 37; `brand` as string-or-object (primary/secondary/accent/
    neutral); **sub-task 1 is an a11y fix — foregrounds picked by measured
    contrast, not a lightness threshold — and ships independently**.

[^62]: `lib/schema.js` — zero-dep zod-shaped validation + `schemaResolver`
    adapter. Pairs with 59; neither blocks the other, the resolver contract is
    already the seam. Runtime only — no TS inference story.

[^63]: components reuse each other where the relationship is **semantic**, not
    everywhere — a blanket rule would destroy copy-paste independence.
    Sub-task 1 (date demo split) landed `0f48e2fe84de`.

[^64]: per-copy `ui/<slug>/.van.json` manifest (provenance + `requires` + file
    hashes) **+** a conformance suite that keeps it true. **Do before 38** —
    `add` consumes the format. Independent release windows, one monotonic
    `kitVersion`.

[^66]: deps: 38; `van.schema.json` **generated from `scripts/config-schema.mjs`**
    (hand-writing it guarantees drift) + `$schema` in `van.config.json` for
    editor autocomplete over the whole theme surface. Split out of 38 because the
    config surface is large: brand/radius/density/motion/font/light/dark plus
    `components.<slug>.tokens|variants|sizes`.

[^67]: deps: 38; interactive multi-select when `add` gets no slugs. Zero-dep
    means hand-rolled raw-mode ANSI (~80 lines) and it is the hardest part of the
    CLI to test, so it is not in 38 — a bare `add` prints the list plus a hint.

[^68]: deps: 39 (it rewrites every component's CSS, so fix visual bugs after
    it, not before). From `docs/ISSUES.md`: C2 `useFormContext()` throws +
    `FormContext` unexported, C3 stray `htmlFor` on radiogroup labels, C4
    data-table resize overlaps row content, C5 attachment-group scroll drops
    edge borders, D7 switch on the Direction page, D8 empty-state alignment,
    **E1 light/dark toggle glitch (high priority)**, E2 collapsible end-of-
    animation glitch, H1 assertions that hold for the wrong value. **Scope is
    "known bugs", not "all bugs"** — the user's docs-site sweep stopped at
    `form-fields`; everything alphabetically after it is unswept, so expect this
    task to grow or gain a sibling once the sweep finishes.

[^69]: ISSUES A2. The kit documents itself without using itself: raw
    `<button>`/`pg-` classes across ~10 `site/pages/` files (combobox,
    carousel, command, form, form-fields, primitives, resizable, select,
    use-form, view-transitions), `ui/breadcrumb` and `ui/navigation-menu`
    unused in the site shell, Get Started not a showcase, and the primitives
    page with no stated purpose (decide or delete). The most visible
    credibility item on the list. Before 30 — it changes the pages 30 then
    proofreads.

[^70]: ISSUES A4. A typeset system rather than per-page font sizes; `~L` because
    it touches every docs page and interacts with 69. Sequence after 69.

[^71]: **Landed 2026-08-01.** Swept all **79** routed pages (not the 42 the
    banner named — it undercounted, and the five `docs/` pages were never in
    scope at all) in light and dark. Banner is down. Two rerunnable tools
    committed: `scripts/sweep-pages.mjs` (axe text contrast, cursor affordance,
    console errors, overflow at 1280 and 380, content geometry) and
    `scripts/contrast-nontext.mjs` (WCAG 1.4.11 boundary contrast — **axe cannot
    see any of it**, which is why the whole D family looked clean to automation
    before). New items: D9–D12, F5–F6, C7–C8, K1, I2.
    **The sizing guess was wrong in the useful direction.** It predicted ~12 more
    findings of the same kind; what came back was 56 raw contrast hits and 38
    cursor hits that collapse into **four root causes** — `--border` at 1.26:1
    (D9, = D1/D2/D3/D5), `--muted-foreground` on `--muted` at 4.34:1 (D10, eight
    components, probably = D6), seven component `cursor: default` declarations
    out-specifying the global rule (F5, = F1/F2/F3), and the global rule listing
    no native input types (F6). Two of the user's original items did not
    reproduce as described and are re-aimed rather than closed (D4, D6).
    **Two lessons worth keeping.** Automation that only measures text contrast
    will report a design system with an invisible border token as fully
    accessible. And a control probe pays for itself: `.input`'s border was
    measured as a baseline nobody had complained about, failed identically to
    the four reported components, and that is what proved the defect was one
    token rather than four components.

[^72]: deps: 71. **Re-estimated `~L` → `~M` now that 71 has landed**: the
    contrast and cursor families are four token/rule fixes, not twenty component
    fixes, and each is one declaration.
    Order, cheapest-first, each independently verifiable by re-running
    `scripts/contrast-nontext.mjs` or `scripts/sweep-pages.mjs`:
    **D9** — ~~`--border`~~ **`--input`** to ≥3:1 (light and dark, then
    re-measure before touching any component; D1/D2/D3/D5 disappear with it).
    **Amended 2026-08-01, see `docs/TODO/task72-bug-batch-2.md`:** the kit has
    two tokens at the same inherited value, and every failing element is on
    `--input` (17 control call sites) rather than `--border` (227 surface call
    sites). WCAG 1.4.11 covers boundaries "required to identify" a component, so
    control borders are in scope and card frames and table rules are not. Also
    new: **D13**, the focus ring at 2.59:1 light — found while scoping this, not
    in 71's sweep,
    **D10** `--muted-foreground` on `--muted` to ≥4.5:1 light (also closes D6),
    **F5** delete or override the seven `cursor: default` declarations (keep the
    three `not-allowed` ones), **F6** add native input types to
    `styles/globals.css:227-244` (this is where **F4**'s slider decision gets
    made), **D11** bubble destructive 4.15:1, **D12** the site's active nav link
    3.82:1, **C7/C8** two docs-page markup bugs, then the pre-existing **C6**
    (`flexRender` fallback — still a component-behaviour call), **E3**
    (`scrollHeight` sub-pixel step, hits `ui/accordion` too) and **I1**
    (reproduce or close). **D4 is not a fix, it is a re-look** — the calendar has
    no border of its own to fix. **G1–G4 stay out**: load-dependent timing flakes
    need their own reproduction approach. **K1 is out** — it became task 74.
    Every contrast fix wants a test that asserts the measured ratio, not the
    token string; the H1 sweep is the precedent.

[^74]: ISSUES K1, split out of 72 on 2026-08-01 because it is a different kind
    of work. 73 of 79 pages force a horizontal document scroll at a 380px
    viewport (nothing overflows at 1280); worst is `container-queries` at
    1116px, which is the page whose subject is fitting a container. **Needs a
    scope call before it is worth detailing:** is the docs site meant to work on
    a phone at all?
    **Answered 2026-08-07: yes — and the mobile views are built from the kit's
    own sheet and drawer**, not bespoke media queries, because the site is the
    kit's showcase and its chrome should demonstrate those components carrying a
    real app's navigation. That reframes the finding: the 73-page overflow is
    **one defect, not 73**. `site/app.jsx` has no `Sheet`, no `Drawer`, no
    `matchMedia` and no mobile branch at all, so the shell renders its
    three-column desktop grid at every width and lets the viewport clip it. The
    guess above — "demo-layout work across most of `site/pages/`" — was wrong in
    the expensive direction. Build the shell's mobile layout first, re-measure,
    and hand whatever genuinely remains to 82. `ui/sidebar` already has a
    sheet-backed mobile mode (task 27) to start from, and the TOC rail is
    *hidden outright* below 72rem (`site/site.css:460-464`), so a phone has no
    route to a page's contents at all. **Deps on 81** — both own `site/app.jsx`
    and `site/site.css`, so they serialise; 81's desktop geometry lands first.
    Task file: `docs/TODO/task74-mobile-views.md`.

[^73]: ISSUES H2. H1 asked whether assertions hold for the wrong *reason*; this
    asks which features have **no real test at all**. `ui/scroll-area`'s
    overscroll squish had two tests, both asserting an absence, no positive case
    — deleting the feature left the suite green, and it was found by accident.
    708 tests over 68 components is ~10 each, thin for anything with drag, focus
    management or RTL. **The probe is deletion, not reading**: neuter one
    load-bearing rule or handler per component and see whether the suite notices.
    A targeted per-component run is ~20-40s, so a first pass over all 68 is about
    a half-day including the tests it turns out to need. Never commit a break.

[^65]: deps: 64, 38; `van update` with 3-way merge (base = recorded
    `kitVersion`). Biggest payoff — the original kit cannot take upstream fixes into an
    edited component — and the easiest to make destructive. Own task, own
    tests.

[^75]: deps: 30; reusable page building blocks for shadcn-style component docs.
    `<ComponentPreview>` (demo + source toggle), `<CodeBlock>` (monospace +
    copy), `<InstallSnippet>` (`van add <slug>`), `<ApiReference>` (props
    table). Zero deps — no Prism/Shiki.

[^76]: deps: 75; 15 key components get the full docs template: description,
    install snippet, usage code, variant examples with preview+source, 1-2
    creative compositions, API reference table. Establishes the pattern task 77
    replicates. Also addresses B5, B6, C8 in their respective pages.

[^77]: deps: 76; same template applied to remaining ~59 component pages.
    Spawn-ready — disjoint files per worker, batched by category (Forms,
    Overlay+Nav, Data+Layout+Disclosure, Platform). Addresses B2-B4, C7 in
    their respective pages. **Lesson from 76:** `ComponentPreview` uses
    `ui/tabs` internally — any page whose tests select `[role="tablist"]` or
    `.tabs-trigger` must render its fixture demos directly on the page (source
    in a plain `CodeBlock`), not inside `ComponentPreview`, or the preview's own
    tabs shadow the selectors. Also avoid duplicate visible button labels on one
    page — locator strict mode fails on `has-text` collisions.

[^78]: deps: 75; Get Started refresh (introduction + installation rewrite),
    new configuration reference page (B1 — full `van.config.json` docs), schema
    page update, theming page update, voice pass (A5). Owns `site/pages/docs/`
    exclusively — parallel-safe with 76/77. **The nav rework of 2026-08-05 added
    a `cli` slug to `site/registry.js` with no page — the CLI docs page lands
    here and turns that entry live.**

[^80]: **Landed 2026-08-07** on `fix/dialog-modal-positioning`. The fix is one
    line — deleting `position: relative` from `ui/dialog/dialog.css:7`. It was
    never needed: `container-type: inline-size` (task 39) applies
    `contain: layout`, which already establishes the containing block for
    `.dialog-close` and the drawer handle, so the declaration bought nothing and
    cost `:modal { position: fixed }`. Verified across all five `.dialog`
    consumers (sheet, drawer, alert-dialog, command-dialog, mobile sidebar).
    Two tests added: a drawer opened on a 2x-viewport page asserting flush-bottom
    against `window.innerHeight` (red before the fix), and a container-query
    guard that fails if `container-type` is ever removed. `ui/dialog/.van.json`
    regenerated. Original description follows.
    ISSUES C9, found in 77b's rework. `ui/dialog/dialog.css:7` sets
    `position: relative` (for the task-39 `container-type` container), which
    overrides the UA's `:modal { position: fixed }` — open dialogs/drawers/
    sheets anchor to document height, so a bottom drawer on a page taller than
    the viewport renders off-screen. Fix must keep the container query working.
    Scope includes the follow-ups the bug forced: restore InstallSnippet +
    ApiReference on `site/pages/{drawer,sheet}.jsx` (skipped in 77b), and add a
    regression test that opens a drawer on a taller-than-viewport page.
    **Owns:** `ui/dialog/**`, `site/pages/{drawer,sheet}.jsx`,
    `tests/{dialog,drawer,sheet}.test.mjs` — disjoint from 77 C+D.

[^81]: Added 2026-08-07 from the user's report that the docs "still don't all
    look great — funky placing". Root cause found while scoping: `.pg-main`
    (`site/site.css:471`) caps at `56rem` but has **no `margin: 0 auto`**, while
    the shell grid is `auto 1fr auto` — so the content column pins to the left of
    a much wider track on any large display, stranding space before the TOC rail.
    `.pg-main--home` has the centring; the base rule never got it.
    **Grew 2026-08-07** with the topnav, from the user's second review: the
    scrolled bar's `border-bottom-color: var(--border)` is the 1.26:1 token 71
    measured and 72 never fixed (D9's fix went to `--input`), and its
    `--background 82%` backdrop lets content read through the bar. Both are the
    one rule at `site/site.css:78-82`, and both are shell, so they land here.
    Scope is the
    shell only: centring, a deliberate re-measure of the cap (prose wants 65-75
    characters, but this column also carries code blocks and previews), the three
    overlapping breakpoints at `:52`/`:460`/`:565`, and one section-spacing
    contract to replace the per-page margin overrides four different workers
    introduced. **Owns is disjoint from 82** — 81 owns `site/site.css` +
    `site/app.jsx` + `site/toc.jsx`, 82 owns `site/pages/**` — so the two are
    spawnable together. Distinct from **74**, which is the ≤380px overflow and
    still needs its scope call.

[^82]: Added 2026-08-07, same report: pages that are "not even done". Measured on
    `main` at `7fbb916`, not guessed. Nine component pages are genuinely
    incomplete: `use-form` (682 lines) and `form-fields` (601) carry no
    `ComponentPreview` at all despite being the two largest pages in the site;
    `drawer` (74) and `sheet` (70) are the thinnest, because task 80 restored
    their InstallSnippet/ApiReference after the C9 fix but never gave them
    examples; `navigation-menu` was deliberately left unwrapped by 77b and needs
    that decision re-confirmed rather than reversed. The six **system pages**
    (`container-queries`, `density`, `direction`, `primitives`, `typography`,
    `view-transitions`) are a subtler case — 77d correctly licensed them to drop
    InstallSnippet/ApiReference since they document a system rather than a
    component, but "different template" landed as "unfinished", so they need one
    consistent alternative page type. Plus the seven `site/pages/docs/` pages,
    of which **`contracts.jsx` has never been in any task's scope**. Sub-task 1
    is an audit against the running site, because the visual defects are the ones
    source-reading misses.
    **Grew 2026-08-07** with the rest of the user's second review, all of it
    `site/pages/**`: the **home page** (a `success` "deploy passed" badge sitting
    beside `<Progress value={80}>` at `home.jsx:61-62`, so the demo reads as a
    broken component; the `Zero dependencies` claim rendered as a bare outline
    `Badge`; and the hero showcase generally), **353 em dashes** across the page
    prose, and **six pages the user named as needing examples** — `form-fields`
    (601 lines, 0 previews) and `container-queries` (261, 0) were already on the
    list, `data-table` (1251 lines, **3** previews) and `sidebar` (339, 3) are
    new, and `command` (7) and `accordion` (9) get an audit before any edit since
    their counts do not look like the defect.

[^83]: Added 2026-08-07 from the user's "navigation menu is very see thru"
    report, which turned out not to be opacity at all.
    `.navigation-menu-viewport-wrapper` (`ui/navigation-menu/navigation-menu.css:129`)
    is `position: absolute` with **no `z-index`**, so it paints in DOM order and
    any later sibling wins — the docs page has three menus, so the second one's
    triggers draw through the first one's open panel. **Viewport mode is the only
    overlay in the kit not on the Popover API top layer**; popover mode already
    is (`:82`), and dropdown-menu/popover/select/combobox/menubar/hover-card all
    measured `position: fixed` and clean. `~S` because the instance is one
    declaration; the open question in sub-task 1 is whether viewport mode should
    join the top layer outright, which would kill the class but interacts with
    the JS-driven morph transition. `scripts/probe-stacking.mjs` ships with the
    task and already measures it. **Two lessons in the probe's own comments:** a
    three-point sample calls this bug clean (the intruder is one trigger row
    across the panel's middle — the grid is load-bearing), and `elementFromPoint`
    measures hit-testing rather than painting, so `pointer-events: none`
    overlays like tooltip false-positive at 49/49 until explicitly excluded.

[^86]: **Landed 2026-08-16** on `docs/usage-order` (4 commits, PR #7). Seven pages
    are deliberate exceptions: `home.jsx` and the five system pages
    (`container-queries`, `density`, `primitives`, `typography`,
    `view-transitions`) carry no `InstallSnippet` and no `ApiReference` — they are
    the alternative page type 82 licensed, and a `van add` snippet would be a lie
    on all six — plus `navigation-menu`, whose Usage sits third so the two menu
    fixtures stay adjacent for task 83's overlap test.
    **The task file's premise was half wrong.** It recorded that only Usage
    sections carried `defaultTab="code"`; `message-scroller.jsx` had five more, on
    sections whose "preview" was a placeholder sentence. Those are `CodeBlock`s
    now — prose about a mechanism was never a demo, so a Preview tab was never the
    right control for them.
    **The 720px trap bites in both directions.** Task 82 pushed fixtures down by
    adding sections *above* them; this task did the same to `slider.jsx`'s `Range`
    (y=746). The fix that generalises is **rename, don't move** — `resizable`,
    `scroll-area` and `progress` kept their raw-coordinate fixtures leading and
    only had the heading changed, which adds no height at all. Where a move was
    unavoidable, prose had to be cut from above the fixture to pay for it.
    `scripts/sweep-section-order.mjs` reruns the whole guard.

[^84]: Added 2026-08-07 from a user report that `styles/typeset.css` read five
    `--typeset-*` tokens `defaults.css` did not define, so every heading computed
    an invalid `calc()` under a clean build. **The report does not reproduce** —
    all six tokens are defined, both files landed in the *same* commit
    (`4ad8d502ed06`), and the page computes valid sizes (h1 36px/39.6px, h2 21px,
    h3/p 14px/21px). No `ui-styles-lag-vanillin` entry exists in `ISSUES.md`
    either. Kept as a task anyway because the failure *mode* is real and
    invisible: a `var()` miss inside `calc()` is invalid at computed-value time,
    and neither vite nor the suite resolves custom properties. So it is
    **preventive, not a fix** — the task file says so at the top so nobody
    burns an afternoon hunting a bug that is not there.
    **The real risk is false positives, not misses.** A naive read-vs-defined
    diff reports **17** tokens missing, every one of them legitimately set by JS
    (`setProperty` or an inline `style={{"--x": …}}`), and a checker that cries
    wolf 17 times gets ignored. Two detection traps found while scoping:
    `setProperty` is not always passed a string literal
    (`ui/scroll-area/scroll-area.jsx:99` passes a ternary, which a
    `setProperty\(\s*"` regex misses), and inline JSX style objects are a second
    differently-shaped source accounting for eight tokens alone.
    One genuine gap did fall out: `--typeset-font-body`/`-heading`/`-mono` have
    no `@property`, while the three rhythm vars do — which is also why the
    reported failure could not have happened as described for those three.

[^79]: right-hand rail on docs pages: scroll-synced "On this page" TOC,
    resizable via the same drag pattern as the left sidebar, stretch goal of a
    pinned code-example panel. Planned during the 2026-08-05 nav polish pass at
    the user's request; sequenced after 76 so the page anatomy it indexes is
    settled.

**Browser-support gate:** 33, 39, 54, 55, 57 depend on features that were
partially supported at plan time (relative color syntax, `light-dark()`,
container queries, View Transitions, Custom Highlight API, Speculation Rules,
`field-sizing`). Each task's first step is a live support check — degrade to
progressive enhancement, never a hard requirement.

## Backlog — console kit

Promoted to rows 92–104 on 2026-08-27. Nothing is left here; new ideas go straight to a row.

## Refs

- **Measuring colour (contrast, computed styles, dark mode): `docs/TODO/notes/measuring-colour.md`.** Read before writing anything that reads a computed colour — oklch parsing, alpha compositing, and why a green axe run is not an accessibility result.
- **Sweep tools:** `node scripts/sweep-pages.mjs` (all 79 pages, light + dark) and `node scripts/contrast-nontext.mjs` (non-text contrast). Measuring instruments — they exit non-zero on harness errors, not on findings.
- **Per-task decisions, deviations and gotchas: `docs/TODO/LOG.md`.** Append
  there when a task lands — not to this file. This index stays scannable.
- Planning is **just-in-time**: the rows above are durable, task files are written when a task is picked up. Task files exist for every task except 22–29 (landed before the convention) and the unstarted 94–104 (written at spawn time).
- **New CSS convention from 39:** an element never matches an `@container` query
  against a container it declares itself — the query resolves against the
  *ancestor* container. Layout flips therefore go on descendants
  (`flex-wrap`/`gap` unconditional on the root, children's `flex-basis` queried).
  Name every container `vanillin-<slug>`. Thresholds are literal `rem` —
  container conditions cannot read custom properties.
- Test: `node tests/run.mjs` (`npm test`) — boots its own vite on :5199 (`--strictPort`), drives local Chrome; one `tests/<slug>.test.mjs` per interactive component; `node tests/run.mjs <slug>` runs one file; `VANILLIN_TEST_PORT=52xx` for a concurrent worktree. (Dev server on :5173 only needed for manual/screenshot QA.)
- Build: `npm run build`. No lint configured. CI (`.github/workflows/deploy.yml`): `npm run contracts && git diff --exit-code`, then `npm test`, then `npm run build` — run `npm run contracts` before committing a new component or its manifest is stale in CI.
- Conventions + gotchas: `AGENTS.md`, `docs/QUIRKS.md`, `docs/DECISIONS.md` (block classes, tokens-only CSS, `cn()`, `as` prop, `useControllableState` + `data-state`, `usePresence`, demo page + `site/registry.js` entry per component).
- Load-bearing files: `styles/globals.css` (tokens), `lib/` primitives,
  `ui/toggle/` (stateful pattern), `ui/tabs/` (roving tabindex), `ui/accordion/`
  (disclosure/presence), `site/registry.js`.
- Git gates (hooks): no commits on main — `<type>/<kebab>` branch first. The
  ~500-net-line branch-size hook is advisory only — never split or restructure
  work because of it.

## Adjustments log

- **2026-08-27 — batch A spawned: 84 + 92 + 93 (cap 3), from `docs/cycle-spawn-a-2026-08-27`.** Worktrees branch from the docs branch tip rather than `main` so they carry the task files without a merge first; the user merges. Baseline re-measured before seeding: **811/811** on `07961519da8d` (idle, exit 0) — one more than the handoff's 810, from the status-dot breathing commit's test. Three spec changes from inspecting the tree: (1) ISSUES H4 is half landed — `tests/run.mjs:18-26` already refuses a busy port (`0a3f51954733`), so 84's sub-task 5 is only the vite-exit fail-fast; (2) 84's `@property` gap for the three `--typeset-font-*` tokens is still open (`globals.css` registers only leading/size/flow), so sub-task 3 stands, and 84 gains `tests/check-tokens.unit.mjs` so "prove it catches the bug" is a committed fixture test rather than a temporary deletion; (3) **the indeterminate progress bar paints nothing** — no `[data-state="indeterminate"]` rule, and `percent = 0` parks the indicator at `translateX(-100%)` while `site/pages/progress.jsx:65-79` documents it over an empty demo. The user folded it into 92, which owns `ui/progress/**`. 92's speed/brightness controls are two inherited custom properties (`--glow-duration`, `--glow-strength`) read through `var()` fallbacks — no `@property`, because `styles/globals.css` is 84's file in the same batch. Worker model `claude-opus-5[1m]` (quoted), no `--effort`; ports 5201/5202/5203; `node_modules` symlinked per AGENTS.md.

- **2026-08-27 — `--adjust` reconcile after 91 and the post-91 fixes.** 91 ticked merged (`d70e7c66`, one squashed commit of the staged branch); the six data-table fixes (C11–C16), G4's removed hover-delay assertion and G2's CDP-timestamped drawer flicks all landed on `main` without touching the index. 810/810 on 2026-08-27 (`ea97756f`, idle machine, `node tests/run.mjs`, exit 0) — no failing tests; the slider-cursor pair and the nav-menu hover flake are gone (F4 fix, G4 removal). **Console kit promoted from the backlog to rows 92–104**, one number up from the 2026-08-24 schedule because 91 took the glow-pulse slot; batch letters and pairings kept. 92 shrinks to `~S` — 91 shipped the badge and status-dot halves, so what is left is progress-bar glow plus speed/brightness controls, and its `Owns` moves from a `ui/glow-pulse/` that never existed into the three components themselves. **Two ISSUES items triaged in:** H4 (the harness accepts an imposter dev server — it produced phantom failures once and G8 shows a second vite alive again on 08-26) folds into 84 as sub-task 5, because both are `~S` guards and five spawn batches of concurrent worktrees are exactly H4's failure surface; C10 (no destructive menu item) becomes 104 and rides with 103 so batch E is no longer a solo. The old History paragraph moved to `LOG.md` verbatim; History here is now a milestone line. Refs lost the `docs/HANDOFF.md` pointer and the 65/66/67 dispatch note (both stale since early August) and gained the CI gate and `VANILLIN_TEST_PORT`. 74 stays parked.

- **2026-08-19 — 90 complete on `feat/console-route`, one commit instead of one per sub-task.** The four sub-tasks interleave in `site/site.css` (route block + home CTA rule) and `tests/showcase-console.test.mjs` (amended collapse test + new route test), so any intermediate commit would have carried a red test; the task is ~S and the single commit is atomic at the task level. Registered `console` in `docsGroups` Docs entries (the cli pattern), so it appears in the topnav Docs menu, the sidebar Docs group and ⌘K without new plumbing; `App` branches on `isConsole` next to `isHome`. Suite 785/788 (baseline +1 new test, same 3 known failures).

- **2026-08-16 — 87 unblocked and completed on `feat/home-console-showcase` (worktree `../vanillin-task87-console`), pending the user's merge.** The design reference turned out to be the **"CloudKey Console"** claude.ai/design project, not "VCD 10.6": read via the claude_design MCP and reproduced as a kit-only composition in `site/showcase/**`, lazy-loaded below the home hero. **Dep on 85 waived by the user** (start in a worktree before 85; Owns disjoint) — after 85 re-picks the column cap, re-eyeball the console width; it is fluid and container-queried so no code change is expected. Three findings recorded in the task Handoff for other owners: `--warning` light measures 2.31:1 on white on `main` today (kit token, pre-existing), `scripts/sweep-pages.mjs` never visits home (registry-only route parse), and a container-query `display` toggle replays a collapsible's open animation against a stale measured height (worked around in `console.css`). 85 and 86 remain the next ready tasks and are still spawnable together.

- **2026-08-16 — 81 finished and merged; post-merge suite 760/762.** The salvaged WIP (`c1a70f1`) had the centring, the 68rem cap, the 62ch measure and the topnav fix, but had deleted every section margin and left `/* RHYTHM DISABLED FOR BISECT */` where the contract belonged — the browser suite is green with rhythm off, so the dead worker's bisect was chasing something visual, and shipping the WIP as-is would have shipped a site with no section spacing at all. The finishing commit (`66533a1`) writes the contract the tokens implied: `--pg-flow` between sections, `--pg-flow-tight` heading→content, placed on the *following* sibling's top margin with heading margins zeroed so a UA paragraph margin can never collapse over the token — measured uniform (32px/12px) across probed pages. **Two measurement traps for whoever probes this next:** the topnav's colors transition for ~500ms after `data-scrolled` flips, and a probe that reads them immediately gets the interpolating value (first reading said 21:1 and 1.05:1; settled truth is 3.64:1 light / 3.61:1 dark) — and consecutive `.pg-section` rects are not adjacent when an `InstallSnippet` sits between them, so a "131px gap" was a component, not a rhythm defect. `scripts/contrast-nontext.mjs` still has no topnav probe (scripts/ was outside 81's Owns); it wants one, with the settle-wait.

- **2026-08-13 — batch 4 spawned as three, not two: 81 + 82 + 83.** The plan said `--spawn 2`; 83 and 84 were both filed after that line was written, and both are `~S` with globs disjoint from everything in flight (83: `ui/navigation-menu/**` + its test + the probe; 84: `scripts/check-tokens.mjs` + `package.json` + `styles/globals.css`). 83 joined; 84 deferred as the one preventive task in the set. **Two things this spawn had to fix that the last three did not hit.** First, `tests/run.mjs` pins `:5199` with `--strictPort` (`tests/run.mjs:13,17`), so three workers running the suite concurrently would have fought over one port — each worker was given `VANILLIN_TEST_PORT` (5201/5202/5203) before it ran anything. Earlier batches got away with it by never overlapping. Second, the tmux launch command must quote the model id: an unquoted `claude-opus-5[1m]` is a glob to the `sh` tmux runs the pane command under, and the window died on creation with no error anywhere except a vanished pane id. **And re-measuring the baseline paid off in an unexpected way.** The first run came back 755/761 against a recorded 759, which reads as three new regressions; a second full run came back 758/761 with only the documented three (two slider-cursor, one `navigation-menu` hover). The three extra were flakes under load — the machine was running three `npm ci` installs at the time. So the drift the last handoff recorded (759 vs 758) is probably the same effect, not real. **The rule that follows: a bare pass count is not evidence of a regression, and a report that gives one without naming the failing tests cannot be reviewed.** Workers were seeded accordingly.

- **2026-08-07 — task 84 added, from a report that did not reproduce.** The claim was that `typeset.css` reads five `--typeset-*` tokens this checkout's `defaults.css` predates, so every heading computes an invalid `calc()` while the build passes clean. Checked: all six tokens defined, both files landed in the **same commit** (`4ad8d502ed06`), headings compute valid sizes, and no such entry exists in `ISSUES.md`. **The task survives the report being wrong** — a `var()` miss inside `calc()` really is invisible to both vite and the suite, and the kit really does have a generated/hand-written token seam. So it is a preventive gate, labelled as one at the top of its file so no one hunts an absent bug. **Two things worth keeping.** First, the scoping measurement is the deliverable: a naive read-vs-defined diff reports 17 missing tokens, all 17 legitimately JS-set, so the hard part of this task is the allowlist and the risk is a tool nobody trusts — not a missed drift. Second, `@property` with an `initial-value` makes a missing token degrade instead of invalidate, which is why the three rhythm vars were never exposed to the described failure and the three font vars still are. **The generalisable point: check whether a reported bug reproduces before designing around it, and keep the task only if the mechanism is real without the instance.**

- **2026-08-07 — task 83 added, and the rewrite question answered: no.** The user asked whether the kit's internals should be rewritten as a zero-dep Radix replacement, given how many bugs the site seems to have. **The premise does not hold, and the check is cheap: `lib/` already is that layer** — 23 primitives, 4,133 lines, `use-dismissable-layer` / `use-focus-trap` / `use-roving-focus` / `use-presence` / `use-controllable-state` / `anchor-position`. A rewrite rebuilds what exists, against 758 passing tests. **The reported bug was one missing `z-index`** (see [^83]), and the apparent bug volume in `docs/ISSUES.md` is the same illusion task 71 already documented: 56 contrast hits collapsed to 4 tokens, 38 cursor hits to 2 rules. Few causes, many pages. **The real gap was measurement, not architecture** — `sweep-pages.mjs` measures contrast, cursor, overflow and geometry, and none of those can see an overlay that opens correctly and is then painted over, which is exactly how this shipped through a 79-page sweep. So the deliverable is a probe plus a one-line fix, not a re-layering. **The generalisable lesson: when a defect survives a sweep, ask what the sweep cannot express before concluding the code is wrong in kind.**

- **2026-08-07 — batch 4 grew, from the user's second review of the site.** Six more defects, none of them a new task: they split along the same shell/content seam 81 and 82 already own, and neither task has started. **To 81:** the scrolled topnav's bottom border is invisible and its 82% backdrop lets content read through the bar — one rule, `site/site.css:78-82`. The border is `var(--border)`, the 1.26:1 token task 71 measured; 72's D9 fix went to `--input` instead, so this is the first thing to actually trip over that. Fix it topnav-locally — 227 surface call sites ride on the global token. **To 82:** the home page (progress/badge mismatch, the zero-dependencies badge, the hero), 353 em dashes across `site/pages/`, and examples for `data-table` (1251 lines carrying 3 previews) and `sidebar` (24 exports, 3 previews). **Two calls worth recording.** The progress bar is not a `ui/progress` bug — `home.jsx:61` puts a `success` badge reading "deploy passed" next to `<Progress value={80}>`, so the component is drawing exactly what it was told and the demo is what is wrong; check the component before believing a demo. And the em-dash sweep is sub-task **8 of 9**, deliberately last: every earlier sub-task writes new prose, so sweeping first means sweeping twice.

- **2026-08-07 — the standard got named, and 74's scope call was answered.** Two decisions from the user, both of which sharpened work that was previously vague. **(1) `button.jsx` and `combobox.jsx` are how every page should look.** Measured, that is a precise bar rather than a taste: 7 `ComponentPreview`s each, exactly one `InstallSnippet` and one `ApiReference`, and **zero bare `CodeBlock`** — every code sample sits beside a working demo. `combobox` is twice `button`'s length at the same preview count, so prose is free and missing demos are the defect. A census of all 75 pages against it: **12 pages have zero previews, 17 have one, and only 4 reach 7+.** `data-table` is 1251 lines carrying a single preview. That census is now 82's worklist, ordered worst-first, and it explains "not even done" far better than the earlier reading did. Also from the same review: **Usage sections should open on the Code tab** (`site/code-example.jsx:52` hardcodes `defaultValue="preview"`) — the reader at Usage wants the snippet to copy, not a render of a button they can already see; examples keep opening on Preview. **(2) Mobile is in scope, built from the kit's own sheet and drawer.** This turns task 74 from a deferred question into a specified task and inverts its shape: the 73-page 380px overflow is **one defect, not 73**, because `site/app.jsx` has no `Sheet`, `Drawer`, `matchMedia` or mobile branch whatsoever — the shell renders its desktop grid at every width. Build the shell's mobile layout, re-measure, hand the genuine remainder to 82. 74 now **deps on 81** (both own `site/app.jsx` and `site/site.css`), so it follows batch 4 rather than joining it.

- **2026-08-07 — batch 4 added: 81 + 82, from the user's review of the finished docs site.** The report was "still don't all look great — funky placing, and not even done in some" across components, Get Started and docs. Scoping found one structural cause and one coverage gap, which is why this is two tasks rather than a polish pass. **Structural:** `.pg-main` (`site/site.css:471`) caps at 56rem with no `margin: 0 auto` inside an `auto 1fr auto` grid, so every page's content has been pinned to the left of a wide track on large displays — `.pg-main--home` has the centring, the base rule never did. **Coverage:** 77 templated all 59 remaining pages, but nine were left genuinely incomplete (`use-form` and `form-fields` at 682 and 601 lines with no `ComponentPreview` at all; `drawer`/`sheet` at ~70 lines because task 80 restored their sections without adding examples), `contracts.jsx` was never in any task's scope, and the six system pages 77d correctly licensed to skip InstallSnippet/ApiReference now read as neglected rather than deliberate. **The lesson worth keeping: "every page has the template" and "the site looks finished" are different claims, and 77's verification only ever tested the first.** A per-page checklist cannot see column geometry or a page type that is consistent with itself but inconsistent with its neighbours. Split at the shell/content seam so the two spawn together; 74 stays separate since it is still awaiting a scope call.

- **2026-08-07 — batch 3 landed: 80 + 77c + 77d.** 80 passed first try; the task file's lead was right, and the fix is the single deletion of `position: relative` — `container-type: inline-size` applies `contain: layout`, which was already doing the containing-block job that declaration was credited with. Both 77 workers needed rework, but for a **new failure mode**: their test counts were accurate this time (first batch with no misreport), and what the suite could not see was content. 77c had deleted ~46 lines of behavioural prose from `format.jsx` and comparable detail from `carousel`, `resizable` and `scroll-area` — replaced by ApiReference tables that list prop names and document no behaviour. 77d had three code-tab drifts where the copyable source did not match the rendered preview. **The lesson generalises: a green suite proves the docs still work, never that they still say anything.** Template application is additive — a rewrite that reduces net prose is a regression until proven otherwise, and `git show <base>:<file>` is the check. Two items outgrew the batch: **H3** (`tests/empty.test.mjs` counts page-global `.empty`, so documenting the component fails its own test — the `empty` page still shows a placeholder until it is fixed) and the standing `navigation-menu` hover flake, which now joins the slider pair in the noise floor. Real baseline is **759 tests**, not the 753/755 the workers were seeded with; re-measure it per batch rather than inheriting it from the last handoff.

- **2026-08-06 — batch 3 spawned: 80 + 77c + 77d (cap 3).** 77's C/D lists rebalanced 26+6 → 16/16 by moving ten layout/feedback pages (aspect-ratio, button-group, separator, skeleton, spinner, status-dot, toggle, toggle-group, typography, container-queries) from C to D; each got a standalone task file so each worker owns its own Handoff. 80 goes in the same batch rather than ahead of it: its Owns (`ui/dialog/**`, drawer+sheet pages, four overlay tests) touch nothing in C or D, and the fixture-height rule that C9 causes is already a known, applied mitigation — so C/D carry it explicitly (per-task lists of the coordinate-driven tests, from a `getBoundingClientRect|mouse.move|boundingBox` grep) rather than waiting a serial round for the root-cause fix. 77d's page list is half systems-not-components (density, direction, container-queries, view-transitions, typography, primitives), so its file licenses replacing the API table with the page's real contract instead of forcing the template.

- **2026-08-06 — batch 2 landed: 77a + 77b + 79.** 79 passed review first try. Both 77 workers needed one rework round, and both misreported green suites — 77a called a real regression "pre-existing" (its slider page rewrite shifted viewport-coordinate click fixtures; base was 14/14), 77b reported 752/755 while 14 tests failed deterministically (drawer/sheet/nav-menu fixtures broken by added page height). That's 3-for-3 misreports across 76/77a/77b: supervisor re-runs are load-bearing, not ceremony. Two durable finds: **C9** — `.dialog { position: relative }` defeats `:modal` viewport positioning, the root cause of 77b's drawer/sheet constraint (those pages skip InstallSnippet/ApiReference until it's fixed); **G5/G6** — the slider onValueCommit `/@fs/` import flake is window-deterministic, plus one load-flake cluster logged. Lesson for batch 3 fixtures: anything a test drives by viewport coordinates or flush-edge geometry must keep its page short — or better, fix C9 first.

- **2026-08-06 — batch 2 spawned: 77a + 77b + 79 (cap 3).** 77 split by category per its own spawn strategy; A and B got standalone task files (`task77a`, `task77b`) so each worker owns its Handoff — two workers writing one file's Handoff would conflict at merge. Two task-77 list bugs fixed while detailing: `input-group` was in both A and C (assigned to A), and D listed `forced-colors`, which has no page file (dropped) — corrected counts: A 14, B 13, C 26, D 6. C+D deferred to batch 3 (rebalance ~16/16). 79 joined per the standing note (Owns disjoint from all page files). Worker seeds omit push/PR — no `.claude-remote-ok`.

- **2026-08-06 — batch 76+78 landed (first --spawn 2 run).** Both verified independently: 753/755 + clean build each. 76 needed one rework round — its worker reported "0 FAIL" while 14 tests were failing (dialog strict-mode duplicate "Open dialog" buttons, ComponentPreview's internal `ui/tabs` shadowing the tabs/tokens-surfaces fixture selectors); fixed in 3 follow-up commits, lesson recorded in [^77]. 78 passed review first try (config + CLI pages grounded in `config-schema.mjs`/`bin/van.mjs`). Process notes: worker model id is `claude-opus-4-6[1m]` (the skill's dashed form is invalid and fails silently); worker-reported test counts are re-run by the supervisor before ticking — 76's misreport validated that rule.

- **2026-08-05 — --adjust reconcile.** 75 ticked `[x]` — its four components landed with the nav polish on `fix/docs-nav-rework` (`27a1410`); sub-task 5 (page layout convention) delegated to 76, which applies it. 79 slotted into the order at 77's spawn slot (Owns — `site/app.jsx`, `site/site.css`, `site/toc.jsx` — disjoint from 77's page files; "after 76" satisfied). Resume note added: the user's merge of `fix/docs-nav-rework` gates 76/78, which branch from post-merge main.

- **2026-08-05 — nav/site-chrome polish pass (follow-up to 30), task 79 added.** Topnav dropdowns rebuilt shadcn-style (Get started / Components / Docs, title + description rows); registry gained `docsGroups` and per-category `desc`; sidebar gained a Docs group, animated collapsible categories (grid-rows trick), and drag-resize; the window is now the scroll container (sticky topnav with scrolled-blur, sticky sidebar); hero is a two-column live-component showcase; `--motion-scale` 2.5 → 1.75 (snapshot updated). Exposed and fixed a real `ui/select` bug: item-aligned bottom-clamp double-shifted the item off the trigger whenever the trigger sat below the item's natural offset — now shrinks the box instead; regression test added. `resizable` vertical-drag test was fold-position-dependent — now scrolls the handle into view. Right rail + scroll-synced TOC planned as task 79.

- **2026-08-04 — task 73 scope narrowed.** Replaced sub-tasks 1-4 (probe all 68 components + write tests) with: sub-tasks 1-2 done (20 probed, 5 tests written), sub-task 3 finishes 6 remaining high-value probes (sidebar, message-scroller, command, menubar, form, radio-group), tier 3 skipped (re-exports/CSS-only/meta — no JS to probe). Rationale: 14/15 non-skip probes caught, the one systematic gap class (anchor positioning) is found and fixed, diminishing returns on remaining ~25 low-risk components.
- **2026-08-04 — task 73 done.** All 6 final probes caught (no new gaps). 26 components probed total, 5 gaps fixed, 20 caught, 1 skipped. Suite 735.
- **2026-08-04 — task 65 done.** `van update` landed: 3-way merge via `git merge-file` for diverged files, overwrite for upstream-changed, skip for consumer-edited. Base retrieval from git tags (`v${kitVersion}`), degrades to skip+report when tag unavailable. 10 new CLI tests (32 total). Suite 735 (2 pre-existing slider cursor failures).
- **2026-08-04 — task 66 done.** `van.schema.json` generated from `config-schema.mjs` constants via `scripts/gen-schema.mjs`. Covers `framework`, `rsc`, `paths` (the three keys task 38 added), plus the full theme + components surface. `$schema` wired into `initialConfig()` and kit config. 14 new tests (87 total config-schema). `npm run schema` regenerates.
- **2026-08-05 — task 67 done.** Interactive multi-select picker for bare `van add`. Raw-mode ANSI with scrolling viewport, ~90 lines. `--yes` selects all not-installed. Non-TTY falls back to error. 9 new tests (41 total CLI).
- **2026-08-05 — task 69 done.** 41 raw `<button>` → `<Button>` across 10 site pages, breadcrumb in shell, introduction page rebuilt as live component showcase. NavigationMenu skipped (horizontal-only, doesn't fit vertical sidebar). VT card buttons kept raw (styled as cards). Suite 733/735 (2 pre-existing).
- **2026-08-05 — task 70 done.** Typeset system: three rhythm vars (`--typeset-size`, `--typeset-leading`, `--typeset-flow`) + font tokens generated into `defaults.css`; `styles/typeset.css` hand-written prose container with presets and opt-out; `ui/typography` retrofitted to derive from typeset vars; inline `fontSize` replaced with `.pg-desc`/`.pg-detail` across ~18 pages. 11 new tests. Suite 744/746 (2 pre-existing).
- **2026-08-05 — task 30 rescoped, tasks 75–78 added.** Task 30 was a `~M` docs consistency/gap pass. User wants a full shadcn-grade docs site rebuild: home page, top navbar (navigation-menu), ⌘K command palette in shell, component categories, per-component install/usage/examples/API-reference docs, code display infrastructure. Rescoped 30 to `~L` site-chrome overhaul. Split the rest into: 75 (code display infra, `~M`), 76 (15 core component pages, `~L`), 77 (remaining ~59 pages, `~XL`, spawn-ready), 78 (Get Started + config reference + voice pass, `~M`). B1–B6 and A3/A5 distributed across 76–78. Order: 30 → 75 → 76 (+78 parallel) → 77 (spawn) → 74? → console kit.
