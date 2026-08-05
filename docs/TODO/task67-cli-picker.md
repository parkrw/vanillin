# task67: cli-picker
**Goal:** Interactive multi-select when `van add` gets no slugs.  **Branch:** feat/cli-picker  **Deps:** 38
**Owns:** `bin/van.mjs`, `tests/cli.unit.mjs`

## Sub-tasks
- [x] 1. Picker function — raw-mode ANSI multi-select with scrolling viewport; exported for testing; files: `bin/van.mjs`
- [x] 2. Wire into `cmdAdd` — replace the `fail()` at `bin/van.mjs:529` with picker call; `--yes` selects all not-installed; non-TTY falls back to error; files: `bin/van.mjs`
- [x] 3. Tests — state machine transitions (cursor, toggle, toggle-all, scroll, confirm, cancel), non-TTY fallback, `--yes` selects all; files: `tests/cli.unit.mjs`

## Design

When `van add` runs with no slugs and stdin is a TTY, show a scrollable multi-select:

```
van add — select components (space toggle, enter confirm, q cancel)

  [ ] accordion
  [ ] alert
> [x] button                    ← cursor, toggled
  ✓  card                       ← already installed, dimmed
  [ ] carousel
  ...

3 selected · ↑↓ move · space toggle · a all · enter confirm
```

Key bindings: `↑`/`↓` move cursor, `space` toggle (skip installed), `enter` confirm, `escape`/`q` cancel, `a` toggle all not-installed.

Viewport adapts to `process.stdout.rows` (default 20 if unavailable). Cursor movement scrolls the viewport when it reaches the edges.

Non-TTY: error with the existing message (piped stdin can't do raw mode).
`--yes`: select all not-installed, skip the picker entirely.

The picker is a render loop over raw-mode stdin. State is a plain object `{ cursor, selected, viewport }` so transitions are testable without a TTY. The render function writes ANSI to stdout; the key handler is pure: `(state, key) → state | null` (null = done).

## Verify / done
```
node tests/run.mjs cli
```
All CLI tests pass. Manual: `npx . add` in a project with some components installed shows the picker, toggles work, enter feeds selection into `planAdd`.

## Handoff

**Status:** DONE — all 3 sub-tasks complete, 41/41 CLI + 87/87 config-schema tests green.

- Picker: raw-mode ANSI multi-select with scrolling viewport (~90 lines). State machine is pure and exported for testing.
- `van add` with no args: shows picker (TTY), errors (non-TTY), or selects all (`--yes`).
- 9 new tests: state transitions (cursor wrap, toggle, toggle-all, scroll, confirm, cancel), render output, non-TTY fallback, `--yes` integration.
