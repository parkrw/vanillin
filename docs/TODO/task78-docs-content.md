# task78: docs-content
**Goal:** Get Started refresh, config reference page, CLI page, voice pass, remaining content fixes from ISSUES B1-B6 + A5 + C7/C8 not addressed by tasks 76-77.  **Branch:** `docs/content`  **Deps:** 75
**Owns:** `site/pages/docs/*.jsx`, `site/registry.js`

## Sub-tasks

- [ ] 1. **Config reference page (B1)** — new `site/pages/docs/configuration.jsx`. Documents `van.config.json` fully: `brand` (string or object), `radius`, `density`, `motion`, `font`, per-mode overrides (`light`/`dark`), `components.<slug>.tokens`, `.variants`, `.sizes`. Real examples from the repo's own `van.config.json` and `van.defaults.json`. Register in `site/registry.js` under docs.
  - files: `site/pages/docs/configuration.jsx`, `site/registry.js`

- [ ] 2. **Get Started refresh** — rewrite `introduction.jsx` and `installation.jsx`:
  - Introduction: what vanillin is (zero-dep, copy-based component kit), why it exists (upstream locks you into Tailwind+Radix+React 18), what makes it different. Built from vanillin components as a showcase (task 69 started this, polish it).
  - Installation: clearer flow — prerequisites, `van init`, `van add`, `van build`, first component rendering. Code examples for each step.
  - files: `site/pages/docs/introduction.jsx`, `site/pages/docs/installation.jsx`

- [ ] 3. **Schema page refresh** — update `schema.jsx` to lead with `lib/schema.js` + `schemaResolver` as the primary recommendation. Zod mentioned as compatible alternative, not first choice. Mirrors B5 fix from task 76 sub-task 6 but on the dedicated schema page.
  - files: `site/pages/docs/schema.jsx`

- [ ] 4. **Theming page update** — add per-component config examples (B1 overflow). Show how `components.button.variants` and `.tokens` work in `van.config.json` → `van.css`. Cross-link to the new configuration page.
  - files: `site/pages/docs/theming.jsx`

- [ ] 5. **Voice pass (A5)** — skim all docs/ pages for upstream-verbatim prose. Rewrite in vanillin's own voice. The kit is similar to upstream, not the same — reads as a clone when the prose is identical.
  - files: `site/pages/docs/*.jsx`

- [ ] 6. **CLI docs page** — new `site/pages/docs/cli.jsx` documenting `bin/van.mjs`: init, add (incl. bare-add picker), diff, update (3-way merge), build, list; `van.config.json` pointer to the configuration page. The `cli` entry in `site/registry.js` (line ~22) exists page-less — add its `page:` import to turn it live.
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

**Status:** NOT STARTED
