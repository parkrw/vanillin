# ISSUES

Running list. Nothing here is scheduled; triage into `docs/TODO/` when a batch
is planned. Items marked **verified** were checked against the tree at
`b83903a91cda`; the rest are as-reported and need reproduction.

**Re-check line numbers before acting.** Task 64 landed on `main`
(`6c0e1b58cf1a`) after most of this was written, and it moved code in
`ui/select`, `ui/combobox` and `ui/data-table`.

---

> ## ⚠️ PICK UP HERE — THE BUG SWEEP IS UNFINISHED
>
> The user's own pass through the docs site stopped at **`form-fields`**.
> Everything after it in alphabetical page order is **unswept**: `hover-card`,
> `input`, `input-otp`, `label`, `menubar`, `navigation-menu`, `pagination`,
> `popover`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`,
> `separator`, `sheet`, `sidebar`, `skeleton`, `slider`, `sonner`, `table`,
> `tabs`, `textarea`, `toast`, `toggle`, `tooltip`, and the rest.
>
> **Remind the user of this at the start of any session that touches bugs.**

---

## A. Product direction

### A1. ~~"Playground" needs a real name~~ — DONE

`playground/` → `site/` on `refactor/site-rename`. `playground.css` →
`site.css`, `root: "site"` in `vite.config.js`, all paths and prose updated
across code, tests and docs. Suite 667/667, build clean.

**Naming decision:** there is no separate site brand. The product is
**Vanillin**, the CLI and config are **`van`**, and the documentation site is
just the product's site — the way upstream, Radix and Base UI all do it. A
sub-brand ("Van Kit", "Workbench") is the pet-project tell we were trying to
remove. `<title>` is now `Vanillin`.

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

### C4. Data-table column resize overlaps row content

Resizing a column narrower makes the cell text overlap its neighbour. Wanted
behaviour: clip character-by-character as the column shrinks, and the moment
the first character is dropped, show an ellipsis — dropping a second character
to make room for the `…` if needed.

### C5. `ui/attachment` group scroll drops the outer edge borders

The first and last cards in a scrolling `AttachmentGroup` are missing their
outer edge border. Possibly the same root cause as D3 (attachment border
contrast) — check the edge-fade mask in `ui/attachment/attachment.css:195-205`,
which already carries a Chrome compositing workaround.

---

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

### D8. Empty-state components sit too far left

The empty components page is misaligned relative to every other page.

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

### E2. `ui/collapsible` glitches at the end of open and close

The tail of both animations jumps. Should be smooth. Suspect the measured-
height keyframes + `fill-mode: forwards` close path (the `usePresence` recipe).

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

---

## G. Test flakes — all pre-existing, none fixed

- **G1.** `message-scroller: button click returns to bottom and re-engages
  follow`. Reproduced on a clean base (285/286, then 286/286 on identical
  code). Oldest of the family; worth a dedicated fix.
- **G2.** `drawer: long slow drag ending in flick` and `drawer: held still
  before lift`. 14/14 in isolation; time out in **full-suite order only**.
  Load-dependent — observed pass/fail/fail/pass across four runs on identical
  code.
- **G3.** Two `resizable` tests — logged failing on the base commit during
  task 54 (hover-state timing; a strict `>` where the values are equal).
  Never logged as fixed, though the last three full runs were green.

---

## H. Test-quality gaps

### H1. Assertions that hold for the wrong value

`.data-table-pinned`'s `inset-inline-start === "0px"` was also true for
`position: relative`, so header pinning was broken on `main` for months while
the test passed. Fixed in task 63, but the *class* of gap was never swept.
Fold into task 64's conformance suite: assert the precondition
(`scrollLeft > 0`) alongside the effect.

---

## I. Suspected, unverified

### I1. `ui/command` may never highlight inside a faceted-filter popover

Task 63 tried to assert it and got **zero ranges** registered under
`vanillin-search` when typing into the data-table's faceted `CommandInput`,
then dropped the assertion rather than chase it.
`ui/command/command.jsx:134` does call `useHighlight`, so the fault is in the
popover context or the range collection. Unowned.

---

## J. Debt / housekeeping

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
