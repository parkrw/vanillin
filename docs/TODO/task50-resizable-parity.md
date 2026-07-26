# task50: resizable-parity

**Goal:** Close the react-resizable-panels gaps left by task 25 — persistence,
the callback surface, F6 cycling, and generous hit areas.
**Branch:** feat/resizable-parity
**Deps:** none (task 25 landed the v4 anatomy)

## Design decisions

- **`autoSaveId` + storage.** A panel group with `autoSaveId="console"`
  persists its layout and restores it on mount.
  - Default storage is `localStorage`; accept a `storage` prop matching the
    `{ getItem, setItem }` shape so SSR and cookie-backed storage work. Never
    touch `localStorage` at module scope — that breaks SSR outright.
  - **First paint must not flash the default layout.** Read storage in a
    layout effect before paint, or render with `visibility: hidden` until the
    saved layout is applied. A visible snap is worse than no persistence.
  - Persist **percentages**, not pixels, keyed by the group's panel ids and
    count — a saved layout for a 3-panel group must not be applied to a
    2-panel group. Version the stored value and drop it on mismatch.
  - Writes are debounced (~100ms); dragging must not hammer storage.
- **`onResize` / `onCollapse` / `onExpand` already exist as props on
  `ResizablePanel` (lines ~246) — verify they actually fire** before building
  on them. The parity gap may be in *when* they fire: `onResize` must fire on
  every layout change including keyboard and programmatic ones, not just drag,
  and must not fire on mount with the initial size (react-resizable-panels
  does not).
- **Imperative handle.** `ResizablePanel` exposes `collapse()`, `expand()`,
  `resize(pct)`, `getSize()`, `isCollapsed()` via ref; `ResizablePanelGroup`
  exposes `setLayout(number[])` and `getLayout()`. This is how a console
  drives a panel from a toolbar button, and it is what makes `autoSaveId`
  testable.
- **F6 cycling** moves focus between panel groups' separators, matching the
  WAI-ARIA window-splitter pattern. Scope: F6 cycles forward through the
  separators of the *nearest* group, Shift+F6 backward, wrapping. Do not make
  it document-global — that hijacks a browser shortcut across the whole page.
- **`hitAreaMargins`** — `{ coarse, fine }` in px (react-resizable-panels'
  exact prop), defaulting to `{ coarse: 15, fine: 5 }`. Implement with a
  pseudo-element overlay on the separator, not by growing the separator box,
  so layout is unaffected. Select the margin from
  `matchMedia("(pointer: coarse)")`, re-evaluated on change — a tablet that
  gains a mouse must update.
  - The enlarged hit area must not swallow clicks on adjacent panel content:
    it is `pointer-events: auto` only on the separator's own overlay, and the
    overlay must sit *above* nothing else interactive.

## Sub-tasks

- [ ] 1. Imperative handles on panel + group, and the `onResize`/`onCollapse`/
  `onExpand` firing-condition audit. Files: `ui/resizable/resizable.jsx`.
- [ ] 2. `autoSaveId` + pluggable storage, versioned/keyed payload, debounced
  writes, no-flash restore. Files: `ui/resizable/resizable.jsx`.
- [ ] 3. F6 / Shift+F6 separator cycling scoped to the group. Files:
  `ui/resizable/resizable.jsx`.
- [ ] 4. `hitAreaMargins` overlay + pointer-coarse detection. Files:
  `ui/resizable/resizable.jsx`, `ui/resizable/resizable.css`.
- [ ] 5. Demo sections. Files: `playground/pages/resizable.jsx`.
- [ ] 6. Test: layout survives a remount with the same `autoSaveId` and is
  ignored on a panel-count change; `onResize` fires for keyboard and
  imperative changes but not on mount; `collapse()`/`expand()` round-trip;
  F6 walks separators and wraps; a pointer-down 10px off a separator still
  starts a drag under coarse pointers but not under fine. Files:
  `tests/resizable.test.mjs` (extend).

## Verify / done

- `node tests/run.mjs` green (existing resizable suite unmodified);
  `npm run build` clean.
- Clear `localStorage` between manual runs; confirm no flash of the default
  layout on reload with a saved non-default one.
- Confirm nothing writes to storage when `autoSaveId` is absent.
