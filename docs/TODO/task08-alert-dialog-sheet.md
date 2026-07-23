# task08: alert-dialog-sheet

**Goal:** AlertDialog and Sheet as thin reuses of the ui/dialog overlay recipe — different roles, dismissal rules, and visuals.
**Branch:** feat/alert-dialog-sheet  **Deps:** 07

## Design decisions

- **Reuse `DialogContent`** (toggle-group→toggle precedent): both render
  composite classes (`dialog alert-dialog`, `dialog sheet sheet--right`);
  their CSS overrides the centered dialog look via the higher-specificity
  `.dialog.sheet` / `.dialog.alert-dialog` compound.
- **DialogContent grows two internal props** (shadcn export names stay
  exact): `role` passthrough (alertdialog) and `dismissible` (default true;
  false = backdrop click ignored — alert-dialog must be answered).
- Esc still closes both (matches Radix). AlertDialog hides the X
  (`showCloseButton={false}`); Cancel precedes Action in DOM so native
  autofocus lands on the least-destructive button.
- **Exports** — AlertDialog, AlertDialogTrigger, AlertDialogPortal,
  AlertDialogOverlay, AlertDialogContent, AlertDialogHeader,
  AlertDialogFooter, AlertDialogTitle, AlertDialogDescription,
  AlertDialogAction, AlertDialogCancel; Sheet, SheetTrigger, SheetClose,
  SheetContent (side: top|right|bottom|left, default right), SheetHeader,
  SheetFooter, SheetTitle, SheetDescription.
- Sheet slides from its side (translate keyframes on the motion tokens),
  full height/width along that edge, square corners on the anchored edge.

## Sub-tasks

- [x] 1. alert-dialog — test: `role="alertdialog"`, no X button, backdrop
  click does NOT close, Esc closes, Action and Cancel close, aria
  title/description wired; files: `ui/dialog/dialog.jsx` (role +
  `dismissible`), `ui/alert-dialog/alert-dialog.jsx` + `.css`,
  `tests/alert-dialog.test.mjs`, `playground/pages/alert-dialog.jsx`,
  `playground/registry.js`.
- [x] 2. sheet — test: opens from side (`sheet--right` class + right edge
  flush), side="left|top|bottom" variants, X closes, backdrop click closes,
  aria wired; files: `ui/sheet/sheet.jsx` + `.css`,
  `tests/sheet.test.mjs`, `playground/pages/sheet.jsx`,
  `playground/registry.js`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#alert-dialog` + `#sheet` light/dark: alert dialog centers
  with no X and survives backdrop clicks; sheet slides in from each side
  (emulate `prefers-reduced-motion: no-preference`).
