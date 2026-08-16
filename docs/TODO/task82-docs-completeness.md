# task82: docs-completeness
**Goal:** Finish the docs pages that are still incomplete — nine component pages, the Get Started flow, and the `docs/` reference pages — so no page reads as half-built.  **Branch:** `docs/completeness`  **Deps:** 77 (done)
**Owns:** `site/pages/**` (all component pages and `site/pages/docs/*.jsx`), `site/code-example.jsx`, `site/api-reference.jsx`, `site/install-snippet.jsx`

## The standard: `button.jsx` and `combobox.jsx`

**The user named these two as how every page should look** (2026-08-07). Read both before touching anything else — they are the spec, and this task is largely "make the other 73 pages meet them".

What they actually do, measured:

| | previews | lines | shape |
| --- | --- | --- | --- |
| `button.jsx` | 7 | 170 | tight — every variant its own preview |
| `combobox.jsx` | 7 | 342 | same count, more prose per example |

Both: exactly one `<InstallSnippet>`, one `<ApiReference>`, **zero bare `<CodeBlock>`** — every code sample lives inside a `ComponentPreview` with its rendered demo. That last point is the real rule. A page that explains with a code block instead of a working demo is the thing that reads as unfinished.

The bar is therefore **~7 previews and every example rendered**, not a line count. `combobox` is twice `button`'s length at the same preview count, so prose is free; missing demos are not.

### Census against that bar — all 75 pages, measured 2026-08-07

| previews | pages |
| --- | --- |
| **0** | 12 — sheet, drawer, direction, primitives, view-transitions, navigation-menu, typography, density, container-queries, form-fields, use-form (+home) |
| **1** | 17 — incl. **data-table (1251 lines!)**, sidebar, carousel, resizable, scroll-area, calendar, menubar, tabs, format, attachment, status-dot, message-scroller, collapsible, empty, alert-dialog, slider, progress |
| 2-3 | 17 — incl. command (3, at 382 lines) |
| 4-6 | 25 — incl. accordion (4) |
| **7-8** | 4 — button, combobox, and two others |

**Only four pages of 75 meet the standard.** The 29 pages at 0-1 previews are what "not even done" meant. Work them worst-first: a 1251-line page with one demo is a bigger defect than a 70-line page with none.

## What else is missing

Measured on `main` at `7fbb916` — do not re-derive, but do re-check before assuming a page is still broken.

**Component pages with no `ComponentPreview` at all:**
- `use-form.jsx` (682 lines) and `form-fields.jsx` (601 lines) — the two largest pages in the site. Big, prose-heavy, and never carried a preview. These are the worst offenders.
- `drawer.jsx` (74 lines) and `sheet.jsx` (70 lines) — the opposite problem: task 80 restored their `InstallSnippet` and `ApiReference` after the C9 fix unblocked them, but they were never given real examples, so they are the thinnest component pages in the kit.
- `navigation-menu.jsx` — task 77b left it unwrapped deliberately (its demos are too interactive for preview tabs). **Confirm that still holds** rather than wrapping it reflexively; if it does, the page still needs to look finished by other means.

**The six system pages** — `container-queries`, `density`, `direction`, `primitives`, `typography`, `view-transitions`. Task 77d licensed these to drop `InstallSnippet`/`ApiReference` because they document a system, not a component, and that reasoning stands. But "different template" became "looks unfinished". Give them a **consistent alternative shape** — they should be visibly a deliberate page type, not a component page missing its sections.

**Get Started + `docs/` pages** — `site/pages/docs/` holds `introduction`, `installation`, `configuration`, `theming`, `schema`, `cli`, `contracts`. Task 78 rewrote most; `contracts.jsx` was never in any task's scope. Read all seven, and fix whatever is thin, stale or inconsistent with the others.

**The home page** (`site/pages/home.jsx`, 165 lines) — the first thing anyone sees, and the user's review hit it three ways. Added 2026-08-07:

- **The hero showcase lies.** `home.jsx:61-62` puts `<Badge variant="success">deploy passed</Badge>` beside `<Progress value={80}>`. A pass badge next to a bar that is three-quarters full reads as a broken component, not a demo. Either make the pair coherent (a finished bar reads 100, or the badge describes an in-flight rollout) or split the two ideas. This is a **content bug in the demo, not a bug in `ui/progress`** — verify that before touching the component.
- **The `Zero dependencies` badge** (`home.jsx:71`) is a bare `variant="outline"` `Badge` doing the job of a hero eyebrow. It is the site's headline claim rendered as the weakest element on the page. Give it a treatment worth the claim, using kit components and tokens only.
- **The hero as a whole.** Two-column copy + `HeroShowcase` (`home.jsx:26-66`). The showcase is a settings card plus a status card; it demonstrates six of 75 components and none of the ones anybody comes for. Revisit what it shows and how the section is laid out.

**Em dashes** — **353 occurrences across `site/pages/`**. Remove them from site prose; recast the sentence rather than swapping in a hyphen where the punctuation was carrying real structure. Prose only: leave code strings, `CodeBlock` content and any `data-pg` value alone, and do not touch `docs/*.md` or `AGENTS.md` in this task.

**Six pages the user named as needing examples** — measured 2026-08-07:

| Page | Lines | `ComponentPreview` |
| --- | --- | --- |
| `form-fields` | 601 | **0** |
| `container-queries` | 261 | **0** |
| `data-table` | 1251 | 3 |
| `sidebar` | 339 | 3 |
| `command` | 382 | 7 |
| `accordion` | 159 | 9 |

The first two are already covered above (no preview at all). `data-table` is the standout defect in the second group: 1251 lines carrying three previews. `sidebar` at 3 is thin for a component with 24 exports. `command` and `accordion` have counts that look fine — **check them at the running site before rewriting anything**, since the user's complaint may be about which examples exist rather than how many.

## Audit — measured 2026-08-13 on `3af9122`, all 82 pages

Machine-measured per page: `LINES`, `PREV` = `<ComponentPreview` count, `CODE` = bare `<CodeBlock` count, `INST` = `<InstallSnippet`, `API` = `<ApiReference`, `EMD` = em dashes. Full table in the branch history; the defects it surfaced are below.

**Corrections to the numbers this file shipped with.** The census table above (0/1/2-3/4-6/7-8 buckets) is accurate. The "six pages the user named" table is not: it lists `command` at 7 previews and `accordion` at 9. Measured, `command` has **3** and `accordion` has **4**. Both are therefore below the bar, not at it, which resolves the file's own open question about whether the user's complaint was about *which* examples exist: both counts were simply wrong.

**Defects the source audit found that the file did not list:**

- **`use-form.jsx` has no `InstallSnippet` at all** (and 2 `ApiReference`). It is the only component page in the site missing its install block.
- **`ApiReference` is not one-per-page across the site.** `form` has 5, `field`/`card`/`avatar`/`button-group` have 3, and eight more have 2. On multi-export components (`Card` + `CardHeader` + `CardTitle` …) a table per sub-component is defensible and reads better than one merged table, so this is **accepted, not a defect** — but it means "exactly one `ApiReference`" describes `button.jsx`, not the house rule. Recorded so the next reader does not "fix" it.
- **`tabs.jsx` carries 2 bare `CodeBlock`s** and cannot take previews around its tab fixtures: `tests/tabs.test.mjs:5` grabs `[role="tablist"]` `.first()`, and `ComponentPreview` renders `ui/tabs` internally. `tests/forced-colors.test.mjs:70` and `tests/tokens-surfaces.test.mjs:143` have the same exposure via `.tabs-trigger`.
- **Em dashes are concentrated, not spread.** `resizable.jsx` alone holds 43 of the 353. `theming` and `configuration` hold 25 each. Ten pages have zero.
- **`docs/` pages are the bare-`CodeBlock` cluster**: `configuration` (12), `theming` (7), `cli` (7), `installation` (6). Command-line pages legitimately keep `CodeBlock`; `theming` and `configuration` describe visible outcomes and should render them.
- **`introduction.jsx` has neither a preview nor a code block** — 147 lines of unbroken prose as the site's first Get Started page.

**Structural finding that shaped the whole task.** `TabsContent` returns `null` when inactive (`ui/tabs/tabs.jsx:59`), so an inactive preview tab's content **is not in the DOM**. Two consequences, both load-bearing: sub-task 0a's `defaultTab="code"` hides the Usage demo from any test that reaches it, and wrapping any test-driven fixture in a preview breaks that test. Every page brief carried this.

## Sub-tasks

- [ ] 0a. **Usage sections open on the Code tab.** `site/code-example.jsx:52` hardcodes `<Tabs defaultValue="preview">`. Add a prop (`defaultTab`, defaulting to `"preview"` so nothing else changes) and pass `defaultTab="code"` from every page's **Usage** section only — the reader arriving at Usage wants the import and JSX to copy, not a rendering of a button they can already see below. Examples/variants sections keep opening on Preview. Do this **before** the page work so the 73 pages are written against the final API, and check `tests/` for anything selecting the active tab. Files: `site/code-example.jsx`, then every page's Usage block.
- [ ] 0b. **Read `site/pages/button.jsx` and `site/pages/combobox.jsx` first.** They are the standard the user named. Everything below means "bring this page up to those two".
- [ ] 1. **Audit and record.** Open all 75 component pages and all 7 `docs/` pages at the dev server; write the concrete defect per page into this file before fixing anything. A list written from reading source will miss the visual ones. Do this first — it sizes the rest. Use the preview census above as the worklist skeleton, worst-first.
- [ ] 2. `use-form.jsx` and `form-fields.jsx` — bring to the task-76 template.
- [ ] 3. `drawer.jsx` and `sheet.jsx` — real examples (sides/directions, controlled, with a form inside), matching sibling overlay pages.
- [ ] 4. The six system pages — one consistent page type, applied to all six.
- [ ] 5. `site/pages/docs/` — the seven Get Started/reference pages, with `contracts.jsx` given the most attention.
- [ ] 6. **Home page** — the progress/badge mismatch first (one-line content fix), then the zero-dependencies badge, then the hero layout and what the showcase shows.
- [x] 7. **The 29 pages at 0-1 previews**, worst-first by the census. `data-table` (1251 lines, 1 preview) leads; then `sidebar`, `carousel`, `resizable`, `scroll-area`, `calendar`. Every example becomes a `ComponentPreview` with a working demo — a `CodeBlock` on its own is what this task is removing.
- [ ] 8. **Em-dash sweep** (partial: 334 → 160) across `site/pages/`. Do this **last**: every sub-task above writes new prose, and sweeping first means sweeping twice. Verify with `grep -ro "—" site/pages | wc -l` reaching 0.
- [ ] 9. Anything else sub-task 1 turned up, cheapest first.

## Rules carried forward from 76/77 — read these, they were each learned the hard way

- **Applying the template is additive.** Both batch-3 workers shipped green suites while deleting prose that documented real behaviour, replacing it with prop tables. Prop tables list names; they explain nothing. Before accepting any page you rewrote, diff it: `git show 7fbb916:site/pages/<page>.jsx`. A page that comes out shorter needs a reason.
- **Code strings must match the JSX rendered beside them** — three drifts in 77d, more in 76. Someone copies that code.
- `ComponentPreview` renders `ui/tabs` internally. A page whose test selects `[role="tablist"]` or `.tabs-trigger` must render that fixture directly, not inside a preview.
- No duplicate visible button labels on one page — Playwright strict mode fails on the collision.
- Preserve every `data-pg` hook and selector its test uses; read `tests/<slug>.test.mjs` before touching a page.
- The page-height rule is now **advisory** — ISSUES C9 is fixed (task 80), so added height no longer breaks viewport-anchored overlays. Tests that drive by viewport coordinates still exist, so keep fixtures reachable.

## Verify / done

```sh
node tests/run.mjs   # full suite — baseline 758/761
npm run build
```

Baseline noise floor: 2 slider-cursor failures + an intermittent `navigation-menu` hover flake. Report exact counts from the runner summary — not from memory.

Done when: every component page and every `docs/` page is complete by its own page type, sub-task 1's audit list is fully struck through, the home page's hero holds up as the site's front door, `grep -ro "—" site/pages | wc -l` is 0, and no page lost prose it used to have.

## Out of scope

`site/site.css`, `site/app.jsx`, `site/toc.jsx` — shell geometry and section spacing are **task 81**, running in parallel. Report layout defects there rather than patching them per page; a margin override on one page is exactly what 81 is deleting. Also out: `tests/**` (see ISSUES H3 for the `empty` page's brittle assertion — the `empty` Usage preview stays a placeholder until that is fixed).

## Handoff

**Status:** IN PROGRESS
**Branch:** `docs/completeness` (salvage merged to `main` at `09f05f3`)  **PR:** none  **Updated:** 2026-08-16

- **Landed:** salvage merged (`defaultTab` API, the audit above, use-form/form-fields/home/data-table + ~30 small pages). **All 20 pages named in the previous Next line are now done** across 6 commits on `docs/completeness` (`74a7b44` … `e12fc91`), plus a partial em-dash sweep (`734fa91`). Verified **760/762**, build clean; the 2 failures are the pre-existing slider-cursor pair.
- **Repo state:** worktree `../vanillin-task82` on `docs/completeness`, 7 commits ahead of `main`, tree clean. Not pushed, no PR. Stash "task82 interrupted-worker pages" is still unpopped and now obsolete: the 20 pages were rewritten from scratch, not from it.
- **Next:** finish the em-dash sweep. **160 left**, concentrated in 11 files: `docs/theming` (25), `docs/configuration` (24), `form-fields` (19), `container-queries` (17), `docs/schema` (14), `use-form` (13), `form` (11), `docs/cli` (11), `data-table` (10), `docs/introduction` (7), `docs/installation` (7). Done when `grep -ro "—" site/pages | wc -l` is 0.
- **Gotchas:**
  - **Viewport-anchored tests break when a page gets taller above the fixture.** Adding a Usage section above `context-trigger` pushed it past 720px and failed 11 context-menu tests that drive raw `page.mouse` at `boundingBox()` coords. Same exposure on `resizable` (`r-horizontal`), `scroll-area` (`sa-vertical`), and `toast`. Fix: keep the tested demo as the **first** section and put the `defaultTab="code"` Usage section after it.
  - **`defaultTab="code"` removes the demo from the DOM** (`TabsContent` returns `null` when inactive). Any page whose test selects inside the old Usage demo needs that demo moved to a preview-tab section named "Default", with a fresh Usage section carrying different ids/labels.
  - `empty.jsx`'s Default demo must stay **outside** a preview: `tests/empty.test.mjs` asserts `frame.x === heading.x` on the page grid (ISSUES H3). Every other Empty demo is wrapped, each with its own `.pg-empty-frame` so the "one frame per empty demo" count assertion holds.
  - `accordion` tests index `.accordion` by `.first()`/`.nth(1)`, so new demos must go after the Multiple section.
  - Unescaped `${…}` inside a `` code={`…`} `` template literal unmounts the whole app; grep after every batch. Suite runner trusts anything on :5199 (ISSUES H4).
