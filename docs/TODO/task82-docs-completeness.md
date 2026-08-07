# task82: docs-completeness
**Goal:** Finish the docs pages that are still incomplete — nine component pages, the Get Started flow, and the `docs/` reference pages — so no page reads as half-built.  **Branch:** `docs/completeness`  **Deps:** 77 (done)
**Owns:** `site/pages/**` (all component pages and `site/pages/docs/*.jsx`)

## What is actually missing

Measured on `main` at `7fbb916` — do not re-derive, but do re-check before assuming a page is still broken.

**Component pages with no `ComponentPreview` at all:**
- `use-form.jsx` (682 lines) and `form-fields.jsx` (601 lines) — the two largest pages in the site. Big, prose-heavy, and never carried a preview. These are the worst offenders.
- `drawer.jsx` (74 lines) and `sheet.jsx` (70 lines) — the opposite problem: task 80 restored their `InstallSnippet` and `ApiReference` after the C9 fix unblocked them, but they were never given real examples, so they are the thinnest component pages in the kit.
- `navigation-menu.jsx` — task 77b left it unwrapped deliberately (its demos are too interactive for preview tabs). **Confirm that still holds** rather than wrapping it reflexively; if it does, the page still needs to look finished by other means.

**The six system pages** — `container-queries`, `density`, `direction`, `primitives`, `typography`, `view-transitions`. Task 77d licensed these to drop `InstallSnippet`/`ApiReference` because they document a system, not a component, and that reasoning stands. But "different template" became "looks unfinished". Give them a **consistent alternative shape** — they should be visibly a deliberate page type, not a component page missing its sections.

**Get Started + `docs/` pages** — `site/pages/docs/` holds `introduction`, `installation`, `configuration`, `theming`, `schema`, `cli`, `contracts`. Task 78 rewrote most; `contracts.jsx` was never in any task's scope. Read all seven, and fix whatever is thin, stale or inconsistent with the others.

## Sub-tasks

- [ ] 1. **Audit and record.** Open all 75 component pages and all 7 `docs/` pages at the dev server; write the concrete defect per page into this file before fixing anything. A list written from reading source will miss the visual ones. Do this first — it sizes the rest.
- [ ] 2. `use-form.jsx` and `form-fields.jsx` — bring to the task-76 template.
- [ ] 3. `drawer.jsx` and `sheet.jsx` — real examples (sides/directions, controlled, with a form inside), matching sibling overlay pages.
- [ ] 4. The six system pages — one consistent page type, applied to all six.
- [ ] 5. `site/pages/docs/` — the seven Get Started/reference pages, with `contracts.jsx` given the most attention.
- [ ] 6. Anything else sub-task 1 turned up, cheapest first.

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

Done when: every component page and every `docs/` page is complete by its own page type, sub-task 1's audit list is fully struck through, and no page lost prose it used to have.

## Out of scope

`site/site.css`, `site/app.jsx`, `site/toc.jsx` — shell geometry and section spacing are **task 81**, running in parallel. Report layout defects there rather than patching them per page; a margin override on one page is exactly what 81 is deleting. Also out: `tests/**` (see ISSUES H3 for the `empty` page's brittle assertion — the `empty` Usage preview stays a placeholder until that is fixed).

## Handoff

**Status:** NOT STARTED
