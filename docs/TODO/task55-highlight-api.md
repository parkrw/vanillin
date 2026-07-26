# task55: highlight-api

**Goal:** Highlight search matches with the CSS Custom Highlight API — no
`<mark>` injection, no DOM mutation.
**Branch:** feat/highlight-api
**Deps:** none

## Why

Every "highlight the matching text" implementation splits text nodes and
injects `<mark>` elements. That breaks React's reconciliation, breaks text
selection across the boundary, and re-renders the world on every keystroke.
The Custom Highlight API paints ranges without touching the DOM — the right
tool, and one shadcn cannot use because it needs the imperative layer.

## Design decisions

- **Step 0 is a live support check** (browser-support gate). Probe
  `CSS.highlights` and `::highlight()` styling together — registration
  succeeding tells you nothing about whether the paint works.
- **`lib/use-highlight.js` — one hook, three consumers.**
  `useHighlight(containerRef, query, { name })` walks the container's text
  nodes, builds `Range`s for each match, and registers a `Highlight` under
  `name`. Consumers: `ui/data-table` (global filter matches),
  `ui/command` (palette matches), and a future log viewer.
- **Text-node walking is the whole implementation and it has sharp edges:**
  - use `createTreeWalker` with `NodeFilter.SHOW_TEXT`, skipping
    `<script>`/`<style>` and anything `aria-hidden`
  - a match may span text nodes when a word is split by inline markup — build
    a flattened string with an offset map rather than matching per node, or
    accept per-node matching and **document** it. Per-node is fine for our
    consumers; say so rather than leaving it as an accident.
  - matching is case-insensitive; escape the query before any regex use, or a
    user typing `(` throws
  - cap the number of ranges (a few thousand) — an empty-ish query over a big
    table can generate a range per character
- **Highlight registry names must be namespaced and cleaned up.**
  `CSS.highlights` is a global map: two tables both registering `"search"`
  clobber each other. Mint a per-instance name (`search-${useId()}`) and
  `CSS.highlights.delete(name)` on unmount — a leaked highlight paints over
  a component that no longer exists.
- **Ranges are invalidated by DOM changes.** Re-run on query change *and* on
  the container's content changing; a `MutationObserver` is the honest
  mechanism, but it must be debounced and must not observe its own work (the
  API mutates nothing, so this is safe — verify it stays that way).
- **Styling via `::highlight(name)`** with tokens only. Note the constraint:
  `::highlight()` supports a small property set (colour, background-color,
  text-decoration, text-shadow) — no padding, no border-radius. Design within
  it rather than fighting it.
- **Fallback is no highlighting, not `<mark>` injection.** Where the API is
  absent the feature is simply off; the filter still filters. Building a
  second DOM-mutating path doubles the surface for a cosmetic feature.

## Sub-tasks

- [ ] 1. Support check; record findings in the log.
- [ ] 2. `lib/use-highlight.js` — tree walk, escaped matching, range cap,
  namespaced registration, unmount cleanup, debounced re-run. Files:
  `lib/use-highlight.js`.
- [ ] 3. `::highlight()` styles from tokens, both themes. Files:
  `styles/globals.css` (one small block at the end).
- [ ] 4. Wire `ui/data-table` global filter and `ui/command` matches. Files:
  `ui/data-table/data-table.jsx`, `ui/command/command.jsx`.
- [ ] 5. Demo sections. Files: `playground/pages/data-table.jsx`,
  `playground/pages/command.jsx`.
- [ ] 6. Test: matches register the expected number of ranges;
  regex-metacharacter queries do not throw; two mounted instances do not
  clobber each other's highlight names; unmount removes the registration;
  the range cap holds; with `CSS.highlights` stubbed away everything still
  filters correctly. Files: `tests/highlight.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Type into the data-table global filter fast — no jank, no leaked entries in
  `CSS.highlights` (assert its size after unmount).
- Confirm text selection still works across a highlighted match, and that
  copying selected text yields the original text with no markup.
