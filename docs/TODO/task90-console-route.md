# task90: console-route
**Goal:** Make the console sidebar read as alive (Platform group open by default) and give the console a dedicated full-viewport `#console` route, linked from the home embed.  **Branch:** `feat/console-route`  **Deps:** none (88/89/integration merged)
**Owns:** `site/showcase/console.jsx`, `site/app.jsx`, `site/registry.js`, `site/pages/home.jsx`, `site/site.css` (route styles only), `tests/showcase-console.test.mjs`

User request 2026-08-18. Measured on main: the home embed gives the console 70rem and the nav panel renders, but with all three groups collapsed the sidebar shows only Overview plus three small gray labels and reads as an empty panel. A separate app and a screenshot link were considered and rejected (screenshot forfeits the live-kit credibility; app buys nothing).

## Sub-tasks

- [ ] 1. **Platform open by default.** `ConsoleNav` (`site/showcase/console.jsx`): the Platform `Collapsible` gets `defaultOpen`; Operations and Account stay closed. Amend the existing "nav groups are collapsed on load" test in `tests/showcase-console.test.mjs` to assert Platform open + the other two closed.
- [ ] 2. **`#console` route, full-bleed.** The shell (`site/app.jsx:390-397`) branches on `isHome`; add a `console` route that renders `ConsoleShowcase` (default export, `site/showcase/console.jsx:1368`) full-viewport with no docs sidebar, no TOC, no breadcrumbs (`site/app.jsx:324` already returns null for home; extend). Register the slug so nav/⌘K can reach it (`site/registry.js` — note: `console` currently has no entry; check how the `cli` slug was added by task 78 for the pattern). Keep the lazy import pattern (`site/pages/home.jsx:29`).
- [ ] 3. **Home link.** An "Open full console" affordance on/near the home embed (`site/pages/home.jsx:141`) linking to `#console`. Kit components only.
- [ ] 4. **Tests.** New: `#console` route renders the console with the docs sidebar absent; home affordance navigates to it. Amended: sub-task 1's collapse assertions.

## Verify / done

`npm run build` clean; `VANILLIN_TEST_PORT=5251 npm test` — baseline **784/787** (known failures: slider-cursor pair + intermittent navigation-menu hover flake; drawer timeouts appear only under load, rerun in isolation before treating as real) plus new tests green.

## Gotchas

- The console mock is `aria-hidden` inside the home hero context in places — the standalone route must be interactive and accessible, not a decoration.
- `.ck-nav-panel` hides below a 42rem container (`console.css:707`) — fine, keep it.
- No em dashes in user-visible prose; tokens only in CSS.

## Handoff

**Status:** NOT STARTED
