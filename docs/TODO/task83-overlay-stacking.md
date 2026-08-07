# task83: overlay-stacking
**Goal:** Fix `ui/navigation-menu`'s viewport panel being painted over by later siblings, and land the probe that found it so the whole defect class stays measured.  **Branch:** `fix/overlay-stacking`  **Deps:** none
**Owns:** `ui/navigation-menu/**`, `scripts/probe-stacking.mjs`, `tests/navigation-menu.test.mjs`

## The bug

Reported as "navigation menu is very see thru on the first example". It is not opacity — the panel is fully opaque `--popover`. It is **stacking**: on `site/pages/navigation-menu.jsx`, the *second* example's trigger row paints straight through the *first* example's open panel.

`ui/navigation-menu/navigation-menu.css:129-139`:

```css
.navigation-menu-viewport-wrapper {
  position: absolute;
  inset-block-start: 100%;
  /* no z-index */
}
```

An absolutely-positioned element with `z-index: auto` paints in DOM order, so **any later sibling wins**. Two navigation menus on one page is all it takes, and the docs page has three.

Viewport mode is the outlier in the kit. Measured across every overlay:

| overlay | position | on top? |
| --- | --- | --- |
| dropdown-menu, popover, select, combobox, menubar, hover-card | `fixed` — Popover API top layer | yes |
| **navigation-menu viewport** | `relative` inside an `absolute` wrapper | **no — 7/49 sample points covered** |

Popover *mode* already uses the Popover API (`navigation-menu.css:82` resets "UA popover defaults"). Viewport mode never did. That asymmetry is the whole bug.

## Sub-tasks

- [ ] 1. **Fix the stacking.** Preferred: give the viewport wrapper a `z-index` above sibling nav content. Consider whether viewport mode should join the Popover API path like every other overlay — that removes the class of bug rather than the instance, but it interacts with the morphing size transition (`--viewport-width`/`--viewport-height` are JS-driven) and with the sliding Indicator, so **measure before committing to it**. A `z-index` that fixes the instance is an acceptable answer; a top-layer rewrite that breaks the morph is not.
- [ ] 2. **Regression test.** Two navigation menus on one fixture, open the first, assert the panel is the topmost hit at a point over the second menu's trigger row. `tests/navigation-menu.test.mjs` — the existing hover flake lives here too, so keep the new test independent of it.
- [ ] 3. **Close the three unmeasured overlays.** `context-menu` and `command` report `no-trigger` (the probe's selectors miss their demos) and `tooltip` is `unmeasurable`. Fix the two selectors; tooltip needs a different technique (see below) or an explicit exemption in the case list.
- [ ] 4. **Re-run and record.** `node scripts/probe-stacking.mjs` should end at 0 covered with at most tooltip unmeasured.

## The probe

`scripts/probe-stacking.mjs` is committed as part of this task and already runs. Opens each overlay, then `elementFromPoint`s a 7x7 grid across the panel; anything that is not the panel or its descendant is an intruder.

Two things it learned the hard way, both encoded in the file:

- **The grid is the point.** A three-point sample (centre + two corners) reports navigation-menu as **clean** — the intruding element is a single row of triggers across the panel's middle, and three points straddle it. Do not "simplify" this back to corner sampling.
- **`elementFromPoint` is hit-testing, not painting.** Anything with `pointer-events: none` can never win it, so `ui/tooltip` (`tooltip.css:18`, correctly) reported 49/49 covered on the first run. That is a false positive, now reported as `unmeasurable` rather than a defect. A real paint-order check for those needs pixel diffing or `getAnimations`-style inspection, which is why sub-task 3 may just exempt tooltip.

Baseline as committed:

```
navigation-menu    COVERED      7/49 points  z=auto pos=relative
dropdown-menu      ok           popover      tooltip      unmeasurable
context-menu       no-trigger   command      no-trigger
select combobox menubar hover-card  ok
```

## Verify / done

```sh
node scripts/probe-stacking.mjs   # 0 covered
node tests/run.mjs                # full suite — baseline 758/761
npm run build
```

Baseline noise floor: 2 slider-cursor failures + an intermittent `navigation-menu` hover flake — **this task touches that component, so re-run the nav-menu file alone before blaming the flake.**

Done when: no measurable overlay is painted over, the regression test fails without the fix, and the probe's unmeasured count is 1 (tooltip) or 0.

## Out of scope

Docs-page content and layout — tasks 81/82 own `site/site.css` and `site/pages/**`. If the fix makes the nav-menu page's examples collide differently, report it to 82 rather than editing the page. Folding this probe into `scripts/sweep-pages.mjs` is deliberately **not** here: sweep walks 79 pages and this walks 10 components, so they stay separate tools until there is a reason.

## Handoff

**Status:** NOT STARTED — probe committed and measuring, fix not written.
