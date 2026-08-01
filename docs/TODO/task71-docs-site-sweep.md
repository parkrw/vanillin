# task71: docs-site-sweep
**Goal:** Finish the docs-site bug sweep the user started — measure the 44 unswept `site/pages/*.jsx` pages, write verified findings into `docs/ISSUES.md`, take the banner down. **No fixes.**  **Branch:** `docs/site-sweep-triage`  **Deps:** none

## Scope

The user's pass stopped at `form-fields`. Unswept, alphabetically `form` → `view-transitions`: form, form-fields, format, hover-card, input, input-group, input-otp, item, kbd, label, marker, menubar, message, message-scroller, mode-toggle, native-select, navigation-menu, pagination, popover, primitives, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, spinner, status-dot, switch, table, tabs, textarea, time-picker, toast, toggle, toggle-group, tooltip, typography, use-form, view-transitions — **44** (the banner says 42; it undercounts, and `form`/`form-fields` are re-checked rather than trusted).

**Triage only.** Task 68 misdiagnosed 3 of 9 and shipped incomplete `files:` lists on 4 of 9, so an unmeasured finding is worse than no finding: it sends 72 after the wrong cause. Every item written to `docs/ISSUES.md` carries the measurement that produced it (ratio, computed value, console text, geometry) and a `path:line` that was re-read, not remembered. Anything suspected but not reproduced goes to section **I**, never to C/D/E/F.

Out of scope: fixes of any kind; A2 (raw `<button>` in docs pages — task 69 owns it and already lists the pages); A3 code examples (task 30); G-family test flakes.

## Sub-tasks

- [x] 1. `scripts/sweep-pages.mjs` — headless sweep over every registry page in light **and** dark, emitting one JSON report plus full-page screenshots. Per page it records: axe-core `color-contrast` violations (selector, measured ratio, required, colours), computed `cursor` for every interactive element (`button`, `a[href]`, `[role=button]`, `[role=option]`, `[role=menuitem]`, `[role=tab]`, `[role=switch]`, `input`, `select`, `summary`, `[tabindex]:not([tabindex="-1"])`) where it is not `pointer`/`text`/`grab`, console errors + React warnings + uncaught page errors, horizontal document overflow at 1280 and 380, and the left edge of the first `.pg-section` (the D8 geometry check). Dark mode via `emulateMedia({ colorScheme: "dark" })` on a fresh load — `site/color-scheme.js:16` reads the media query at import time, so toggling the class post-load desyncs the store. — test: the script's own run is the test; it must complete all 74 pages with zero harness errors and produce a report whose page count matches `site/registry.js`; files: `scripts/sweep-pages.mjs`
- [x] 2. Triage the machine findings — dedupe against existing D1–D6/F1–F4/C6/E3/I1 (already owned by 72), confirm each survivor by re-reading the source at the reported line, and drop anything the script flagged that does not reproduce on a second run. Output is a triaged list in the report dir, not yet in `ISSUES.md`. — test: every kept finding cites a `path:line` re-read this pass; files: (scratchpad report only)
- [x] 3. Visual review of the screenshots — 4 background `general-purpose` agents (`model: "opus"`), ~11 pages each, light+dark, each reporting only defects it can name concretely (clipping, overlap, misalignment against neighbouring pages, invisible state, broken demo). Screenshots stay in the agents' context, never the head's. — test: each agent returns a list with page, mode, and what is wrong; files: (scratchpad screenshots)
- [x] 4. Write findings into `docs/ISSUES.md` under the existing lettered sections (new items continue the numbering: D7+ are taken, so contrast items land as D9…, cursor as F5…, code bugs as C7…, motion as E4…, unverified as I2…), each with its measurement and verified line reference. — test: `grep` every new `path:line` resolves to the cited code; files: `docs/ISSUES.md`
- [x] 5. Take the banner down and reconcile the plan — delete the `⚠️ PICK UP HERE` block from `docs/ISSUES.md`, mark 71 `[x]` in `docs/TODO/README.md`, re-estimate 72 from the actual finding count, append to `docs/TODO/LOG.md`. — test: no `PICK UP HERE` remains; the 72 footnote lists the new item ids; files: `docs/ISSUES.md`, `docs/TODO/README.md`, `docs/TODO/LOG.md`

## Verify / done

```
node scripts/sweep-pages.mjs        # completes 74 pages, writes report
node tests/run.mjs                  # 708/708 — this task changes no component
npm run build                       # clean
```

Acceptance: `docs/ISSUES.md` has no unfinished-sweep banner; every new finding names a measurement and a re-read `path:line`; nothing under `ui/`, `lib/` or `site/pages/` changed except by the sweep script's own existence.

## Handoff

**Status:** COMPLETE
**Branch:** merged to `main` (`a4d2b3761d06`, `750bcd0b89a0`), pushed  **PR:** none — fast-forwarded  **Updated:** 2026-08-01

- **Landed:** the sweep is finished and the `docs/ISSUES.md` banner is down. All 79 routed pages measured in light and dark by two committed, rerunnable tools: `node scripts/sweep-pages.mjs` (axe text contrast, cursor affordance, console errors, overflow at 1280 and 380, geometry; takes route substrings, `--out`, `--no-shots`) and `node scripts/contrast-nontext.mjs` (WCAG 1.4.11 boundary contrast).
- **Findings:** 56 raw contrast hits and 38 cursor hits collapse into four causes — D9 `--border` 1.26:1, D10 `--muted-foreground` on `--muted` 4.34:1, F5 seven component `cursor: default` declarations, F6 no native input types in the global rule. Plus C7–C8, I2, and K1 (now task 74). D1/D2/D3/D5 = D9; F1/F2/F3 = F5.
- **Repo state:** clean. (`stash@{0} "whoops"` predates this task and is not ours.)
- **Next:** task 72 — its footnote in `docs/TODO/README.md` has the ordered, cheapest-first fix list. Start with D9: one token in `styles/defaults.css:35`, then re-run `scripts/contrast-nontext.mjs` before touching any component.
- **Gotchas:** D4 and D6 were measured and did **not** reproduce as described — re-aimed in place, not struck. Colour measurement traps live in `docs/TODO/notes/measuring-colour.md`; read it before writing anything that reads a computed colour.
