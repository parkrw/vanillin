/**
 * Conformance suite for ui/ components.
 * Named .unit.mjs so the browser test runner ignores it.
 *
 * Walks every ui/<slug>/ and checks static rules from README.md's component
 * conventions and AGENTS.md's additions to them.
 * Every failure names the offending file, the rule, and what to do.
 */

import assert from "node:assert/strict"
import { readdirSync, readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import {
  readManifest,
  hashFile,
  deriveRequires,
} from "../scripts/manifest.mjs"

const repoRoot = fileURLToPath(new URL("..", import.meta.url))
const uiDir = join(repoRoot, "ui")
const testsDir = join(repoRoot, "tests")
const sitePagesDir = join(repoRoot, "site", "pages")
const registryPath = join(repoRoot, "site", "registry.js")
const pkgPath = join(repoRoot, "package.json")

let passed = 0
let failed = 0
const tests = []

function test(name, fn) {
  tests.push([name, fn])
}

// ── Allowlists ──────────────────────────────────────────────────────

// Components whose CSS block class intentionally differs from the dir slug.
// Each uses a subpart naming scheme (slug-part) or re-exports another component.
const BLOCK_CLASS_ALLOWLIST = {
  "alert-dialog": "re-exports dialog; compound class 'dialog alert-dialog' — all styling from dialog.css",
  breadcrumb: "no wrapper element; uses .breadcrumb-list / .breadcrumb-item subparts directly",
  button: "block class is .btn (upstream convention)",
  "button-group": "block class is .btn-group (matches button's .btn prefix)",
  collapsible: "no visible root; .collapsible-content is the styled part",
  combobox: "composite; .combobox-input-group is the visible root, not a bare .combobox",
  "context-menu": "re-exports dropdown-menu; compound class rides on .dropdown-menu",
  "data-table": "composite; toolbar/pagination/filter are all .data-table-* subparts",
  "date-picker": "CSS-only component; uses .date-picker-trigger / .date-picker-popover subparts",
  density: "no CSS file — sets data-density attribute only",
  format: "multiple formatter components; uses .format-relative / .format-bytes etc.",
  "form-fields": "composite wrappers; uses .form-field-row / .form-field-option subparts",
  resizable: "composite; .resizable-group / .resizable-panel / .resizable-handle subparts",
  select: "composite; .select-trigger / .select-content subparts (no bare .select root)",
  typography: "CSS-only component (no JSX); defines typographic utility classes",
}

// Components that are CSS-only or purely presentational — no interactive
// behavior requiring browser tests. Each must have a reason.
const STATIC_COMPONENTS = {
  alert: "presentational wrapper — renders a styled div with role=alert",
  "aspect-ratio": "CSS aspect-ratio wrapper, no interactivity",
  attachment: "presentational file-attachment card with remove button (delegated click only)",
  avatar: "image + fallback; loading state is native <img> behavior",
  breadcrumb: "presentational nav list with links — no managed state",
  bubble: "chat-bubble presentational wrapper",
  button: "native <button> wrapper — behavior is the browser's",
  "button-group": "layout wrapper grouping buttons — no own state",
  card: "presentational container with slots",
  "date-picker": "CSS-only (no JSX); popover wiring is in the demo page",
  empty: "presentational empty-state placeholder",
  field: "presentational form-field layout wrapper",
  input: "native <input> wrapper — no managed state",
  "input-group": "layout wrapper for input + addons — no own behavior",
  item: "presentational list-item layout",
  kbd: "presentational keyboard-shortcut badge",
  label: "native <label> wrapper",
  marker: "presentational dot/ring indicator",
  message: "presentational chat-message wrapper",
  "native-select": "native <select> wrapper — behavior is the browser's",
  separator: "presentational <hr> / divider",
  skeleton: "CSS-only loading placeholder — no interactivity",
  spinner: "CSS-only spinning indicator — no interactivity",
  table: "presentational <table> wrapper — no own state",
  typography: "CSS-only typographic classes (no JSX)",
}

// Indeterminate-loop animations: must use fixed literals, NOT motion tokens.
// Keyed by slug; value is the list of allowed {selector, duration} pairs.
const INDETERMINATE_LOOPS = {
  spinner: [{ selector: ".spinner", duration: "1s" }],
  skeleton: [{ selector: ".skeleton", duration: "2s" }],
  "status-dot": [
    { selector: '.status-dot[data-status="pending"]', duration: "2s" },
    { selector: ".status-dot--ring", duration: "2s" },
  ],
  badge: [{ selector: ".badge--glow", duration: "2s" }],
  // The sweep is the indeterminate loop; the glow is a "live" halo. Both are
  // infinite, so both must stay off --motion-scale. --glow-duration retimes
  // the halo only — the sweep's 1.5s is not a consumer knob.
  progress: [
    { selector: '.progress[data-state="indeterminate"] .progress-indicator', duration: "1.5s" },
    { selector: ".progress--glow .progress-indicator", duration: "2s" },
  ],
  attachment: [{ selector: ".attachment--uploading::before", duration: "2s" }],
  "input-otp": [{ selector: ".input-otp-slot--caret::after", duration: "1s" }],
  toast: [{ selector: ".toast-loading-spinner", duration: "1s" }],
}

// Exported components that render only a context provider — no DOM node of
// their own, so there is nothing to spread rest props onto. Select and
// Combobox are NOT here: they forward leftover props to their trigger/input.
// Keyed "slug/ComponentName".
const PROVIDER_COMPONENTS = {
  "context-menu/ContextMenu": "renders DropdownMenu + context; the trigger is a child part",
  "dialog/Dialog": "context provider; DialogContent renders the <dialog>",
  "dialog/DialogPortal": "portal wrapper, renders children elsewhere",
  "dropdown-menu/DropdownMenu": "context provider; trigger/content are child parts",
  "dropdown-menu/DropdownMenuSub": "nested-menu context provider",
  "form/FormField": "context provider around Controller — FormControl targets the control",
  "hover-card/HoverCard": "context provider; trigger/content are child parts",
  "menubar/MenubarMenu": "per-menu context provider inside Menubar",
  "message-scroller/MessageScrollerProvider": "context provider by name and contract",
  "popover/Popover": "context provider; trigger/content are child parts",
  "tooltip/Tooltip": "context provider; trigger/content are child parts",
  "tooltip/TooltipProvider": "shared-timer context provider by name and contract",
}

// ── Helpers ─────────────────────────────────────────────────────────

function listUiSlugs() {
  return readdirSync(uiDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort()
}

function listRegularFiles(dir, prefix = "") {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      results.push(...listRegularFiles(join(dir, entry.name), rel))
    } else if (entry.isFile() && entry.name !== ".van.json") {
      results.push(rel)
    }
  }
  return results.sort()
}

// Comments are blanked, not removed, so reported line numbers stay true.
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ""))
}

function stripJsComments(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ""))
    .replace(/\/\/.*/g, "")
}

// Remove var(--…) calls so tokens inside them don't false-positive as
// hard-coded values (e.g. "ease" inside "var(--motion-ease)").
function stripVarCalls(s) {
  return s.replace(/var\([^)]*\)/g, "")
}

// Find every declaration of the given properties, wherever it sits on a line
// (one-line rules like `.x { animation: … }` must not evade the motion
// checks). Returns {prop, value, line}; value spans to the next ; or }.
function findDeclarations(content, props) {
  const re = new RegExp(`(?:^|[{;])\\s*(${props.join("|")})\\s*:\\s*([^;}]*)`, "g")
  const out = []
  let m
  while ((m = re.exec(content)) !== null) {
    const propOffset = m.index + m[0].indexOf(m[1])
    out.push({
      prop: m[1],
      value: m[2].replace(/\s+/g, " ").trim(),
      line: content.slice(0, propOffset).split("\n").length,
    })
  }
  return out
}

// ── Rule 1: Tokens only — no hex, no raw rgb/hsl, no --shadow-xs ───

test("tokens-only: no hex colours in CSS property values", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const dir = join(uiDir, slug)
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".css"))) {
      const raw = readFileSync(join(dir, file), "utf8")
      const content = stripComments(raw)
      const lines = content.split("\n")
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Skip lines that are selectors (contain { but not : before it) or
        // @-rules, data URIs, or id selectors in selectors context.
        // Only check property values: lines with a colon.
        if (!line.includes(":")) continue
        // Split at first colon to get the value portion.
        const valuePart = line.slice(line.indexOf(":") + 1)
        // Skip data URIs.
        if (valuePart.includes("data:")) continue
        // Match hex colour patterns in value context.
        const hexMatch = valuePart.match(/#[0-9a-fA-F]{3,8}\b/)
        if (hexMatch) {
          errors.push(
            `${slug}/${file}:${i + 1} — hex colour "${hexMatch[0]}" in value. ` +
              `Use a token var(--…) from globals.css instead.`
          )
        }
      }
    }
  }
  assert.equal(errors.length, 0, "tokens-only (hex):\n  " + errors.join("\n  "))
})

test("tokens-only: no hex colours in JSX inline styles", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const dir = join(uiDir, slug)
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".jsx"))) {
      const raw = readFileSync(join(dir, file), "utf8")
      const content = stripJsComments(raw)
      // Match style={{ ... }} or style={...} with hex values.
      // Simpler: just look for hex in string literals and style props.
      const lines = content.split("\n")
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // Skip SVG paths/viewBox/data attributes and imports.
        if (/\bviewBox\b|\bd=["']|import\s/.test(line)) continue
        // Look for hex in style-related contexts.
        const hexInStyle = line.match(/style\s*=\s*\{[^}]*#[0-9a-fA-F]{3,8}\b/)
        if (hexInStyle) {
          const hex = line.match(/#[0-9a-fA-F]{3,8}\b/)
          errors.push(
            `${slug}/${file}:${i + 1} — hex colour "${hex[0]}" in inline style. ` +
              `Use a token var(--…) instead.`
          )
        }
      }
    }
  }
  assert.equal(errors.length, 0, "tokens-only (hex in JSX):\n  " + errors.join("\n  "))
})

test("tokens-only: no raw rgb()/hsl()/rgba()/hsla() in CSS", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const dir = join(uiDir, slug)
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".css"))) {
      const raw = readFileSync(join(dir, file), "utf8")
      const content = stripComments(raw)
      const lines = content.split("\n")
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        // color-mix(in oklab, …) is allowed; raw rgb/hsl is not.
        const match = line.match(/\b(rgba?|hsla?)\s*\(/)
        if (match) {
          errors.push(
            `${slug}/${file}:${i + 1} — raw ${match[1]}() colour. ` +
              `Use a token var(--…) or color-mix(in oklab, …) instead.`
          )
        }
      }
    }
  }
  assert.equal(errors.length, 0, "tokens-only (rgb/hsl):\n  " + errors.join("\n  "))
})

test("tokens-only: no --shadow-xs anywhere in ui/", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const dir = join(uiDir, slug)
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".css") || f.endsWith(".jsx"))) {
      const content = readFileSync(join(dir, file), "utf8")
      const lines = content.split("\n")
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("--shadow-xs")) {
          errors.push(
            `${slug}/${file}:${i + 1} — banned token --shadow-xs. ` +
              `Use --shadow-sm instead.`
          )
        }
      }
    }
  }
  assert.equal(errors.length, 0, "tokens-only (--shadow-xs):\n  " + errors.join("\n  "))
})

// ── Rule 2: Motion — no hard-coded durations/easings ────────────────

test("motion: transitions use var(--motion-*), not hard-coded values", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const dir = join(uiDir, slug)
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".css"))) {
      const raw = readFileSync(join(dir, file), "utf8")
      const content = stripComments(raw)
      const decls = findDeclarations(content, [
        "transition",
        "transition-duration",
        "transition-timing-function",
      ])
      for (const { value, line } of decls) {
        if (value === "none") continue
        // Strip var() calls so tokens don't false-positive.
        const bare = stripVarCalls(value)
        // Check for hard-coded time values (not 0s/0ms).
        const timeRe = /\b(\d*\.?\d+)(ms|s)\b/g
        let m
        while ((m = timeRe.exec(bare)) !== null) {
          const val = m[1] + m[2]
          if (val === "0s" || val === "0ms") continue
          errors.push(
            `${slug}/${file}:${line} — hard-coded transition duration "${val}". ` +
              `Use var(--motion-fast) or var(--motion-medium) instead.`
          )
        }
        // Check for hard-coded easings.
        const easingRe = /\b(ease-in-out|ease-in|ease-out|ease|linear|cubic-bezier\s*\([^)]+\))\b/g
        while ((m = easingRe.exec(bare)) !== null) {
          errors.push(
            `${slug}/${file}:${line} — hard-coded transition easing "${m[1]}". ` +
              `Use var(--motion-ease) instead.`
          )
        }
      }
    }
  }
  assert.equal(errors.length, 0, "motion (transitions):\n  " + errors.join("\n  "))
})

test("motion: animations use var(--motion-*), except indeterminate loops", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const dir = join(uiDir, slug)
    const isIndeterminate = slug in INDETERMINATE_LOOPS
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".css"))) {
      const raw = readFileSync(join(dir, file), "utf8")
      const content = stripComments(raw)
      const decls = findDeclarations(content, [
        "animation",
        "animation-duration",
        "animation-timing-function",
      ])
      for (const { value: fullValue, line } of decls) {
        if (fullValue === "none") continue

        const hasInfinite = /\binfinite\b/.test(fullValue)

        if (hasInfinite) {
          // Indeterminate loop: must have a FIXED literal, must NOT use a
          // motion token (it must not track --motion-scale) — the inverse of
          // the rule for finite animations.
          if (!isIndeterminate) {
            errors.push(
              `${slug}/${file}:${line} — infinite animation in a slug not in INDETERMINATE_LOOPS. ` +
                `Indeterminate loops use a fixed literal duration (never a motion token); ` +
                `add {selector, duration} to INDETERMINATE_LOOPS with a reason.`
            )
          } else if (fullValue.includes("var(--motion")) {
            errors.push(
              `${slug}/${file}:${line} — indeterminate loop uses a motion token. ` +
                `Indeterminate animations must use a fixed literal (they must not track --motion-scale).`
            )
          }
          continue
        }

        // Non-indeterminate animation: must use var(--motion-*).
        const bare = stripVarCalls(fullValue)
        const timeRe = /\b(\d*\.?\d+)(ms|s)\b/g
        let m
        while ((m = timeRe.exec(bare)) !== null) {
          const val = m[1] + m[2]
          if (val === "0s" || val === "0ms") continue
          errors.push(
            `${slug}/${file}:${line} — hard-coded animation duration "${val}". ` +
              `Use var(--motion-fast) or var(--motion-medium) instead.`
          )
        }
        const easingRe = /\b(ease-in-out|ease-in|ease-out|ease|linear|cubic-bezier\s*\([^)]+\))\b/g
        while ((m = easingRe.exec(bare)) !== null) {
          errors.push(
            `${slug}/${file}:${line} — hard-coded animation easing "${m[1]}". ` +
              `Use var(--motion-ease) instead.`
          )
        }
      }
    }
  }
  assert.equal(errors.length, 0, "motion (animations):\n  " + errors.join("\n  "))
})

test("motion: indeterminate loops do NOT use motion tokens", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const dir = join(uiDir, slug)
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".css"))) {
      const raw = readFileSync(join(dir, file), "utf8")
      const content = stripComments(raw)
      for (const { value, line } of findDeclarations(content, ["animation"])) {
        if (/\binfinite\b/.test(value) && value.includes("var(--motion")) {
          errors.push(
            `${slug}/${file}:${line} — indeterminate loop references a motion token. ` +
              `Use a fixed literal instead; indeterminate animations must not track --motion-scale.`
          )
        }
      }
    }
  }
  assert.equal(errors.length, 0, "motion (indeterminate loops):\n  " + errors.join("\n  "))
})

// ── Rule 3: Naming — block class matches dir slug ───────────────────

test("naming: CSS defines a block class matching the dir slug", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    if (slug in BLOCK_CLASS_ALLOWLIST) continue
    const dir = join(uiDir, slug)
    const cssFile = join(dir, `${slug}.css`)
    if (!existsSync(cssFile)) {
      errors.push(
        `${slug}/ — no ${slug}.css file found. ` +
          `Create ${slug}.css with a .${slug} block class, or add to BLOCK_CLASS_ALLOWLIST with a reason.`
      )
      continue
    }
    const content = stripComments(readFileSync(cssFile, "utf8"))
    // Look for the block class: .slug followed by space, {, :, [, comma, or newline.
    const blockClassRe = new RegExp(`\\.${slug.replace(/-/g, "\\-")}(?=[\\s{:,\\[])`)
    if (!blockClassRe.test(content)) {
      // Check if it uses subpart naming (slug-part).
      const subpartRe = new RegExp(`\\.${slug.replace(/-/g, "\\-")}-`)
      if (subpartRe.test(content)) {
        errors.push(
          `${slug}/${slug}.css — no .${slug} block class (only subparts like .${slug}-*). ` +
            `Add a .${slug} block class or add to BLOCK_CLASS_ALLOWLIST if intentional.`
          )
      } else {
        errors.push(
          `${slug}/${slug}.css — no .${slug} block class found. ` +
            `Add .${slug} as the block class or add to BLOCK_CLASS_ALLOWLIST with a reason.`
        )
      }
    }
  }
  assert.equal(errors.length, 0, "naming (block class):\n  " + errors.join("\n  "))
})

// ── Rule 4: Demo page + registry ────────────────────────────────────

test("demo-page: every ui/ slug has site/pages/<slug>.jsx", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const page = join(sitePagesDir, `${slug}.jsx`)
    if (!existsSync(page)) {
      errors.push(
        `${slug} — missing site/pages/${slug}.jsx. ` +
          `Create a demo page so the component is documented on the docs site.`
      )
    }
  }
  assert.equal(errors.length, 0, "demo-page (missing):\n  " + errors.join("\n  "))
})

test("demo-page: every ui/ slug has a registry entry", () => {
  const errors = []
  const registrySrc = readFileSync(registryPath, "utf8")
  for (const slug of listUiSlugs()) {
    // Check for a key matching the slug in the registry.
    const keyRe = new RegExp(`["']?${slug.replace(/-/g, "\\-")}["']?\\s*:`)
    if (!keyRe.test(registrySrc)) {
      errors.push(
        `${slug} — no entry in site/registry.js. ` +
          `Add: "${slug}": { title: "…", page: lazy(() => import("./pages/${slug}.jsx")) }`
      )
    }
  }
  assert.equal(errors.length, 0, "demo-page (registry):\n  " + errors.join("\n  "))
})

test("demo-page: no two registry entries resolve to the same page module", () => {
  const registrySrc = readFileSync(registryPath, "utf8")
  // Extract all import("...") paths from the registry section. Keys may be
  // bare identifiers (introduction:) or quoted ("date-picker":).
  const importRe = /(?:["']([^"']+)["']|([\w$]+))\s*:\s*\{[^}]*?import\(["']([^"']+)["']\)/g
  const moduleMap = new Map() // module path -> array of slug keys
  let m
  while ((m = importRe.exec(registrySrc)) !== null) {
    const key = m[1] ?? m[2]
    const mod = m[3]
    if (!moduleMap.has(mod)) moduleMap.set(mod, [])
    moduleMap.get(mod).push(key)
  }
  // The regex matching nothing must be a failure, not a vacuous pass.
  assert.ok(
    moduleMap.size > 0,
    "demo-page (duplicate modules): extracted zero registry entries — the registry format changed and this check needs updating."
  )
  const errors = []
  for (const [mod, keys] of moduleMap) {
    if (keys.length > 1) {
      errors.push(
        `Registry entries [${keys.join(", ")}] share page module "${mod}". ` +
          `Each slug must have its own page module — see 0f48e2fe84de.`
      )
    }
  }
  assert.equal(errors.length, 0, "demo-page (duplicate modules):\n  " + errors.join("\n  "))
})

// ── Rule 5: Test presence ───────────────────────────────────────────

test("test-presence: interactive components have tests/<slug>.test.mjs", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    if (slug in STATIC_COMPONENTS) continue
    const testFile = join(testsDir, `${slug}.test.mjs`)
    if (!existsSync(testFile)) {
      errors.push(
        `${slug} — interactive component missing tests/${slug}.test.mjs. ` +
          `Add browser tests, or add to STATIC_COMPONENTS if purely presentational.`
      )
    }
  }
  assert.equal(errors.length, 0, "test-presence (missing):\n  " + errors.join("\n  "))
})

test("test-presence: every .test.mjs has export default", () => {
  const errors = []
  const testFiles = readdirSync(testsDir).filter((f) => f.endsWith(".test.mjs"))
  for (const file of testFiles) {
    const content = readFileSync(join(testsDir, file), "utf8")
    if (!content.includes("export default")) {
      errors.push(
        `tests/${file} — no default export. ` +
          `Browser test files must export default an async function. ` +
          `Rename to .unit.mjs if this is a pure-node test.`
      )
    }
  }
  assert.equal(errors.length, 0, "test-presence (export default):\n  " + errors.join("\n  "))
})

// ── Rule 6: Manifest freshness + import graph ───────────────────────

test("manifest: every ui/ dir has .van.json", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    if (!readManifest(join(uiDir, slug))) {
      errors.push(
        `${slug}/ — missing .van.json. ` +
          `Run: node scripts/manifest.mjs --write`
      )
    }
  }
  assert.equal(errors.length, 0, "manifest (missing):\n  " + errors.join("\n  "))
})

test("manifest: files map matches the tree exactly (no missing/extra, hashes current)", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const dir = join(uiDir, slug)
    const manifest = readManifest(dir)
    if (!manifest) continue

    const actualFiles = listRegularFiles(dir)
    const manifestFiles = Object.keys(manifest.files).sort()

    // Missing from manifest.
    for (const f of actualFiles) {
      if (!manifest.files[f]) {
        errors.push(
          `${slug}/.van.json — file "${f}" exists on disk but missing from manifest. ` +
            `Run: node scripts/manifest.mjs --write`
        )
      }
    }
    // Extra in manifest.
    for (const f of manifestFiles) {
      if (!actualFiles.includes(f)) {
        errors.push(
          `${slug}/.van.json — manifest lists "${f}" but file is missing on disk. ` +
            `Run: node scripts/manifest.mjs --write`
        )
      }
    }
    // Hash mismatches.
    for (const f of actualFiles) {
      if (manifest.files[f]) {
        const actual = hashFile(join(dir, f))
        if (actual !== manifest.files[f]) {
          errors.push(
            `${slug}/.van.json — hash mismatch for "${f}" (file was modified since last manifest write). ` +
              `Run: node scripts/manifest.mjs --write`
          )
        }
      }
    }
  }
  assert.equal(errors.length, 0, "manifest (files):\n  " + errors.join("\n  "))
})

test("manifest: requires matches deriveRequires()", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const dir = join(uiDir, slug)
    const manifest = readManifest(dir)
    if (!manifest) continue

    const actual = deriveRequires(dir)
    const recorded = [...(manifest.requires || [])].sort()

    if (JSON.stringify(actual) !== JSON.stringify(recorded)) {
      errors.push(
        `${slug}/.van.json — requires mismatch. ` +
          `Manifest: [${recorded.join(", ")}]; derived: [${actual.join(", ")}]. ` +
          `Run: node scripts/manifest.mjs --write`
      )
    }
  }
  assert.equal(errors.length, 0, "manifest (requires):\n  " + errors.join("\n  "))
})

test("manifest: kitVersion matches package.json version", () => {
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"))
  const expected = pkg.version
  const errors = []
  for (const slug of listUiSlugs()) {
    const manifest = readManifest(join(uiDir, slug))
    if (!manifest) continue
    if (manifest.kitVersion !== expected) {
      errors.push(
        `${slug}/.van.json — kitVersion "${manifest.kitVersion}" does not match package.json "${expected}". ` +
          `Run: node scripts/manifest.mjs --write`
      )
    }
  }
  assert.equal(errors.length, 0, "manifest (kitVersion):\n  " + errors.join("\n  "))
})

test("manifest: no cycles in the requires graph", () => {
  const slugs = listUiSlugs()
  const graph = new Map()
  for (const slug of slugs) {
    const manifest = readManifest(join(uiDir, slug))
    graph.set(slug, manifest ? manifest.requires || [] : [])
  }

  // DFS cycle detection.
  const WHITE = 0, GRAY = 1, BLACK = 2
  const color = new Map()
  const parent = new Map()
  for (const s of slugs) color.set(s, WHITE)

  function dfs(u) {
    color.set(u, GRAY)
    for (const v of graph.get(u) || []) {
      if (!color.has(v)) continue // external dep, skip
      if (color.get(v) === GRAY) {
        // Reconstruct cycle path.
        const cycle = [v, u]
        let cur = u
        while (cur !== v && parent.has(cur)) {
          cur = parent.get(cur)
          cycle.push(cur)
        }
        cycle.reverse()
        return cycle.join(" -> ")
      }
      if (color.get(v) === WHITE) {
        parent.set(v, u)
        const result = dfs(v)
        if (result) return result
      }
    }
    color.set(u, BLACK)
    return null
  }

  let cyclePath = null
  for (const s of slugs) {
    if (color.get(s) === WHITE) {
      cyclePath = dfs(s)
      if (cyclePath) break
    }
  }

  assert.equal(
    cyclePath,
    null,
    `manifest: dependency cycle detected: ${cyclePath}. ` +
      `Break the cycle by removing one of the requires edges.`
  )
})

// ── Rule 7: Props-rest ──────────────────────────────────────────────

test("props-rest: exported function components destructure with ...rest", () => {
  const errors = []
  for (const slug of listUiSlugs()) {
    const dir = join(uiDir, slug)
    const files = readdirSync(dir).filter((f) => f.endsWith(".jsx"))
    for (const file of files) {
      const content = readFileSync(join(dir, file), "utf8")
      // Find: export function Name({ ... }) — check for rest element.
      const re = /export\s+function\s+(\w+)\s*\((\{[^)]*\})\)/g
      let m
      while ((m = re.exec(content)) !== null) {
        const name = m[1]
        const params = m[2]
        if (params.includes("...")) continue
        if (`${slug}/${name}` in PROVIDER_COMPONENTS) continue
        // Find the line number.
        const upTo = content.slice(0, m.index)
        const lineNum = upTo.split("\n").length
        errors.push(
          `${slug}/${file}:${lineNum}:${name} — destructures props without a ...rest element. ` +
            `ARIA/id props passed to <${name}> will be silently dropped. ` +
            `Spread a rest onto the root element (or forward it to the interactive part, ` +
            `like Select/Combobox), or add to PROVIDER_COMPONENTS if it renders no DOM node.`
        )
      }
    }
  }
  assert.equal(errors.length, 0, "props-rest:\n  " + errors.join("\n  "))
})

// ── Run ─────────────────────────────────────────────────────────────

for (const [name, fn] of tests) {
  try {
    fn()
    passed++
  } catch (e) {
    failed++
    console.error(`FAIL: ${name}`)
    console.error("  ", e.message)
  }
}

console.log(`\nconformance: ${passed}/${passed + failed} passed`)
if (failed) process.exit(1)
