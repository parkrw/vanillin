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

- [x] 1. **Fix the stacking.** Preferred: give the viewport wrapper a `z-index` above sibling nav content. Consider whether viewport mode should join the Popover API path like every other overlay — that removes the class of bug rather than the instance, but it interacts with the morphing size transition (`--viewport-width`/`--viewport-height` are JS-driven) and with the sliding Indicator, so **measure before committing to it**. A `z-index` that fixes the instance is an acceptable answer; a top-layer rewrite that breaks the morph is not.
- [x] 2. **Regression test.** Two navigation menus on one fixture, open the first, assert the panel is the topmost hit at a point over the second menu's trigger row. `tests/navigation-menu.test.mjs` — the existing hover flake lives here too, so keep the new test independent of it.
- [x] 3. **Close the three unmeasured overlays.** `context-menu` and `command` report `no-trigger` (the probe's selectors miss their demos) and `tooltip` is `unmeasurable`. Fix the two selectors; tooltip needs a different technique (see below) or an explicit exemption in the case list.
- [x] 4. **Re-run and record.** `node scripts/probe-stacking.mjs` should end at 0 covered with at most tooltip unmeasured.

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

After the fix — all ten measured, nothing covered:

```
10 overlays: 0 covered, 0 not measured.
```

`unmeasurable` is gone as a status. Tooltip is measured by lending its panel
`pointer-events: auto` for the length of the hit test and restoring it in a
`finally` — no event is dispatched and the pointer never moves, so the tooltip's
own hover bookkeeping never sees it. It reports `ok-forced` rather than `ok`
because one blind spot survives: an intruder that is *itself*
`pointer-events: none` still paints over the panel and is still invisible here.
Only the panel is lent the pointer, never the page.

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

**Status:** COMPLETE  **Branch:** `fix/overlay-stacking` (2 commits, unmerged)  **PR:** none — remote writes off  **Updated:** 2026-08-13

- **Landed:** a navigation menu's open viewport panel now paints over every later sibling on the page — the docs page's three menus no longer draw through each other. The probe measures all ten overlays instead of seven, and reports `0 covered, 0 not measured`.
- **Repo state:** clean. `ui/navigation-menu/.van.json` regenerated (`node scripts/manifest.mjs --write` reported `navigation-menu: updated (files)` and touched nothing else).
- **Verified:** suite `759/762` — the only failures are the two slider-cursor tests and the known `navigation-menu: hover opens after delay` flake, which **passed 23/23 in a focused re-run of this file**. Build clean. `node scripts/probe-stacking.mjs` → 0 covered.
- **Next:** task 81 + 82 (batch 4). Nothing is owed here.
- **Gotchas:**
  - **The top-layer rewrite was measured and rejected, not skipped.** Viewport mode's panel is sized by JS (`--viewport-width`/`-height`) inside an `absolute` wrapper anchored to the nav by `inset-block-start: 100%` + `justify-content: center`. Moving it to the Popover API means `position: fixed`, so that anchoring becomes a JS recompute on every scroll and resize via `lib/anchor-position`. That is a positioning rewrite to close a bug class the *other nine* overlays already closed by being on the top layer. One declaration closes the instance.
  - **The indicator's `z-index` moved 1 → 51 as a direct consequence.** Measured before touching it: the arrow overlaps the panel's top edge by exactly **2px** and currently paints above it. Both live in the same stacking context, so raising the wrapper to 50 would have flipped that silently. 51 keeps the arrow tip merging into the panel border.
  - **The probe now addresses two triggers by `data-pg`** (`context-trigger`, `cmd-dialog-trigger`) because `ContextMenuTrigger` renders no class of its own. Those hooks live in `site/pages/**`, which task 82 owns — if 82 renames one, the probe reports `no-trigger`, which is loud rather than a silent pass.
  - **The regression test guards its own premise.** It asserts the open panel actually overlaps the later menu's trigger row before asserting what is on top, so a future page edit that separates the two fails the test instead of quietly making it measure nothing.
