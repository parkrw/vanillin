# task56: forced-colors

**Goal:** The kit works in Windows High Contrast and honours
`prefers-contrast` and `prefers-reduced-transparency`.
**Branch:** feat/forced-colors
**Deps:** none (but do this after 33/34/35 if they are in flight — a tokenized
kit is far cheaper to sweep)

## Why

Forced-colors mode replaces every author colour with a system palette. A kit
built entirely on `color-mix` and custom properties — as this one is — loses
every visual distinction at once: borders vanish, focus rings vanish, the
"selected" state becomes invisible. It is the accessibility mode that silently
breaks design systems, and nothing in the suite currently checks it.

## Design decisions

- **Forced colors is a *repair* pass, not a theme.** Do not author a third
  colour scheme. In `@media (forced-colors: active)`, the job is narrow:
  1. restore borders that were doing the visual work of a background —
     `border: 1px solid CanvasText` where a surface was distinguished only by
     fill (cards, popovers, menus, toasts, badges, the sidebar)
  2. `forced-color-adjust: none` **only** where colour carries irreplaceable
     meaning — the status dots from task 32, chart-ish fills — and pair it
     with a non-colour cue (shape, text) because the whole point is that
     colour is unreliable
  3. use system colour keywords for state: `Highlight` / `HighlightText` for
     selected, `GrayText` for disabled, `LinkText` for links, `AccentColor`
     where supported
  4. make focus visible: forced-colors kills `box-shadow`, which is how most
     of the kit draws focus rings. Every focus style needs an `outline`
     fallback here — this is the single highest-impact item in the task.
- **`prefers-contrast: more`** is a lighter touch: raise border opacity to
  full, drop decorative `color-mix` transparency on interactive surfaces,
  thicken focus outlines. It does **not** replace the palette.
- **`prefers-reduced-transparency`** — swap every translucent surface
  (dialog/sheet/drawer overlays, glassy popovers, hover `color-mix(… ,
  transparent)` states) for the opaque equivalent. Cheap, and it also fixes
  the readability complaint people have about overlay scrims.
- **Where the rules live:** one `styles/forced-colors.css` imported by
  `globals.css`, not scattered across 60 component files. Rationale: the
  overrides are cross-cutting and need to be readable as a set; a reviewer
  must be able to see the whole high-contrast story in one file. Component
  files stay about the component.
  - The exception is any component that needs `forced-color-adjust: none` —
    put that with the component and comment why.
- **Testing this is the hard part.** Playwright can emulate `forced-colors`
  (`page.emulateMedia({ forcedColors: "active" })`) and `contrast`, but it
  does *not* apply a Windows palette in headless Chrome on macOS. So assert
  what is assertable: that the media query matched and the repair rules
  applied (computed `border-style`, `outline-width`, presence of
  `forced-color-adjust`), not the resulting colours.

## Sub-tasks

- [ ] 1. Audit: enumerate every place a background-only distinction, a
  `box-shadow` focus ring, or a translucent surface carries meaning. Write the
  list into the task file before fixing anything — it is the checklist for
  sub-tasks 2–4.
- [ ] 2. `styles/forced-colors.css` — borders, system colour keywords, and
  outline-based focus for every focusable family. Files:
  `styles/forced-colors.css`, `styles/globals.css` (import only).
- [ ] 3. `prefers-contrast: more` and `prefers-reduced-transparency` blocks.
  Files: `styles/forced-colors.css`.
- [ ] 4. Per-component `forced-color-adjust: none` where colour is the
  message, each with a non-colour cue and a comment. Files: whichever the
  audit named (expect `ui/status-dot`, `ui/progress`, `ui/slider`).
- [ ] 5. Test: under emulated `forced-colors: active`, a representative
  surface from each family has a visible border and every focusable family
  has a non-zero `outline-width` on focus; under
  `prefers-reduced-transparency`, no overlay computes to a translucent
  background. Files: `tests/forced-colors.test.mjs`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- Manual sweep of 6–8 dense demo pages under emulated forced-colors: nothing
  invisible, nothing indistinguishable from its container, focus always
  visible.
- Confirm the normal (non-forced) rendering is byte-identical — this task must
  not change the default appearance at all.
