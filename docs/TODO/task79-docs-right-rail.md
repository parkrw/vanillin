# task79: docs-right-rail
**Goal:** A right-hand rail on component/docs pages: a scroll-synced table of contents now, a resizable code-example panel as the stretch goal.  **Branch:** `feat/docs-right-rail`  **Deps:** 75 (rail hosts the code blocks 76/77 add), ideally after 76 so the page anatomy it indexes is settled
**Owns:** `site/app.jsx` (shell grid), `site/site.css` (rail styles), new `site/toc.jsx`

## Sub-tasks

- [x] 1. **Shell grid gains a third column** — `sidebar | main | rail`, rail hidden below ~72rem viewport and on `#home`. Rail is sticky under the topnav like `.pg-sidebar` (see the left-sidebar pattern from the 2026-08-05 nav rework: sticky wrapper + window scroll).
  - files: `site/app.jsx`, `site/site.css`

- [x] 2. **Table of contents** — derive entries from the rendered page's `.pg-section > h3` headings after route change (the pages already follow one-`h2`-plus-`h3`-sections structure; no per-page data needed). Render as an "On this page" list.
  - files: `site/toc.jsx`

- [x] 3. **Scroll sync** — `IntersectionObserver` with a top rootMargin band marks the active heading; active link gets the `--pg-accent` treatment. Clicking scrolls to the heading (`scroll-margin-top: var(--pg-topnav-h)` on sections).
  - files: `site/toc.jsx`, `site/site.css`

- [x] 4. **Resizable rail** — reuse the pointer-drag pattern from `Sidebar`'s `startResize` (`site/app.jsx`), handle on the rail's left edge, width persisted to `localStorage` (`pg-rail-width`). Consider extracting the shared drag hook once there are two callers.
  - files: `site/app.jsx`, `site/site.css`

- [ ] 5. **(Stretch) code-example panel** — a mode where the rail pins the active section's `<CodeBlock>`/source alongside the demo, updating as the TOC active section changes. Scope call needed: this may compete with `<ComponentPreview>`'s inline code tabs from 75 — decide whether the rail replaces or supplements them before building.
  - files: `site/app.jsx`, `site/toc.jsx`

## Verify / done

```sh
node tests/run.mjs docs-shell   # extend with: rail present on component pages, absent on #home
npm run dev                     # visual QA: sync while scrolling, resize, both themes
```

Observable:
- TOC lists the page's `h3` sections; active item tracks scroll position
- Rail resizes by drag and the width survives reload
- No rail on `#home` or narrow viewports; no horizontal overflow (watch ISSUES K1)

## Handoff

**Status:** SUB-TASKS 1-4 DONE — stretch goal 5 skipped per task spec.

**What landed:**
- Three-column grid (`sidebar | main | rail`) in `site/app.jsx` + `site/site.css`; rail hidden below 72rem and on `#home`
- `site/toc.jsx`: TOC derived from `.pg-section > h3` via MutationObserver (handles lazy-loaded pages), IntersectionObserver scroll sync, pointer-drag resize persisted to `localStorage("pg-rail-width")`
- Four new tests in `tests/docs-shell.test.mjs`: rail presence, absence on home, scroll tracking, drag resize

**Surprises:**
- IntersectionObserver rejects `rem` in `rootMargin` — only `px` and `%` accepted. Used element `.offsetHeight` instead of reading the `--pg-topnav-h` CSS custom property.
- Heading derivation via `setTimeout(0)` races with Suspense lazy loading — the timeout fires before the chunk resolves, so headings are never found. Replaced with MutationObserver on `.pg-main` that re-derives when the lazy content mounts.

**Not extracted:** the drag-resize logic is duplicated between `Sidebar.startResize` and `TableOfContents.startResize`. A shared hook could be extracted once patterns stabilize.
