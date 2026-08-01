# task71: docs-site-sweep
**Goal:** Finish the docs-site bug sweep the user started — measure the 44 unswept `site/pages/*.jsx` pages, write verified findings into `docs/ISSUES.md`, take the banner down. **No fixes.**  **Branch:** `docs/site-sweep-triage`  **Deps:** none

## Scope

The user's pass stopped at `form-fields`. Unswept, alphabetically `form` → `view-transitions`: form, form-fields, format, hover-card, input, input-group, input-otp, item, kbd, label, marker, menubar, message, message-scroller, mode-toggle, native-select, navigation-menu, pagination, popover, primitives, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, spinner, status-dot, switch, table, tabs, textarea, time-picker, toast, toggle, toggle-group, tooltip, typography, use-form, view-transitions — **44** (the banner says 42; it undercounts, and `form`/`form-fields` are re-checked rather than trusted).

**Triage only.** Task 68 misdiagnosed 3 of 9 and shipped incomplete `files:` lists on 4 of 9, so an unmeasured finding is worse than no finding: it sends 72 after the wrong cause. Every item written to `docs/ISSUES.md` carries the measurement that produced it (ratio, computed value, console text, geometry) and a `path:line` that was re-read, not remembered. Anything suspected but not reproduced goes to section **I**, never to C/D/E/F.

Out of scope: fixes of any kind; A2 (raw `<button>` in docs pages — task 69 owns it and already lists the pages); A3 code examples (task 30); G-family test flakes.

## Sub-tasks

- [ ] 1. `scripts/sweep-pages.mjs` — headless sweep over every registry page in light **and** dark, emitting one JSON report plus full-page screenshots. Per page it records: axe-core `color-contrast` violations (selector, measured ratio, required, colours), computed `cursor` for every interactive element (`button`, `a[href]`, `[role=button]`, `[role=option]`, `[role=menuitem]`, `[role=tab]`, `[role=switch]`, `input`, `select`, `summary`, `[tabindex]:not([tabindex="-1"])`) where it is not `pointer`/`text`/`grab`, console errors + React warnings + uncaught page errors, horizontal document overflow at 1280 and 380, and the left edge of the first `.pg-section` (the D8 geometry check). Dark mode via `emulateMedia({ colorScheme: "dark" })` on a fresh load — `site/color-scheme.js:16` reads the media query at import time, so toggling the class post-load desyncs the store. — test: the script's own run is the test; it must complete all 74 pages with zero harness errors and produce a report whose page count matches `site/registry.js`; files: `scripts/sweep-pages.mjs`
- [ ] 2. Triage the machine findings — dedupe against existing D1–D6/F1–F4/C6/E3/I1 (already owned by 72), confirm each survivor by re-reading the source at the reported line, and drop anything the script flagged that does not reproduce on a second run. Output is a triaged list in the report dir, not yet in `ISSUES.md`. — test: every kept finding cites a `path:line` re-read this pass; files: (scratchpad report only)
- [ ] 3. Visual review of the screenshots — 4 background `general-purpose` agents (`model: "opus"`), ~11 pages each, light+dark, each reporting only defects it can name concretely (clipping, overlap, misalignment against neighbouring pages, invisible state, broken demo). Screenshots stay in the agents' context, never the head's. — test: each agent returns a list with page, mode, and what is wrong; files: (scratchpad screenshots)
- [ ] 4. Write findings into `docs/ISSUES.md` under the existing lettered sections (new items continue the numbering: D7+ are taken, so contrast items land as D9…, cursor as F5…, code bugs as C7…, motion as E4…, unverified as I2…), each with its measurement and verified line reference. — test: `grep` every new `path:line` resolves to the cited code; files: `docs/ISSUES.md`
- [ ] 5. Take the banner down and reconcile the plan — delete the `⚠️ PICK UP HERE` block from `docs/ISSUES.md`, mark 71 `[x]` in `docs/TODO/README.md`, re-estimate 72 from the actual finding count, append to `docs/TODO/LOG.md`. — test: no `PICK UP HERE` remains; the 72 footnote lists the new item ids; files: `docs/ISSUES.md`, `docs/TODO/README.md`, `docs/TODO/LOG.md`

## Verify / done

```
node scripts/sweep-pages.mjs        # completes 74 pages, writes report
node tests/run.mjs                  # 708/708 — this task changes no component
npm run build                       # clean
```

Acceptance: `docs/ISSUES.md` has no unfinished-sweep banner; every new finding names a measurement and a re-read `path:line`; nothing under `ui/`, `lib/` or `site/pages/` changed except by the sweep script's own existence.

## Handoff

**Status:** COMPLETE (2026-08-01), branch `docs/site-sweep-triage`, not yet pushed.

All five sub-tasks done. Nothing under `ui/`, `lib/` or `site/` was touched — the deliverable is measurement plus the two tools that produced it.

**The two tools, both rerunnable and both committed:**

```
node scripts/sweep-pages.mjs      # 79 pages × light/dark, ~6 min
node scripts/contrast-nontext.mjs # WCAG 1.4.11 boundary contrast, ~40s
```

`sweep-pages.mjs` takes route substrings to narrow a run (`node scripts/sweep-pages.mjs select tabs`), `--out <dir>` for the report and screenshots, `--no-shots` to skip the captures. It exits non-zero only on harness errors, not on findings — it is a measuring instrument, not a gate, and wiring it into `npm test` would be wrong until the findings are fixed.

**Why two tools and not one:** axe's `color-contrast` rule measures text only. Every original D item is a border or a switch track — non-text. A text-only sweep calls this kit fully accessible while `--border` sits at 1.26:1.

**What it found** — 56 raw contrast hits and 38 cursor hits reducing to four causes, written up as D9–D12 and F5–F6 in `docs/ISSUES.md`, plus C7–C8 (docs-page markup), K1 (now task 74) and I2. D1/D2/D3/D5 are all D9; F1/F2/F3 are all F5. Task 72's footnote in `docs/TODO/README.md` has the ordered fix list.

**Traps for whoever measures colour here next:**

- Computed styles come back as `oklch()`/`oklab()`. Parsing numbers out of the string yields a uniform 1.00:1 — garbage that looks like data. Convert via canvas `fillStyle`, then composite alpha over the resolved backdrop; `scripts/contrast-nontext.mjs` has the working version.
- Probe something nobody reported, as a control. `.input`'s border failing identically to the four reported components is the entire reason we know this is one token and not four bugs.
- Dark mode via `emulateMedia({ colorScheme })` on a fresh load. `site/color-scheme.js:16` reads the media query at import time, so toggling `.dark` after load desyncs the store from the DOM.

**Deliberately not done:** anything resembling a fix, and any change to `docs/ISSUES.md` sections A, B, G, H or J. D4 and D6 were measured and did not reproduce as described — they are re-aimed in place, not struck.
