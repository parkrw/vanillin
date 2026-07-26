# task59: form-bindings

**Goal:** one import that wires the engine, the form primitives and a control
together, so a field is one line instead of fifteen.
**Branch:** feat/form-bindings
**Deps:** 40 ✓ (`lib/use-form.js`), 41 ✓ (`ui/form/`)

## Why

The three layers exist and none of them talk to each other. Wiring one
`Controller`-driven Select in `playground/pages/form.jsx` costs ~28 lines
(`form.jsx:132-163`) — `Controller` → `FormField` → `FormItem` → `FormLabel` →
`FormControl` → control → `FormDescription` → `FormMessage`. Every field repeats
it, and every repetition is a chance to drop `aria-describedby` or forget
`FormMessage`.

`ui/form` is engine-agnostic on purpose: `ui/form/form.jsx:15` inlines its own
`getByPath` with the comment "ui/form must never import lib/use-form". That
constraint is right and stays. The missing piece is a **third layer** that is
allowed to know about both.

## Design decisions

- **Its own slug, not a file inside `ui/form/`.** This layer imports the engine;
  dropping it into `ui/form/` would mean copying `ui/form` drags `lib/use-form.js`
  in, which is exactly the copy-paste independence the kit protects. Default to
  `ui/form-fields/` (`form-fields.jsx` + `form-fields.css` if it needs any CSS —
  it probably needs none, since it renders `ui/form` and control classes). If you
  pick a different slug, write the reason in the task log.
- **`ui/form/form.jsx` and `lib/use-form.js` are not modified.** Both are shipped
  contracts with tests. If a binding needs something they do not expose, report
  it rather than widening them. The one permitted exception: adding an export to
  `ui/form/form.jsx` that it already computes internally — say so in the report.
- **One component per control, named `<XField>`:**
  `TextField`, `TextareaField`, `SelectField`, `CheckboxField`, `SwitchField`,
  `RadioGroupField`. Common props: `name` (required), `label`, `description`,
  `control` (the `useForm` control object) — plus everything else forwarded to the
  underlying control.
- **The binding picks `register` vs `Controller`, the caller never does.** Native
  inputs (`input`, `textarea`) use `register`; anything with a non-native value
  channel (Select, Checkbox, Switch, RadioGroup) uses `Controller`. That choice
  is the single biggest thing this layer buys, and getting it wrong per-control
  is the bug it exists to prevent.
- **Escape hatch, not a walled garden.** Provide a generic
  `<FormFieldBinding name control label description render={({ field }) => …}>`
  (name yours) that does the plumbing and hands back `field` for anything not on
  the list above. Every `<XField>` should be a thin call to it — if it isn't,
  the abstraction is wrong.
- **Do not build an `<AutoForm>` / schema-driven form generator.** Out of scope.
  62 shipped `schemaResolver`; a schema-to-JSX generator is a separate decision.
- **`control` may come from context.** `FormProvider`/`useFormContext` already
  exist (`lib/use-form.js:787,791`). Accept an explicit `control` prop and fall
  back to context so both styles work; throw a clear error when neither is
  present.
- **Zero new dependencies**, runtime or dev.

## Sub-tasks

- [ ] 1. The generic binding + `TextField` and `TextareaField` (the `register`
  path) — test: a bound text field renders label, description and error with the
  same `id` / `aria-describedby` / `aria-invalid` wiring as the hand-wired
  version, and typing updates form state; files: `ui/form-fields/`,
  `tests/form-fields.test.mjs`.
- [ ] 2. `SelectField`, `CheckboxField`, `SwitchField`, `RadioGroupField` (the
  `Controller` path) — test: each one round-trips its value through
  `handleSubmit` and shows a resolver error; files: `ui/form-fields/`,
  `tests/form-fields.test.mjs`.
- [ ] 3. Demo page + prose: `playground/pages/form-fields.jsx` showing the same
  form as `playground/pages/form.jsx` written with bindings, side by side with
  what it replaces, and stating when to reach for each layer. Registry entry.
- [ ] 4. Test: a resolver error (use `schemaResolver` from `lib/schema.js`, which
  landed in 62) surfaces through a bound field without the caller touching
  `FormMessage`.

## Verify / done

- `node tests/run.mjs` green (583/583 on the base commit); `npm run build` clean.
- `tests/form.test.mjs`, `tests/use-form.test.mjs` and `tests/field.test.mjs`
  pass **unmodified** — this task adds a layer, it does not change one.
- `grep -n "use-form" ui/form/form.jsx` returns nothing. The seam holds.
- `git diff --stat` shows no change to `lib/use-form.js`.
- A bound field and its hand-wired equivalent produce the same rendered
  attributes — assert it, don't eyeball it.
- The demo page has exactly one `h2` (playground convention: several suites
  click a bare `h2` as an outside-click target).

## File ownership (batch 59/60/63)

You are the **sole owner of `playground/registry.js`** this batch. Add your one
line; change nothing else in it. Do not touch `styles/globals.css` (task 60 owns
it) or `ui/badge`, `ui/combobox`, `ui/data-table`, `lib/use-highlight.js`
(task 63 owns those) — report, don't edit.
