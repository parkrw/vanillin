# task87: home-console-showcase
**Goal:** A second showcase section below the home hero: a sleek cloud-console mock ("VCD 10.6", VMware-look) demonstrating many kit components in advanced compositions, with parts of it styled like Apple's glass design language.  **Branch:** `feat/home-console-showcase`  **Deps:** 85 (shell geometry settles first), 86 optional
**Owns:** `site/pages/home.jsx`, new `site/showcase/**` (keep console demo components out of `site/pages/`)

User request 2026-08-16: "New showcase below hero with many advanced usages of many van components — cloud console with a more sleek and stylized vmw-look project (VCD 10.6) in my Claude design of that name. Make some of it look like it was styled by Apple glass designers."

## BLOCKED INPUT — the design reference

The user has a prior Claude design named **"VCD 10.6"**. It is **not in this repo, `~/.claude/plans/`, or any published artifact** (searched 2026-08-16). **First action: ask the user to paste or link it.** Do not invent the design and then retrofit; scope below is provisional until the reference lands.

## Provisional scope (pending the reference)

- One new section below the hero in `home.jsx` (hero itself was finished in task 82 — do not redo it).
- The mock is a **cloud-console workspace** in the visual spirit of VMware Cloud Director 10.6: dense left nav, resource tables, status, breadcrumb trail, dark chrome.
- Built **only from kit components and tokens** — this is the site's dogfood claim. Candidate cast: `sidebar` (or `navigation-menu`) + `breadcrumb`, `data-table` (filtering/pinning from 47/48), `command` palette, `tabs`, `badge`/`status-dot`/`progress`, `dropdown-menu`, `sheet` for a detail panel, `resizable` split.
- **Glass treatment** on selected surfaces (e.g. the console's top bar and a floating palette): `backdrop-filter: blur/saturate` + translucent token-derived backgrounds. Constraints: honour `prefers-reduced-transparency` (task 56 machinery exists), keep text contrast measurable — run `scripts/contrast-nontext.mjs` and `scripts/sweep-pages.mjs` on home before calling it done, since translucency is exactly what those tools exist to catch.
- Home has **no test file**; the suite constrains nothing here, so the sweep scripts are the only automated check. Keep `#home` load time sane — the section will import many components; check the vite chunk for home doesn't balloon (currently home is in the index chunk).

## Relation to the console kit

`TODO/README.md` sequences a "console kit" (new components) after 74. This task is the **showcase**, not the kit: build with components that exist. Where the mock wants something the kit lacks (e.g. charts), fake it with composition, and feed the gap list into the console-kit scoping instead of building new `ui/` components here.

## Sub-tasks

- [ ] 1. Obtain the "VCD 10.6" design from the user; extract palette, layout, and which surfaces go glass.
- [ ] 2. Layout skeleton in `site/showcase/console.jsx` — static, kit components, no data wiring.
- [ ] 3. Interactions that read as "advanced usage": working command palette scoped to the mock, table filter, detail sheet.
- [ ] 4. Glass pass + reduced-transparency fallback.
- [ ] 5. Wire into `home.jsx` below the hero; sweep scripts + full suite (baseline 760/762); check home stays clean at 1280 and 380.

## Handoff

**Status:** BLOCKED — needs the "VCD 10.6" design reference from the user (sub-task 1); everything else is ready to start once it lands.
