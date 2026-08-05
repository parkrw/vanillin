# task66: config-schema-json
**Goal:** Generate `van.schema.json` (JSON Schema) from the validator's constants so editors autocomplete `van.config.json`.  **Branch:** feat/config-schema-json  **Deps:** 38
**Owns:** `scripts/gen-schema.mjs`, `van.schema.json`, `bin/van.mjs` (`initialConfig` + `$schema` passthrough), `scripts/config-schema.mjs` (`TOP_LEVEL_KEYS`), `tests/config-schema.unit.mjs`, `package.json` (npm script)

## Sub-tasks
- [x] 1. Generator script — `scripts/gen-schema.mjs` reads constants from `config-schema.mjs` (`FRAMEWORKS`, `PATH_KEYS`, `BRAND_KEYS`, `THEME_KEYS`, `MOTION_KEYS`, `FONT_KEYS`, `COMPONENT_SECTION_KEYS`, `DENSITY_PRESETS`, `DENSITY_RANGE`, `MOTION_SCALE_RANGE`) and emits a JSON Schema draft-07 covering the full config surface; files: `scripts/gen-schema.mjs`
- [x] 2. Allow `$schema` in the validator — add `"$schema"` to `TOP_LEVEL_KEYS` so `validate()` passes it through without erroring; files: `scripts/config-schema.mjs`
- [x] 3. Wire `$schema` into scaffolded configs — `initialConfig()` in `bin/van.mjs` adds `"$schema": "./van.schema.json"` to the output; add `"$schema"` to the kit's own `van.config.json`; files: `bin/van.mjs`, `van.config.json`
- [x] 4. Generate and commit `van.schema.json` + add `"schema"` npm script; files: `van.schema.json`, `package.json`
- [x] 5. Tests — generated schema validates known-good configs (empty, the kit's own, a maximal example) via `Ajv` or manual structural assertions; round-trip: every `FRAMEWORKS` member appears in the schema enum, `PATH_KEYS` match schema properties, density accepts both preset strings and numbers; the validator accepts `$schema` without error; files: `tests/config-schema.unit.mjs`

## Design

The schema is **generated, not hand-written** — hand-writing it guarantees drift from the validator. The generator imports the same constants that `validate()` uses.

Config surface (from `config-schema.mjs`):
- `$schema` — string, ignored by validator
- `framework` — enum: `next-app`, `next-pages`, `vite`, `remix`, `astro`, `unknown`
- `rsc` — boolean
- `paths` — object: keys `ui`, `lib`, `styles`, `css`; all strings (project-relative, no `..`, no absolute)
- `theme.brand` — string (oklch) OR object with optional keys `primary`, `secondary`, `accent`, `neutral` (each oklch string)
- `theme.radius` — string
- `theme.density` — string enum (`compact`, `comfortable`, `spacious`) OR number [0.75, 1.5]
- `theme.motion` — object: `scale` (number [0, 3]), `ease` (string)
- `theme.font` — object: `sans` (string), `mono` (string)
- `theme.light`, `theme.dark` — objects: string keys → string values (colour token overrides)
- `components.<slug>` — object: `tokens`, `variants`, `sizes`; each is a map of CSS property names → string values (variants/sizes are nested one level deeper by name)

No runtime dep for schema validation in tests — use structural assertions against the generated JSON (parse it, walk the properties). Zero-dep constraint applies.

## Verify / done
```
node scripts/gen-schema.mjs            # generates van.schema.json, exit 0
node tests/run.mjs config-schema       # unit tests pass
```
Open `van.config.json` in VS Code — autocomplete for `theme.brand`, `framework`, `paths.*`, `components.<slug>.variants`.

## Handoff

**Status:** DONE — all 5 sub-tasks complete, 87/87 config-schema + 32/32 CLI tests green.

- `scripts/gen-schema.mjs` generates `van.schema.json` from the same constants `validate()` uses — no drift possible.
- `$schema` added to `TOP_LEVEL_KEYS` so the validator passes it through.
- `initialConfig()` scaffolds `"$schema": "./van.schema.json"`, kit's own `van.config.json` has it too.
- `npm run schema` regenerates.
- 14 new tests: `$schema` passthrough, structural round-trip (every constant set in `config-schema.mjs` verified against the generated schema properties/enums/ranges).
