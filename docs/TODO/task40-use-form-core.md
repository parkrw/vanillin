# task40: use-form-core

**Goal:** `lib/use-form.js` — a zero-dep form engine shaped like react-hook-form.
**Branch:** feat/use-form-core
**Deps:** none

## Why zero-dep

Decided 2026-07-25. `react` / `react-dom` are platform — the consumer already
has them, versioned by their app. `react-hook-form` is a third-party choice in
the same class as Radix, cmdk, vaul and `@tanstack/react-table`, all of which
vanillin replaced. Same precedent as `lib/use-data-table.js`.

**Honest risk:** this is the hardest thing in phase 2 to clone well. Form state
has real depth — validation modes, dirty/touched tracking, field arrays, watch
subscriptions, uncontrolled-input performance. `use-data-table` only had to
cover the slice the payments example used; the form surface people actually
reach for is much wider. Budget two PRs and cut scope explicitly rather than
shipping a half-fidelity `useForm` that looks complete.

## Design decisions

- **RHF-shaped on purpose.** Matching names is not flattery — it is what lets
  `ui/form/` (41) stay engine-agnostic, so a consumer already on real RHF drops
  their form object in unchanged. Any deliberate divergence must be documented,
  because divergence breaks that swap.

- **Scope — in:**
  `useForm({ defaultValues, mode, reValidateMode, resolver })`, `register`,
  `control`, `handleSubmit`, `watch`, `setValue`, `getValues`, `reset`,
  `setError`, `clearErrors`, `trigger`, `formState` (`errors`, `isDirty`,
  `dirtyFields`, `touchedFields`, `isSubmitting`, `isSubmitted`, `isValid`),
  `Controller`, `FormProvider`, `useFormContext`, `useFieldArray`.

  **Scope — out** (document as deviations): `shouldUnregister`, `criteriaMode:
  "all"`, `setFocus`, `getFieldState` subscriptions, `delayError`, devtools
  integration, native validation mode.

- **Resolver contract is the ecosystem bridge.** RHF resolvers are just
  `async (values, context, options) => ({ values, errors })` with errors keyed
  by dotted field path as `{ type, message }`. Implement exactly that shape and
  `@hookform/resolvers`' `zodResolver` should work verbatim — consumers get zod
  validation without us writing or shipping an adapter. **Verify this against
  the real package as a sub-task**; do not assume it, and pass the `options`
  argument (`fields`, `names`, `criteriaMode`, `shouldUseNativeValidation`)
  since some resolvers read it.

- **Uncontrolled by default, like RHF.** `register` returns
  `{ name, onChange, onBlur, ref }` and reads values off the DOM node. This is
  the performance property that makes RHF worth cloning — typing in one field
  must not re-render the form. `Controller` is the controlled escape hatch for
  components that own their state (our `Select`, `Combobox`, `Calendar`,
  `Checkbox` — all `useControllableState`-based, none of which expose a DOM
  node `register` can read).

- **Subscription model.** A `formState` that re-renders on every keystroke
  defeats the point. Use a proxy or explicit subscription so a component only
  re-renders for the slices it read — RHF's own approach. `watch("field")`
  subscribes; `getValues()` does not. Consider `useSyncExternalStore` (the
  toast store already uses this pattern).

- **Dotted paths throughout** — `user.address.city`, `items.2.name`. Write the
  get/set/unset path helpers once and test them hard; nested-path bugs are the
  classic failure mode and they surface as silent data loss on submit.

## Sub-tasks

- [ ] 1. Path helpers + store core (values, errors, touched, dirty) with the
  subscription model; `useForm`, `register`, `getValues`, `setValue`, `watch`,
  `reset`. Files: `lib/use-form.js`, `tests/use-form.test.mjs`.
- [ ] 2. Validation — `mode` / `reValidateMode` timing, `resolver`, `trigger`,
  `setError`, `clearErrors`, `handleSubmit` (incl. `isSubmitting` and the
  invalid-submit path). Files: `lib/use-form.js`.
- [ ] 3. `Controller`, `FormProvider`, `useFormContext`, `useFieldArray`.
  Files: `lib/use-form.js`.
- [ ] 4. Verify `@hookform/resolvers`' `zodResolver` runs unmodified against
  our contract (devDependency for the test only — **never** a runtime dep).
  Record the result in the adjustments log either way. Files:
  `tests/use-form.test.mjs`, `package.json`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- **Re-render assertion, not just correctness:** typing in one registered
  field must not re-render siblings. Count renders in the test — this is the
  property that justifies cloning RHF instead of writing something simpler,
  and it is invisible to every other test.
- Nested paths and field arrays round-trip through submit with no dropped keys.
