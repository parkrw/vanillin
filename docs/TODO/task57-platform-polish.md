# task57: platform-polish

**Goal:** Two small platform wins — Speculation Rules prefetch for docs
navigation, and `field-sizing: content` on textarea.
**Branch:** feat/platform-polish
**Deps:** none

## Design decisions

### `field-sizing: content`

- Auto-growing textareas are today solved with a scroll-height measurement in
  JS or a mirrored hidden div. `field-sizing: content` does it in CSS.
- **Support-check first** (browser-support gate). Where absent, the textarea
  behaves exactly as it does now — this is pure progressive enhancement and
  needs no JS fallback, because the current behaviour *is* the fallback.
- Opt-in via an `autoResize` prop on `ui/textarea`, not the default: a
  textarea in a fixed-height panel that suddenly grows breaks layouts. Pair it
  with `rows` as the minimum and a `max-height` so it cannot grow unbounded;
  once capped it must scroll, so `overflow: auto` stays.
- Apply the same to `ui/input` where the kit has content-sized inputs
  (the OTP field is fixed-width — leave it alone).
- **Gotcha:** `field-sizing: content` on an empty textarea collapses to
  roughly one character wide unless `rows`/`min-height` hold it open. Check
  the empty and placeholder-only states specifically.

### Speculation Rules

- A `<script type="speculationrules">` prefetching same-origin documentation
  links makes the docs feel instant. This is a **site/docs-shell**
  feature, not a `ui/` feature — components must not inject speculation rules
  into a consumer's page.
- **Prefetch, not prerender.** Prerendering runs the target page's scripts;
  for a docs shell that means booting a second React app per hovered link.
  Prefetch is the honest cost/benefit here. Note the reasoning in the log so
  nobody "upgrades" it later.
- Scope with `eagerness: "moderate"` (on hover/pointerdown) and a URL pattern
  restricted to the docs routes. `eagerness: "eager"` over every link in a
  sidebar of 60 components is a self-inflicted DoS on your own dev server.
- The playground is a hash router, so **verify Speculation Rules do anything
  at all here** before building it: same-document hash navigation is not a
  document navigation and cannot be prefetched. If it turns out to be a no-op
  for our routing, say so in the log and either scope this to the built docs
  output or drop the item — do not ship a `<script>` tag that does nothing.

## Sub-tasks

- [ ] 1. Support checks for `field-sizing` and Speculation Rules; determine
  whether the hash router makes prefetch a no-op. Record both in the log —
  the second finding may cancel sub-task 3.
- [ ] 2. `autoResize` on `ui/textarea` with `rows` minimum and `max-height`
  cap; empty/placeholder states verified. Files: `ui/textarea/textarea.jsx`,
  `ui/textarea/textarea.css`, `site/pages/textarea.jsx`.
- [ ] 3. Speculation Rules for docs links, `eagerness: "moderate"`, pattern-
  scoped — **only if sub-task 1 shows it applies.** Files:
  `site/index.html` or the docs shell entry.
- [ ] 4. Test: `autoResize` textarea grows with content and stops at the cap,
  then scrolls; without the prop, height is unchanged; empty state keeps its
  `rows` height. Where `field-sizing` is unsupported, assert the unchanged
  behaviour rather than skipping. Files: `tests/textarea.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#textarea`: paste a long block, delete it, confirm it shrinks
  back and the caret stays visible throughout.
- If sub-task 3 shipped, confirm in DevTools that prefetches actually fire on
  hover and are scoped to docs routes only.
