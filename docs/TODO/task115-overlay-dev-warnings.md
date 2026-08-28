# task115: overlay-dev-warnings
**Goal:** A dialog or popover without a title should say so in the dev console instead of shipping an unnamed (worse: mis-pointed) accessible name.  **Branch:** `fix/overlay-dev-warnings`  **Deps:** none
**Owns:** `ui/dialog/dialog.jsx`, `ui/popover/popover.jsx`, `tests/dialog.test.mjs`, `tests/popover.test.mjs`, and the dialog-family consumers sub-task 3 must fix: `ui/sheet/sheet.jsx`, `ui/drawer/drawer.jsx`, `ui/alert-dialog/alert-dialog.jsx`, `ui/command/command.jsx`, `ui/sidebar/sidebar.jsx` + `tests/{sheet,drawer,alert-dialog,command,sidebar}.test.mjs`; `registry.json` and touched `ui/*/.van.json` (regenerated via `npm run contracts`, never hand-edited); this file.

Line numbers measured 2026-08-27; re-verify before editing.

## Finding

`ui/dialog/dialog.jsx:86-88` and `ui/popover/popover.jsx:107-108` always emit `aria-labelledby={titleId}` / `aria-describedby={descriptionId}`. Those ids only exist in the DOM if the consumer rendered `DialogTitle`/`DialogDescription` (`PopoverTitle`/…). Omit the title and the attribute points at nothing — which **suppresses the fallback naming chain**, so the result is worse than omitting the attribute: a screen reader announces an unnamed dialog. Radix logs a dev warning for exactly this case; vanillin has **zero `console.warn` anywhere in `ui/` or `lib/`**, so nothing tells the developer.

Two independent fixes, do both:

1. **Don't emit a dangling reference.** After mount, if `document.getElementById(titleId)` is null, drop `aria-labelledby` (same for describedby). The attribute becomes truthful whether or not anyone reads the console.
2. **Warn once, dev-only.** `if (process.env.NODE_ENV !== "production")` — vite (docs site and every consumer bundler the CLI targets) statically replaces this; verify the production build strips it (`npm run build`, grep the output chunk). Message should name the component and the fix: `"<DialogContent> has no <DialogTitle>. Screen readers will announce an unnamed dialog — add a DialogTitle, or aria-label on DialogContent."` Warn once per mounted instance, not per render. Respect an explicit consumer-passed `aria-label`/`aria-labelledby` (via `...rest`) as satisfying the requirement — the conformance suite guarantees rest-spreading, so this must not fight it.

## Ripple check (thin re-exports)

`ui/alert-dialog` and `ui/sheet`/`ui/drawer` re-export dialog parts; `ui/context-menu`/`ui/menubar` re-export dropdown-menu, not popover — so the only re-export surfaces affected are the dialog family. `AlertDialog` *requires* a title by ARIA (`role="alertdialog"` must be named): its warning should not be softer than dialog's. Confirm `ui/command`'s dialog mode passes a label already (it renders a combobox inside a dialog — if it relies on the dangling id today, this task just found a real bug; fix it by passing `aria-label`).

## Sub-tasks

- [x] 1. Dangling-id suppression in dialog + popover (post-mount check, state or ref-based; avoid a layout thrash — `getElementById` is fine).
- [x] 2. Dev-only warn-once in both, honoring consumer `aria-label`/`aria-labelledby`.
- [x] 3. Sweep the dialog family consumers (`sheet`, `drawer`, `alert-dialog`, `command` dialog mode, sidebar mobile) for instances that would now warn; fix any real gaps found (that's the point).
- [x] 4. Tests: (a) titleless dialog has **no** `aria-labelledby` attribute (red today); (b) titled dialog keeps it; (c) consumer `aria-label` suppresses the warning path (assert the attribute outcome, not the console); production-build grep for the warning string as a unit check.
- [x] 5. `npm run contracts`.

## Verify / done

```sh
node tests/run.mjs dialog popover sheet drawer alert-dialog command sidebar
npm run contracts && git diff --exit-code registry.json
npm run build && ! grep -r "has no <DialogTitle>" site/dist/assets
npm run build && ! grep -r "has no <PopoverTitle>" site/dist/assets
npm test > out.txt 2>&1; grep ^FAIL out.txt
```

Done when: the tests pass, `npm test` holds its baseline, and the production bundle carries neither warning string.

**The "no docs-site page warns" criterion is met for dialog and not for popover, and this task cannot close the popover half.** The sweep ran and is recorded under [Findings outside this task's Owns](#findings-outside-this-tasks-owns): zero `<DialogTitle>` warnings, seven `<PopoverTitle>` warnings from three call sites, none of which is in this task's `Owns`. The `Owns` line was widened to the dialog-family consumers only; `ui/data-table` and `site/pages/` were not added, and editing them is a rework trigger. So the criterion is narrowed here, deliberately: **this task warns truthfully, and clearing the docs site is a follow-up whose scope is the supervisor's to assign.** The single highest-value item is `ui/data-table/data-table.jsx:181` — a library component, so every consumer inherits the unnamed popover.

## Out of scope

A general dev-warnings framework; warnings for anything beyond missing accessible names. Toast a11y is task114.

## Outcome

Both `DialogContent` and `PopoverContent` resolve their part ids in a layout effect (before paint) and emit `aria-labelledby`/`aria-describedby` only for ids that **name something** — the element exists *and* carries either non-empty trimmed `textContent` or at least one child element. Existence alone was not enough: `<DialogTitle>{undefined}</DialogTitle>` renders an `<h2>` whose id resolves to an empty element, which is the same unnamed dialog the task set out to catch. Text alone was not enough either: an image-only title has a name (`alt`, `aria-label`) that `textContent` cannot see, and discarding a valid `aria-labelledby` would be a regression rather than a fix. Child elements that are all `aria-hidden="true"` are the exception — a decorative icon is invisible to AT — so an icon-only title warns like an empty one. A consumer `aria-label` or `aria-labelledby` in `...rest` counts as a name, judged per attribute so an empty one cannot mask a real one: it suppresses the warning and still wins the attribute through spread order. The dev warning is one `console.warn` per mounted instance inside `if (process.env.NODE_ENV !== "production")`, with the message inlined so rollup's dead-code pass removes the string, not just the call.

`AlertDialogContent` is `DialogContent` with three overrides, so `role="alertdialog"` gets the identical warning — never a softer one.

The layout effects carry no dep array on purpose: the parts can appear or disappear on any re-render, and `getElementById` is a DOM read that forces no layout. `setWired` bails out when nothing changed, so there is no render loop.

### Consumer sweep (sub-task 3)

Every dialog-family consumer in `ui/` already names its overlay, so the sweep found no gap to fix inside this task's `Owns`:

| Consumer | Name today |
|---|---|
| `ui/sheet` | pass-through; the name is the caller's `SheetTitle` |
| `ui/drawer` | pass-through; the name is the caller's `DrawerTitle` |
| `ui/alert-dialog` | pass-through; the name is the caller's `AlertDialogTitle` |
| `ui/command` | `CommandDialog` renders `DialogTitle` + `DialogDescription` from its `title`/`description` props (`ui/command/command.jsx:194-195`) — it never relied on the dangling id |
| `ui/sidebar` | mobile sheet renders an `sr-only` `SheetTitle` + `SheetDescription` (`ui/sidebar/sidebar.jsx:180-183`) |

### Findings outside this task's Owns

Every docs page was opened with the new warnings collected from the console. **No page emits the `<DialogTitle>` warning.** That is a weaker statement than "the dialog family is clean": `DialogContent`'s effect is guarded on `present`, because a closed dialog has not rendered its parts and so has nothing to read, and the sweep opened no dialogs. It establishes that no dialog the site mounts open is unnamed. `PopoverContent` has no such guard — its element is always in the DOM — so it reports on mount, and the popover half of the sweep is exhaustive. Seven `<PopoverTitle>` warnings fire, from three source locations, and all three are real gaps: a `role="dialog"` with no accessible name. All three sit outside this task's `Owns`, so they are reported, not fixed.

| Source | Warnings observed | Where |
|---|---|---|
| `ui/data-table/data-table.jsx:181` (`DataTableFacetedFilter`) | 2 | `#data-table`, and `#home` via `site/showcase/panels/support-panel.jsx:402` |
| `site/pages/date-input.jsx:88`, `:142` | 2 | `#date-input` |
| `site/pages/date-picker.jsx:96`, `:162`, `:213` | 3 | `#date-picker` |

`ui/data-table/data-table.jsx:181` is the one that matters most: it is a library component, so every consumer inherits the unnamed popover, and it is what makes the home page warn. The fix in each case is one `aria-label` on `PopoverContent`.

### Gap: the dead-code claim has no automated guard

Sub-task 4 asked for the production-build grep "as a unit check". It ships as a verify command instead, and that leaves a real gap: nothing in `npm test` fails if the warning strings start reaching consumers — swap `process.env.NODE_ENV !== "production"` for a runtime flag, or build under a bundler that does not substitute it, and both strings ship silently.

The reason is ownership, not cost. The `Owns` line was widened to name specific consumer files; no `tests/*.unit.mjs` is among them, and adding one is a rework trigger. The check to add is `tests/dev-warnings.unit.mjs`, asserting statically that every `console.warn` under `ui/` and `lib/` sits inside a `process.env.NODE_ENV !== "production"` guard — a text check, no build, milliseconds. Assigning that file is the supervisor's call.

### Note for future ad-hoc React roots in tests

`useId` is scoped per root but not namespaced across roots, so an extra `createRoot` in a test can mint an id the docs page already used. That is exactly what a titleless probe cannot survive: `getElementById` finds the docs page's title, and the warning goes quiet. The probes pass `identifierPrefix` for this reason, and it is why the popover probe failed once before that was added.
