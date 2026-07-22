# task03: field-direction
**Goal:** Add the shadcn Field family (`ui/field/`) and surface RTL support — Direction demo page + logical-property sweep — as one PR.
**Branch:** `feat/field-direction`  **Deps:** none

## Sub-tasks
- [x] 1. `ui/field/field.jsx` + `field.css` — Field (orientation: vertical | horizontal | responsive; `data-invalid`), FieldGroup, FieldSet, FieldLegend (variant: legend | label), FieldLabel, FieldTitle, FieldContent, FieldDescription, FieldError (`errors` array → `role="alert"`), FieldSeparator (optional children). CSS-only structural component (like `ui/item/`) — no test per repo convention; block classes `field`, `field--horizontal`, `field-label`, …; tokens only. files: `ui/field/field.jsx`, `ui/field/field.css`
- [ ] 2. Demo page `playground/pages/field.jsx` + registry `page:` entry — vertical/horizontal/responsive fieldsets, checkbox/switch rows, invalid + FieldError example. files: `playground/pages/field.jsx`, `playground/registry.js`
- [ ] 3. RTL: sweep physical → logical properties (`ui/button-group/button-group.css` margin-left; `ui/typography/typography.css` border/padding-left) + Direction demo page `playground/pages/direction.jsx` (DirectionProvider dir="rtl" wrapping slider, breadcrumb, field horizontal) + registry entry — test: `tests/direction.test.mjs` proves ArrowRight decrements slider value under `DirectionProvider dir="rtl"` (slider already consumes `useDirection`); files: `tests/direction.test.mjs`, `playground/pages/direction.jsx`, `playground/registry.js`, two css files

## Verify / done
- `node tests/run.mjs` green (incl. new direction test).
- `npm run build` clean.
- Playground: `#field` and `#direction` pages render; RTL demo lays out right-to-left; net diff vs main ≤ 500 lines.
