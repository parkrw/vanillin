# task74: mobile-views
**Goal:** Make the docs site work on a phone, built out of the kit's own overlay components — sheet and drawer — rather than bespoke site CSS.  **Branch:** `feat/mobile-views`  **Deps:** 81 (shares the shell files)
**Owns:** `site/app.jsx`, `site/site.css`, `site/toc.jsx`, `site/pages/home.jsx`

## Scope call — answered 2026-08-07

The open question was whether the docs site is meant to work on a phone at all. **It is**, and with a constraint that changes the shape of the work: the mobile views use **sheet, drawer and the other overlay components from the kit**, not one-off media queries. The site is the kit's own showcase, so its mobile navigation is a live demonstration that these components handle a real app's chrome.

That reframes ISSUES K1. The old finding — 73 of 79 pages force a horizontal scroll at 380px — is a symptom of there being **no mobile layout at all**, not 73 separate page bugs. Confirmed while scoping: `site/app.jsx` contains no `Sheet`, no `Drawer`, no `matchMedia`, no mobile branch of any kind. The shell renders its three-column desktop grid at every width and lets the viewport clip it.

`ui/sidebar` already ships a mobile mode backed by `ui/sheet` (task 27) — start there rather than inventing a pattern.

## Sub-tasks

- [ ] 1. **Left sidebar → sheet on narrow viewports.** The nav becomes a sheet behind a trigger in the topnav. `ui/sidebar`'s own mobile path is the reference; reuse it if it fits, and if it does not, record why in the handoff — that is a finding about the component, not just about the site.
- [ ] 2. **TOC rail → drawer or sheet.** The right rail (task 79) is hidden outright below `72rem` (`site/site.css:460-464`), so on a phone there is no way to reach a page's table of contents at all. Give it a bottom drawer or a second sheet.
- [ ] 3. **Topnav at narrow widths.** It carries nav dropdowns, the ⌘K palette trigger and the theme toggle. Decide what stays visible and what collapses into the sheet; the palette must stay reachable.
- [ ] 4. **Re-measure K1.** Re-run `node scripts/sweep-pages.mjs` and see how many of the 79 pages still overflow at 380px once the shell has a mobile layout. Expect the count to collapse. Whatever remains is genuine per-page demo overflow — list it, and hand it to task 82 rather than fixing page content here.
- [ ] 5. **Home page at phone width** (`site/pages/home.jsx`) — the two-column hero and showcase need a stacked form. Owned here because it is layout, not the content work 82 does.
- [ ] 6. **Touch targets and safe areas.** 44px minimum hit targets on the new triggers, and `env(safe-area-inset-*)` on anything anchored to a screen edge — a bottom drawer on iOS sits under the home indicator otherwise.

## Verify / done

```sh
node tests/run.mjs              # full suite — baseline 758/761
npm run build
node scripts/sweep-pages.mjs    # 380px overflow count, before and after
```

Report the 380px overflow count before and after as the headline number. Baseline noise floor: 2 slider-cursor failures + an intermittent `navigation-menu` hover flake.

Done when: the sidebar and TOC are reachable on a 380px viewport through kit overlay components, the palette still opens, no page forces a horizontal document scroll from the *shell*, and the remaining per-page overflows are listed for 82.

## Out of scope

`site/pages/**` except `home.jsx` — per-page demo overflow belongs to task 82. `ui/**` — if a kit component cannot do what the mobile shell needs, that is a finding to record, not a component to patch here. **Deps on 81:** this task and 81 both own `site/app.jsx` and `site/site.css`, so they cannot run concurrently. 81 lands the desktop geometry first; this task builds the mobile branch on top of it.

## Handoff

**Status:** NOT STARTED
