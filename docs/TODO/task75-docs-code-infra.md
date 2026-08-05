# task75: docs-code-infra
**Goal:** Build reusable page building blocks for shadcn-style component documentation — preview cards, code blocks, install snippets, API reference tables.  **Branch:** `docs/code-infra`  **Deps:** 30
**Owns:** `site/code-example.jsx`, `site/code-example.css`, `site/api-reference.jsx`, `site/api-reference.css`, `site/install-snippet.jsx`, `site/install-snippet.css`

## Sub-tasks

- [ ] 1. **`<CodeBlock>`** — monospace pre/code with a copy-to-clipboard button. No syntax highlighting library (zero deps) — use CSS classes for basic keyword colouring if feasible, otherwise plain monospace is fine. Supports a `language` prop for future use. Dark/light theme-aware via `--code-*` tokens in `site/site.css`.
  - files: `site/code-example.jsx`, `site/code-example.css`

- [ ] 2. **`<ComponentPreview>`** — card with two tabs: "Preview" (rendered demo) and "Code" (source in `<CodeBlock>`). Preview renders children; source comes from a `code` string prop. Defaults to preview open. The card uses `ui/card` or a styled `<div>` with the site's border token.
  - files: `site/code-example.jsx`, `site/code-example.css`

- [ ] 3. **`<InstallSnippet>`** — given a `slug`, renders `npx github:parkrw/vanillin add <slug>` in a `<CodeBlock>` with a "CLI" label. If the component has `requires` deps in the registry, show them as a note. Compact — one line.
  - files: `site/install-snippet.jsx`, `site/install-snippet.css`

- [ ] 4. **`<ApiReference>`** — renders a props table from a declarative array: `[{ name, type, default, description }]`. Styled with `ui/table` conventions. Supports a `title` prop (defaults to "API Reference"). Each row shows prop name in `<code>`, type in `<code>`, default value, and description.
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

**Status:** NOT STARTED
