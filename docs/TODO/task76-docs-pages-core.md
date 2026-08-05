# task76: docs-pages-core
**Goal:** Apply the shadcn-style docs template to 15 key components — install snippet, usage code, variant examples with preview+source, creative compositions, API reference.  **Branch:** `docs/pages-core`  **Deps:** 75
**Owns:** `site/pages/{button,input,dialog,card,select,form,badge,tabs,accordion,checkbox,switch,table,avatar,alert,toast}.jsx`

## Components (15)

button, input, dialog, card, select, form, badge, tabs, accordion, checkbox, switch, table, avatar, alert, toast

## Per-component structure

Each page gets rewritten to follow this layout:

1. **Title + description** — one sentence, vanillin voice (not upstream copy)
2. **Install snippet** — `<InstallSnippet slug="..." />`
3. **Usage** — basic import + JSX in a `<ComponentPreview>` (rendered + source)
4. **Examples** — each variant/feature as a `<ComponentPreview>`:
   - All existing demos preserved (they are test fixtures via `data-pg` hooks)
   - Add source code string for each demo
   - Add 1-2 creative composition examples (component used with others — e.g. Button inside Card with Badge, Dialog with Form, etc.)
5. **API Reference** — `<ApiReference>` with props table derived from the component's JSX (read the actual prop destructuring and defaultProps/types)

## Sub-tasks

- [ ] 1. **button** — 6 variants, 3 sizes, states, density, `as` prop. Composition: button inside card footer, button-group with badge count.
  - files: `site/pages/button.jsx`

- [ ] 2. **input** — default, disabled, with label, file input, density. Composition: input inside card with form field. Fix C8 (empty density section) here.
  - files: `site/pages/input.jsx`

- [ ] 3. **dialog** — default, with form, alert-dialog comparison. Composition: dialog containing a form with validation.
  - files: `site/pages/dialog.jsx`

- [ ] 4. **card** — default, with content sections. Composition: card grid, card with avatar + badge + button.
  - files: `site/pages/card.jsx`

- [ ] 5. **select** — default, with groups, controlled. Composition: select in form field, select with combobox comparison.
  - files: `site/pages/select.jsx`

- [ ] 6. **form** — FormField anatomy, controlled components, validation. Fix B5 (recommend lib/schema.js first). Fix B6 (add form vs form-fields explainer).
  - files: `site/pages/form.jsx`

- [ ] 7. **badge** — variants, sizes, with icon, dismissible. Composition: badge in card header, badge in table cell.
  - files: `site/pages/badge.jsx`

- [ ] 8. **tabs** — default, with content. Composition: tabs containing cards, tabs with form sections.
  - files: `site/pages/tabs.jsx`

- [ ] 9. **accordion** — default, multiple. Composition: accordion FAQ, accordion settings panel.
  - files: `site/pages/accordion.jsx`

- [ ] 10. **checkbox** — default, with label, disabled, indeterminate. Composition: checkbox list in card, checkbox in form.
  - files: `site/pages/checkbox.jsx`

- [ ] 11. **switch** — default, with label, disabled. Composition: switch in settings list (item + switch).
  - files: `site/pages/switch.jsx`

- [ ] 12. **table** — default, striped, dense. Composition: table in card.
  - files: `site/pages/table.jsx`

- [ ] 13. **avatar** — image, fallback, sizes. Composition: avatar + name in item, avatar group.
  - files: `site/pages/avatar.jsx`

- [ ] 14. **alert** — default, destructive. Composition: alert in card, alert in dialog.
  - files: `site/pages/alert.jsx`

- [ ] 15. **toast** — default, with action, variants. Composition: toast triggered by form submit.
  - files: `site/pages/toast.jsx`

## Verify / done

```sh
npm run dev          # visual QA: every page has install, usage, examples with source, API table
npm test             # suite green — all data-pg hooks preserved
npm run build        # build clean
```

Observable:
- Each of 15 pages follows the template: description → install → usage → examples → API
- Every demo has a "Code" view showing the source
- No `data-pg` attributes removed (test fixtures)
- At least one composition example per page showing components used together
- B5, B6, C8 addressed in their respective pages

## Handoff

**Status:** NOT STARTED
