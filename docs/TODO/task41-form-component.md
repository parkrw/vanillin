# task41: form-component

**Goal:** `ui/form/` — upstream's Form anatomy, engine-agnostic, plus a
first-class React 19 Actions path.
**Branch:** feat/form-component
**Deps:** 40 (`lib/use-form.js`)

## Design decisions

- **`ui/form/` must never import `lib/use-form.js`.** This is the load-bearing
  decision. Upstream's `form.tsx` is mostly wiring — it provides a field-name
  context, generates ids, and hooks `aria-describedby` / `aria-invalid` to the
  field's error. The state arrives via `useFormContext()`. If our components
  read a **context** rather than the engine, then:
  - our `useForm` is the default, and
  - a consumer already on real react-hook-form wraps in RHF's `FormProvider`
    and everything works unchanged — because 40 matched the shape.

  One code path, two engines. If a component reaches for the engine directly,
  that property is gone.

- **Anatomy (upstream names exactly):** `Form` (provider passthrough),
  `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`,
  `FormMessage`, `useFormField`.

- **Accessibility is the actual product here.** The wiring upstream's Form does
  is the reason to use it at all:
  - `FormItem` mints one id; label/control/description/message derive from it
  - `FormControl` sets `aria-describedby` to description **and** message,
    `aria-invalid` when errored
  - `FormLabel` gets `htmlFor` and an error state
  - `FormMessage` renders nothing when there is no error, and must be a live
    region so validation failures are announced — upstream does not do this, and
    it is a real gap worth closing
  - `FormControl` uses our `as` prop, not Radix `asChild`

- **React 19 Actions as a peer path, not a replacement.** RHF predates
  Actions and integrates awkwardly; we can support both cleanly and this is a
  genuine differentiator:
  - `<Form action={fn}>` uses `useActionState` — no client engine needed for
    simple server-driven forms
  - a `FormSubmit` button reads `useFormStatus` for pending state, which kills
    the usual prop-drilling of `isSubmitting` into a nested button
  - errors returned by the action land in the same context shape the engine
    path uses, so `FormMessage` does not care which path produced them

  **Gotcha:** `useFormStatus` only reports status for the nearest ancestor
  `<form>` — a submit button rendered in a portalled dialog footer is outside
  it and will always read `pending: false`. Test this specifically; a dialog
  footer is exactly where consoles put submit buttons.

- **Wire the kit's controlled components.** `Select`, `Combobox`, `Checkbox`,
  `RadioGroup`, `Switch`, `Calendar`, `InputOTP`, `Slider` are all
  `useControllableState`-based and cannot be `register`ed — they need
  `Controller`. The demo page must show at least three of them, because
  "does it work with your own Select" is the first question anyone asks.

- **Zod is not a dependency.** The demo validates with a plain resolver
  function. Document that `@hookform/resolvers` + zod works (verified in 40)
  for consumers who want it.

## Sub-tasks

- [ ] 1. `ui/form/` parts + `useFormField`, context-only, with the full ARIA
  wiring and a live-region `FormMessage`. Files: `ui/form/form.jsx` + `.css`.
- [ ] 2. Actions path — `action` prop via `useActionState`, `FormSubmit` via
  `useFormStatus`, unified error shape. Files: `ui/form/form.jsx`.
- [ ] 3. Demo page: engine path with `Input` + three controlled components via
  `Controller`, a field array, and a separate Actions-path example. Files:
  `site/pages/form.jsx`, `site/registry.js`.
- [ ] 4. Test: id wiring (`htmlFor`, `aria-describedby` covers both
  description and message, `aria-invalid` on error); message announced on
  validation failure; `Controller`-wired `Select` submits its value; the same
  markup works when driven by a hand-rolled RHF-shaped context (the
  engine-agnostic proof); `useFormStatus` pending state, including the
  portalled-footer case. Files: `tests/form.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- axe pass on the demo page in both modes, with a form in its error state —
  error states are where form a11y usually breaks.
- Swap the demo to real `react-hook-form` locally (devDependency, reverted
  before commit) and confirm it renders unchanged. That is the engine-agnostic
  claim; verify it rather than asserting it.
