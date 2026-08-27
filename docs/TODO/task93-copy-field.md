# task93: copy-field
**Goal:** A read-only field that shows a resource ID, ARN or connection string and copies it in one click, with truncation that keeps the distinguishing part visible and an optional secret mask.  **Branch:** `feat/copy-field`  **Deps:** none
**Owns:** `ui/copy-field/**` (incl. `.van.json`), `site/pages/copy-field.jsx`, `tests/copy-field.test.mjs`, one `site/registry.js` line (Data Display group, after `live-value`), the regenerated `registry.json`

## Read this first

New component; follow `README.md` "Adding a component" and the conventions in `AGENTS.md` and `docs/QUIRKS.md`. `ui/live-value` (task 91, `d70e7c66`) is the most recent new component — copy its page anatomy (`site/pages/live-value.jsx`: `InstallSnippet`, `ComponentPreview`, `ApiReference`, `data-pg` hooks) and its test style (`tests/live-value.test.mjs`).

Precedents for the interaction, **read-only — do not edit them**: the docs site's copy button (`site/code-example.jsx:23-41`: `navigator.clipboard.writeText`, 2s "Copied" state, icon swap) and the console mock's API-key row (`site/showcase/panels/settings-panel.jsx:102`, `CopyIcon`/`EyeIcon` in `panels-icons.jsx`). `ui/` never imports from `site/`, so the icons are re-declared inline in `copy-field.jsx` (the kit does this everywhere, e.g. `XIcon` in `ui/badge/badge.jsx`).

Composition follows task 63's rule — reuse where the relationship is **semantic**. The copy control *is* a button, so render it with `ui/button`'s `Button` (`variant="ghost" size="icon"`, sized down in `.copy-field-btn`). `deriveRequires()` then lists `button` in `requires` when you run `npm run contracts`. Nothing else here is semantic enough to compose.

## API (settled; stop and report rather than force a change)

```jsx
<CopyField value="arn:aws:iam::123456789012:role/console-readonly" />
<CopyField value={connectionString} label="Connection string" secret />
<CopyField value={id} truncate="end" />            // default "middle"
<CopyField value={id} onCopy={(v) => track(v)} copyLabel="Copy ARN" copiedLabel="ARN copied" />
```

| Prop | Default | Meaning |
|---|---|---|
| `value` | required | the string copied; always copied in full, even when masked or truncated |
| `label` | — | visible label in `.copy-field-label`; the button's accessible name is `copyLabel` + `label` when present, `copyLabel` alone otherwise |
| `truncate` | `"middle"` | `"middle"` keeps the last 8 characters visible and ellipsises the head; `"end"` is plain `text-overflow: ellipsis`; `false` wraps |
| `secret` | `false` | display masked (`•` × 12) with a reveal toggle; copy still copies `value` |
| `copyLabel` / `copiedLabel` | `"Copy"` / `"Copied"` | button accessible name before/after; `copiedLabel` also goes to a polite live region |
| `onCopy` | — | `(value) => void` after a successful write |
| `as`, `className`, `...rest` | | spread on the root, per kit convention |

Anatomy: `.copy-field` (root `<div>`), `.copy-field-label`, `.copy-field-value` (`<code dir="ltr">` — IDs are not bidi text, so the value stays LTR under an RTL page), `.copy-field-head` + `.copy-field-tail` for middle truncation (head `flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap`, tail `flex: 0 0 auto`), `.copy-field-btn` (the `Button`), `.copy-field-reveal` (secret toggle, also a `Button`), `.copy-field-live` (visually hidden, `aria-live="polite"`). `data-state="idle" | "copied"` on the root; `data-secret="masked" | "revealed"` on the root when `secret`.

Clipboard: `navigator.clipboard.writeText(value)`; when `navigator.clipboard` is undefined (insecure context) fall back to a transient off-screen `<textarea>` + `document.execCommand("copy")`. The copied state lasts 2000ms — a JS constant, like `site/code-example.jsx`; the no-hard-coded-durations rule is about CSS motion — and the timer is cleared on unmount. The copy→check icon swap is CSS via `data-state`; any transition uses `var(--motion-fast) var(--motion-ease)`.

Tokens only (`var(--…)`, `color-mix(in oklab, …)`, no hex); monospace via `var(--font-mono)`. Forced-colors: the buttons keep a visible `CanvasText` border and the mask dots take no author colour.

## Sub-tasks

- [x] 1. **Component.** `ui/copy-field/copy-field.jsx` + `copy-field.css` per the API above. files: `ui/copy-field/**`
- [x] 2. **Page + registry.** `site/pages/copy-field.jsx` — Default, Usage, Truncation (middle vs end, in a 12rem container), Secret, With label, Callback — and the `site/registry.js` line under Data Display after `"live-value"`. Exactly one `h2`. files: page, `site/registry.js`
- [ ] 3. **Tests** in `tests/copy-field.test.mjs`. Grant clipboard first: `await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseUrl })`. Then assert outcomes, never call shapes: a click puts the exact `value` on the clipboard (`navigator.clipboard.readText()` in the page); `secret` copies the real value while the visible text is dots, and reveal toggles `data-secret`; the button's accessible name flips to `copiedLabel` and back (`waitForFunction`, never a fixed sleep); the live region is empty before the click and carries `copiedLabel` after; middle truncation in the 12rem container leaves the tail's text equal to the last 8 characters and the head with `scrollWidth > clientWidth`; `truncate="end"` renders one value span; the value has `dir="ltr"`. files: `tests/copy-field.test.mjs`
- [ ] 4. **Manifests.** `npm run contracts`; commit `ui/copy-field/.van.json` and `registry.json` with the component.

## Verify / done

```sh
npm run contracts && git diff --exit-code
VANILLIN_TEST_PORT=5203 node tests/run.mjs copy-field conformance registry manifest
VANILLIN_TEST_PORT=5203 node tests/run.mjs > out.txt 2>&1; grep -c '^PASS' out.txt; grep '^FAIL' out.txt
npm run build
```

Baseline: **811/811** on 2026-08-27 (`07961519da8d`, idle machine, exit 0). Your run should be 811 + your new tests. Name any `FAIL` line in the report — a bare count cannot be reviewed.

Done when: `#copy-field` renders every demo, a click puts the full value on the clipboard, the conformance/registry/manifest unit suites pass with the new slug, and the full suite is green with the new tests named in the report.

## Out of scope

Swapping `site/showcase/panels/settings-panel.jsx`'s API-key row to `CopyField` — shared file; the head does it after merge. A standalone `CopyButton` export (no second caller yet). `ui/tooltip` on the button — the visible copied state and the live region already carry the feedback.

## Handoff

**Status:** NOT STARTED
