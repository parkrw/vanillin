# task91: console-ck-look
**Goal:** Give the home console showcase the CloudKey console's exact look (palette, navy chrome, two collapsible rails, a breadcrumb bar in place of the tab strip, live motion), ship the live-number pattern as a kit component, and make status-dot rings and badges glow in their own colour.  **Branch:** `feat/console-ck-look`  **Deps:** none
**Owns:** `ui/live-value/**`, `lib/use-ticker.js`, `ui/status-dot/**`, `ui/badge/**`, `site/showcase/**`, `site/pages/{live-value,status-dot,badge,home}.jsx`, `site/registry.js`, `site/site.css` (live-value page styles), `tests/{live-value,status-dot,badge,showcase-console}.test.mjs`, `tests/conformance.unit.mjs` (allowlists)

User request 2026-08-25: "make the console showcase have the exact same look with the colors and styling as ck-console/apps/web and the animations, the 2 sidebars and 3rd navbar breadcrumbed. make the values changing on a ticker that are orange show orange for up and blue for down. make the values changing every configurable amount of time a new component in the core components. edit components to make the green status dot rings flash glow all same color of the central dot. make the badges flash glow too."

## Design reference

`~/Developments/work/ck/programmin/ck-console` (a vanillin fork): `packages/ui/styles/ck.css` is the palette, `packages/ui/console/console.css` the shell, `console/{shell,sidebars,topbar,widgets,live}.jsx` the behaviour. Blue is interactive/active, orange is live/attention, the top bar is navy in both schemes. The reference flashes every live number orange; this task splits that into orange up / blue down per the request.

Decisions taken without the user (asked 2026-08-25, no answer in 60s, recommended defaults applied): third bar is breadcrumb only (pages switch from the secondary rail and the crumbs); `StatusDot ring` always pulses while `Badge` glow is opt-in (`glow` prop); brand stays Acme Cloud, no CloudKey logo.

## Sub-tasks

- [x] 1. **`ui/live-value`** + `lib/use-ticker.js`. `<LiveValue interval sample format>` self-samples on a timer shared per interval (one `setInterval` per distinct interval, started by the first subscriber, stopped by the last); `<LiveValue value>` is controlled. `data-trend="up|down|changed"` colours the text via `--live-value-up` / `--live-value-down` (defaults `--warning` / `--info`, overridable from any ancestor); the tick is a finite animation on the inner text node and the trend clears on `animationend`. Docs page, registry entry, 6 tests.
- [x] 2. **`ui/status-dot`**: `ring` now carries the status token in `color` and breathes a `currentColor` halo on a fixed 2s loop (`status-dot-ring-pulse`), so a green dot glows green. Reduced motion parks it at the old static 20% halo. `pending` + `ring` runs both loops.
- [x] 3. **`ui/badge`**: `glow` prop; each variant sets `--badge-glow` to its own token and `.badge--glow` breathes it (2s loop, reduced motion static, focus ring wins). Conformance `INDETERMINATE_LOOPS` gains `badge` and documents both status-dot loops.
- [x] 4. **Console shell**: `console.css` rewritten around scoped token overrides on `.ck-console` (every kit component inside takes the CloudKey palette without knowing); `.ck-topbar` re-declares the neutral tokens as chrome values and sets `color-scheme: dark`. Primary rail (Overview + categories) and secondary rail (service name + orange code, groups with their pages, quick links) both fold to 56px icon strips; a folded rail leaves the `ResizablePanelGroup`, which is keyed on the fold state so the panel set re-registers. Third bar is `Acme Cloud › Category › Service › Group › Page` with the orange underline on the page crumb and a glowing `Live` badge.
- [x] 5. **Motion**: utilisation rows and the Instances stat drift on the shared 2s ticker through `LiveValue` (orange up, blue down via the console's `--live-value-*` override); sparklines on stat cards; event feed prepends a canned event every 5 ticks with an orange sweep; health rings pulse and the alarm badge glows; resize handles go orange while grabbed; stat cards get the blue-to-orange hover stripe.
- [x] 6. **Data**: `NAV_GROUPS` items gain `code` and `groups: [{ label, pages }]` (+ `quickLinks` on Overview); `findService()` flattens `pages`, `findGroup()` locates a page's group. Overview grows Capacity / Health / Recent events pages so its rail has content.
- [x] 7. **Tests**: `showcase-console` rewritten for the new chrome (17 tests: navy-in-both-schemes, rails, fold/unfold at 56px, breadcrumb trail and crumb navigation, live flash colours, ring/glow in the health card, plus the surviving 88/90 tests); `status-dot` +1, `badge` +1, `live-value` new (6).

## Verify / done

`npm run build` clean; `npm run contracts` fresh; `node tests/conformance.unit.mjs` 19/19; `npm test > out.txt` then `grep ^FAIL out.txt` (see Handoff for the measured count).

## Gotchas

- **A custom property declared on the element defeats the ancestor override.** The first `live-value.css` set `--live-value-up` on `.live-value` itself, so the console's orange never applied and the docs-page test still passed because it probed a sibling span. Read with a fallback (`var(--live-value-up, var(--warning))`) and test the override on the element itself with a forced `data-trend`.
- `--primary-hover` is derived at `:root` from the site's `--primary`; a scoped `--primary` override needs its own `--primary-hover`.
- `light-dark()` resolves at the declaring element, so tokens overridden on `.ck-console` keep their light/dark value inside the navy topbar. The topbar therefore re-declares the neutrals it needs as single chrome values rather than relying on `color-scheme: dark`.
- `TooltipTrigger as={ModeToggle}` would let the tooltip's `data-state` overwrite the lamp's `data-state`; wrap the toggle in the `Tip` span instead (see `notes/tooltip-composition.md`).
- Percent-sized `ResizablePanel`s cannot hold a fixed 56px strip; the folded rail renders outside the group and the group is keyed on the fold state.
- Event-feed injection is 5 ticks (10s) and is not covered by a test; asserting it would add 10s to the suite.

## Handoff

**Status:** COMPLETE, uncommitted  **Branch:** `feat/console-ck-look`  **PR:** none  **Updated:** 2026-08-25

- **Landed:** everything in the sub-tasks above, uncommitted and staged on the branch for the user's commit.
- **Verify:** `npm run build` clean; `npm run contracts` fresh; full `npm test` **803/804**, the one failure being this task's own `live-value: --live-value-up/down recolour from an ancestor`, which read `color` mid-transition (interpolated oklab). Probe fixed to switch the transition off; `node tests/run.mjs live-value` then 6/6. Not re-run as a full suite after that one-test fix. The previously known failures (slider-cursor pair, navigation-menu hover flake) did not appear in this run.
- **Next:** user reviews `#home` and `#console` visually (`npm run dev`), commits, and decides whether the `glow-pulse` backlog item is now redundant (this task covers its badge and status-dot halves; progress-bar glow and speed/brightness controls remain).
