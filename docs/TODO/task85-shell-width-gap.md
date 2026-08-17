# task85: shell-width-gap
**Goal:** Content column at a normal-to-slightly-above-average max width, and roughly double the breathing room between the docs column and the two resizable side menus.  **Branch:** `docs/shell-width-gap`  **Deps:** none
**Owns:** `site/site.css` (shell geometry only)

User request 2026-08-16, verbatim intent: "max width of the site set to a normal to slightly above average size. More spacing between the docs and the resizable side menus. About double."

## Current geometry (measured at seed time)

- `--pg-main-max: 68rem` (`site/site.css:28`) — 1088px, set by task 81.
- `.pg-main` padding `2rem 2.5rem` (`site/site.css:501`); the 2.5rem inline padding is most of the visual gap to the sidebar and TOC rail.
- Shell grid `auto 1fr auto` (`site/site.css:60`); the column centres in the `1fr` track (`margin-inline: auto`, load-bearing `width: 100%` — read the comment block at `site/site.css:497-513` before touching).
- `--typeset-measure: 62ch` at `site/site.css:512` — prose measure is independent of the column cap; previews/code/tables take the full column.

## Sub-tasks

- [ ] 1. **Measure before editing.** At 1440 and 1920, screenshot a mid-weight page (e.g. `#dialog`) and record the actual pixel gap between column edge and sidebar/rail. "About double" refers to what the user sees, which is padding + any leftover track slack.
- [ ] 2. Pick the cap. "Normal to slightly above average" for a docs content column is ~72-80rem overall against 68rem today; propose one value with the measurement in hand, likely a modest bump (e.g. 72rem) or keep 68rem if the gap change alone reads right.
- [ ] 3. Double the column-to-menus spacing: raise `.pg-main` inline padding ~2.5rem → ~5rem, or move the spacing to grid `column-gap` so it holds when the rail is drag-resized (the rail is resizable — check how its width interacts with padding vs gap before choosing).
- [ ] 4. Re-check the three breakpoints (`site/site.css:75`, `:487`, and the 64rem rule) and the ≤72rem collapse — wider padding must not crush the column at laptop widths.
- [ ] 5. Verify: `node tests/run.mjs` (baseline 760/762), `scripts/sweep-pages.mjs` for overflow at 1280/380.

## Notes

- Task 74 (mobile views) also owns the shell — it now deps on this task; serialise.
- Do not reintroduce per-page margin overrides; 81 deleted those deliberately.

## Handoff

**Status:** NOT STARTED
