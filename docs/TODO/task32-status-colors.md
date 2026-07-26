# task32: status-colors

**Goal:** Badge gains built-in status variants; a new `ui/status-dot`
component covers the "green/amber/red pip" pattern every console needs.
**Branch:** feat/status-colors
**Deps:** none (tokens already exist)

## Design decisions

- **The tokens already landed in task 23.** `styles/globals.css` has full
  `--success` / `--warning` / `--info` / `--destructive` families in both
  modes, each with `-foreground`, `-background`, `-border`. This task spends
  them; it does not define new colour.
- **Badge variants:** add `success`, `warning`, `info` alongside the existing
  `default | secondary | destructive | outline`. The JSX needs **no change** —
  `variant !== "default" && \`badge--${variant}\`` already passes any string
  through. This is CSS plus a doc comment.
- **Solid or soft?** Use the **soft** treatment — `background:
  var(--success-background)`, `color: var(--success-foreground)`, `border:
  1px solid var(--success-border)`. Rationale: badges cluster in table rows,
  and a row of saturated solid pills is unreadable at density. The existing
  `destructive` badge is solid, so keep it as-is for back-compat and add
  `destructive-soft`; note the inconsistency in the docs rather than making a
  breaking change.
- **`ui/status-dot` is its own component, not a badge modifier.** It is used
  without a label (in a table cell, next to a resource name) and needs to work
  at 6–10px where a badge's padding and font tokens are meaningless.
  - Anatomy: `StatusDot` only. `status` prop
    (`success | warning | error | info | neutral | pending`), `size`
    (`sm | default | lg`), optional `label`.
  - **Accessibility is the whole point of getting this right.** Colour alone
    fails WCAG 1.4.1. Default to `role="img"` with an `aria-label` derived
    from `status` (overridable via `label`); when the dot sits next to visible
    text that already names the state, callers pass `label={null}` to get
    `aria-hidden`. Document both.
  - **`pending` animates** — a slow pulse, `var(--motion-medium)` scaled up,
    behind a `prefers-reduced-motion` guard. Indeterminate loop, so per the
    HANDOFF motion rule it does **not** take `--motion-scale`.
  - Optional `ring` prop draws a soft halo (`color-mix(in oklab, … 20%,
    transparent)`) — the "live" look consoles use for running instances.
- **`error` vs `destructive`:** status-dot uses `error` because that is what
  the state is called in a console; it maps to the `--destructive` tokens.
  Badge keeps `destructive` for upstream parity. Intentional divergence — note
  it in both doc comments.

## Sub-tasks

- [ ] 1. Badge status variants + demo section. Files: `ui/badge/badge.css`,
  `ui/badge/badge.jsx` (doc comment only),
  `playground/pages/badge.jsx`.
- [ ] 2. `ui/status-dot` + demo page + registry entry. Files:
  `ui/status-dot/status-dot.jsx` + `.css`,
  `playground/pages/status-dot.jsx`, `playground/registry.js`.
- [ ] 3. Test: each badge variant resolves to its token pair (assert computed
  colour, not class); status-dot exposes `role="img"` + label by default,
  `aria-hidden` with `label={null}`, `data-status` per state, pulse animation
  present on `pending` and absent under emulated `prefers-reduced-motion`.
  Files: `tests/status-dot.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- axe contrast check on every badge variant and dot in **both** modes — the
  warning family is the risky one (amber on light backgrounds).
- Manual :5173 `#badge` / `#status-dot` light and dark.
