# task70: typography-system
**Goal:** Replace per-page font sizes with a rhythm-variable-driven typeset system, generated from config, applied to the docs site.  **Branch:** `feat/typography-system`  **Deps:** 69
**Owns:** `styles/typeset.css`, `styles/globals.css`, `styles/defaults.css`, `scripts/build-theme.mjs`, `scripts/config-schema.mjs`, `scripts/gen-schema.mjs`, `van.defaults.json`, `van.config.json`, `van.schema.json`, `ui/typography/**`, `site/site.css`, `site/pages/*.jsx`, `site/main.jsx`, `site/registry.js`, `tests/typography*`, `package.json`

## Architecture

Three rhythm variables drive every size and spacing decision in prose:

| Token | Type | Default | Controls |
|---|---|---|---|
| `--typeset-size` | `<length>` | `1rem` | base font-size on `.typeset` |
| `--typeset-leading` | `<number>` | `1.75` | line-height for body text |
| `--typeset-flow` | `<length>` | `1.5rem` | vertical block spacing (margins) |

Three font tokens inherit from the theme but are overridable per-scope:

| Token | Default |
|---|---|
| `--typeset-font-body` | `var(--font-sans)` |
| `--typeset-font-heading` | `var(--font-sans)` |
| `--typeset-font-mono` | `var(--font-mono)` |

**Token values** are generated into `defaults.css` (kit) / `van.css` (consumer) by the existing pipeline — same as every other token. **`@property` registrations** for `--typeset-size` (length), `--typeset-leading` (number), `--typeset-flow` (length) go in `globals.css` alongside the existing block.

**`styles/typeset.css`** is hand-written structural CSS (like `globals.css`), not generated. It defines `.typeset` prose container rules using the tokens. Imported in `site/main.jsx` between `globals.css` and `site.css`.

**Presets** are classes layered on the base: `.typeset-docs` (roomier for documentation), `.typeset-chat` (compact for messaging). They override the three rhythm vars. Consumer presets come from `theme.typeset.presets` in `van.config.json` and are generated into `van.css`.

**Opt-out**: `:where(.not-typeset, [data-not-typeset])` resets to `revert-layer` / `unset`.

**Relationship to `ui/typography/`**: the existing `.typography` component gets retrofitted to derive its sizes from the typeset vars. It keeps its class name and semantic helpers (`.lead`, `.large`, `.small`, `.muted`) — the typeset is the rhythm system, the typography component is one consumer of it.

## Sub-tasks

- [ ] 1. **Typeset tokens — config schema + generator + defaults**
  - Add `theme.typeset` validation to `scripts/config-schema.mjs`: `{ size?: string, leading?: number, flow?: string, font?: { body?, heading?, mono? }, presets?: Record<string, { size?, leading?, flow? }> }`
  - Add generation block to `scripts/build-theme.mjs` — emit `--typeset-*` tokens into the `:root` block
  - Add `typeset` block to `van.defaults.json` with defaults; add to `van.config.json` with docs/chat presets
  - Add `@property` registrations for `--typeset-size`, `--typeset-leading`, `--typeset-flow` to `styles/globals.css`
  - Regenerate `van.schema.json` via `npm run schema`
  - test: `npm run theme:defaults` succeeds and `defaults.css` contains `--typeset-size`; schema validates a `theme.typeset` block
  - files: `scripts/config-schema.mjs`, `scripts/build-theme.mjs`, `scripts/gen-schema.mjs`, `van.defaults.json`, `van.config.json`, `styles/globals.css`, `styles/defaults.css`, `van.schema.json`

- [ ] 2. **Write `styles/typeset.css`** — the prose container
  - `.typeset` sets `font-size: var(--typeset-size)`, `line-height: var(--typeset-leading)`, `font-family: var(--typeset-font-body)`
  - Heading scale: h1 = `calc(var(--typeset-size) * 2.25)`, h2 × 1.875, h3 × 1.5, h4 × 1.25 — font-family `var(--typeset-font-heading)`, letter-spacing `-0.025em`
  - Block spacing: h2/h3/h4 `margin-top` as multiples of `--typeset-flow`, p/blockquote/table/lists/hr get `var(--typeset-flow)` uniform
  - Code: `font-family: var(--typeset-font-mono)`, inline styling (background, padding, radius)
  - Blockquote, table, lists — same structure as current `ui/typography/typography.css` but var-driven
  - `.typeset-docs` preset: `--typeset-size: 1rem; --typeset-leading: 1.8; --typeset-flow: 1.75rem`
  - `.typeset-chat` preset: `--typeset-size: 0.875rem; --typeset-leading: 1.5; --typeset-flow: 0.75rem`
  - `.not-typeset` / `[data-not-typeset]` opt-out: resets font-size, line-height, margin to `revert`
  - test: `.typeset h1` computed font-size equals `--typeset-size * 2.25`; `.typeset-chat` produces smaller sizes
  - files: `styles/typeset.css` (new), `site/main.jsx` (import)

- [ ] 3. **Retrofit `ui/typography/typography.css`** — derive from typeset vars
  - Replace hard-coded `font-size` on h1–h4 with `calc(var(--typeset-size) * N)` matching current ratios
  - Replace `line-height` with values derived from `--typeset-leading`
  - Replace `margin-top` with multiples of `--typeset-flow`
  - Keep `.lead`, `.large`, `.small`, `.muted` semantic helpers, also var-driven
  - test: `.typography h1` computed font-size matches `.typeset h1`
  - files: `ui/typography/typography.css`

- [ ] 4. **Apply typeset to the docs site** — remove per-page sizes
  - Apply `.typeset.typeset-docs` to prose sections in `site/site.css` (on `.pg-section > p` or a prose wrapper)
  - Remove inline `fontSize` styles from descriptive paragraphs across site pages (~15 files)
  - Keep demo-specific sizing (component demo text, not prose descriptions)
  - Adjust `site/site.css` heading styles (`.pg-section > h3`) to defer to typeset where possible
  - test: no inline `fontSize: "0.875rem"` on descriptive paragraphs; visual QA confirms consistent typography
  - files: `site/site.css`, `site/pages/*.jsx`

- [ ] 5. **Docs page + tests**
  - Update `site/pages/typography.jsx` to showcase the typeset system: all element types, both presets, opt-out demo, rhythm variable override demo
  - Update `site/registry.js` if the page entry needs changes
  - Write `tests/typography.test.mjs`: computed font-size/line-height/margin under `.typeset`, preset overrides, `.not-typeset` opt-out, var override propagation
  - test: `node tests/run.mjs typography` green
  - files: `site/pages/typography.jsx`, `site/registry.js`, `tests/typography.test.mjs`

## Verify / done
```
npm run theme:defaults   # regenerates defaults.css with typeset tokens
npm run theme            # regenerates van.css with typeset overrides
npm run schema           # schema includes theme.typeset
npm run contracts        # manifests up to date
npm run build            # clean
npm test                 # suite green, typography tests pass
```
Observable: docs page headings/paragraphs use rhythm-derived sizes, presets visually distinct, no inline `fontSize` on prose paragraphs, config changes propagate to computed values.

## Handoff

**Status:** DONE — all sub-tasks complete, suite 744/746 (2 pre-existing slider cursor failures).

**What landed:**
- `--typeset-size`, `--typeset-leading`, `--typeset-flow` + three font tokens in `defaults.css` via generator; `@property` registered in `globals.css`
- `theme.typeset` config block validated by `config-schema.mjs`, generated by `build-theme.mjs`, covered by `van.schema.json`
- `styles/typeset.css` — hand-written `.typeset` prose container with h1–h4, p, blockquote, table, lists, code, pre, hr + `.typeset-docs`/`.typeset-chat` presets + `.not-typeset`/`[data-not-typeset]` opt-out
- `ui/typography/typography.css` retrofitted — all sizes derive from typeset vars
- Inline `fontSize` + `color: var(--muted-foreground)` replaced with `.pg-desc`/`.pg-detail` classes across ~18 site pages
- Typography docs page rewritten to showcase typeset, presets, custom rhythm, opt-out, and `.typography` component
- 11 new browser tests, all passing

**Not in scope:**
- Sidebar demo labels, collapsible demo chrome, context-menu demo area keep their specific inline sizes (demo styling, not prose)
- `van.css` is still not imported by the docs site (deliberate — see `site/main.jsx` comment); preset defaults are baked into `typeset.css`
