# task30: site-chrome
**Goal:** Rebuild the docs site shell — top navbar, command palette, home page, component categories, enhanced breadcrumbs.  **Branch:** `docs/site-chrome`  **Deps:** none
**Owns:** `site/app.jsx`, `site/site.css`, `site/pages/home.jsx`, `site/registry.js`

## Sub-tasks

- [x] 1. **Categorize components in registry** — restructure `site/registry.js` to group components into categories (Forms, Data Display, Layout, Navigation, Overlay, Disclosure, Communication, Platform). Sidebar renders category headings with collapsible lists underneath. Existing flat nav becomes grouped; no component page changes needed.
  - files: `site/registry.js`, `site/app.jsx`, `site/site.css`

- [x] 2. **Top navbar with navigation-menu** — add a horizontal top bar using `ui/navigation-menu`. Contains: vanillin logo/wordmark (links to `#home`), top-level nav links (Get Started, Components dropdown by category), mode toggle moves here. Sidebar becomes content-only (component tree for the current section). The site layout goes from `sidebar | main` to `navbar / sidebar | main`.
  - files: `site/app.jsx`, `site/site.css`

- [x] 3. **Command palette in shell** — wire `ui/command` + `CommandDialog` into the app shell, triggered by ⌘K / Ctrl+K globally. Populates items from `registry` + `docs` entries. Selecting an item navigates (`location.hash`). Shows keyboard shortcut hint in navbar.
  - files: `site/app.jsx`

- [x] 4. **Home / landing page** — `site/pages/home.jsx`, registered as the `#home` route (empty hash also resolves here instead of `#introduction`). Built entirely from vanillin components: hero section (Card, Button, Badge), feature highlights, "Get Started" CTA. Brief, not a marketing page — shows the kit in action.
  - files: `site/pages/home.jsx`, `site/registry.js`, `site/app.jsx`

- [x] 5. **Enhanced breadcrumbs** — breadcrumb trail reflects category: Home > Components > Forms > Button. Uses `ui/breadcrumb` already imported. Category comes from the registry grouping in sub-task 1.
  - files: `site/app.jsx`

- [x] 6. **Polish + visual QA** — run dev server, verify navbar responsiveness at 1280 and 768, command palette works, all nav links resolve, breadcrumbs are correct for docs pages vs component pages vs home. Dark mode.
  - test: `npm run dev`, manual QA
  - test: `npm test` — suite must stay green

## Verify / done

```sh
npm run dev          # visual: navbar, sidebar categories, home page, ⌘K palette, breadcrumbs
npm test             # suite green (no component changes, but site is the test fixture)
npm run build        # build clean
```

Observable:
- Logo click → home page
- ⌘K → command palette with all pages searchable
- Sidebar groups components by category with headings
- Breadcrumbs show full path including category
- Mode toggle in top navbar
- Navigation-menu dropdown shows component categories on hover

## Handoff

**Status:** COMPLETE
**Branch:** `docs/site-chrome-plan`  **PR:** none  **Updated:** 2026-08-05

- **Landed:** Top navbar (navigation-menu + command palette + mode toggle), categorized sidebar (8 categories), home/landing page, enhanced breadcrumbs (Home > Components > Category > Component). Layout fixed to `height: 100vh; overflow: hidden` to prevent document scroll from shifting modal dialogs. Tests 748/751 (3 pre-existing). Build clean.
- **Visual QA passed:** Navbar, sidebar categories, breadcrumbs, command palette, home page all verified at 1280 and 768 in both light and dark mode. No regressions.
- **Gotchas:** The navbar `.btn` (search trigger) resolves before lazy-loaded page content — any test `waitForSelector(".btn")` must scope to `.pg-main` to avoid matching the navbar. Three tests were fixed for this (`cursor`, `tokens-controls`, `docs-shell`).
