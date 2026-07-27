#!/usr/bin/env node
/**
 * van — the vanillin CLI. Node stdlib only, no dependencies.
 *
 * It copies files and stops. `van add button` writes button.jsx + button.css
 * into your project; nothing is imported from a vanillin package at runtime,
 * so there is no version coupling and no upgrade that can break your app.
 * Copy-paste stays the distribution model — this is just a faster hand.
 *
 *   van init                 scaffold van.config.json + stylesheets
 *   van add <slug…>          copy components and their dependencies
 *   van diff [slug]          what you edited vs what upstream changed
 *   van build                regenerate the theme CSS from the config
 *   van list                 available components, marking installed ones
 *
 * Global flags: --cwd <dir>, --yes, --silent, --no-color, --help, --version.
 */

import { readFileSync, existsSync, readdirSync, mkdirSync, writeFileSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { generate } from "../scripts/build-theme.mjs"
import { readManifest, writeManifest, hashFile, hashBytes } from "../scripts/manifest.mjs"
import { PATH_DEFAULTS, pathError } from "../scripts/config-schema.mjs"
import { REGISTRY_FILE } from "../scripts/build-registry.mjs"

/** The kit checkout this CLI was run from — the source of every copied file. */
export const kitRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..")

export const CONFIG_FILE = "van.config.json"

// ── output ──────────────────────────────────────────────────────────

// Four escapes, not a dependency. Disabled when piped or when NO_COLOR is set
// (https://no-color.org), so redirected output stays diffable.
const useColor = () => !process.env.NO_COLOR && process.stdout.isTTY && !flags.noColor
const wrap = (code) => (s) => (useColor() ? `\x1b[${code}m${s}\x1b[0m` : String(s))
export const bold = wrap(1)
export const dim = wrap(2)
export const red = wrap(31)
export const green = wrap(32)

let flags = {}

function say(...args) {
  if (!flags.silent) console.log(...args)
}

/** Print to stderr and exit non-zero. Errors ignore --silent. */
function fail(message) {
  console.error(`${red("error")} ${message}`)
  process.exit(1)
}

// ── argv ────────────────────────────────────────────────────────────

const BOOLEAN_FLAGS = {
  yes: "yes",
  y: "yes",
  silent: "silent",
  s: "silent",
  help: "help",
  h: "help",
  version: "version",
  v: "version",
  "dry-run": "dryRun",
  overwrite: "overwrite",
  force: "overwrite", // shadcn's older name, kept as an alias
  "no-color": "noColor",
  all: "all",
}

/**
 * Parse argv into { command, args, flags }. Unknown flags are an error rather
 * than silently ignored — a mistyped --overwirte must not read as "no".
 */
export function parseArgs(argv) {
  const out = { command: null, args: [], flags: {} }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === "--cwd") {
      out.flags.cwd = argv[++i]
      if (!out.flags.cwd) throw new Error("--cwd needs a directory")
    } else if (arg.startsWith("--cwd=")) {
      out.flags.cwd = arg.slice("--cwd=".length)
    } else if (arg.startsWith("-")) {
      const name = arg.replace(/^--?/, "")
      const key = BOOLEAN_FLAGS[name]
      if (!key) throw new Error(`unknown flag "${arg}"`)
      out.flags[key] = true
    } else if (out.command === null) {
      out.command = arg
    } else {
      out.args.push(arg)
    }
  }
  return out
}

// ── project ─────────────────────────────────────────────────────────

/**
 * Resolve the project root and its layout. `paths` comes from the consumer's
 * config so `add` is non-interactive after `init`; the kit's own checkout has
 * no `paths` key and falls back to the defaults.
 */
export function loadProject(cwd) {
  const root = resolve(cwd)
  const configPath = join(root, CONFIG_FILE)
  let config = null
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, "utf8"))
    } catch (err) {
      throw new Error(`invalid JSON in ${CONFIG_FILE}: ${err.message}`)
    }
  }
  const paths = { ...PATH_DEFAULTS, ...(config?.paths || {}) }
  for (const [k, v] of Object.entries(paths)) {
    const err = pathError(v)
    if (err) throw new Error(`${CONFIG_FILE}: paths.${k} ${err}`)
  }
  return { root, config, configPath, paths, hasConfig: config !== null }
}

/** The kit's generated component graph. */
export function loadRegistry() {
  const path = join(kitRoot, REGISTRY_FILE)
  if (!existsSync(path)) {
    throw new Error(`${REGISTRY_FILE} missing from the kit — run \`npm run contracts\``)
  }
  return JSON.parse(readFileSync(path, "utf8"))
}

/** Slugs already present in the project's ui directory. */
export function installedSlugs(project) {
  const dir = join(project.root, project.paths.ui)
  if (!existsSync(dir)) return new Set()
  return new Set(
    readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name),
  )
}

// ── layout detection ────────────────────────────────────────────────

/** Stylesheets `init` copies: globals.css and the two files it @imports. */
export const STYLESHEETS = ["globals.css", "defaults.css", "forced-colors.css"]

/**
 * Read `compilerOptions.paths` from tsconfig/jsconfig and return a resolver for
 * alias specifiers. Handles the one shape that matters — `"@/*": ["./src/*"]` —
 * because that is what an alias in components.json actually points through.
 *
 * JSON with comments is tolerated: tsconfig.json is JSONC in practice.
 */
export function aliasResolver(root) {
  for (const name of ["tsconfig.json", "jsconfig.json"]) {
    if (!existsSync(join(root, name))) continue
    // An unparseable tsconfig is not a reason to abort init.
    const json = readJsonc(root, name)
    const paths = json?.compilerOptions?.paths
    if (!paths) continue
    const baseUrl = json.compilerOptions.baseUrl || "."

    return (specifier) => {
      for (const [pattern, targets] of Object.entries(paths)) {
        if (!pattern.endsWith("/*") || !Array.isArray(targets) || !targets.length) continue
        const prefix = pattern.slice(0, -1) // "@/"
        if (!specifier.startsWith(prefix)) continue
        const rest = specifier.slice(prefix.length)
        const target = targets[0].replace(/\*$/, "").replace(/^\.\//, "")
        return joinRel(baseUrl, target + rest)
      }
      return null
    }
  }
  return () => null
}

/**
 * Read a project config file, tolerating comments (tsconfig.json is JSONC in
 * practice) and returning null rather than throwing — none of these files is
 * required, so an unreadable one just means "no hint available".
 */
function readJsonc(root, name) {
  try {
    const raw = readFileSync(join(root, name), "utf8").replace(/\/\*[\s\S]*?\*\/|(^|\s)\/\/.*/g, "$1")
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Join project-relative segments, dropping empties and leading "./". */
function joinRel(...parts) {
  return parts
    .flatMap((p) => String(p).split("/"))
    .filter((seg) => seg && seg !== ".")
    .join("/")
}

/**
 * Work out where a project keeps its components.
 *
 * An existing components.json is honoured — upstream users have one, and its
 * aliases are the cheapest possible migration story. Otherwise the default is
 * ./components/ui, which is where React projects put them anyway.
 */
export function detectLayout(root, detected = { styles: "styles" }) {
  const resolveAlias = aliasResolver(root)
  const componentsJson = readJsonc(root, "components.json")
  const aliases = componentsJson?.aliases || {}

  /** A components.json alias -> a project-relative directory, or null. */
  const fromAlias = (specifier) => {
    if (typeof specifier !== "string") return null
    if (specifier.startsWith(".") || !specifier.includes("/")) return joinRel(specifier) || null
    return resolveAlias(specifier) || joinRel(specifier)
  }

  const layout = { ...PATH_DEFAULTS }

  // shadcn's aliases.ui is the ui dir itself; aliases.components is its parent.
  const ui = fromAlias(aliases.ui)
  const components = fromAlias(aliases.components)
  layout.ui = ui || (components ? `${components}/ui` : "components/ui")

  // lib/utils is a file alias in shadcn, so its directory is what we want.
  const lib = fromAlias(aliases.lib) || fromAlias(aliases.utils)?.replace(/\/utils$/, "")
  layout.lib = lib || `${layout.ui.replace(/\/ui$/, "")}/lib`

  // A Tailwind css entry names the project's global stylesheet; failing that,
  // the framework tells us where one belongs.
  const css = typeof componentsJson?.tailwind?.css === "string" ? joinRel(componentsJson.tailwind.css) : null
  layout.styles = css && css.includes("/") ? css.slice(0, css.lastIndexOf("/")) : detected.styles
  layout.css = `${layout.styles}/van.css`

  const hints = [componentsJson && "components.json", detected.framework !== "unknown" && detected.framework]
  return { layout, source: hints.filter(Boolean).join(" + ") || "defaults" }
}

// ── framework awareness ─────────────────────────────────────────────

/**
 * Identify the consumer's framework from its dependencies.
 *
 * Only two framework differences reach a tool that just copies files: where the
 * global stylesheet belongs, and whether components need a "use client"
 * directive. Tailwind config mutation and dependency installation — the other
 * reasons upstream's CLI cares — do not exist here.
 */
export function detectFramework(root) {
  const pkg = readJsonc(root, "package.json")
  const deps = { ...pkg?.dependencies, ...pkg?.devDependencies }

  if (deps.next) {
    // App Router is a directory, not a dependency: only its files are RSC.
    const appDir = ["app", "src/app"].find((d) => existsSync(join(root, d)))
    return appDir ? { framework: "next-app", rsc: true, styles: appDir } : { framework: "next-pages", rsc: false, styles: "styles" }
  }
  if (deps["@remix-run/react"] || deps["@remix-run/node"]) {
    return { framework: "remix", rsc: false, styles: "app/styles" }
  }
  if (deps.astro) return { framework: "astro", rsc: false, styles: "src/styles" }
  if (deps.vite) {
    return { framework: "vite", rsc: false, styles: existsSync(join(root, "src")) ? "src/styles" : "styles" }
  }
  return { framework: "unknown", rsc: false, styles: "styles" }
}

/** Hooks and context make a module client-only under React Server Components. */
const CLIENT_ONLY = /\buse[A-Z]\w*\s*\(|\bcreateContext\s*\(/

/**
 * Bytes to write for one kit file in this project.
 *
 * Under RSC, a component that calls hooks needs a "use client" directive, and
 * the kit's own files carry none — shipping them unconditionally would make
 * every non-Next bundler warn about module-level directives. Injecting here
 * keeps that cost on the projects that need it.
 *
 * The transform is deterministic, and the sidecar records the hash of what was
 * actually written, so a later add or diff still compares like with like.
 */
export function kitFileContent(project, slug, rel) {
  const bytes = readFileSync(join(kitRoot, "ui", slug, rel))
  if (!project.config?.rsc || !/\.(jsx|js|tsx|ts)$/.test(rel)) return bytes
  const text = bytes.toString("utf8")
  if (/^\s*["']use client["']/.test(text) || !CLIENT_ONLY.test(text)) return bytes
  return Buffer.from(`"use client"\n\n${text}`)
}

// ── closure + file states ───────────────────────────────────────────

/**
 * Resolve the transitive closure of components and lib/ primitives to copy.
 *
 * Slugs are allowlisted against the registry rather than sanitised: they come
 * from argv and become filesystem paths, and "is it a known component" is a
 * stronger check than any string filter.
 */
export function resolveClosure(registry, slugs) {
  const components = []
  const seen = new Set()
  const queue = [...slugs]

  while (queue.length) {
    const slug = queue.shift()
    if (seen.has(slug)) continue
    const entry = registry.components[slug]
    if (!entry) throw new Error(`unknown component "${slug}" — run \`van list\``)
    seen.add(slug)
    components.push(slug)
    queue.push(...entry.requires)
  }

  const lib = []
  const libSeen = new Set()
  const libQueue = components.flatMap((slug) => registry.components[slug].lib)
  while (libQueue.length) {
    const file = libQueue.shift()
    if (libSeen.has(file)) continue
    if (!(file in registry.lib)) throw new Error(`registry references unknown lib file "${file}"`)
    libSeen.add(file)
    lib.push(file)
    libQueue.push(...registry.lib[file])
  }

  return { components: components.sort(), lib: lib.sort() }
}

/**
 * Classify a target file against the kit's copy and the recorded hash.
 *
 * `unmodified` vs `edited` is the whole point of the sidecar: comparing a local
 * file to the *current* kit version cannot tell "the consumer changed this"
 * from "upstream moved on", and those two deserve opposite behaviour.
 */
export function fileState(expected, targetPath, recordedHash) {
  if (!existsSync(targetPath)) return "missing"
  if (readFileSync(targetPath).equals(expected)) return "identical"
  if (recordedHash && hashFile(targetPath) === recordedHash) return "unmodified"
  return "edited"
}

/**
 * Plan an `add`: every file that would be written, with its state.
 *
 * Atomic per component — if any of a component's files is `edited`, the whole
 * component is blocked, because a partial write leaves one copy straddling two
 * kitVersions, which is exactly the diamond problem the manifest format
 * refused. Other components in the same add still proceed.
 */
export function planAdd(project, registry, slugs) {
  const { components, lib } = resolveClosure(registry, slugs)
  const plan = { components: [], lib: [] }

  for (const slug of components) {
    const entry = registry.components[slug]
    const targetDir = join(project.root, project.paths.ui, slug)
    const recorded = readManifest(targetDir)?.files || {}
    const files = entry.files.map((rel) => {
      const contents = kitFileContent(project, slug, rel)
      const to = join(targetDir, rel)
      return { rel, contents, to, state: fileState(contents, to, recorded[rel]) }
    })
    plan.components.push({
      slug,
      dir: `${project.paths.ui}/${slug}`,
      files,
      edited: files.filter((f) => f.state === "edited").map((f) => f.rel),
    })
  }

  for (const file of lib) {
    const contents = readFileSync(join(kitRoot, "lib", file))
    const to = join(project.root, project.paths.lib, file)
    // No sidecar covers lib/ (it is substrate, versioned by kitVersion), so a
    // difference cannot be attributed and is treated as an edit.
    plan.lib.push({ file, contents, to, state: fileState(contents, to) })
  }

  return plan
}

// ── commands ────────────────────────────────────────────────────────

function cmdList(project) {
  const registry = loadRegistry()
  const installed = installedSlugs(project)
  const slugs = Object.keys(registry.components).sort()

  for (const slug of slugs) {
    const entry = registry.components[slug]
    const mark = installed.has(slug) ? green("✓") : " "
    const deps = entry.requires.length ? dim(`  requires ${entry.requires.join(", ")}`) : ""
    say(`${mark} ${slug}${deps}`)
  }
  say("")
  say(dim(`${slugs.length} components, ${installed.size} installed · kit v${registry.kitVersion}`))
}

/** The scaffolded config: a brand colour to change, and the detected layout. */
export function initialConfig(layout, detected = { framework: "unknown", rsc: false }) {
  const paths = {}
  for (const [k, v] of Object.entries(layout)) {
    if (v !== PATH_DEFAULTS[k]) paths[k] = v
  }
  const config = {
    framework: detected.framework,
    rsc: detected.rsc,
    paths,
    theme: {
      brand: "oklch(0.55 0.2 265)",
      radius: "0.5rem",
      density: "comfortable",
    },
  }
  if (!Object.keys(paths).length) delete config.paths
  return config
}

function cmdInit(project) {
  const registry = loadRegistry()

  if (project.hasConfig && !flags.overwrite) {
    fail(`${CONFIG_FILE} already exists — edit it, or re-run with --overwrite`)
  }

  const detected = detectFramework(project.root)
  const { layout, source } = detectLayout(project.root, detected)
  say(`${bold("van init")} ${dim(`in ${project.root}`)}`)
  say(`  framework: ${detected.framework}${detected.rsc ? ' — components get a "use client" directive' : ""}`)
  say(`  layout from ${source}: components → ${layout.ui}, primitives → ${layout.lib}, styles → ${layout.styles}`)

  const config = initialConfig(layout, detected)
  writeFileAtomic(project.configPath, JSON.stringify(config, null, 2) + "\n")
  say(`  ${green("+")} ${CONFIG_FILE}`)

  // Stylesheets only: a component's lib/ deps come with `add`, not up front.
  for (const name of STYLESHEETS) {
    const to = join(project.root, layout.styles, name)
    if (existsSync(to) && !flags.overwrite) {
      say(`  ${dim("=")} ${layout.styles}/${name} ${dim("exists, left alone")}`)
      continue
    }
    writeFileAtomic(to, readFileSync(join(kitRoot, "styles", name)))
    say(`  ${green("+")} ${layout.styles}/${name}`)
  }

  // First build, from the config we just wrote.
  const css = generate(config, {
    root: project.root,
    uiDir: layout.ui,
    globals: `${layout.styles}/globals.css`,
    source: CONFIG_FILE,
  })
  writeFileAtomic(join(project.root, layout.css), css)
  say(`  ${green("+")} ${layout.css} (${css.length} bytes)`)

  say("")
  say(`${bold("Next")}`)
  say(`  1. import the stylesheets, in this order:`)
  say(`       import "./${layout.styles}/globals.css"`)
  say(`       import "./${layout.css}"`)
  say(`  2. van add button dialog        ${dim(`(${Object.keys(registry.components).length} components available)`)}`)
  say(`  3. edit ${CONFIG_FILE} and re-run van build to retheme`)
}

/** Marker for one planned file, so dry-run and the real thing read alike. */
const MARK = { missing: green("+"), unmodified: "~", identical: dim("="), edited: red("!") }

function describe(state) {
  return { missing: "new", unmodified: "updated", identical: "unchanged", edited: "you edited this" }[state]
}

function cmdAdd(project, slugs) {
  const registry = loadRegistry()

  if (!slugs.length) {
    // Task 67 replaces this with an interactive multi-select.
    fail("nothing to add — pass component names, or run `van list` to see them")
  }

  let plan
  try {
    plan = planAdd(project, registry, slugs)
  } catch (err) {
    fail(err.message)
  }

  const blocked = flags.overwrite ? [] : plan.components.filter((c) => c.edited.length)
  const blockedLib = flags.overwrite ? [] : plan.lib.filter((f) => f.state === "edited")
  const writable = plan.components.filter((c) => !blocked.includes(c))

  for (const comp of plan.components) {
    const skipped = blocked.includes(comp) ? dim(" — skipped") : ""
    say(`${bold(comp.slug)}${skipped}`)
    for (const f of comp.files) {
      say(`  ${MARK[f.state]} ${comp.dir}/${f.rel} ${dim(describe(f.state))}`)
    }
  }
  for (const f of plan.lib) {
    const skipped = blockedLib.includes(f) ? dim(" — skipped") : ""
    say(`  ${MARK[f.state]} ${project.paths.lib}/${f.file} ${dim(describe(f.state))}${skipped}`)
  }

  if (flags.dryRun) {
    say("")
    say(dim("--dry-run: nothing written"))
    return
  }

  let written = 0
  for (const comp of writable) {
    for (const f of comp.files) {
      if (f.state === "identical") continue
      writeFileAtomic(f.to, f.contents)
      written++
    }
    // Provenance for what we actually wrote — hashes of the written bytes, not
    // of the kit's tree, so an RSC-injected copy is still recognised as
    // unedited the next time add or diff runs.
    const targetDir = join(project.root, project.paths.ui, comp.slug)
    mkdirSync(targetDir, { recursive: true })
    writeManifest(targetDir, {
      name: comp.slug,
      kitVersion: registry.kitVersion,
      source: registry.source,
      requires: registry.components[comp.slug].requires,
      files: Object.fromEntries(comp.files.map((f) => [f.rel, hashBytes(f.contents)])),
    })
  }
  for (const f of plan.lib) {
    if (f.state === "identical" || blockedLib.includes(f)) continue
    writeFileAtomic(f.to, f.contents)
    written++
  }

  say("")
  say(`${green("✓")} ${written} file${written === 1 ? "" : "s"} written`)

  if (blocked.length || blockedLib.length) {
    const names = [...blocked.map((c) => `${c.slug} (${c.edited.join(", ")})`), ...blockedLib.map((f) => f.file)]
    console.error("")
    console.error(`${red("skipped")} ${names.join(", ")}`)
    console.error(dim("you have local edits there. `van diff` to see them, `van add --overwrite` to replace them"))
    process.exit(1)
  }
}

/**
 * Compare one installed component against the kit and its recorded install.
 *
 * Three hashes decide everything: what you have, what you installed, what the
 * kit ships now. Without the recorded middle one "differs" is ambiguous — this
 * is the read-only half of the state machine `add` uses.
 */
export function diffComponent(project, registry, slug) {
  const entry = registry.components[slug]
  const kitDir = join(kitRoot, "ui", slug)
  const targetDir = join(project.root, project.paths.ui, slug)
  const manifest = readManifest(targetDir)
  const recorded = manifest?.files || {}
  const rels = [...new Set([...entry.files, ...Object.keys(recorded)])].sort()
  const files = []

  for (const rel of rels) {
    const localPath = join(targetDir, rel)
    const local = existsSync(localPath) ? hashFile(localPath) : null
    // The kit side is what `add` would write here, RSC transform included.
    const kit = existsSync(join(kitDir, rel)) ? hashBytes(kitFileContent(project, slug, rel)) : null
    const was = recorded[rel] || null

    let state
    if (!local) state = was ? "deleted" : "absent"
    else if (local === kit) state = "current"
    else if (!was) state = "untracked"
    else if (local === was) state = "upstream-changed"
    else if (kit === was) state = "edited"
    else state = "diverged"

    files.push({ rel, state })
  }

  return { slug, kitVersion: manifest?.kitVersion || null, tracked: manifest !== null, files }
}

const DIFF_LABEL = {
  edited: () => red("edited locally"),
  "upstream-changed": () => "upstream changed — `van add` will update it",
  diverged: () => red("edited locally, and upstream changed"),
  untracked: () => "not recorded in .van.json",
  deleted: () => "recorded but missing locally",
  absent: () => dim("not installed"),
  current: () => dim("up to date"),
}

function cmdDiff(project, slugs) {
  const registry = loadRegistry()
  const installed = installedSlugs(project)

  let targets
  if (slugs.length) {
    for (const slug of slugs) {
      if (!registry.components[slug]) fail(`unknown component "${slug}" — run \`van list\``)
      if (!installed.has(slug)) fail(`${slug} is not installed in ${project.paths.ui}`)
    }
    targets = slugs
  } else {
    targets = [...installed].filter((slug) => registry.components[slug]).sort()
    if (!targets.length) fail(`no vanillin components found in ${project.paths.ui}`)
  }

  let differing = 0
  for (const slug of targets) {
    const result = diffComponent(project, registry, slug)
    const interesting = result.files.filter((f) => f.state !== "current" && f.state !== "absent")
    differing += interesting.length
    if (!interesting.length && !flags.all) continue

    const version = result.tracked ? dim(` (installed from v${result.kitVersion})`) : dim(" (no .van.json)")
    say(`${bold(slug)}${version}`)
    for (const f of flags.all ? result.files : interesting) {
      say(`  ${f.rel} — ${DIFF_LABEL[f.state]()}`)
    }
  }

  if (!differing) {
    const n = targets.length
    say(`${green("✓")} ${n} component${n === 1 ? " matches" : "s match"} kit v${registry.kitVersion}`)
    return
  }

  say("")
  say(dim(differing === 1 ? "1 file differs" : `${differing} files differ`))
  // Non-zero so `van diff` is usable as a CI drift check.
  process.exit(1)
}

function cmdBuild(project) {
  if (!project.hasConfig) {
    fail(`no ${CONFIG_FILE} in ${project.root} — run \`van init\` first`)
  }
  const globals = `${project.paths.styles}/globals.css`
  if (!existsSync(join(project.root, globals))) {
    fail(`${globals} not found — run \`van init\` first`)
  }

  let css
  try {
    css = generate(project.config, {
      root: project.root,
      uiDir: project.paths.ui,
      globals,
      source: CONFIG_FILE,
    })
  } catch (err) {
    fail(err.message)
  }

  const outPath = join(project.root, project.paths.css)
  writeFileAtomic(outPath, css)
  say(`${green("✓")} ${project.paths.css} (${css.length} bytes)`)
}

// ── writes ──────────────────────────────────────────────────────────

/** Write a file, creating its directory. Used for every generated output. */
export function writeFileAtomic(path, contents) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, contents)
}

// ── entry ───────────────────────────────────────────────────────────

const USAGE = `${bold("van")} — zero-dependency React components, copied into your project.

  van init                  scaffold ${CONFIG_FILE} and the stylesheets
  van add <slug…>           copy components and their dependencies
  van diff [slug]           show local edits vs upstream changes
  van build                 regenerate the theme CSS from ${CONFIG_FILE}
  van list                  list components, marking installed ones

Flags
  --cwd <dir>               run against another directory
  --dry-run                 (add) print what would be written, write nothing
  --overwrite               (add) replace files you have edited
  --yes                     assume yes for prompts
  --silent                  suppress non-error output
  --no-color                disable ANSI colour
  --help, --version
`

export function main(argv = process.argv.slice(2)) {
  let parsed
  try {
    parsed = parseArgs(argv)
  } catch (err) {
    console.error(`${red("error")} ${err.message}`)
    console.error(dim("run `van --help` for usage"))
    process.exit(1)
  }

  flags = parsed.flags

  if (flags.version) {
    const pkg = JSON.parse(readFileSync(join(kitRoot, "package.json"), "utf8"))
    console.log(pkg.version)
    return
  }
  if (flags.help || !parsed.command) {
    console.log(USAGE)
    return
  }

  let project
  try {
    project = loadProject(flags.cwd || process.cwd())
  } catch (err) {
    fail(err.message)
  }

  switch (parsed.command) {
    case "add":
      cmdAdd(project, parsed.args)
      break
    case "init":
      cmdInit(project)
      break
    case "diff":
      cmdDiff(project, parsed.args)
      break
    case "list":
      cmdList(project)
      break
    case "build":
      cmdBuild(project)
      break
    default:
      fail(`unknown command "${parsed.command}" — run \`van --help\``)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main()
}
