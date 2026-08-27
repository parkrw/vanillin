# task92: glow-pulse
**Goal:** Finish the console "live" glow — a glow on `ui/progress`, one speed/brightness vocabulary shared by badge, status-dot and progress, and a visible indeterminate state for progress.  **Branch:** `feat/glow-pulse`  **Deps:** none (91 merged)
**Owns:** `ui/progress/**`, `ui/badge/**`, `ui/status-dot/**` (incl. their `.van.json`), `site/pages/{progress,badge,status-dot}.jsx`, `tests/{progress,badge,status-dot}.test.mjs`, `tests/conformance.unit.mjs` (`INDETERMINATE_LOOPS` entries only)

## Read this first

Task 91 shipped the badge and status-dot halves: `badge--glow` (`ui/badge/badge.css:22-56`) and `status-dot--ring` (`ui/status-dot/status-dot.css`, ring block) breathe on a **fixed 2s literal** with symmetric 0/50/100 keyframes and a halo in the component's own colour (`--badge-glow` per variant; `currentColor` on the dot). Copy that shape; do not invent a third. What is left:

- `ui/progress` has no glow.
- Nothing lets a consumer make a glow faster, slower, brighter or dimmer without rewriting keyframes.
- **The indeterminate progress bar paints nothing** (found 2026-08-27, folded in by the user). `progress.css` has no `[data-state="indeterminate"]` rule, and `progress.jsx:8` sets `percent = 0`, so the indicator sits at `translateX(-100%)`, off the track. `site/pages/progress.jsx:65-79` documents indeterminate as a feature over an empty demo. Confirm in the browser first (`npm run dev`, `#progress`), then fix.

Rules that bind here:

- `styles/globals.css` belongs to **task 84 in this same batch**. Do not touch it — no new `@property`, no new global tokens. The speed and brightness controls are custom properties read with `var(--x, fallback)` inside the three components' own CSS.
- Indeterminate loops take a **fixed literal duration**, never `var(--motion-*)`: `tests/conformance.unit.mjs` "motion: indeterminate loops do NOT use motion tokens". `progress` is not in its `INDETERMINATE_LOOPS` map yet, and any infinite animation in a slug outside that map fails conformance — add `progress` there with the selector, the literal and a reason. A `var(--glow-duration, 2s)` in the shorthand passes: the rule only rejects `var(--motion`.
- Reduced-motion guard on every new keyframe use (`@media (prefers-reduced-motion: reduce) { … animation: none }`), leaving a static halo or a static bar.
- Tokens only, `color-mix(in oklab, …)` for alpha, no hex. Modifier naming `progress--glow`; the indeterminate rules target `[data-state="indeterminate"]`, no extra class.
- Run `npm run contracts` after any `ui/` edit; the three `.van.json` hashes change and CI diffs them.

## Design (settled; deviate only by stopping and reporting)

Two custom properties, read by all three components, with **no block-level defaults**, so one ancestor can set them for a whole panel:

| Property | Type | Fallback | Effect |
|---|---|---|---|
| `--glow-duration` | `<time>` | `2s` | one breath; the `animation-duration` of every glow/ring keyframe |
| `--glow-strength` | number 0–1 | `1` | multiplies every halo alpha percentage: `color-mix(in oklab, var(--badge-glow) calc(18% * var(--glow-strength, 1)), transparent)` |

`--badge-glow` stays the badge's colour hook. Existing tests assert `badge-glow@2s` and `status-dot-ring-pulse@2s`; they keep passing because the fallback is `2s`. Status-dot's `pending` runs the same loops and takes the same properties.

Progress: a `glow` prop (boolean, default `false`) adds `progress--glow` to the root; the halo sits on `.progress-indicator` in `var(--progress-glow, var(--primary))`, so a themed indicator can recolour it. Indeterminate: a `progress-indeterminate` keyframe sweeps a 40%-wide indicator across the track on a fixed literal (1.5s), `translateX` only — animating `width` relayouts. The `style` attribute the component writes today (`translateX(-100%)`) wins over a stylesheet rule, so make `progress.jsx` stop writing the inline transform when indeterminate. Reduced motion: a static indicator, 40% wide at 30% offset — visible, not moving.

## Sub-tasks

- [x] 1. **Indeterminate paints.** `[data-state="indeterminate"] .progress-indicator` gets a width and the sweep; `progress.jsx` drops the inline transform for indeterminate; reduced motion shows a static partial bar. `progress` joins `INDETERMINATE_LOOPS`. — test: on `#progress` both indeterminate demos' indicators have `getBoundingClientRect().width > 0` and `animationName === "progress-indeterminate"` with a fixed `animationDuration`; under `page.emulateMedia({ reducedMotion: "reduce" })` `animationName === "none"` and the width is still `> 0`. Counter-precondition: the determinate demos have `animationName === "none"`. files: `ui/progress/progress.css`, `ui/progress/progress.jsx`, `tests/progress.test.mjs`, `tests/conformance.unit.mjs`
- [x] 2. **Progress glow.** `glow` → `progress--glow`; halo keyframes on the indicator; `--progress-glow` colour hook; reduced-motion static halo. — test: on `[data-pg="progress-glow"]` the indicator's `animationName` is the glow keyframe at `2s` and `boxShadow !== "none"`; a non-glow bar has `boxShadow === "none"`. files: `ui/progress/progress.jsx`, `ui/progress/progress.css`, `site/pages/progress.jsx`, `tests/progress.test.mjs`
- [ ] 3. **Speed and brightness on all three.** `--glow-duration` and `--glow-strength` wired into badge glow, status-dot ring **and** pending, and progress glow. — test: each page gets a `data-pg="<slug>-glow-controls"` row whose **wrapper** sets `style={{ "--glow-duration": "4s", "--glow-strength": 0.5 }}` (proves inheritance); assert `animationDuration === "4s"` on the children, and that the halo alpha at rest is lower than the default row's — read through a probe element the way `tests/live-value.test.mjs` does (`docs/QUIRKS.md`: never parse oklch by hand). Default rows keep asserting `2s`. files: three `.css`, three pages, three tests
- [ ] 4. **Docs.** Each page gains a "Glow speed and brightness" example and lists both properties in its reference; the progress page's Indeterminate prose describes what it now shows; badge `glow` and status-dot `ring` prose point at the shared properties. Every page keeps exactly one `h2`. files: the three pages
- [ ] 5. **Manifests.** `npm run contracts`; commit the regenerated `.van.json` files with the component change.

## Verify / done

```sh
npm run contracts && git diff --exit-code
VANILLIN_TEST_PORT=5202 node tests/run.mjs progress badge status-dot conformance
VANILLIN_TEST_PORT=5202 node tests/run.mjs > out.txt 2>&1; grep -c '^PASS' out.txt; grep '^FAIL' out.txt
npm run build
```

Baseline: **811/811** on 2026-08-27 (`07961519da8d`, idle machine, exit 0). Your run should be 811 + your new tests. Name any `FAIL` line in the report — a bare count cannot be reviewed.

Done when: indeterminate visibly sweeps and holds still under reduced motion, `<Progress glow>` breathes like `badge--glow`, an ancestor's `--glow-duration`/`--glow-strength` changes all three components, all three pages document it, manifests are fresh, and the suite is green with the new tests named in the report.

## Out of scope

`styles/globals.css` (task 84's). `site/showcase/**` and `site/site.css` (shared; the head wires console usages after merge). `ui/skeleton`'s pulse (a placeholder, not "live") and `ui/live-value`'s flash (`--motion-*`-driven, finite).

## Handoff

**Status:** NOT STARTED
