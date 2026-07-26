# task62: schema-core

**Goal:** `lib/schema.js` — a zero-dep, zod-shaped validation library, wired into
the form layer through the resolver contract that already exists.
**Branch:** feat/schema-core
**Deps:** 40 ✓ (resolver contract). Pairs with 59; see sequencing below.

## Why

`lib/use-form.js` takes a `resolver` and its contract is already documented and
RHF-compatible (`lib/use-form.js:28-33`, verified against
`@hookform/resolvers` 5.5.3 + zod 4.4.3, neither a dependency):

```
async (values, context, options) => { values, errors }
  options = { fields, names, criteriaMode, shouldUseNativeValidation }
  errors keyed by dotted path, each { type, message }
```

So consumers can bring zod today — but they have to *install* zod, and vanillin's
whole proposition is zero dependencies. Right now the honest answer to "how do I
validate this form?" is "hand-write a resolver or add a dependency". A schema
library owned by the kit closes that.

**This is the seam that makes the task safe:** the resolver contract is the
boundary. `lib/schema.js` must be usable standalone, and `use-form` must keep
working with any third-party resolver. Do not couple them — a consumer who
prefers zod or valibot keeps that option.

## Design decisions

- **Zod-shaped API, deliberately a subset.** Familiarity is the point; a novel
  API forfeits the main benefit. Target the surface real forms use:
  - `s.string()`, `s.number()`, `s.boolean()`, `s.date()`, `s.literal()`,
    `s.enum()`
  - `s.object()`, `s.array()`, `s.optional()`, `s.nullable()`, `s.union()`
  - chained refinements: `.min()`, `.max()`, `.length()`, `.regex()`, `.email()`,
    `.url()`, `.int()`, `.positive()`
  - `.refine(fn, message)` and `.transform(fn)` as the escape hatches
  - `.parse()` (throws) and `.safeParse()` (returns `{ success, data, error }`)

- **Out of scope, and say so in the file header** (the `use-form.js` header is
  the model): intersections, discriminated unions, recursive/lazy schemas,
  branded types, codecs, async refinements, `.catch()`, error maps. Each is a
  real feature and each is a rabbit hole; a small correct subset beats a large
  half-right one.

- **Issue paths must be dotted strings.** The resolver contract keys errors by
  dotted path (`items.0.name`), and `use-form` already resolves nested paths.
  Emitting zod-style path *arrays* and converting in the adapter is the wrong
  layer — emit what the consumer needs.

- **Ship the adapter in the same PR:** `schemaResolver(schema)` returning the
  contract shape above. Without it the library is inert.

- **No TypeScript inference story.** This repo is JSDoc-typed JSX, not TS. Zod's
  main draw is static inference and we cannot reproduce it. Be explicit that this
  is runtime validation only, so nobody expects `s.infer<>`.

- **Coercion is opt-in, never implicit.** `s.number()` on the string `"42"` from
  an `<input>` must fail unless the consumer wrote `s.coerce.number()`. Silent
  coercion in a validation library is how bad data reaches a backend.

## Sequencing with 59

59 (form-bindings) should **not** block on this. Ship 59 against the resolver
contract as-is, then 62 plugs in behind the same interface. If 62 lands first,
59 can use it directly. Either order works precisely because the contract is
already the boundary — that is worth preserving, not collapsing.

## Sub-tasks

- [ ] 1. Core: primitives, `safeParse`/`parse`, issue shape with dotted paths.
  Files: `lib/schema.js`, `tests/schema.unit.mjs` (**`.unit.mjs`** — pure-node
  tests must not be named `.test.mjs` or the browser runner will call them).
- [ ] 2. Composites: `object`, `array`, `optional`, `nullable`, `union`, nested
  path reporting.
- [ ] 3. Refinements + `.refine()` / `.transform()`; opt-in `s.coerce.*`.
- [ ] 4. `schemaResolver(schema)` adapter + tests proving it satisfies the same
  contract the hand-written RHF-shaped fake in `tests/` already exercises.
- [ ] 5. Docs prose: the subset, the omissions, and "runtime only, no inference".

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- `package.json` gains **no** dependencies — check `dependencies` *and*
  `devDependencies`. A devDependency imported from a playground page is a runtime
  dependency; that exact mistake broke the build once already (see HANDOFF).
- A form using `schemaResolver` and a form using the hand-written resolver both
  pass, proving the contract stayed open.
- Validate a deeply nested `useFieldArray` shape — dotted-path reporting through
  arrays is where this class of library usually breaks.
