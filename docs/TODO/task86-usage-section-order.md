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

- [x] 1. **Sweep script first.** Extract per-page `<h3>` order + which section carries `defaultTab="code"`; emit the violator list. Work from that list, not memory. → `scripts/sweep-section-order.mjs`, rerunnable.
- [x] 2. Pages leading with Usage: add or promote a Default section above it (often the Usage demo itself, duplicated as a preview-tab section with distinct ids/labels).
- [x] 3. Pages where the tested fixture leads (task 82 moved these): the fixture **becomes** the Default section where possible. Where the fixture cannot lead (see gotchas), keep it first and put Default+Usage after it — tests win over shape; note each exception in this file.
- [x] 4. Verify: full suite at baseline 760/762, `grep` that `defaultTab="code"` count per page is ≤1 and only on Usage.

## What the sweep found, and the exceptions it leaves

**68 of 75 pages now read Default → Usage, and all 69 `defaultTab="code"` occurrences are on a Usage section, one per page.** Seven pages are deliberate exceptions:

- `home.jsx` and the five **system pages** (`container-queries`, `density`, `primitives`, `typography`, `view-transitions`) have no Default/Usage section and are not getting one. They carry no `InstallSnippet` and no `ApiReference` — they are the alternative page type task 82 licensed for documenting a system rather than a component, and a `van add` snippet would be a lie on all six.
- `navigation-menu.jsx` puts Usage **third**: `Default | Per-item popover mode | Usage | Controlled`. Task 83's regression test requires the open viewport panel to overlap the *later* menu's trigger row, and a Usage section between them separates the two fixtures by ~430px — more than any shortening of the code block can recover. Tests win over shape.

**The task file's "no other section opens on Code" claim was wrong.** `message-scroller.jsx` carried `defaultTab="code"` on five non-Usage sections whose previews were placeholder sentences. They are now plain `CodeBlock`s: prose about a mechanism, not a demo, so a Preview tab was never the right control.

**Two fixtures needed geometry work** (the task-82 720px trap, in both directions):

- `slider.jsx` — inserting Usage at index 1 pushed `Range (two thumbs)` to y=746 and `slider.test.mjs`'s `clickAt` uses raw `boundingBox()` coords with no scroll. Dropping the Default section's description paragraph (its keyboard prose moved to a new `Keyboard` section at the foot of the page) brings Range back to y=690. **Margin is ~30px — task 85 owns `site/site.css` and any column-width change will move this.**
- `resizable.jsx` and `scroll-area.jsx` kept their raw-coordinate fixtures leading; the fixture itself was renamed to `Default` (`Horizontal` / `Vertical`), which adds no height. `progress.jsx` likewise: `Default (animates 13 → 66)` → `Default`.

**Three pages needed a real Default demo written**, because their Usage preview's children were the placeholder "See the live demos below." — `calendar` and `carousel` promoted their first real fixture (`cal-single`, `c-basic`), and `data-table` got a new minimal `DefaultDemo` (4 rows, 3 columns, no sorting UI). Its tests all scope to a `data-pg` root, so the extra table above them is safe.

## Gotchas (inherited from task 82 — each cost a debugging session)

- **Raw-coordinate tests**: `context-menu` (11 tests drive `page.mouse` at `boundingBox()` coords), `resizable` (`r-horizontal`), `scroll-area` (`sa-vertical`), `toast` — adding height above their fixtures pushes them past the 720px viewport and fails them. These pages' tested fixture stays first unless the test is fixed (tests/** is out of scope).
- `TabsContent` returns `null` when inactive: a `defaultTab="code"` Usage demo is **not in the DOM** — never let a tested selector point into Usage.
- `accordion` tests index `.accordion` by `.first()`/`.nth(1)` — new sections go after Multiple.
- No duplicate visible button labels on a page (Playwright strict mode); `empty.jsx`'s Default demo stays outside a preview (ISSUES H3).
- Unescaped `${…}` inside a `code={` template literal unmounts the app; grep `(?<!\\)\$\{` after any batch edit.

## Handoff

**Status:** COMPLETE
**Branch:** `docs/usage-order`  **PR:** #7 (open)  **Updated:** 2026-08-16

- **Landed:** 68 of 75 pages open with a Default demo and carry Usage immediately after it; all 69 `defaultTab="code"` occurrences are on a Usage section, one per page. The seven exceptions and why they hold are in the section above.
- **Repo state:** clean, 4 commits pushed. `scripts/sweep-section-order.mjs` reruns the guard.
- **Next:** task 84 (`token-guard`) — 85 is in flight in a sibling worktree and 74 collides with its `Owns`.
- **Gotchas:** `slider.jsx`'s `Range` fixture sits ~30px above the 720px fold. **Task 85 owns `site/site.css`** — a column-width or section-spacing change will move it, and `slider.test.mjs`'s `clickAt` reads raw `boundingBox()` coords with no scroll, so it fails silently-looking ("upper follows click expected 90, got 75"). Re-run `node tests/run.mjs slider` after 85 merges.
- **Baseline correction:** the full suite on this machine is **759/762**, not 760/762. The third failure is `navigation-menu: hover opens after delay` — verified not ours by restoring the original `navigation-menu.jsx` and re-running the full suite, which failed identically.
