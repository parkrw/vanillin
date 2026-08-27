# ISSUES

Running list. Nothing here is scheduled; triage into `docs/TODO/` when a batch
is planned. Items marked **verified** were checked against the tree at
`b83903a91cda`; the rest are as-reported and need reproduction.

**Re-check line numbers before acting.** Task 64 landed on `main`
(`6c0e1b58cf1a`) after most of this was written, and it moved code in
`ui/select`, `ui/combobox` and `ui/data-table`.

---

> ## ✅ THE SWEEP IS FINISHED (task 71, 2026-08-01)
>
> All **79 routed pages** — every `site/pages/*.jsx` plus the five `docs/`
> pages — were swept in light **and** dark, not just the 42 the banner used to
> name. Two committed tools did the measuring and both are rerunnable:
> `scripts/sweep-pages.mjs` (axe text contrast, cursor affordance, console
> errors, overflow, geometry) and `scripts/contrast-nontext.mjs` (the non-text
> contrast axe structurally cannot see).
>
> **Every finding below carries the number that produced it.** New items are
> D9–D12, F5–F6, C7–C8, K1, I2. The headline is that the D family collapses
> into **two token defects**, not eight component ones — see D9.

---

## A. Product direction

### A1. ~~"Playground" needs a real name~~ — DONE

`playground/` → `site/` on `refactor/site-rename`. `playground.css` →
`site.css`, `root: "site"` in `vite.config.js`, all paths and prose updated
across code, tests and docs. Suite 667/667, build clean.

**Naming decision:** there is no separate site brand. The product is
**vanillin**, the CLI and config are **`van`**, and the documentation site is
just the product's site — the way upstream, Radix and Base UI all do it. A
sub-brand ("Van Kit", "Workbench") is the pet-project tell we were trying to
remove. `<title>` is now `vanillin`.

**Deliberately not renamed:** the `pg-` CSS prefix and `data-pg` test hooks.
They are internal, invisible to consumers, and renaming them would touch every
CSS rule and every test selector for no user-facing gain. Optional follow-up if
someone wants total consistency — do it alone, like task 64.

### A2. The whole docs site should be built out of vanillin

The kit documents itself badly. Concretely:

- **Get Started is bland.** It should be the showcase — built from the kit.
- **Use `ui/breadcrumb`** in the site shell.
- **Use `ui/navigation-menu`** in the site shell.
- **Buttons everywhere are raw `<button>`/`pg-` classes, not `ui/button`.**
  Verified — at minimum `site/pages/` `combobox`, `carousel`, `command`,
  `form`, `form-fields`, `primitives`, `resizable`, `select`, `use-form`,
  `view-transitions`. This is the single most visible credibility problem: the
  kit's own docs don't use the kit. If it must wait, fine, but it must happen.
- **The primitives page has no clear purpose** and its buttons are the worst of
  them. Decide what it is for or delete it.

### A3. Every component page needs code examples

Match upstream's structure: rendered example **and** its source, side by side,
for every variant — the way their Field page does it. Today most pages show the
component and describe it in prose. **All components**, no exceptions.

### A4. Typography / typeset system

Ref: <https://ui.shadcn.com/docs/typeset> — "A styling system for HTML and
rendered markdown, from blog posts to streaming chat. One CSS file you own."

How theirs works:

- A generated `typeset.css` the consumer copies in and owns, imported after
  the framework CSS.
- One base `.typeset` class driven by three rhythm variables —
  `--typeset-size` (base text size, default `1em`), `--typeset-leading` (line
  height), `--typeset-flow` (block spacing). Every element's spacing and
  sizing derives from those three.
- Fonts come from `--typeset-font-body` / `-heading` / `-mono`, inherited from
  the theme.
- Styles markdown output wholesale: headings, paragraphs, lists, tables, other
  block elements — no per-element classes.
- **Presets** are extra classes layered on the base: `.typeset .typeset-docs`
  (roomier), `.typeset-chat` (compact). A consumer defines as many as they
  need.
- Opt-out per element via `.not-typeset` / `data-not-typeset`.
- A web builder generates the file (font + rhythm picker).

Fit for us: very good, and it lands almost for free — the three-variable
rhythm model is the same shape as our `--density-scale`, and generating a CSS
file from a config is exactly what `scripts/` already does for `van.css` and
`defaults.css`. Likely a `typeset` block in `van.config.json` plus a generator
target, not a new subsystem.

Use it for the docs site's own prose (see A3 — the rendered half of every code
example). Whether consumers get it as a shipped feature is a separate call.

### A5. Stop borrowing upstream's exact copy

Alert-dialog wording is the clearest case, but it is everywhere. The kit is
similar to upstream, not the same, and reads as a clone when the prose is
identical. Write vanillin's own copy. (Note the existing rule: shadcn is named
**only** on the introduction page; everywhere else says "upstream".)

---

## B. Docs gaps that read as missing features

### B1. Per-component config is undocumented — the feature already exists

**Verified.** `van.config.json` accepts `components.<slug>.tokens`,
`.variants` and `.sizes` (`scripts/config-schema.mjs:301-345`), and the sample
config in the repo root already defines a `brand` button variant and an `xs`
button size. **None of this appears anywhere in the docs.**

So the answer to "how do I add a button variant / change a component's padding
/ border colour / radius?" is: you already can, and nobody can find out how.

Required:

- A real config reference page — every key, with examples.
- On **`ui/button`**: how to add variants and sizes. Then the same for every
  other component that supports it.
- Make clear this is **file-based** (`van.config.json`), the way consumers
  expect from `components.json` — not something you do through the CLI. The
  CLI (task 38) consumes the file; it is not the interface.
- Cover the theme-level knobs too: density, radius, motion, fonts, brand,
  per-mode colour overrides.

### B2. Density page needs code examples

It explains the concept and shows none of the code. Upstream-style examples.

### B3. `ui/command` is unexplained

Nobody can tell from the page:

- How to wire your own site actions into it.
- What the search actually searches — the whole site, or just registered
  commands? (Just the items, but the page never says so.)
- **Feature request:** an opt-in that pulls navigation-menu links in as
  redirect actions, so a consumer gets site navigation in the palette for free.

### B4. `ui/drawer` swipe-to-dismiss is undiscoverable

Is it touch-only? A user has no way to know it exists. Needs a visible
affordance (upstream/vaul use a grab handle) and a line of docs.

### B5. Form docs recommend zod + `@hookform/resolvers` without mentioning ours

**Verified.** `site/pages/form.jsx:508-514` and
`site/pages/use-form.jsx:396-431,598` point consumers at
`@hookform/resolvers` + `zod`. Task 62 shipped **`lib/schema.js` +
`schemaResolver`** — zero-dep, zod-shaped. Ours should be the recommendation;
zod and RHF stay as proof the resolver contract is compatible.

### B6. Clarify `ui/form` vs `ui/form-fields`

The user's read — "form-fields is our version of upstream's Form" — is roughly
right and the docs don't say it plainly. `ui/form` is the engine-agnostic
primitive layer (never imports the engine, stays copyable); `ui/form-fields` is
the bound layer over `lib/use-form.js`. Say so at the top of both pages.

---

## C. Confirmed code bugs

### C1. ~~`ui/select` swallows ARIA props — a11y~~ — FIXED (`a87ce88ff4a9`)

Fixed on `main` by task 64's props-rest work, after this list was written.
`Select` and `Combobox` now forward leftover root props to the trigger/input,
four `data-table` parts spread rest, and **conformance enforces the rule** with
a reasoned provider allowlist — so a future dropped ARIA prop fails loudly,
which is exactly what was asked for. `tests/form.test.mjs` gained coverage.

Residual, still open: `site/pages/form.jsx:140-155` **still wraps `FormControl`
around `<Select>` rather than `<SelectTrigger>`.** Harmless now that the props
forward, but it teaches the wrong pattern on the page consumers copy from. The
rewrite is written out in `docs/TODO/reports/task59.md`.

### C2. ~~`useFormContext()` throws and `FormContext` is not exported~~ — FIXED (`3bbd2bb318d7`)

Both were done: `FormContext` is exported and `useFormContextSafe()` returns
`null` outside a provider. `useBoundControl`'s `try/catch` is gone.

Found while fixing it: **the `FormProvider` path of `useBoundControl` was
covered by no test at all** — every `form-fields` demo passed `control`
explicitly, so the branch this issue is about ran nowhere in the suite. The fix
adds a provider-path demo (`site/pages/form-fields.jsx`, "Without a control
prop") and cases for both paths.

### C3. ~~Stray `htmlFor` on radiogroup labels~~ — FIXED (`b730bab4e43a`)

`FormItem` gained a `grouped` flag: `FormLabel` drops `htmlFor` and takes an
id, `FormControl` points `aria-labelledby` at it. `RadioGroupField` sets it.
The flag has to be declared by an ancestor — `FormLabel` renders before
`FormControl` and cannot learn what the control turns out to be.

`ui/form-fields`' own `aria-labelledby` resolves to the same id and was left in
place, per the task file. Its comment now says why it is redundant.

### C4. ~~Data-table column resize overlaps row content~~ — FIXED (`6f1470ab2948`)

Cause confirmed by measurement: `table-layout: fixed` hands each column a width
but no clip, so a cell wider than its column painted over the next one. Before
the fix a 40px `id` cell measured `box [234,274]` with `text [246,308]` — 34px
into a neighbour that starts at 274.

Fixed with `overflow: hidden` + `text-overflow: ellipsis` + `white-space:
nowrap` on `.data-table-sized .table-cell`, plus a stand-down in the stacked
container block (a card is as wide as the row, so a long value must wrap).

Two corrections to the original prescription: **`white-space: nowrap` is
required** — without it anything containing a space wraps to a second line
instead of clipping per character — and **`min-width: 0` is not**, because a
`<td>` under `table-layout: fixed` takes its width from the column and ignores
content min-width. **Body cells only**: `overflow: hidden` on a `<th>` clips the
resizer handle, which sits 2px outside the header box
(`data-table.css:239`).

### C5. ~~`ui/attachment` group scroll drops the outer edge borders~~ — FIXED (`ff6cac152716`, `6a18d1e31d51`)

Not related to D3. The edge-fade `mask-image` reaches `transparent` at both ends
of the group, so the first and last card's outer border was painted at ~0 alpha
— measured as a 1/255 channel delta against the card background, versus 26 for
an interior card.

Fixed by insetting `.attachment-group-viewport` by the fade width
(`--attachment-group-fade`, extracted from the four hard-coded `1rem` stops) so
a resting card edge lands where the gradient is fully opaque.
`scroll-padding-inline` matters as much as `padding-inline`: `scroll-snap-type:
inline mandatory` aligns card starts to the snapport, so padding alone would
have fixed the resting position at `scrollLeft: 0` and re-broken every other
snap point. The Chrome compositing workaround is untouched.

`tests/attachment.test.mjs` is new — the component had no browser suite at all.
Its border cases sample **painted pixels**, because a masked border still
reports full `border-width` in `getComputedStyle`, which is why this bug
survived.

### C6. ~~The sized data-table demo renders every `email` cell empty~~ — FIXED in task 72

`flexRender` now falls back to the context's `getValue()` when the cell def is
undefined, matching tanstack's default cell — fixes every consumer who omits
`cell`, not just the demo. Asserted by the data-table suite.

Found while fixing C4, not fixed. `site/pages/data-table.jsx:224-229` declares
`accessorKey: "email"` with no `cell` renderer, and this repo's `flexRender`
(`lib/use-data-table.js:7-10`) returns `null` when the renderer is undefined —
there is no tanstack-style default cell. So the whole `email` column in the
"Column sizing & pinning" demo is blank. Either the demo needs a `cell`, or
`flexRender` should fall back to the accessor value; the second is a component
decision, since it changes behaviour for every consumer who omits `cell`.

### C7. Adjacent `<span>`s on the use-form page render as one unreadable token

`site/pages/use-form.jsx:205` renders the dirty flag and two JSON objects as
three sibling `<span>`s with no separator, so the page shows **`false{}{}`**.
`site/pages/use-form.jsx:524` does the same with two booleans and shows
**`falsetrue`**. Both are in state-inspection demos, which is exactly where a
reader is trying to read a value. Docs-page markup, not a component bug.

### C8. The Density section of the input page renders no inputs

`site/pages/input.jsx:41` — heading and explanatory paragraph, then no
`<Input>`. Every other section on that page renders at least one, so it reads
as a broken demo rather than a prose aside. Compare `site/pages/density.jsx`,
which shows the same idea with controls.

### C9. `.dialog { position: relative }` defeats `:modal` viewport positioning

`ui/dialog/dialog.css:7` overrides the UA's `:modal { position: fixed }`, so
an open dialog — and therefore every drawer and sheet — anchors to the
**document**, not the viewport. On any page taller than the viewport, a
bottom drawer renders at the document's bottom edge, off-screen (measured:
flush-bottom expected 720, got 170 once the page gained an InstallSnippet).
Found during task 77b: the drawer and sheet docs pages cannot carry the full
docs template (InstallSnippet/ApiReference add height), and the drawer/sheet
tests only pass because those fixture pages stay shorter than the viewport.
Any consumer page with a drawer below the fold hits this. The `position:
relative` exists for the `container-type: inline-size` container (task 39) —
the fix needs to keep the container without breaking `:modal`.

### C10. `ui/dropdown-menu` has no destructive item variant

**Status:** owned by **task 104** (2026-08-27)  **Found:** task 88, 2026-08-17

`ui/button` and `ui/badge` both carry a `destructive` variant; menu items carry
none, so a delete entry in a menu has no kit-sanctioned styling. Task 87 wrote
`className="ck-menu-danger"` on the console's Delete item and never defined the
class — it was dead markup until task 88 declared it in
`site/showcase/console.css` from `--destructive`. Every consumer with a
destructive menu item will re-derive the same rule. Cheapest fix: a
`variant="destructive"` prop on `DropdownMenuItem` writing `data-variant`, with
the two declarations in `dropdown-menu.css`; `ui/context-menu` and
`ui/menubar` re-export the item, so they inherit it for free.

### C11. ~~Data-table toolbar wraps its second filter onto a new row~~ — FIXED (`686a77dd8c31`)

Measured in the 40rem docs column: `.data-table-toolbar-filters` is 556px wide and held two `.data-table-filter` inputs at 256px each (`.input { width: 100% }` capped by `max-inline-size: 16rem`) plus a 91px facet trigger — 619px. A wrap container wraps before it shrinks, so "Filter emails…" dropped to a second row and the Columns button floated at mid-height. The inputs were also 36px tall beside 32px `size="sm"` buttons.

Fixed with `.data-table-toolbar .data-table-filter { flex: 1 1 10rem; block-size: 2rem; padding-block: var(--space-1) }`: a small basis that grows to the existing 16rem cap (inputs now 220px, one row) at the sm button height. Two-class specificity beats `.input`'s `height` whatever the import order. Component CSS; the page markup was correct.

### C12. ~~Sized data-table header text paints over the next header~~ — FIXED (`dfff963ad1f8`)

C4 clipped body cells only, because `overflow: hidden` on a `<th>` would have clipped the resizer handle straddling the header's end edge. So a header narrowed below its text — Status at its 40px minimum, "Status" 43px wide, ending at x=524 while the `<th>` ends at 510 — painted over "Email". Hit-testing cannot see this: both headers are `position: relative`, so the later one hit-tests on top of the earlier one's overflow. The test samples pixels instead (the C5 technique).

Fixed by extending the C4 clip to `.data-table-sized .table-head` and moving the resizer inside the header box (`inset-inline-end: 0`, was -2px). The handle keeps its 5px width and is hit-testable at the header's end edge. The -2px straddle had also given the last column 2px of scrollable overflow — viewport `scrollWidth` 642 for a 640px table, 578 against 576 once the table fit — so a table that fit its scroller still grew a horizontal bar. Gone with the same change.

### C13. ~~`DataTableScroller`'s horizontal bar goes stale when columns change~~ — FIXED (`579564d74879`)

Found while fixing C12: with Status hidden the sized table fit its viewport exactly (576 = 576, `scrollWidth` 576), yet `data-has-overflow-x` stayed set and the bar stayed visible until the next scroll event. `ui/scroll-area` detects x-overflow in `sync()`, which runs on scroll and from a ResizeObserver over the viewport and `.scroll-area-content`. Neither ever resized: `.table-container` has `container-type: inline-size`, and size containment zeroes its intrinsic contribution, so `.scroll-area-content { min-inline-size: fit-content }` resolved to 100% (576) whatever the table's width — measured 576 around a 640px table.

Fixed in `data-table.css` by moving the container role: `.data-table-scroller .table-container { container-type: normal }` and `.data-table-scroller .scroll-area-viewport { container-type: inline-size; container-name: vanillin-table }`. The content now tracks the table (640 → 580 → 576 → 1200 across resizes and hides), so the observer fires and the flag follows. The viewport is the width `.table-container` had, so `.table--stack` switches at the same threshold (block at 480px; 640px is the inclusive 40rem edge). Column widths stay strict: Chrome sizes a fixed-layout table's intrinsic width from its column widths, not cell content (`id` at 40px measured 40). `ui/table` and `ui/scroll-area` are not modified.

### C14. ~~Faceted filter opens without focusing its search input~~ — FIXED (`77a29e15524a`)

Click or Enter on `.data-table-facet-trigger` opened the `role="dialog"` popover with `document.activeElement` still on the trigger; typing "pen" changed nothing (four options visible, no highlight ranges). `ui/popover` is non-modal and deliberately moves no focus, so the fix is the faceted filter's: a `useEffect` on `open` focuses the Command's input. Effect order does the timing — `PopoverContent`'s effect has already called `showPopover()` when the parent's effect runs, so the input is focusable. Escape still returns focus to the trigger (native popover focus restoration).

This is also why I1 looked real in task 63: nothing typed reached the input. With focus in place "pen" registers one `vanillin-search` range; I1 stays closed and the suite now pins it.

### C15. ~~Faceted filter keeps a stale query across close and reopen~~ — FIXED (`90c11aa01eea`)

Type "pen", Escape, reopen: the input still read "pen", the list was still 2 of 4 options, and "Clear filters" was hidden by the filter. Upstream's popover unmounts its content on close, so the Command resets; ours stays mounted. Fixed by controlling `CommandInput`'s value in `DataTableFacetedFilter` and clearing it when the popover opens — not closes, which would repaint the list during the exit fade. The highlight registry is released with the query.

### C16. ~~Data-table toolbar and pagination never wrap~~ — FIXED (`a2ad6b97cea4`)

`.data-table-toolbar`, `.data-table-pagination` and `.data-table-page-controls` were `flex-wrap: nowrap` over `white-space: nowrap` children. At a 640px viewport (330px content column) the page controls are 395px wide and overflowed the page by 65px in the Payments and Grouping sections, forcing a document-wide horizontal scroll. Fixed with `flex-wrap: wrap` and row gaps on all three; the selection count takes `flex: 1 1 auto` so it claims its own row first, and the controls keep `margin-inline-start: auto` so they stay end-aligned when alone. Layout in the 40rem column is unchanged (one row).

Not fixed here: the page's remaining overflow at 640px (`scrollWidth` 753 before and after) comes from the docs shell and code blocks, and at 380px the shell leaves a 70px content column — both K1, whose decision is still open.

---

### C17. Chrome drops `@property --typeset-size` and `--typeset-flow` — their `rem` initial values are not computationally independent
**Status:** open, found by task 84 (2026-08-27), outside its scope  **Where:** `styles/globals.css:118-119`
`initial-value: 1rem` / `1.5rem` break the `@property` rule that an initial value must be computationally independent (no `em`/`rem`/`%`), so Chrome discards the whole registration at parse time. Measured on a real page: 65 rules declared, 63 land as `CSSPropertyRule`, and `getComputedStyle` returns `""` for both tokens on an element nothing sets them on. Effect: the two rhythm tokens have **no** fallback guard — the protection task 84's spec credited them with; only `--typeset-leading` (`initial-value: 1.75`) is guarded. Fix: `initial-value: 16px` and `24px` (or `syntax: "*"` and drop the typing). Either changes computed-value representation, so it wants a full-suite run — see `docs/QUIRKS.md` line 1. Task 84's own three font-token registrations were verified accepted.

## D. Contrast and visual defects

All of these are "not enough contrast", light **and** dark unless noted.

- **D1.** `ui/switch` — the greyed-out/off track background.
- **D2.** `ui/switch` disabled state on the Field page — border *and*
  background.
- **D3.** `ui/attachment` — borders, both modes.
- **D4.** `ui/calendar` — borders, all calendars, both modes.
- **D5.** `ui/checkbox` — border and background.
- **D6.** Date input — the time text is muddied and hard to read.

### D7. ~~The switch on the Direction page looks broken~~ — FIXED (`066fb6a22a2e`)

Not a hand-rolled switch and not contrast: `site/pages/direction.jsx:9` imports
the real component. `.switch-thumb` moved with physical `translateX`, so under
`dir="rtl"` a checked thumb travelled *out* of its track. It hit **every RTL
consumer**, not just the Direction page — that page was only where anyone
happened to look.

Fixed with a `:dir(rtl)` override mirroring the checked transform, the same
convention as `ui/data-table/data-table.css:295`. `tests/switch.test.mjs`
asserts the *sign* of the thumb offset flips between `ltr` and `rtl` and that
the thumb stays inside the track in both; the RTL fixture lives on the switch
page as `data-pg="sw-rtl"`.

### D8. ~~Empty-state components sit too far left~~ — FIXED (`71aa0516b940`)

Not the page wrapper. `site/pages/empty.jsx` already had its `.pg-section`
wrappers, and the page's chrome measures pixel-identical to `card` and `alert`
at 1280px — `.pg-main` 220→1116, section and `h3` both starting at 260.

`ui/empty` centres itself in whatever box it is given and paints no bounds of
its own (`empty.css:1-8`), so the demo filled the 816px column with its content
floating at the centre while every neighbouring page shows a bordered element
anchored at the left edge. Read as adrift rather than as a component with a
deliberate full-bleed box.

Fixed on the docs site, not in `ui/`: a `.pg-empty-frame` container using the
same dashed convention as `.pg-cq-panel` (`site/site.css:265`). Upstream leaves
Empty full-bleed on purpose so it can fill a parent slot, and its own docs
supply the frame the same way.

### D9. `--border` fails non-text contrast — this is D1, D2, D3 and D5

**One token, not four component bugs.** `--border`
(`styles/defaults.css:35`, `oklch(0.922 0 0)` light / `oklch(1 0 0 / 0.15)`
dark) measures **1.26:1** against the light page and **1.48:1** against the
dark one. WCAG 1.4.11 asks **3:1** for the visual boundary of a UI component.

Measured with `node scripts/contrast-nontext.mjs`. Everything the D family
reported separately resolves to this one value:

| Reported as | Element | Light | Dark |
| --- | --- | --- | --- |
| D1/D2 | `.switch` unchecked track background | 1.26:1 | 1.48:1 |
| D5 | `.checkbox` border | 1.26:1 | 1.48:1 |
| D3 | `.attachment` border | 1.26:1 | 1.26:1 |
| (baseline) | `.input` border | 1.26:1 | 1.48:1 |

The `.input` row is the proof that this is systemic: it was probed as a
control, was never reported by anyone, and fails identically. **Fix the token,
then re-measure — do not fix four components.** The checked/filled states all
pass comfortably (17.93:1 light, 15.72:1 dark), so only the resting boundary is
at issue.

Second, smaller value in the same family: `.attachment`'s destructive-tinted
border measures **2.12:1** light / **1.95:1** dark — closer, still under 3:1,
and a separate declaration from `--border`.

### D10. `--muted-foreground` on `--muted` is 4.34:1 — eight components, one pair

`--muted-foreground` (`styles/defaults.css:34`) over `--muted`
(`styles/defaults.css:33`) measures **4.34:1** in light mode against the 4.5:1
WCAG 1.4.3 minimum. axe flagged it independently on every page that pairs them:
`ui/bubble` (`bubble.css:31-34`), `ui/avatar`'s fallback, `ui/kbd`, `ui/item`'s
muted description, `ui/tabs`' inactive trigger, `ui/aspect-ratio`'s demo
placeholder, and the `kbd` inside `ui/sidebar`.

**Dark mode passes** — this is a light-mode-only defect, which is why eyeballing
in dark missed it.

**This is probably also D6.** `.time-picker-separator`
(`ui/time-picker/time-picker.css:56-57`) uses the same `--muted-foreground`,
and "the time text is muddied" describes 4.34:1 well. See D6's note below.

### D11. `ui/bubble` destructive text is 4.15:1

`bubble.css:59-61` paints `var(--destructive)` on a 10% tint of itself over the
background — `#e7000b` on `#ffebe8`, measured **4.15:1**, against 4.5:1. Light
only. Same shape as D10 but a different token pair, so it needs its own fix.

### D12. The docs site's active nav link is 3.82:1

`site/site.css:88-91` — `--pg-accent` on an 18% tint of itself: `#008065` on
`#d1e8e3`, **3.82:1**. It is on **every page of the site**, it is the element
marking where the reader is, and it is site chrome rather than kit code, so it
is a one-line fix independent of everything above.

### D13. The focus ring is 2.59:1 in light mode

**Status:** open  **Found:** task 72 scoping, 2026-08-01

`--ring` light (`oklch(0.708 0 0)`) measures **2.59:1** against the page —
under WCAG 1.4.11's 3:1 for a component state indicator. Dark
(`oklch(0.556 0 0)` on `--background`) is 4.18:1 and passes.

Not in task 71's sweep: `scripts/contrast-nontext.mjs` has no focus-ring row,
and axe cannot see non-text contrast at all. Found by measuring the token
directly while scoping D9.

Worse than the bare number suggests — `input.css:22`, `button.css:28` and
`checkbox.css:26` composite `--ring` at **50% alpha** for the focus glow, so
the visible ratio there is lower still. `styles/globals.css:222` uses it
undiluted as a 2px outline.

A focus indicator that cannot be seen is a keyboard-navigation defect, not a
cosmetic one. Fix alongside D9 — same generated file, same regeneration step.

**Update 2026-08-02 (task 72):** token raised to `oklch(0.65 0 0)` light (3.23:1); the bare outline and the border-swap indicators (`.input:focus-visible` et al.) now pass, asserted by `tests/contrast.test.mjs`. But the 50%-alpha glow is not three sites — `grep 'color-mix(in oklab, var(--ring) 50%'` finds **28 declarations across ~24 components**, and wherever the glow is the *only* focus indicator (button, checkbox, toggle, badge, tabs, switch, radio, slider, …) it measures ~1.7:1 light regardless of the token: no alpha short of ~solid reaches 3:1 over white. The remainder is one kit-wide design call, not per-component fixes — either make the glow solid `var(--ring)` (keeps the 3px geometry, loses the softness) or stop suppressing the global 2px outline on glow-only components (keeps the glow as decoration, outline carries compliance).

**RESOLVED 2026-08-02: solid glow.** All 28 declarations are now `var(--ring)` undiluted — geometry unchanged, and a solid ring is the standard focus appearance; the outline option would have doubled the indicator on ~24 components. `.btn--destructive:focus-visible` went solid `var(--destructive)` for the same reason (its glow is the only indicator; note the ring reads against the page, not the button's own fill). The five `aria-invalid` 40% glows stay: each sits on a solid destructive border that carries the state at ≥4.77:1, so the glow is decoration. `.status-dot--ring` halos are decorative variants, also untouched. Asserted by the `.btn:focus-visible` row in `tests/contrast.test.mjs`; the outline path is covered by the calendar row in `scripts/contrast-nontext.mjs`.

### D4 and D6 — the probe did not reproduce them as described

Not closed, **re-aimed**. Both were measured and neither matched its
description, so 72 should not go looking where the text points:

- **D4 (calendar borders).** `.calendar-day-button` declares `border: none`
  (`ui/calendar/calendar.css:122`) and `.calendar` resolved to no border at
  all, so there is no calendar-specific border to fix. What the eye saw was
  almost certainly D9's `--border` on the surrounding frame.
- **D6 (time text muddied).** The field text itself measures **19.80:1** light
  / **18.97:1** dark — it is `--foreground` and is fine
  (`ui/time-picker/time-picker.css:35`). The muddy element is the separator at
  `time-picker.css:56-57`, which is D10's token pair.

### Negative result: axe found zero text-contrast violations in dark mode

Across 79 pages. Every text-contrast finding in this file is light-only. Worth
recording because the D items were all written as "light **and** dark unless
noted" — for text, that framing is wrong. It does **not** clear dark mode for
non-text contrast, where D9 fails in both.

### D14. Warning status dot is 2.31:1 in light mode (found in task 72, 2026-08-02)

The new graphical-object rows in `scripts/contrast-nontext.mjs` measure
`--warning` (`oklch(0.75 0.18 65)`) at **2.31:1** on white; success, error and
info all pass both modes, warning passes dark (10.08:1). A status dot's colour
*is* the information, so 1.4.11's graphical-object clause applies. Fixing it
means darkening the light `--warning` token, which touches every warning
surface from task 32 (badge, status-dot) — a token design call, not a
one-liner.

### D15. Progress track and slider rail are invisible against the page (found in task 72, 2026-08-02)

Progress track (`--primary` at 20%) measures 1.53:1 light / 1.64:1 dark;
slider rail (`--muted`) 1.09:1 light / 1.31:1 dark. The filled portion passes
easily in both. Whether the *unfilled* extent is "required to identify" is the
open question: without a visible track you cannot judge the proportion, but
upstream and most design systems ship the same values. Needs a design call —
possibly a border on the track rather than a darker fill.

---

## E. Motion

### E1. Light/dark toggle transition glitches — high priority

The idea is right, the execution is not. It stutters roughly halfway through
the top-left → bottom-right sweep, **on both directions of the swap**.

Wanted:

- Much smoother. Find the mid-sweep hitch (likely a layout/paint boundary in
  the circular clip-path wipe from the button centre — `withViewTransition`,
  task 54).
- A **more subtle** look: fade the leading edge of the change line with
  opacity, in both directions, rather than a hard boundary.

### E2. ~~`ui/collapsible` glitches at the end of open and close~~ — FIXED (`197b9a9d0afe`, `a9512c7946cf`)

**Both suspected causes were wrong, and so was "the tail of both".** Measured
per frame: content heights are integral (`scrollHeight 86` vs rect `86.0000`),
so there is no fractional endpoint to snap across; and `forwards` holds height
at `0` for ~9 frames after the animation reports `finished`, so nothing releases
early. Close jumps at the tail but open jumps at the **head** — the mount frame.
The open tail is clean to sub-pixel, so anyone reproducing this by watching the
end of the open animation concludes there is no bug.

Real cause: animating `height` alone cannot collapse the rendered box. Under
`box-sizing: border-box` (`styles/globals.css:185`) `height: 0` floors at the
content element's own vertical padding, and a zero-height flex child still
consumes its slot in the parent's `gap`. Both remainders appear or vanish in one
frame at React's mount/unmount, outside the animation's control — 8px each.

Fixed as a **spacing contract**, with `ui/collapsible/` deliberately untouched:
spacing moved onto a wrapper inside `CollapsibleContent`, `gap` dropped from the
root, and the contract stated on the docs page. `ui/accordion` already does
exactly this (`accordion.jsx:157` + `accordion.css:82-84` put padding on
`.accordion-content-inner`), so the collapsible was the odd one out of two
components sharing the same `usePresence` recipe.

**The assertion this issue originally asked for would have passed against the
broken code.** Content height *is* monotonic across the final frames in both
directions; the discontinuity was in the root box across the mount/unmount
boundary, which that assertion never looks at — see H1. Catching it needs a
*pair* of assertions, since one alone passes the other's mechanism: content
height at the endpoint is 0 (catches the padding floor) **and** the root box
step across the boundary is 0 (catches the gap slot).

### E3. ~~`scrollHeight` rounding can leave a sub-pixel step in the `usePresence` recipe~~ — FIXED in task 72

Both copies of the recipe (`ui/collapsible`, `ui/accordion`) now measure
`getBoundingClientRect().height` with the animation suppressed for the frame,
so the var carries the fraction. Asserted by a fractional-height test in
`tests/collapsible.test.mjs`.

Found while measuring E2, not fixed. `--collapsible-content-height` comes from
`scrollHeight`, which is integer-rounded, while the natural box is not. Content
that lands on a fractional height therefore animates to a slightly wrong
endpoint: forcing the case measured a `0.3906px` error. Two orders of magnitude
below E2's 8px and absent from the shipped demos, so it is latent rather than
visible — but it applies to every consumer of the recipe, `ui/accordion`
included.

---

## F. Cursor affordance

Task 31 shipped a global interactive-cursor rule (`styles/globals.css:227-244`).
These are all clickable and reportedly do not get the hand — each is either a
bug against that rule or a deliberate exception that is undocumented:

- **F1.** Combobox.
- **F2.** The role select box on the Form Fields page.
- **F3.** The dismiss `×` on badge chips. *(Probably yes — it is a button.)*
- **F4.** Sliders — question, not a bug report: what is the web-wide
  convention? Decide and apply consistently. (`grab`/`grabbing` is the common
  answer for a draggable thumb, not `pointer`.)
  **Settled 2026-08-02, split decision:** native `input[type="range"]` gets
  `grab`/`grabbing` (`styles/globals.css`); `.slider-thumb` deliberately gets
  **no cursor** — the hand sits exactly on the thumb and hides the hover/focus
  glow. The web-wide convention is the default arrow anyway (native controls,
  Radix, shadcn, Primer). The sweep flags the thumb as a cursor miss; it is
  not one — do not "fix" it.

### F5. Seven `cursor: default` declarations out-specify the global rule — this is F1, F2 and F3

The global rule (`styles/globals.css:227-244`) selects `button` by element, so
**any component class that sets `cursor` wins on specificity**. Seven do, all
ported from upstream's menu-trigger styling, and each one is a confirmed miss
measured by `node scripts/sweep-pages.mjs`:

| Declaration | Element | Reported as |
| --- | --- | --- |
| `ui/select/select.css:22` | `button.select-trigger` | F2 |
| `ui/select/select.css:200` | select scroll button | new |
| `ui/combobox/combobox.css:68` | combobox clear button | F1 |
| `ui/combobox/combobox.css:93` | combobox chip remove | F1 |
| `ui/menubar/menubar.css:33` | `button.menubar-trigger` | new |
| `ui/navigation-menu/navigation-menu.css:45` | `button.navigation-menu-trigger` | new |
| `ui/badge/badge.css:61` | `button.badge-chip-remove` | F3 |

F2 is broader than reported — the select trigger misses on the `select`, `form`
**and** `form-fields` pages, not only Form Fields. Note that
`ui/select/select.css:40`, `ui/combobox/combobox.css:54` and `:97` set
`not-allowed` for disabled state, which is correct and should survive the fix.

### F6. The global rule covers ARIA roles but no native input types

`styles/globals.css:227-244` enumerates `[role="checkbox"]`, `[role="radio"]`,
`[role="switch"]` and friends, but the only native elements it lists are
`button`, `summary`, `label[for]`, `a[href]` and `select`. So a plain
`<input type="radio">` gets the OS default and no hand. Measured instances:

- `<input type="radio" name="tier">` — `site/pages/form.jsx`, `cursor: default`
- `<input type="range">` — `site/pages/use-form.jsx`, `cursor: default`
  (this is **F4**'s decision point, arriving via a different route)
- `<input type="file" class="input">` — `site/pages/input.jsx`,
  `cursor: default`

Native `input[type=checkbox|radio|file|submit|button|reset]` all want the same
treatment. Low-priority sibling: a **disabled** calendar day
(`button.calendar-day-button[disabled]`) resolves to `default` rather than
`not-allowed`, unlike the disabled select and combobox — decide whether that is
an exception or an oversight. **Settled in task 72 (2026-08-02): oversight** —
the kit's disabled convention is `not-allowed`; `calendar.css` fixed to match.

### F7. Sweep-tool cursor heuristic: two false-positive classes (found in task 72, 2026-08-02)

After F5/F6 landed, `scripts/sweep-pages.mjs` still reports 16 cursor hits, all
tool gaps rather than kit bugs (the tool is outside task 72's write scope, so
recording instead of fixing):

- **`AFFORDANCES` lacks single-side resize cursors.** `button.sidebar-rail`
  computes `w-resize`/`e-resize` — a deliberate affordance from task 31 — but
  the set only has `ew-resize`/`ns-resize` and friends. Add
  `w-resize|e-resize|n-resize|s-resize`.
- **`[tabindex]:not([tabindex="-1"])` over-matches focusable non-click
  targets.** Scroll viewports (`.scroll-area-viewport`,
  `.message-scroller-viewport`, `.carousel`) and `[role=tabpanel]` are
  keyboard-focusable per ARIA authoring practice but are not click targets, so
  `cursor: auto` is correct. Exclude `[role=tabpanel]`, `[role=region]` and
  `[role=presentation]` from the tabindex arm, or drop hits whose only matching
  selector is the tabindex arm.

---

## G. Test flakes — G2, G4, G5, G7, G9, G10 fixed

- **G1.** `message-scroller: button click returns to bottom and re-engages
  follow`. Reproduced on a clean base (285/286, then 286/286 on identical
  code). Oldest of the family; worth a dedicated fix.
- **G2.** ~~`drawer: long slow drag ending in flick` and `drawer: held still before lift`. 14/14 in isolation; time out in **full-suite order only**.~~ Resolved 2026-08-25: the flick's velocity depended on four Playwright round-trips landing in a 16–29ms window (an idle run measured 21–27ms); the two velocity-dismiss tests now declare their timestamps through CDP `Input.dispatchMouseEvent`. `held still` never failed on its own — the failed flick left the modal open and the next `click()` timed out behind it.
- **G3.** Two `resizable` tests — logged failing on the base commit during
  task 54 (hover-state timing; a strict `>` where the values are equal).
  Never logged as fixed, though the last three full runs were green.
- **G4.** ~~`navigation-menu: hover opens after delay, leave closes after grace`.~~
  Resolved: test removed. The delay assertion was inherently load-dependent.
- **G5.** ~~`slider: onValueCommit fires on pointerup and keydown` —
  `page.evaluate` fails with *Failed to fetch dynamically imported module*
  on the `/@fs/` slider URL.~~ Resolved 2026-08-26. Never a flake: "harness
  or vite state, not the page" was right, and the state was the dev server's
  `base`. `vite.config.js` keyed it on `GITHUB_ACTIONS`, so on a runner the
  dev server moved to `/vanillin/` and every root-absolute URL in the suite
  404'd — hence "deterministic within a window" (the window being whether the
  variable was set) and the 200 from a hand-driven page. `base` is now scoped
  to `command === "build"`. Same root cause as the `showcase-panels` abort and
  `docs-shell: page has exactly one h2`; all three had been red in CI since the
  test gate landed (`9c483eaf8f0c`).
- **G6.** One full-suite run under heavy parallel load (batch 2 supervision,
  2026-08-06) failed `scroll-area: thumb parks at end` and two `toast` timing
  tests (promise transition, held-still velocity); all passed 34/34 in
  isolation immediately after on identical code. G2-shaped load sensitivity,
  logged so the next full-suite reader doesn't re-investigate.
- **G7.** ~~One full-suite run under load (ci-test-gate worktree, 2026-08-23)
  failed `select: item-aligned mode clamps to viewport and enables scroll
  buttons` (scroll-up visible expected "visible", got "hidden") and `select:
  scroll buttons hide at each scroll extreme` (click timeout).~~ Resolved
  2026-08-26, and not load-shaped after all: the first test *sampled*
  `data-state` on the scroll buttons, which an IntersectionObserver sets, so
  it read "hidden" whenever the observer had not fired yet — the test three
  lines below already waits for exactly that. It now waits too. The click
  timeout was the cascade: the failed assertion skipped the `Escape`, and the
  still-open listbox ate the next test's click (the G2 shape). Recurred in CI
  2026-08-26 (`cbaea1a89223`), which is what made it reproducible.
  Second round, same file: with the cascade gone, `scroll buttons hide at each
  scroll extreme` failed in CI on its own (`down button visible at top expected
  "visible", got "hidden"`). It waited for the *up* button's observer at each
  extreme and then sampled the *down* one — the two settle independently, so it
  read the down button's mount state. Both extremes now wait for the pair. Worth
  taking as the general lesson: waiting on one observer-driven attribute says
  nothing about its sibling.
- **G8.** `carousel: loop clones: narrow carousel loops forward seamlessly` —
  failed once in a full run on `fix/data-table-page` (2026-08-26, a second
  vite dev server alive on :5173): after 10 `next` clicks the nearest item
  was 9, not 0, so one advance was swallowed. 26/26 in isolation right after
  and 810/810 on the next full run of identical code. Each click is gated on
  `waitForSnap` + 200ms, so a slow snap under load eats a click. G2-shaped.
  Not the data-table change set: carousel runs before data-table, and every
  rule that set added is scoped under `.data-table-*`.
- **G9.** ~~`live-value: controlled: a rise flashes up…` (`expected "up", got
  null`) and `…a fall flashes down…` (`expected "down", got null`, then `got
  "up"`).~~ Resolved 2026-08-26. Red in CI on every run of the gate, green
  everywhere locally, and the message told the story once both edges were
  seen: `data-trend` is set from a post-commit effect and cleared on
  `animationend`, so the sample after `click()` could land before the effect
  *or* after the 600ms flash. The `got "up"` variant is the cascade — the
  aborted rise test never ran its clear, so the fall test opened on a stale
  flash. The suite now waits for the trend and widens the window with a
  subtree-local `--motion-medium`.
- **G10.** ~~`mode-toggle: the lamp actually rocks when clicked` — `and swings
  back past upright — got -0.006deg`.~~ Resolved 2026-08-26. Two fixed offsets
  into a `--motion-scale: 20` swing; the second landed on the zero crossing
  between the extremes and read an upright lamp as a stalled one. Never seen
  in CI, reproduced 2 runs in 3 under Chromium. The swing is now sampled every
  frame in-page and the peaks come out of the series, which also gets the
  decay assertion off a point sample.
- **G11.** ~~`forced-colors: high-contrast: focus outline is at least 3px`
  fails under the Chromium that ships with `playwright-core` (`outline-width
  is 0px`) and passes under CI's Google Chrome.~~ Resolved 2026-08-26, and the
  browser split was the tell, not the bug: with `outline-style: none` the
  computed `outline-width` is 0 per spec (Chromium 141 reports that), while
  newer Chrome reports the cascade's specified width — so CI was passing on a
  3px that painted nothing. The real defect: `.btn` (like every family in the
  forced-colors focus list) sets `outline: none` and draws its ring in
  `box-shadow`, so `@media (prefers-contrast: more) { :focus-visible {
  outline-width: 3px } }` never reached a single one of them — "thicker
  focus" was delivered nowhere. Fixed by mirroring the forced-colors focus
  repair inside the prefers-contrast block (`3px solid var(--ring)`,
  `!important` for the same load-order reason), and the test now asserts
  `outline-style === "solid"` alongside the width so a reported-but-unpainted
  value can never pass it again.
- **G12.** `view-transitions: view-transition-name is unique during transition
  and cleared after` — `detail has shared-element name expected
  "shared-element", got "none"`. Once in seven full runs (2026-08-26), 7/7 in
  isolation six times over, and green in CI. Logged with a candidate mechanism
  so the next reader starts from a hypothesis rather than the top:
  `.pg-vt-detail` carries `viewTransitionName` **statically from JSX**, while
  the back handler in `site/pages/view-transitions.jsx` *also* calls
  `setTransitionName` on that same element and schedules a 500ms cleanup that
  blanks the inline style. If React reuses the detail node across a
  back-then-forward inside that 500ms — the style value is unchanged, so React
  would not rewrite it — the stale cleanup lands on a live element and the name
  reads "none". Unverified: worth an instrumented run before changing the
  demo. Note the back path also names the outgoing detail rather than the
  incoming card, which looks wrong on its own terms.

---

## H. Test-quality gaps

### H4. ~~`tests/run.mjs` accepts an imposter dev server — the suite can silently test the wrong tree~~ — FIXED (`fe9a7befe5f0`, task 84, PR #8)
**Status:** fixed 2026-08-27 — the busy-port refusal landed in `0a3f51954733`; `fe9a7befe5f0` races `waitForServer` against the vite child's `exit`, so a dead vite fails in ~1s naming its code and signal instead of 15s later as "did not start"  **Found:** task82 salvage, 2026-08-16
`run.mjs` spawns vite with `--strictPort` but never checks that the child survived; `waitForServer()` just fetches `:5199`, so anything already on the port answers and the whole suite runs against *that* tree. Hit for real: an orphaned vite rooted in `../vanillin-task82` made merged `main` read 755-758/762 with phantom deterministic failures (nav-menu z-index "regression", slider `@fs` 403) that vanished once the orphan was killed. Cheapest fix: fail fast when the spawned vite exits (`vite.on("exit", ...)` before `waitForServer`), or fetch a nonce file vite serves only from the expected root.

### H1. ~~Assertions that hold for the wrong value~~ — SWEPT (`c7f0664d119e`)

`.data-table-pinned`'s `inset-inline-start === "0px"` was also true for
`position: relative`, so header pinning was broken on `main` for months while
the test passed. Fixed in task 63; the *class* of gap was swept in task 68.

Swept by triaging every assertion in the suite whose expected value is also
what an absent mechanism reports. **Four were real, four were already sound.**
Fixed: `ui/scroll-area`'s two overscroll-squish guards (plus a positive case
that never existed — see below), `status-dot`'s two `animationName: none`
checks, `navigation-menu`'s reduced-motion suppression, and `drawer`'s "sprang
back". Each now proves the mechanism engages before asserting it is absent.

Left alone with reason: `data-table.test.mjs:753` already got its
`scrolled > 0` guard in task 63; `container-queries.test.mjs:123` and
`status-dot.test.mjs:177` already assert both halves; `forced-colors`'s
`forced-color-adjust: none` is an explicit opt-in rather than a default; the
`"none"` checks in `date-input`, `calendar`, `select` and `combobox` read demo
`textContent`, not computed style; and `scroll-area:164,290` read a custom
property and an inline style, which return `""` when absent.

**`ui/scroll-area`'s overscroll squish had no real coverage at all** — both
tests asserted `transform: none` with no positive case, so deleting the feature
left the suite green. Two independent causes, either alone sufficient:

- The gesture fired **one** `touchmove`. The first move only latches the
  boundary and origin (`ui/scroll-area/scroll-area.jsx:394`); the transform is
  not written until a later move finds `active` already true.
- **`Input.dispatchTouchEvent` delivers no touch events to the listeners here**,
  with or without `hasTouch` — instrumented, zero `touchstart`/`touchmove`
  observed. It is the only CDP-touch user in the suite. Touch gestures are now
  synthesised in-page with `new TouchEvent`.

The general lesson, for whoever writes the next motion or suppression test: an
assertion that expects an *absence* proves nothing on its own. Pair it with the
presence it is the absence of, and confirm by deleting the feature — a test
that stays green is not a test.

Four concrete instances found during task 68, all worth folding into the sweep:

- **E2's specified assertion would have passed against the broken code** —
  "content height is monotonic across the final frames" is true either way. The
  fix needed a *pair* of assertions because each mechanism silently passes the
  other's check. Assert the precondition **and** the counter-precondition: C4's
  test hit-tests a point in the neighbouring cell and separately asserts that
  point resolves *inside* the neighbour, otherwise it also passes when the hit
  lands on some third element entirely.
- **C5's borders reported full `border-width` in computed style while painting
  at ~0 alpha.** Any assertion about something a mask, filter or transform can
  suppress has to sample pixels. Same lesson as the mode-toggle sweep.
- **The browser suites share one page across tests, so state leaks forward.**
  A `data-table` test that asserted before restoring column widths left the demo
  at 40px/800px and timed out a later pinning test; the new `collapsible` cases
  depend on earlier tests having left each demo closed. They fail loudly rather
  than silently, but the coupling is real and the sweep should note it.
- **D8's specified assertion — "the page's section box aligns with a reference
  page's" — passes against the broken code**, measured. So does a left-edge
  check on the demo box: a container with `border-width: 0` reports the same
  geometry as one that paints. Geometry cannot distinguish "bounded" from
  "unbounded"; only a pixel sample can. And when the border is *dashed*, one
  mid-height sample lands in a gap and reports unpainted — scan the whole edge.

### H2. Unknown how many features have no real test at all

**Status:** owned by **task 73**  **Found:** task 68 sub-task 9, 2026-07-31

H1 asked whether assertions hold for the wrong reason. The squish answered a
worse question nobody asked: `ui/scroll-area`'s overscroll squish had **no real
coverage whatsoever** — two tests, both asserting an absence, no positive case,
and deleting the feature outright left the suite green. It was found by
accident while fixing something else.

Nothing rules out more of the same. 708 tests across 68 components is ~10 each,
thin for anything with drag, focus management or RTL, and the pinning bug
(H1's origin) survived on `main` for months behind a passing test.

The cheap probe is deletion, not reading: neuter one load-bearing rule or
handler per component and see whether the suite notices. Mechanical, and it
answers "which features are untested" directly rather than by inspection. A
per-component targeted run is ~20-40s, so a first pass over all 68 is a
half-day including authoring.

Distinct from the unswept docs-site sweep at the top of this file: that one
finds defects users can see, this one finds defects nothing would catch. Do the
sweep first — it is cheaper and targets the class that has actually been
biting. Sequenced accordingly: **71 → 72 → 73**.

---

### H3. `tests/empty.test.mjs` asserts a page-global count, so documenting the component breaks it

**Status:** open, unowned  **Found:** task 77c review, 2026-08-07

`tests/empty.test.mjs:67-69` counts **every** `.empty` on the page and requires the total to equal `.pg-empty-frame`:

```js
const frames = await page.locator(".pg-empty-frame").count()
eq(frames, await page.locator(".empty").count(), "one frame per empty demo")
```

Rendering an `<Empty>` anywhere outside a demo frame — such as in the Usage preview the docs template calls for — makes the counts disagree and fails the test. Task 77c hit this and worked around it by showing the text "See the live demos above" instead of the component, so the `empty` page is the one page in the batch whose Usage section does not render what it documents.

The test is at fault, not the page: scope the assertion to `.pg-empty-frame .empty` and it measures what it means to measure. Then restore the real `<Empty>` in that page's Usage preview.

Same shape as H1 — an assertion that passes for the wrong reason, here by counting a superset. Worth a grep for other page-global `.count()` comparisons while fixing it.

---

## I. Suspected, unverified

### I1. ~~`ui/command` may never highlight inside a faceted-filter popover~~ — CLOSED, does not reproduce

Task 63 tried to assert it and got **zero ranges** registered under
`vanillin-search` when typing into the data-table's faceted `CommandInput`,
then dropped the assertion rather than chase it.
`ui/command/command.jsx:134` does call `useHighlight`, so the fault is in the
popover context or the range collection. Unowned.

**Closed in task 72 (2026-08-02):** typing "pen" into the faceted
`CommandInput` registers **one** range under `vanillin-search` — the
contiguous match in "pending"; "processing" survives the fuzzy filter with no
contiguous substring, which `lib/use-highlight.js` documents as unpainted.
Whatever task 63 hit is gone (likely fixed by the task 45 fuzzy re-sort work)
or was a probe error.

### I2. One unidentified 404 on the badge page

The sweep's console capture across 79 pages × 2 modes produced exactly **one**
error, on `#badge` in light mode: `Failed to load resource: the server
responded with a status of 404 (Not Found)`. The message carries no URL and it
did not recur in dark mode. Reproduce with the network panel open before
spending time on it — it may be a dev-server artefact rather than a page bug.

---

## J. Debt / housekeeping

- `scripts/contrast-nontext.mjs` has no topnav row — task 81's boundary fix (3.64:1 light / 3.61:1 dark) was measured by a one-off probe, so nothing guards it. A committed row must wait ~500ms after `data-scrolled` flips: the bar's colors transition, and an early read returns the interpolating value (found task81, 2026-08-16).
- **Task 64 is half-done** on `feat/component-contracts`: sub-tasks 1–2 landed
  (manifest reader/writer, 68 generated `.van.json`); **3–6 open** —
  conformance suite, import-graph + cycle check, `npm test` wiring ("expect a
  real backlog"), docs.
- Open tasks: **38** (CLI, blocked on 64), **39** (container queries), **65**
  (`van update`, blocked on 64 + 38), **30** (docs pass, runs last). Much of
  section A and B above lands naturally in 30 — but 30 was scoped as a
  *consistency pass*, and this is a rewrite. Rescope it or add tasks.
- Four merged remote branches still need deleting — `feat/form-bindings`,
  `feat/generated-defaults`, `feat/composition-pass`, `feat/brand-multicolor`.
  The push must be run by a human from `main`.
- `ui/attachment/attachment.css:197` documents a Chrome compositing bug
  (masking the scroller paints the pane white). Upstream browser bug, not ours
  — but see C5.
- Optional (task 63): `.table-container`'s `overflow: auto` is dead weight
  whenever a table is wrapped in a scroll area. Removable if `ui/table` grows
  a `scrollable={false}`.
- **Unverified end-to-end, needs the user:** `npx github:parkrw/vanillin init`
  from a scratch Vite app, then rendering the copied components. It targets
  `main` now that task 38 is merged. A bare `git clone` + `node
  <clone>/bin/van.mjs` was verified locally, which is what `npx github:`
  reduces to.

- `site/api-reference.jsx` has no column vocabulary for CSS custom properties: task 92 added a second `<ApiReference title="Custom properties">` to the badge, progress and status-dot pages for `--glow-duration`/`--glow-strength`, and the header still reads "Prop". A `columns` prop or a title-aware header fixes all three at once; do it when the next page needs one (2026-08-27).

---

## K. Responsive — narrow viewports

### K1. 73 of 79 pages overflow horizontally at 380px

Measured at a 380px viewport by `scripts/sweep-pages.mjs` (`scrollWidth` vs
`clientWidth`). At **1280px nothing overflows** — this is narrow-only. Six
pages are clean (`aspect-ratio`, `avatar`, `input`, `native-select`, `spinner`,
`table`); the rest force a horizontal scroll of the whole document, which is
WCAG 1.4.10 (Reflow).

Worst offenders, `scrollWidth` at a 380px viewport:

| Page | Width | | Page | Width |
| --- | --- | --- | --- | --- |
| container-queries | 1116 | | data-table | 754 |
| theming | 865 | | attachment | 684 |
| mode-toggle | 823 | | installation | 670 |
| schema | 814 | | density | 662 |
| carousel | 812 | | card | 652 |
| form | 803 | | pagination | 640 |
| form-fields | 766 | | scroll-area, skeleton | 620 |
| contracts | 764 | | navigation-menu | 614 |

The long tail sits at 390–540, which is one demo grid or one wide table each;
the top of the list is a different problem in kind. Note that
`container-queries` — the page whose subject is fitting a container — is the
single worst page on the site at nearly 3× the viewport.

**Not scoped to 72 without a decision first:** whether the docs site is meant
to work on a phone at all. If it is, this is its own task, not a bug batch —
`~L` and mostly demo-layout work rather than kit CSS.
