# task81: docs-layout-measure
**Goal:** Fix the docs shell's geometry — centre and cap the content column, then sweep the page-level spacing and alignment defects that make finished pages still read as unfinished.  **Branch:** `docs/layout-measure`  **Deps:** none
**Owns:** `site/site.css`, `site/app.jsx`, `site/toc.jsx`, `styles/typeset.css`

## The bug that started this

`site/site.css:471-475`:

```css
.pg-main {
  padding: 2rem 2.5rem;
  max-width: 56rem;
  min-width: 0;
}
```

The shell grid is `auto 1fr auto` (`site/site.css:43`) — sidebar, main, right rail. `.pg-main` caps at 56rem but has **no `margin: 0 auto`**, so it sits hard against the left edge of a `1fr` track that is far wider on a large display. The result is text pinned left with a dead gap before the rail. `.pg-main--home` (`:477-481`) *does* have `margin: 0 auto`; the base rule was simply never given it.

That one declaration is the headline fix. The rest of this task is the sweep it opens up.

## Sub-tasks

- [x] 1. **Centre and re-measure the content column.** Add the centring, then pick the cap deliberately rather than keeping 56rem by inertia: prose reads best at roughly 65-75 characters, and this column carries prose *and* wide code blocks *and* component previews, so the right answer is likely a wider shell with a narrower measure on the prose specifically (`styles/typeset.css` already owns prose rhythm — use it rather than adding page-level widths). Verify at 1280, 1600 and 2560 CSS px. Files: `site/site.css`, `styles/typeset.css`.
- [x] 2. **Reconcile the three breakpoints.** `site/site.css:52`, `:460` and `:565` each collapse a different part of the layout at `72rem`/`64rem`. Confirm they compose — in particular that hiding `.pg-rail` at 72rem (`:460-464`) hands its space to the content column rather than leaving it stranded. Files: `site/site.css`.
- [x] 3. **Sweep vertical rhythm between page sections.** The reported "funky placing" is largely inconsistent gaps between a heading, its description, its preview and the next section — different pages were written by four different workers against the same template. Find the section wrapper, give it one spacing contract, and delete the per-page margin overrides that fight it. Files: `site/site.css`.
- [x] 4. **Check the right rail against the new geometry.** The TOC rail (task 79) was positioned against the old left-aligned column. Confirm it still tracks headings and that its drag-resize range still makes sense once the column moves. Files: `site/toc.jsx`, `site/site.css`.
- [x] 5. **Topnav separation and scrolled opacity** (user report, 2026-08-07). `site/site.css:78-82`: the scrolled bar draws `border-bottom-color: var(--border)` and `background: color-mix(in oklab, var(--background) 82%, transparent)`. Two defects, one rule: the border is invisible (`--border` measured **1.26:1** in task 71's sweep — D9's fix went to `--input`, so this token is still the weak one), and at 82% the page content reads straight through the bar while scrolling under it. Raise the border to a visible weight against both surfaces and take the background materially more opaque; the `prefers-reduced-transparency` branch at `:85-91` already lands on solid `--background`, so that is the ceiling. Do not fix this by changing `--border` globally — 227 surface call sites depend on it; use a topnav-local value. Files: `site/site.css`.
- [x] 6. **Screenshot QA at three widths.** `node scripts/sweep-pages.mjs` covers 1280 and 380; this task cares about the wide end, which nothing currently measures. Spot-check a prose page (`docs/introduction`), a dense component page (`data-table`) and a system page (`container-queries`).

## Verify / done

```sh
node tests/run.mjs   # full suite — baseline 758/761
npm run build
node scripts/sweep-pages.mjs
```

Baseline noise floor: 2 slider-cursor failures + an intermittent `navigation-menu` hover flake. Report exact counts from the runner summary.

Done when: the content column is centred and deliberately measured at 1280/1600/2560, section spacing is one contract rather than per-page overrides, the scrolled topnav visibly separates from the content passing under it, and the rail still works.

Sub-task 5 also wants a measurement, not an eyeball: run `node scripts/contrast-nontext.mjs` and confirm the topnav's bottom boundary clears 3:1 in light and dark.

## Out of scope

`site/pages/**` — page *content* belongs to task 82, which runs in parallel and owns those files. If a page needs a markup change to pick up the new spacing contract, record it in the report for 82 rather than editing it. Narrow-viewport overflow (≤380px) is **task 74**, which is still awaiting a scope call — do not start on it here.

## Handoff

**Status:** COMPLETE
**Branch:** `docs/layout-measure` (merged `6a79bdc4`; branch and worktree removed)  **PR:** none (local merge)  **Updated:** 2026-08-16

- **Landed:** content column centred and capped at 68rem with a 62ch prose measure; one page-rhythm contract (`--pg-flow` between sections, `--pg-flow-tight` heading→content); scrolled topnav at 94% opacity with a boundary measuring 3.64:1 light / 3.61:1 dark.
- **Repo state:** clean; post-merge suite 760/762 (the pre-existing slider-cursor pair only). Main is ahead of origin — push is human-only.
- **Next:** task 82 — the 20 reverted pages (`docs/TODO/task82-docs-completeness.md` → Handoff, worktree `../vanillin-task82`).
- **Gotchas:** for 82 — inline `marginBottom`/`marginBlockEnd` on section-intro paragraphs (`site/pages/navigation-menu.jsx:36,95`, `site/pages/scroll-area.jsx` passim) predate the rhythm contract and can be dropped where they duplicate the `h3 + *` tight gap. Measurement traps are in the adjustments log (topnav transition settle, InstallSnippet between sections); the missing topnav probe is ISSUES.md §J.
