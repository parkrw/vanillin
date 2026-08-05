# task69: docs-site-dogfood
**Goal:** The docs site uses vanillin components instead of raw HTML — the single most visible credibility item.  **Branch:** `feat/docs-site-dogfood`  **Deps:** none
**Owns:** `site/app.jsx`, `site/site.css`, `site/pages/*.jsx` (the 10 flagged pages + introduction)

## Sub-tasks

- [x] 1. Raw `<button>` → `<Button>` across 9 pages — import `Button` + `button.css`, swap tags, add `variant` where already styled; files: `form.jsx` (7), `use-form.jsx` (20), `form-fields.jsx` (5), `select.jsx` (2), `combobox.jsx` (2), `carousel.jsx` (1), `command.jsx` (1), `resizable.jsx` (1), `view-transitions.jsx` (2 — cards kept raw, styled as cards not buttons)
- [x] 2. Primitives page: `<Button>` for trigger/toggle buttons; reframed intro to explain why consumers care about lib/ primitives; roving-focus demo keeps raw `<button data-roving>` (hook binds to them); files: `primitives.jsx`
- [x] 3. Breadcrumb in site shell — `<Breadcrumb>` at top of `.pg-main` showing `Get started > Page` or `Components > Page`; files: `site/app.jsx`, `site/site.css`
- [x] 4. NavigationMenu: **skipped** — horizontal-only (no orientation prop, no vertical mode). The sidebar is a vertical link list; forcing NavigationMenu would misuse the component. Sidebar already uses semantic `<nav>` + `<ul>`.
- [x] 5. Introduction page: Card with avatar/badges/buttons, settings card with Input/Switch, Tabs with copy-paste vs CLI instructions; files: `site/pages/docs/introduction.jsx`

## Verify / done

```sh
npm test > /tmp/t69.txt 2>&1 && grep -E 'passed|FAIL' /tmp/t69.txt
npm run build
```
- Zero raw `<button>` on the 10 flagged pages (except primitives' roving-focus demo if `data-roving` requires raw elements)
- Breadcrumb visible in the shell showing correct section/page
- Introduction page renders real components
- No regressions in existing tests

## Handoff

**Status:** COMPLETE
**Branch:** feat/docs-site-dogfood (merged)  **PR:** none (local merge)  **Updated:** 2026-08-05

- **Landed:** 41 raw `<button>` → `<Button>` across 10 pages; breadcrumb in site shell; introduction page rebuilt as live component showcase; NavigationMenu skipped (horizontal-only). Suite 733/735 (2 pre-existing slider cursor flakes).
- **Repo state:** clean on main, 2 unstaged TODO bookkeeping changes (README resume pointer + task67 handoff text).
- **Next:** task 70 (typography-system) — a typeset scale for the docs site, then task 30 (docs-content) proofreads everything.
