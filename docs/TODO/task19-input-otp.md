# task19: input-otp

**Goal:** One-time-code field — one real `<input>` behind rendered slots.
**Branch:** feat/input-otp (stacked on feat/command — shared registry.js)
**Deps:** none

## Design decisions

- **Live anatomy verified 2026-07-25:** upstream wraps `input-otp`
  (guilhermerodz): InputOTP, InputOTPGroup, InputOTPSlot,
  InputOTPSeparator. Root props `maxLength`, `value`/`onChange` (the string,
  not an event), `pattern`, `disabled`, plus upstream's `onComplete`,
  `textAlign`, `containerClassName`. Slots take `index` and honour
  `aria-invalid`. Pattern constants re-exported: REGEXP_ONLY_DIGITS,
  REGEXP_ONLY_CHARS, REGEXP_ONLY_DIGITS_AND_CHARS.
- **One transparent input over the slots** (upstream's trick): native
  caret/selection/IME/`autocomplete="one-time-code"` and the OS SMS
  autofill keep working, while the boxes are plain divs mirroring
  `value[index]`. `inputMode` follows the pattern (numeric for digits-only).
- **Slots come from context**, upstream-style: `{ char, isActive,
  hasFakeCaret }` per index. `isActive` = focused and the index inside the
  input's selection; `hasFakeCaret` = active, collapsed caret, empty slot —
  the real caret is invisible so a CSS-blinked bar stands in (reduced-motion
  guard).
- **Caret lands at the end of the typed value** on focus and on click
  (upstream parity): slots are not individually clickable, so typing always
  appends and there is no hole-in-the-middle state. Arrows/Backspace/Delete
  are native input behavior; the selection listener just re-renders slots.
- **Pattern rejects, it does not sanitize:** a change whose whole new value
  fails the regex is dropped (upstream), so pasting "12a4" into a
  digits-only field leaves the value untouched rather than filtering chars.
- `onComplete` fires when a change fills the last slot.

## Sub-tasks

- [x] 1. input-otp — test: typing fills slots + active slot/fake caret,
  maxLength cap, digits-only pattern rejects letters, Backspace clears,
  paste-style fill + onComplete, click focuses and parks the caret at the
  end, arrows move the active slot, disabled ignores input, aria-invalid
  slots; files: `ui/input-otp/input-otp.jsx` + `.css`,
  `tests/input-otp.test.mjs`, `site/pages/input-otp.jsx`,
  `site/registry.js`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual :5173 `#input-otp` light/dark: slot borders join cleanly, focus
  ring on the active slot, caret blink, separator, invalid state.
