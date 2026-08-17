# task87: home-console-showcase
**Goal:** A second showcase section below the home hero: a sleek cloud-console mock ("VCD 10.6", VMware-look) demonstrating many kit components in advanced compositions, with parts of it styled like Apple's glass design language.  **Branch:** `feat/home-console-showcase`  **Deps:** 85 (shell geometry settles first), 86 optional
**Owns:** `site/pages/home.jsx`, new `site/showcase/**` (keep console demo components out of `site/pages/`)

User request 2026-08-16: "New showcase below hero with many advanced usages of many van components — cloud console with a more sleek and stylized vmw-look project (VCD 10.6) in my Claude design of that name. Make some of it look like it was styled by Apple glass designers."

## Design reference (resolved 2026-08-16)

The reference is the user's **"CloudKey Console"** claude.ai/design project, supplied via the claude_design MCP (`DesignSync`, project `c25e05dc-c6da-46e6-8020-480f4da27d33`, file `CloudKey Console copy.dc.html`): an OpenStack-flavoured console with a gold `#C9913F` accent, light/dark themes, category nav → service nav → tabbar → dashboard/tables, project/region pills, and an expandable taskbar. The mock brands as CloudKey 10.6, not VMware.

## Scope

- One new section below the hero in `home.jsx` (hero itself was finished in task 82 — do not redo it).
- The mock is a **cloud-console workspace** in the visual spirit of VMware Cloud Director 10.6: dense left nav, resource tables, status, breadcrumb trail, dark chrome.
- Built **only from kit components and tokens** — this is the site's dogfood claim. Candidate cast: `sidebar` (or `navigation-menu`) + `breadcrumb`, `data-table` (filtering/pinning from 47/48), `command` palette, `tabs`, `badge`/`status-dot`/`progress`, `dropdown-menu`, `sheet` for a detail panel, `resizable` split.
- **Glass treatment** on selected surfaces (e.g. the console's top bar and a floating palette): `backdrop-filter: blur/saturate` + translucent token-derived backgrounds. Constraints: honour `prefers-reduced-transparency` (task 56 machinery exists), keep text contrast measurable — run `scripts/contrast-nontext.mjs` and `scripts/sweep-pages.mjs` on home before calling it done, since translucency is exactly what those tools exist to catch.
- Home has **no test file**; the suite constrains nothing here, so the sweep scripts are the only automated check. Keep `#home` load time sane — the section will import many components; check the vite chunk for home doesn't balloon (currently home is in the index chunk).

## Relation to the console kit

`TODO/README.md` sequences a "console kit" (new components) after 74. This task is the **showcase**, not the kit: build with components that exist. Where the mock wants something the kit lacks (e.g. charts), fake it with composition, and feed the gap list into the console-kit scoping instead of building new `ui/` components here.

## Sub-tasks

- [x] 1. Obtain the design from the user (see "Design reference" above).
- [x] 2. Layout skeleton: `site/showcase/console.jsx` + `console-data.js` + `console.css`.
- [x] 3. Interactions: command palette (navigates the mock, queues toast actions), servers data-table (global filter, faceted status filter, sorting, selection-gated bulk actions, pagination, per-row menu), detail sheet, project switcher that refilters the table, resizable nav split, collapsible taskbar.
- [x] 4. Glass pass (topbar, sticky toolbar, palette, sheet) + `prefers-reduced-transparency` fallback.
- [x] 5. Wired into `home.jsx` below the hero as a lazy chunk (console: 27.8 kB js + 9.8 kB css gz 7.9/2.3; index chunk unchanged). Suite 760/762. Sweep + non-text contrast measured on home in both themes and all interactive states: zero violations.

## Handoff

**Status:** COMPLETE on `feat/home-console-showcase` (worktree `../vanillin-task87-console`), pending merge.

- **What landed:** `site/showcase/{console.jsx,console-data.js,console.css}` + a "Compose something real" section in `home.jsx`. Kit-only composition of ~30 components; the only new values are the scoped CloudKey gold custom properties in `console.css`, split into text/solid/soft roles, measured 3.56:1 to 10.5:1 across themes.
- **Verification:** suite 760/762 twice (one run flaked three drawer timeouts; clean in isolation and on rerun, G-family noise). Home has no test file; measurement was a scratch copy of `scripts/sweep-pages.mjs` with a hard-coded home route plus palette/servers/sheet axe passes, and a scratch `contrast-nontext.mjs` probe list for the console surfaces. Scratch scripts deleted; regenerate the same way if needed.
- **Findings for other owners:** (1) `--warning` light (`oklch(0.75 0.18 65)`) measures 2.31:1 on white and fails on `main` today via the stock status-dot probe: a kit token issue, not this task's (the console's warning bars keep the value as adjacent text, so 1.4.11's redundancy carve-out applies). (2) `scripts/sweep-pages.mjs` never visits home because it parses routes out of `site/registry.js` and home is routed in `app.jsx`: add home probes when someone owns `scripts/`. (3) Kit quirk worked around in `console.css`: a CSS animation restarts when its element regains `display`, so a container-query-hidden `CollapsibleContent` replays `collapsible-down` against a stale measured height and clips; the console's open nav categories render statically.
- **Deps note:** started before task 85 by user instruction (Owns are disjoint). After 85 re-picks the column cap, re-eyeball the console at the new width; the frame is fluid and container-queried, so no code change is expected. The pre-existing 380px home overflow (753px scrollWidth) is byte-identical before and after this task; it is task 74's shell defect.
