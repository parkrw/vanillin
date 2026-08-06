# task77a: docs-pages-forms
**Goal:** Apply the task-76 docs template to the 14 form-family component pages.  **Branch:** `docs/pages-rest-a`  **Deps:** 76
**Owns:** `site/pages/{combobox,date-input,date-picker,field,form-fields,input-group,input-otp,label,native-select,radio-group,slider,textarea,time-picker,use-form}.jsx`

## Pages (14)

combobox, date-input, date-picker, field, form-fields, input-group, input-otp, label, native-select, radio-group, slider, textarea, time-picker, use-form

## Per-page structure

Read `site/pages/button.jsx` (task 76) as the reference pattern before starting:
1. Title + description (vanillin voice)
2. `<InstallSnippet slug="..." />`
3. Usage — `<ComponentPreview>` with basic import + JSX
4. Examples — each variant/feature with preview + source, 1-2 creative compositions
5. `<ApiReference>` — props table

## Test-safety rules (lesson from task 76 — it shipped 14 hidden failures ignoring these)

- Before rewriting a page, read `tests/<slug>.test.mjs` if it exists. These pages have one: combobox, date-input, date-picker, form-fields, input-otp, radio-group, slider, textarea, time-picker, use-form. Preserve every selector and `data-pg` hook the test uses.
- `ComponentPreview` renders `ui/tabs` internally. Any fixture a test targets via `[role="tablist"]`, `.tabs-trigger`, or similarly collision-prone selectors must render **directly on the page** (source shown in a plain `<CodeBlock>`), not inside `ComponentPreview`.
- No duplicate visible button labels on one page — Playwright strict mode fails on `has-text` collisions.
- Keep code-tab strings in sync with the rendered JSX (76 needed a fix commit for drift).

## Content notes

- **form-fields** (ISSUES B6): add a "form vs form-fields" explainer at the top.
- **use-form** (ISSUES C7): fix the adjacent `<span>`s that render as one unreadable token.

## Verify / done

```sh
node tests/run.mjs   # suite green — all data-pg hooks preserved
npm run build        # clean
```

Baseline is 753/755 (2 pre-existing failures). Run the full suite and report exact counts — do not summarize from memory.

## Handoff

**Status:** DONE
**Branch:** `docs/pages-rest-a`

### Commits

- `d31ff4e` — `docs(pages): apply task-76 template to 14 form-family pages`
- `3ca4981` — `docs(slider): drop unused ComponentPreview import`
- `68168fd` — `docs(todo): task77a handoff`
- `dc271ee` — `docs(pages): fix slider viewport regression, code-tab drifts`

### What landed

All 14 form-family pages rewritten to the task-76 button.jsx template:
- Title + vanillin-voice description
- `<InstallSnippet slug="..." />`
- Examples wrapped in `<ComponentPreview>` (code tab + preview tab)
- `<ApiReference>` props tables at the bottom

Special items:
- **form-fields (B6):** Added "form vs form-fields" explainer section at the top, explaining the three-layer split (ui/form, ui/form-fields, lib/use-form).
- **use-form (C7):** State-display spans now have labeled `<div>` wrappers and spacing — no more `false{}{}` or `falsetrue` tokens.
- **slider:** Usage ComponentPreview placed AFTER test-fixture sections to avoid shifting viewport coordinates for pointer-click tests.
- **use-form:** No `<InstallSnippet>` — `use-form` is a lib, not in the registry. Installed as a dependency of `form-fields`.

### Verify

```
node tests/run.mjs   → 753/755 passed
npm run build        → clean (1.05s)
```

2 failures are the documented pre-existing cursor tests:
- cursor: slider thumb shows grab cursor at rest
- cursor: slider thumb shows grabbing cursor during drag

### Surprises

- Any content above the slider test fixtures shifts their viewport coordinates. The Vertical slider's `clickAt` uses `page.mouse.click` which operates in viewport space — extra height above pushes it below the fold. Fixed by placing the Usage ComponentPreview after all fixture sections.
- Code-tab strings must include every element the rendered JSX shows (Labels, wrappers). Omitting them makes the copyable code produce inaccessible markup.
