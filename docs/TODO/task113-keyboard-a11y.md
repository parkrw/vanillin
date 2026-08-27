# task113: keyboard-a11y
**Goal:** Two `lib/` keyboard primitives fail structurally — roving focus dies on dynamic lists, the focus trap leaks the moment focus lands on `<body>`. Both are WCAG 2.1.1 failures with no visible symptom.  **Branch:** `fix/keyboard-a11y`  **Deps:** none
**Owns:** `lib/use-roving-focus.js`, `lib/use-focus-trap.js`, `tests/roving-focus.test.mjs` + `tests/focus-trap.test.mjs` (new), `site/pages/primitives.jsx` (only if a fixture is needed)

Line numbers measured 2026-08-27; re-verify before editing.

## Why these two together

They're the same class of defect: a keyboard mechanism that works on the static demo page and breaks under DOM change — which is why 700+ tests never caught either. Note `use-focus-trap` currently has **zero `ui/` consumers and zero tests** (modals ride native `<dialog>` focus containment instead), but it ships to consumers via `registry.json`, so it must either work or be unshipped; this task makes it work.

## Findings

### use-roving-focus: `tabIndex` synced once, never again
`lib/use-roving-focus.js:41` runs `syncTabIndexes(initialActive())` in an effect whose deps (`:89`) are `[ref, orientation, loop, selector]` — nothing about the item list. No MutationObserver, no re-run on children changing. Consequences:
- The item holding `tabIndex=0` unmounts → every remaining item is `-1` → the whole group (toolbar, tab bar, menubar) becomes unreachable by Tab.
- Newly appended items never receive a tab stop.

Fix: a MutationObserver on `childList` (subtree if the selector can match nested items) that re-runs the sync, preserving the active item when it still exists and falling back to the first item when it doesn't. Keep the observer cheap: sync only when the focusable set actually changed.

Also in this file, cheap and adjacent: `:50` calls `getComputedStyle(node).direction` **per keydown** (a forced style recalc per arrow press) and ignores `lib/direction.jsx` entirely — read it once per effect run (or take it from context) and cache.

### use-focus-trap: listens on the container, not `document`
`lib/use-focus-trap.js:49` (verified): `node.addEventListener("keydown", onKeyDown)`. Keyboard events only reach the handler while focus is *inside* the subtree. Delete the focused element, click non-focusable padding, or let anything move focus to `<body>`, and the next Tab walks straight out of the "trapped" layer. Radix listens on `document` for exactly this reason. Fix: document-level listener gated on `enabled`, containing focus back into the node when the event target is outside it.

Same file, same pass:
- The `FOCUSABLE` list (`:3-10`) omits `[contenteditable]`, `iframe`, `audio[controls]`, `video[controls]`, `summary`, `area[href]`, and matches `a[href]` even with `tabindex="-1"`. Fix the list and exclude explicit `-1`.
- `:25-28` filters on `el.offsetParent !== null`: misses `visibility: hidden` (stays "focusable") and excludes any `position: fixed` focusable (wrongly dropped), and forces a layout read per candidate per Tab. Use `checkVisibility()` where available with the current check as fallback.
- `:28` looks for `[autofocus]` — React's `autoFocus` prop never emits the attribute, so it can't match JSX usage. Document that (or accept a `initialFocus` ref option); don't silently keep a dead branch.

## Sub-tasks

- [ ] 1. Roving focus: list-change re-sync via MutationObserver + active-item preservation. Tests: (a) remove the active item → Tab reaches the group and Arrow keys work; (b) append an item → it's reachable; (c) assert the counter-precondition — before the fix, (a) leaves all items at `tabIndex="-1"` (pin as the red test).
- [ ] 2. Roving focus: hoist the per-keydown `getComputedStyle` direction read.
- [ ] 3. Focus trap: document-level listener + refocus-into-node when focus escapes. Test: open a trapped fixture, remove the focused element, press Tab, assert focus lands inside the trap (red before).
- [ ] 4. Focus trap: FOCUSABLE list + visibility filter fixes, with a fixture covering `contenteditable`, `tabindex="-1"` link, and a `position: fixed` child.
- [ ] 5. Both files get a browser test file — these are the first `tests/` for `use-focus-trap`; keep them driving the `site/pages/primitives.jsx` fixtures (extend that page if its demos don't cover the cases; the demo page is the test fixture, house rule).

## Verify / done

```sh
node tests/run.mjs roving-focus focus-trap primitives
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: all five tests red-then-green, no `ui/` component behavior changes (toggle-group/tabs/menubar ride `use-roving-focus` — their suites must stay green untouched), baseline unmoved.

## Out of scope

Typeahead and PageUp/PageDown in roving focus (ARIA parity, real, backlog); `use-return-focus` ordering guardrails; `use-dismissable-layer` stack ordering (backlog — interacts with `popover="auto"` double-dismiss and needs its own design note).

## Handoff

**Status:** NOT STARTED
