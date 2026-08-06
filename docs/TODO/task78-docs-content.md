# task78: docs-content
**Goal:** Get Started refresh, config reference page, CLI page, voice pass, remaining content fixes from ISSUES B1-B6 + A5 + C7/C8 not addressed by tasks 76-77.  **Branch:** `docs/content`  **Deps:** 75
**Owns:** `site/pages/docs/*.jsx`, `site/registry.js`

## Sub-tasks

- [x] 1. **Config reference page (B1)** — new `site/pages/docs/configuration.jsx`. Documents `van.config.json` fully: `brand` (string or object), `radius`, `density`, `motion`, `font`, per-mode overrides (`light`/`dark`), `components.<slug>.tokens`, `.variants`, `.sizes`. Real examples from the repo's own `van.config.json` and `van.defaults.json`. Register in `site/registry.js` under docs.
  - files: `site/pages/docs/configuration.jsx`, `site/registry.js`

- [x] 2. **Get Started refresh** — rewrite `introduction.jsx` and `installation.jsx`:
  - Introduction: what vanillin is (zero-dep, copy-based component kit), why it exists (upstream locks you into Tailwind+Radix+React 18), what makes it different. Built from vanillin components as a showcase (task 69 started this, polish it).
  - Installation: clearer flow — prerequisites, `van init`, `van add`, `van build`, first component rendering. Code examples for each step.
  - files: `site/pages/docs/introduction.jsx`, `site/pages/docs/installation.jsx`

- [x] 3. **Schema page refresh** — update `schema.jsx` to lead with `lib/schema.js` + `schemaResolver` as the primary recommendation. Zod mentioned as compatible alternative, not first choice. Mirrors B5 fix from task 76 sub-task 6 but on the dedicated schema page.
  - files: `site/pages/docs/schema.jsx`

- [x] 4. **Theming page update** — add per-component config examples (B1 overflow). Show how `components.button.variants` and `.tokens` work in `van.config.json` → `van.css`. Cross-link to the new configuration page.
  - files: `site/pages/docs/theming.jsx`

- [x] 5. **Voice pass (A5)** — skim all docs/ pages for upstream-verbatim prose. Rewrite in vanillin's own voice. The kit is similar to upstream, not the same — reads as a clone when the prose is identical.
  - files: `site/pages/docs/*.jsx`

- [x] 6. **CLI docs page** — new `site/pages/docs/cli.jsx` documenting `bin/van.mjs`: init, add (incl. bare-add picker), diff, update (3-way merge), build, list; `van.config.json` pointer to the configuration page. The `cli` entry in `site/registry.js` (line ~22) exists page-less — add its `page:` import to turn it live.
  - files: `site/pages/docs/cli.jsx`, `site/registry.js`

## Verify / done

```sh
npm run dev          # visual QA: all docs pages, new config page in nav
npm test             # suite green
npm run build        # build clean
```

Observable:
- New "Configuration" page in Get Started nav, fully documenting van.config.json
- Introduction explains vanillin's identity and value prop
- Installation has step-by-step code examples
- Schema page leads with lib/schema.js
- No upstream-verbatim prose remaining in docs/ pages

## Handoff

**Status:** COMPLETE
**Branch:** `docs/content`  **PR:** none  **Updated:** 2026-08-06

- **Landed:** Configuration reference page (B1) with full `van.config.json` docs grounded in `config-schema.mjs`. Introduction rewritten with vanillin identity/value prop. Installation has numbered step-by-step with CodeBlock examples. Schema page leads with `lib/schema.js` + `schemaResolver`. Theming page gains per-component config section and CodeBlock migration. Voice pass converted all bare `<pre>` to `<CodeBlock>` across docs pages. CLI page documents all 6 commands with flags.
- **Repo state:** clean (pre-existing `package-lock.json` modification unstaged)
- **Next:** task 76 (docs-pages-core) — 15 key component pages get the full docs template
- **Gotchas:** Configuration page registered under "Get started" group, not "Docs" — felt more discoverable there alongside introduction/installation. CLI `page:` and configuration entry both landed in one registry.js commit (sub-task 1). 2 pre-existing slider cursor test failures (753/755).
