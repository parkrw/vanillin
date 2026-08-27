# task115: overlay-dev-warnings
**Goal:** A dialog or popover without a title should say so in the dev console instead of shipping an unnamed (worse: mis-pointed) accessible name.  **Branch:** `fix/overlay-dev-warnings`  **Deps:** none
**Owns:** `ui/dialog/dialog.jsx`, `ui/popover/popover.jsx`, `tests/dialog.test.mjs`, `tests/popover.test.mjs`

Line numbers measured 2026-08-27; re-verify before editing.

## Finding

`ui/dialog/dialog.jsx:86-88` and `ui/popover/popover.jsx:107-108` always emit `aria-labelledby={titleId}` / `aria-describedby={descriptionId}`. Those ids only exist in the DOM if the consumer rendered `DialogTitle`/`DialogDescription` (`PopoverTitle`/…). Omit the title and the attribute points at nothing — which **suppresses the fallback naming chain**, so the result is worse than omitting the attribute: a screen reader announces an unnamed dialog. Radix logs a dev warning for exactly this case; vanillin has **zero `console.warn` anywhere in `ui/` or `lib/`**, so nothing tells the developer.

Two independent fixes, do both:

1. **Don't emit a dangling reference.** After mount, if `document.getElementById(titleId)` is null, drop `aria-labelledby` (same for describedby). The attribute becomes truthful whether or not anyone reads the console.
2. **Warn once, dev-only.** `if (process.env.NODE_ENV !== "production")` — vite (docs site and every consumer bundler the CLI targets) statically replaces this; verify the production build strips it (`npm run build`, grep the output chunk). Message should name the component and the fix: `"<DialogContent> has no <DialogTitle>. Screen readers will announce an unnamed dialog — add a DialogTitle, or aria-label on DialogContent."` Warn once per mounted instance, not per render. Respect an explicit consumer-passed `aria-label`/`aria-labelledby` (via `...rest`) as satisfying the requirement — the conformance suite guarantees rest-spreading, so this must not fight it.

## Ripple check (thin re-exports)

`ui/alert-dialog` and `ui/sheet`/`ui/drawer` re-export dialog parts; `ui/context-menu`/`ui/menubar` re-export dropdown-menu, not popover — so the only re-export surfaces affected are the dialog family. `AlertDialog` *requires* a title by ARIA (`role="alertdialog"` must be named): its warning should not be softer than dialog's. Confirm `ui/command`'s dialog mode passes a label already (it renders a combobox inside a dialog — if it relies on the dangling id today, this task just found a real bug; fix it by passing `aria-label`).

## Sub-tasks

- [ ] 1. Dangling-id suppression in dialog + popover (post-mount check, state or ref-based; avoid a layout thrash — `getElementById` is fine).
- [ ] 2. Dev-only warn-once in both, honoring consumer `aria-label`/`aria-labelledby`.
- [ ] 3. Sweep the dialog family consumers (`sheet`, `drawer`, `alert-dialog`, `command` dialog mode, sidebar mobile) for instances that would now warn; fix any real gaps found (that's the point).
- [ ] 4. Tests: (a) titleless dialog has **no** `aria-labelledby` attribute (red today); (b) titled dialog keeps it; (c) consumer `aria-label` suppresses the warning path (assert the attribute outcome, not the console); production-build grep for the warning string as a unit check.
- [ ] 5. `npm run contracts`.

## Verify / done

```sh
node tests/run.mjs dialog popover sheet drawer alert-dialog command
npm run contracts && git diff --exit-code registry.json
npm run build && ! grep -r "has no <DialogTitle>" site/dist/assets
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: the four tests pass red-then-green, no docs-site page warns during `npm run dev` (the site is the dogfood — a warning there is a finding), baseline unmoved.

## Out of scope

A general dev-warnings framework; warnings for anything beyond missing accessible names. Toast a11y is task114.

## Handoff

**Status:** NOT STARTED
