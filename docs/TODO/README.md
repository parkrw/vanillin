# Cycle: vanillin — component build-out (01–30), then config/parity/platform (31–61)

**Resume:** Tasks 65–70 done. Next ready: **30** (docs-content, final consistency/gap pass). Task **74** (narrow-viewport reflow, split out of 71's findings) still needs a scope call before it is detailed. See `docs/TODO/task71-docs-site-sweep.md` for what the sweep tools do and how to re-run them.

## Handoff — task 70 (complete)

See `docs/TODO/task70-typography-system.md` → Handoff. Typeset rhythm system landed, all inline font sizes consolidated. Suite 744/746 (2 pre-existing).

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
| 30 (do last) | docs-content        | ~M  | [ ]    | **runs last**, after 70; consistency/gap pass + the docs half of `docs/ISSUES.md` (A3, B1–B6)       |

## Phase 2 — config, form, parity, platform

Tasks are detailed just-in-time; only the rows below are durable.

**Order from here (settled 2026-07-27, after 38 landed):**

```
39 ✓ → 68 ✓ → 71 ✓ → 72 (bugs) → 73 (coverage) → 65 → 66 → 67 → 69 → 70 → 30 → 74? → console kit
```

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
- **30 is last and absorbs the docs half of `docs/ISSUES.md`** — A3 (code
  examples on every component page) and B1–B6 (per-component config
  undocumented, density examples, `ui/command` unexplained, drawer swipe
  undiscoverable, form docs recommending zod over `lib/schema.js`, `ui/form` vs
  `ui/form-fields`) are its checklist, not a separate list.
- **The console kit comes after 30** — new components want settled docs
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
`site/pages/docs/` page. Task 30 is no longer where documentation gets
written; it is a final consistency and gap pass.

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
| 74  | site-responsive          | ~L  | [ ]    | ISSUES K1 — 73 of 79 pages overflow at 380px; needs a scope call [^74]  |
| 73  | coverage-probe           | ~L  | [x]    | 26 probed, 5 gaps fixed, 20 caught, 1 skipped; suite 735 [^73]          |

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
    a phone at all? If yes it is demo-layout work across most of
    `site/pages/`, not kit CSS, and belongs after 30 with the other docs-site
    passes rather than in a bug batch.

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

**Browser-support gate:** 33, 39, 54, 55, 57 depend on features that were
partially supported at plan time (relative color syntax, `light-dark()`,
container queries, View Transitions, Custom Highlight API, Speculation Rules,
`field-sizing`). Each task's first step is a live support check — degrade to
progressive enhancement, never a hard requirement.

## Backlog — console kit

Components a cloud console needs that upstream has no answer for. **Scheduled
after 30** (see the order above): they need post-39 CSS and settled docs
conventions, and writing them earlier means writing them twice. Detail
just-in-time. Rough order of usefulness:

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

- **Measuring colour (contrast, computed styles, dark mode): `docs/TODO/notes/measuring-colour.md`.** Read before writing anything that reads a computed colour — oklch parsing, alpha compositing, and why a green axe run is not an accessibility result.
- **Sweep tools:** `node scripts/sweep-pages.mjs` (all 79 pages, light + dark) and `node scripts/contrast-nontext.mjs` (non-text contrast). Measuring instruments — they exit non-zero on harness errors, not on findings.
- **Per-task decisions, deviations and gotchas: `docs/TODO/LOG.md`.** Append
  there when a task lands — not to this file. This index stays scannable.
- Planning is **just-in-time**: the rows above are durable, task files are
  written when a task is picked up. Task files now exist for every task except
  22–29 (landed before the convention).
  Specified and ready to dispatch: 65/66/67. 68, 69 and 70 have rows and
  footnotes but no task files yet. **66 must cover `framework`, `rsc` and
  `paths`** — task 38 added all three as top-level config keys, so the generated
  schema has three more branches than its row assumed.
- **New CSS convention from 39:** an element never matches an `@container` query
  against a container it declares itself — the query resolves against the
  *ancestor* container. Layout flips therefore go on descendants
  (`flex-wrap`/`gap` unconditional on the root, children's `flex-basis` queried).
  Name every container `vanillin-<slug>`. Thresholds are literal `rem` —
  container conditions cannot read custom properties.
- Test: `node tests/run.mjs` — boots its own vite on :5199, drives local Chrome;
  one `tests/<slug>.test.mjs` per interactive component. (Dev server on :5173
  only needed for manual/screenshot QA.)
- Build: `npm run build`. No lint configured.
- Conventions + gotchas: `docs/HANDOFF.md` (block classes, tokens-only CSS,
  `cn()`, `as` prop, `useControllableState` + `data-state`, `usePresence`, demo
  page + `site/registry.js` entry per component).
- Load-bearing files: `styles/globals.css` (tokens), `lib/` primitives,
  `ui/toggle/` (stateful pattern), `ui/tabs/` (roving tabindex), `ui/accordion/`
  (disclosure/presence), `site/registry.js`.
- Git gates (hooks): no commits on main — `<type>/<kebab>` branch first. The
  ~500-net-line branch-size hook is advisory only — never split or restructure
  work because of it.

## Adjustments log

- **2026-08-04 — task 73 scope narrowed.** Replaced sub-tasks 1-4 (probe all 68 components + write tests) with: sub-tasks 1-2 done (20 probed, 5 tests written), sub-task 3 finishes 6 remaining high-value probes (sidebar, message-scroller, command, menubar, form, radio-group), tier 3 skipped (re-exports/CSS-only/meta — no JS to probe). Rationale: 14/15 non-skip probes caught, the one systematic gap class (anchor positioning) is found and fixed, diminishing returns on remaining ~25 low-risk components.
- **2026-08-04 — task 73 done.** All 6 final probes caught (no new gaps). 26 components probed total, 5 gaps fixed, 20 caught, 1 skipped. Suite 735.
- **2026-08-04 — task 65 done.** `van update` landed: 3-way merge via `git merge-file` for diverged files, overwrite for upstream-changed, skip for consumer-edited. Base retrieval from git tags (`v${kitVersion}`), degrades to skip+report when tag unavailable. 10 new CLI tests (32 total). Suite 735 (2 pre-existing slider cursor failures).
- **2026-08-04 — task 66 done.** `van.schema.json` generated from `config-schema.mjs` constants via `scripts/gen-schema.mjs`. Covers `framework`, `rsc`, `paths` (the three keys task 38 added), plus the full theme + components surface. `$schema` wired into `initialConfig()` and kit config. 14 new tests (87 total config-schema). `npm run schema` regenerates.
- **2026-08-05 — task 67 done.** Interactive multi-select picker for bare `van add`. Raw-mode ANSI with scrolling viewport, ~90 lines. `--yes` selects all not-installed. Non-TTY falls back to error. 9 new tests (41 total CLI).
- **2026-08-05 — task 69 done.** 41 raw `<button>` → `<Button>` across 10 site pages, breadcrumb in shell, introduction page rebuilt as live component showcase. NavigationMenu skipped (horizontal-only, doesn't fit vertical sidebar). VT card buttons kept raw (styled as cards). Suite 733/735 (2 pre-existing).
- **2026-08-05 — task 70 done.** Typeset system: three rhythm vars (`--typeset-size`, `--typeset-leading`, `--typeset-flow`) + font tokens generated into `defaults.css`; `styles/typeset.css` hand-written prose container with presets and opt-out; `ui/typography` retrofitted to derive from typeset vars; inline `fontSize` replaced with `.pg-desc`/`.pg-detail` across ~18 pages. 11 new tests. Suite 744/746 (2 pre-existing).
