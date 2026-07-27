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
