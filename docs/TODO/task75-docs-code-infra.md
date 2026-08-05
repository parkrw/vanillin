# task75: docs-code-infra
**Goal:** Build reusable page building blocks for shadcn-style component documentation — preview cards, code blocks, install snippets, API reference tables.  **Branch:** `docs/code-infra`  **Deps:** 30
**Owns:** `site/code-example.jsx`, `site/code-example.css`, `site/api-reference.jsx`, `site/api-reference.css`, `site/install-snippet.jsx`, `site/install-snippet.css`

## Sub-tasks

- [x] 1. **`<CodeBlock>`** — monospace pre/code with a copy-to-clipboard button. No syntax highlighting (zero deps). `language` prop for future use (stored as `data-language`). Themed via site tokens (`--muted`, `--border`, `--foreground`). Copy button fades in on hover.
  - files: `site/code-example.jsx`, `site/code-example.css`

- [x] 2. **`<ComponentPreview>`** — bordered card with `ui/tabs` toggle: "Preview" (renders children centered) and "Code" (source in `<CodeBlock>`). Toolbar styled compactly over the content area.
  - files: `site/code-example.jsx`, `site/code-example.css`

- [x] 3. **`<InstallSnippet>`** — given a `slug`, renders `npx github:parkrw/vanillin add <slug>` in a compact `<CodeBlock>`. Auto-derives `requires` from `registry.json` and shows linked deps below.
  - files: `site/install-snippet.jsx`, `site/install-snippet.css`

- [x] 4. **`<ApiReference>`** — renders a props table from `[{ name, type, default, description }]` using `ui/table`. `title` prop defaults to "API Reference". Heading styled to match `.pg-section > h3`.
  - files: `site/api-reference.jsx`, `site/api-reference.css`

- [ ] 5. **Docs page layout convention** — document the per-component page structure as a pattern (not a wrapper component): description → install → basic usage → examples → API reference. Write a brief comment in the first component that uses it (task 76) so the pattern is discoverable.
  - files: none (convention, verified by task 76)

## Verify / done

```sh
npm run dev          # import and render each component on a scratch page
npm run build        # build clean — no external deps introduced
```

Observable:
- `<CodeBlock>` renders monospace with copy button, themed light/dark
- `<ComponentPreview>` toggles between rendered demo and source
- `<InstallSnippet slug="button">` shows the CLI command
- `<ApiReference>` renders a clean props table
- No new runtime dependencies

## Handoff

**Status:** IN PROGRESS — sub-tasks 1–4 done, sub-task 5 is convention only (task 76 applies it)
**Branch:** `docs/code-infra`  **PR:** none  **Updated:** 2026-08-05

- **Landed:** `CodeBlock` (monospace + hover-reveal copy), `ComponentPreview` (tabs-based preview/code card using `ui/tabs`), `InstallSnippet` (auto-derives requires from `registry.json`), `ApiReference` (props table using `ui/table`). Build clean.
- **Page layout convention for task 76:** description → install snippet → basic usage (ComponentPreview) → variant/example sections (more ComponentPreviews) → API reference table. Not a wrapper — each page composes the building blocks in this order.
- **Usage from a component page:**
  ```jsx
  import { ComponentPreview, CodeBlock } from "../code-example.jsx"
  import { InstallSnippet } from "../install-snippet.jsx"
  import { ApiReference } from "../api-reference.jsx"
  import "../code-example.css"
  import "../install-snippet.css"
  import "../api-reference.css"
  ```
