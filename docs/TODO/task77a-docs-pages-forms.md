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

**Status:** NOT STARTED
