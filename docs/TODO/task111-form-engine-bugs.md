# task111: form-engine-bugs
**Goal:** Fix the `lib/use-form.js` defects that produce silently wrong form state — dirty tracking, leaks, a validation race, and a wrong initial `isValid`.  **Branch:** `fix/form-engine-bugs`  **Deps:** none
**Owns:** `lib/use-form.js`, `tests/use-form.test.mjs` (or a new `tests/use-form.unit.mjs` for the pure functions)

Line numbers measured 2026-08-27; re-verify before editing, they drift.

## The findings, worst first

1. **`deepEqual` treats every Date, Map, Set, RegExp and File as equal** (`lib/use-form.js:125-133`). It compares own enumerable keys; boxed types have none, so `deepEqual(new Date(2020), new Date(2024)) === true` (verified by execution). This feeds `_updateDirty` → `formState.isDirty`/`dirtyFields`, so a form containing a date picker, file input, or Set-valued multi-select never reports dirty. Any "warn on unsaved changes" or "disable Save until dirty" guard built on it silently never fires — this is the data-loss one.
2. **`watch(callback)` subscribes during render** (`:670-676`): `control._valueListeners.add(listener)` runs in the render body, so a component following the RHF docs pattern adds one listener per render, forever. Move to an effect with cleanup.
3. **`Controller` leaks and over-subscribes** (`:722-738`): never deletes `control._fields[name]` on unmount (removed fields validated forever), and its effect deps include `rules` — almost always an inline object — so it tears down and re-adds both listeners every render.
4. **The `ref` callback ignores `null`** (`:433-439`), so `_fields[name]._ref` retains a detached DOM node after any conditional field unmounts.
5. **Async validation race** (`:390-400`): `_validateField` is async and assigns `_formState.errors` wholesale; two overlapping keystrokes with an async resolver can land old-over-new. Add a per-field (or per-form) sequence token and drop stale results.
6. **`isValid` initialises to `true`** (`:186`); RHF initialises `false`. `<Button disabled={!isValid}>` starts enabled on an empty invalid form. Match RHF.
7. **`watchedRef` only grows** (`:684-688`): a conditionally-watched field keeps forcing re-renders after it's gone.

## Known, deliberately out of this task (record, don't fix here)

- The `formState` proxy is rebuilt every render over an in-place-mutated object (`:693-698`), so `formState.errors` keeps its identity across changes and defeats `useMemo`/`React.memo`. Fixing it means changing the mutation model — bigger than a bug batch. File in `docs/ISSUES.md` if not already there.
- `Controller`'s unconditional `bump` fan-out (`:731`) and `FormProvider`'s fresh `methods` object (`:786-789`) are re-render cost, not correctness. Same treatment.
- `_`-prefixed internals returned on the public `control` object: in a copy-paste kit these *are* API. Needs the task124 policy call, not code.

## Sub-tasks

- [ ] 1. `deepEqual`: handle Date (`getTime`), RegExp (`source`+`flags`), Map/Set (size + entry-wise), and bail to `Object.is` for other exotic receivers. Unit-test each pair, plus the nested case (`{ d: Date }`).
- [ ] 2. Move `watch(callback)` subscription into an effect with delete-on-cleanup; test that N renders leave exactly one listener.
- [ ] 3. `Controller`: delete `_fields[name]` on unmount; take `rules` via a ref so inline objects stop resubscribing.
- [ ] 4. Null-ref cleanup in the register `ref` callback.
- [ ] 5. Sequence token for async validation; test with two resolvers racing (resolve the first slower).
- [ ] 6. `isValid: false` initial + test asserting an empty required form starts invalid.
- [ ] 7. Prune `watchedRef` when a watch unmounts or the arg set changes.

## Verify / done

```sh
node tests/run.mjs use-form form   # component + engine suites green
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: every sub-task has a test that was red before the fix (implementation first, then tests, one green run — house rule), and the suite baseline is unmoved. Each dirty-tracking test must assert the precondition too (the field actually registered), not just `isDirty` — the H1 lesson.

## Out of scope

`lib/schema.js` (task116 owns its guards), `ui/form`/`ui/form-fields` (no API change should be needed), RHF parity gaps that aren't bugs.

## Handoff

**Status:** NOT STARTED
