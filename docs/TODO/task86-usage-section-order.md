# task86: usage-section-order
**Goal:** Every component page opens with a leading Default demo section, with Usage (opening on the Code tab) as the section immediately after it — and Usage is the only section that opens on Code.  **Branch:** `docs/usage-order`  **Deps:** none
**Owns:** `site/pages/**`

User request 2026-08-16: "I ONLY want usage section to be code on page load and I want it the section after leading default card/section."

## What already holds

- 61 pages carry `defaultTab="code"` and only Usage sections use it; no other section opens on Code (verified 2026-08-16). Half of the request is a **guard**, not a change — do not add `defaultTab="code"` anywhere else.
- What varies is **position**: task 82's viewport-test fix pushed Usage after the tested demo on 16 pages, other pages (e.g. `button`, `drawer`) lead with Usage directly, some have no distinct Default section at all.

## Target shape per page

1. h2 + intro + `InstallSnippet`
2. **Default** — one representative demo in a `ComponentPreview` (opens on Preview)
3. **Usage** — imports + JSX, `defaultTab="code"`
4. everything else unchanged

## Sub-tasks

- [ ] 1. **Sweep script first.** Extract per-page `<h3>` order + which section carries `defaultTab="code"`; emit the violator list. Work from that list, not memory.
- [ ] 2. Pages leading with Usage: add or promote a Default section above it (often the Usage demo itself, duplicated as a preview-tab section with distinct ids/labels).
- [ ] 3. Pages where the tested fixture leads (task 82 moved these): the fixture **becomes** the Default section where possible. Where the fixture cannot lead (see gotchas), keep it first and put Default+Usage after it — tests win over shape; note each exception in this file.
- [ ] 4. Verify: full suite at baseline 760/762, `grep` that `defaultTab="code"` count per page is ≤1 and only on Usage.

## Gotchas (inherited from task 82 — each cost a debugging session)

- **Raw-coordinate tests**: `context-menu` (11 tests drive `page.mouse` at `boundingBox()` coords), `resizable` (`r-horizontal`), `scroll-area` (`sa-vertical`), `toast` — adding height above their fixtures pushes them past the 720px viewport and fails them. These pages' tested fixture stays first unless the test is fixed (tests/** is out of scope).
- `TabsContent` returns `null` when inactive: a `defaultTab="code"` Usage demo is **not in the DOM** — never let a tested selector point into Usage.
- `accordion` tests index `.accordion` by `.first()`/`.nth(1)` — new sections go after Multiple.
- No duplicate visible button labels on a page (Playwright strict mode); `empty.jsx`'s Default demo stays outside a preview (ISSUES H3).
- Unescaped `${…}` inside a `code={` template literal unmounts the app; grep `(?<!\\)\$\{` after any batch edit.

## Handoff

**Status:** NOT STARTED
