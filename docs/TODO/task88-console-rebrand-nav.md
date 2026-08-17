# task88: console-rebrand-nav
**Goal:** Rebrand the home showcase to Acme Cloud 1.0.0 with generic (non-OpenStack) wording, rebuild the sidebar to the user's screenshot (three collapsible groups, collapsed on first open), and densify the chrome: fake theme toggle, tooltips everywhere, richer data-table row actions, attachment uploads for machine images.  **Branch:** `feat/console-rebrand-nav`  **Deps:** none
**Owns:** `site/showcase/console.jsx`, `site/showcase/console.css`, `site/showcase/console-data.js`, `tests/showcase-console.test.mjs`

User request 2026-08-17. The showcase lives below the home hero (`site/pages/home.jsx` mounts it; do not edit that file). Everything is a mock: no real state, actions land as `toast(...)`.

## Sub-tasks

- [ ] 1. **Rebrand.** Every visible "CloudKey" → "Acme Cloud"; avatar email → `ops@acme.cloud`; version `Badge` at `console.jsx:221` `10.6` → `1.0.0`. Sweep `console-data.js` for OpenStack-flavoured wording (its header comment says "OpenStack-flavoured"; flavors/Horizon/Neutron-style names become generic: instance sizes, networks, volumes, machine images). The `ck-` CSS class prefix may stay (it is not user-visible); if you rename it, rename it everywhere in one commit.
- [ ] 2. **Sidebar per screenshot.** Replace the current nav data with three groups — PLATFORM: Overview, Virtual data centers, Resources, Networking, Storage; OPERATIONS: Metrics, Events, Service health; ACCOUNT: Billing, Contacts, Support, Security, Your data, Settings. Each item gets a small inline SVG icon (kit style, `aria-hidden`) matching the screenshot's iconography. The three group `Collapsible`s open **closed** (`ConsoleNav`, `console.jsx:304` — drop `defaultOpen`); the standalone Overview link above the groups stays. Active item keeps `data-active`. Every item routes to a page: reuse the existing generic service-page renderer for new items; **Support and Settings render a clearly named placeholder component each (e.g. `SupportPanelSlot`, `SettingsPanelSlot`) with a Card saying the panel loads here — task 89 builds the real panels in separate files and the supervisor wires them in after both merge. Keep each slot a one-line mount point.**
- [ ] 3. **Fake theme toggle.** Sun/moon icon button in the topbar; clicking flips the icon and toasts ("Theme switching is decorative in this demo") but must not change any theme attribute or class on the page.
- [ ] 4. **Tooltips broadly.** Kit `Tooltip` on: every topbar icon button, the theme toggle, nav group carets, status dots, table row-action triggers, refresh/filter controls, the version badge. Anywhere a control's label is an icon, it gets a tooltip.
- [ ] 5. **Row actions.** Every data-table row menu gains more "Action …" entries appropriate to its row type (e.g. instances: Start, Stop, Reboot, Resize, Snapshot, Delete; volumes: Attach, Detach, Extend, Snapshot, Delete). Each entry toasts with the row's name. Destructive entries use the destructive menu-item variant.
- [ ] 6. **Attachments.** `ui/attachment` (`Attachment`, `AttachmentGroup`) on the Storage or Resources page as a "Machine images" upload row: several fake uploaded images (name, size, status) plus an upload affordance that toasts.
- [ ] 7. **Tests** in `tests/showcase-console.test.mjs` (new file): nav groups are collapsed on load and expand on click; theme toggle click leaves `document.documentElement` attributes/classes unchanged; one row action fires a toast; "Acme Cloud" renders and "CloudKey"/"10.6" do not.

## Verify / done

`npm run build` clean; `VANILLIN_TEST_PORT=5241 npm test` — baseline **760/763** (known failures: slider-cursor pair + intermittent navigation-menu hover flake) plus your new tests all green. `grep -ri cloudkey site/showcase` returns nothing.

## Gotchas

- CSS: tokens only, no raw hex; keep the `prefers-reduced-transparency` block (`console.css:633-648`) working.
- No em dashes in user-visible prose (repo-wide sweep enforced it).
- No duplicate visible button labels reachable on one page (Playwright strict mode); tooltips must not duplicate accessible names into collisions.
- `home.jsx` and `site/pages/**` are out of scope; so is `site/showcase/panels/` (task 89's directory).

## Handoff

**Status:** NOT STARTED
