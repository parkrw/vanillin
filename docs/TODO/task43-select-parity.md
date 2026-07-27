# task43: select-parity

**Goal:** Close the three deferred gaps in `ui/select`: item-aligned
positioning, scroll buttons, and constraint validation.
**Branch:** feat/select-parity
**Deps:** none (task 16 landed the popper-only base)

## Why

Task 16 shipped `ui/select` popper-only and said so in the log. The three
things it deferred are the ones that make a native-feeling select: the popup
opening with the *selected* item over the trigger, arrows when the list
overflows, and participating in `<form>` validation.

## Design decisions

- **`alignItemWithTrigger` is the hard one and it is opt-in.** Radix's
  `position="item-aligned"` translates the popup so the selected item sits on
  the trigger, then clamps to the viewport and switches to scroll-button mode
  when the list cannot fit. Implement it as a *mode* on the existing
  `useAnchorPosition` consumer, not a rewrite: measure the selected item's
  offset within the list, offset the popup by it, clamp, and record how much
  was clamped so the scroll buttons know there is content off-screen.
  **Default stays popper** — the current behaviour must not change for
  existing callers.
- **Scroll buttons are `SelectScrollUpButton` / `SelectScrollDownButton`** —
  upstream's exact names. They are not buttons in the a11y sense: `aria-hidden`,
  not focusable, and they scroll on *hover* (Radix's behaviour) as well as
  pointer-down-and-hold. Keyboard users never need them because arrow keys
  already scroll the active option into view.
  - Visibility is driven by scroll position: hide the up button at
    `scrollTop === 0`, the down button at the end. Use an `IntersectionObserver`
    on sentinel elements rather than a scroll handler — no rAF loop.
- **Constraint validation** means the select participates in native form
  validation without a hidden-input hack being visible to the consumer:
  - render a visually-hidden `<select>` (not `<input>`) mirroring the options,
    so `required`, `:invalid`, `form.checkValidity()` and form submission all
    work for free, and the value posts under `name`
  - keep it `aria-hidden` and `tabindex="-1"` — the real listbox owns
    accessibility
  - forward `required`, `name`, `form`, and `disabled` to it
  - expose `setCustomValidity` through the ref so a consumer can push a
    server-side error onto the field
  - **Gotcha:** a visually-hidden `<select>` must not be `display: none` or
    `hidden`, or it is excluded from form submission and validation entirely.
    Use the standard clip-rect hidden pattern.
- **Do not regress the dropdown race** fixed in task 16 — see the log entry
  before touching open/close ordering.

## Sub-tasks

- [ ] 1. `alignItemWithTrigger` positioning mode + clamp bookkeeping. Files:
  `ui/select/select.jsx`, `lib/use-anchor-position.js` (only if the mode
  genuinely cannot live in the consumer).
- [ ] 2. `SelectScrollUpButton` / `SelectScrollDownButton` + intersection-driven
  visibility. Files: `ui/select/select.jsx`, `ui/select/select.css`.
- [ ] 3. Constraint validation via a mirrored visually-hidden `<select>`;
  `name`/`required`/`form`/`disabled` forwarding and `setCustomValidity`.
  Files: `ui/select/select.jsx`, `ui/select/select.css`.
- [ ] 4. Demo sections for all three + registry stays as-is. Files:
  `site/pages/select.jsx`.
- [ ] 5. Test: item-aligned mode puts the selected item within a few px of the
  trigger; clamping at the viewport edge reveals the scroll buttons; buttons
  hide at each scroll extreme; a `required` empty select blocks
  `form.requestSubmit()` and reports invalid; the value posts under `name`;
  existing popper behaviour unchanged. Files: `tests/select.test.mjs`
  (extend — do not fork a second file).

## Verify / done

- `node tests/run.mjs` green (the existing select suite must stay green
  unmodified); `npm run build` clean.
- axe on the demo with the popup open in item-aligned mode — the mirrored
  native select is the likely source of a duplicate-name or hidden-focusable
  violation.
- Manual :5173 `#select`: open near the top and bottom viewport edges in both
  modes and under `dir="rtl"`.
