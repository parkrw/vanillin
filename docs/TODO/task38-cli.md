# task38: cli

**Goal:** `npx github:progrums/vanillin init` / `add <component>` / `build` /
`list`. Zero dependencies, Node stdlib only.
**Branch:** feat/cli
**Deps:** 37 (the generator the CLI drives)

## Distribution: git-sourced, stays unpublished

Decided 2026-07-25, revising an earlier assumption that a CLI meant publishing.

`npx` does **not** require the npm registry — `npx github:progrums/vanillin add
button` installs straight from the repo. `private: true` only blocks
`npm publish`; it does not block git installs. So `private: true` stays.

Why git-sourced is the right default here:

- **Nothing to maintain.** No registry name, no semver contract. And there is
  no runtime contract to version anyway — consumers own the code they copied.
- **Honest pinning.** `npx github:progrums/vanillin#v0.2.0` pins *the source
  you copied from*, which is what actually happened, instead of implying a
  dependency range on something that is not a runtime dependency.
- **A CLI is dev-time.** It never ships to the browser, so it costs nothing
  against the zero-dep claim regardless of how it is distributed. The only
  real question was who owns distribution, and the answer is the repo.

Cost, stated plainly: `npx github:` clones, so it is slower than a registry
install, and there is no discoverability. If vanillin later needs adoption,
publishing is a one-line change (drop `private`, add `files`) and can happen
then — **do not make that call in this task**. Publishing now buys nothing and
commits you to a public artifact you have to keep alive.

Tag releases (`v0.1.0`, …) so consumers have something stable to pin. Untagged
`main` as the default install target is a footgun.

## Design decisions

- **The CLI copies; it never wraps.** `van add button` writes
  `ui/button/button.jsx` + `.css` into the consumer's project and stops. No
  imports from a `vanillin` package at runtime, no version coupling, no
  breaking changes pushed at consumers. Copy-paste stays the distribution
  model; the CLI is just a faster hand.

- **`registry.json` is generated, not hand-maintained.** A build step walks
  `ui/*/` and emits slug → files, `dependsOn` (other `ui/` slugs the component
  imports), `lib` (which `lib/` primitives it needs), and `cssImports` (several
  components `@import` a sibling's CSS — alert-dialog and sheet pull
  `dialog.css`, date-picker pulls popover + calendar). Hand-maintaining that
  graph will rot within two tasks. Derive it by parsing the import statements.

- **Commands:**
  - `init` — writes `van.config.json`, copies `styles/globals.css` and
    `lib/`, runs `build`, prints the one-line import to add.
  - `add <slug…>` — resolves the dependency closure from the registry, shows
    what it will write, copies. `--dry-run` prints the file list and exits.
  - `build` — regenerates `styles/van.css` from the config (task 37).
  - `list` — available components, marking which are already installed.

- **Never clobber silently.** If a target file exists and differs from the
  registry version, refuse and print a diff hint. Consumers *will* edit the
  files they copied — that is the whole point of the model — and an `add` that
  overwrites their edits is the fastest way to lose trust in the tool.
  `--force` exists and says what it destroyed.

- **Compare against the recorded hash, not against current upstream** (added
  2026-07-26, see task 64). Diffing a local file against the *current* registry
  version cannot tell "the consumer edited this" from "upstream moved on" — both
  read as "differs". Only a hash recorded at install time separates them, and the
  two cases deserve opposite behaviour: upstream-moved is a safe update,
  consumer-edited must not be overwritten. So `add` **writes a
  `ui/<slug>/.van.json` sidecar** per task 64 — `kitVersion`, `source`,
  `requires`, and a `files` map of sha256 hashes — and later runs compare against
  it. Build the manifest format in 64 before implementing `add`, or `add` will
  bake in its own incompatible assumptions.

- **`registry.json`'s `dependsOn` and the manifest's `requires` must agree.** The
  registry is the upstream graph, the manifest is what a given copy actually got.
  Task 64's conformance suite checks the derivation against the real import graph;
  do not derive it twice with two parsers.

- **Path safety.** Slugs come from argv and become filesystem paths. Resolve
  every write against the project root and reject anything that escapes it;
  allowlist slugs against the registry rather than sanitising strings.

- **Detect the project layout instead of assuming.** Read the consumer's
  `components.json` if present (upstream users have one, and honouring its
  `aliases` is a cheap migration story); otherwise ask, defaulting to
  `./components/ui`. Persist the answer in `van.config.json` so later
  `add` calls are non-interactive.

- **No colour/spinner library.** Plain output, `process.stdout`. If it needs
  to be pretty, ANSI escapes are four lines.

## Decisions taken on approach (2026-07-27)

Four things the spec above left open, settled after reading the ground:

- **`generate()` gains `uiDir` and `globals` options** (root-relative, defaults
  unchanged). Today `scripts/build-theme.mjs` hard-codes `styles/globals.css`
  and `ui/`, which a consumer using `components/ui` does not have. `build` must
  validate against the *consumer's* tree, so those two paths become options.
  `discoverComponents(root, uiDir = "ui")` likewise.

- **`paths` becomes a third top-level config key** — `ui`, `lib`, `styles`,
  `css`. `scripts/config-schema.mjs` rejects unknown top-level keys, and the
  layout has to persist somewhere so later `add` calls are non-interactive.
  Validate as project-relative paths: no absolute, no `..`.

- **`add` is atomic per component.** If *any* file of a component is
  consumer-edited (hash ≠ sidecar), refuse the whole component and name the
  files; other components in the same `add` still proceed. A partial write
  leaves one copy straddling two `kitVersion`s, which is exactly the diamond
  problem task 64 refused. Per-file states: `missing` / `identical` (bytes match
  source) / `unmodified` (hash matches sidecar — upstream moved on, safe to
  overwrite) / `edited` (refuse). Only `edited` blocks.

- **`init` copies stylesheets only; `add` pulls each component's `lib/` deps.**
  The prose above says init copies all of `lib/`, but sub-task 6's own test
  ("`add dialog` pulls its `lib/` deps") says otherwise, and 23 files for one
  component is wrong. `init` copies `globals.css` + the two files it `@import`s
  (`defaults.css`, `forced-colors.css`). `lib/`→`lib/` imports need their own
  closure (`use-anchor-position.js` → `anchor-position.js`).

## Scope additions (2026-07-27)

Six cheap parity items with shadcn's CLI, agreed with the user. Together ~150
lines.

- **`van diff [slug]`** — own sub-task. The read-only half of the state machine
  `add` already needs: "you edited these files" vs "upstream moved since your
  recorded `kitVersion`". Task 64's sidecar is what makes the two
  distinguishable, and nothing currently surfaces it. Natural on-ramp to task 65
  — `update` is `diff` plus a merge.
- **`--cwd <dir>`** — also what keeps `tests/cli.unit.mjs` from `chdir`-ing a
  shared process.
- **shadcn's flag vocabulary** — `--overwrite` primary (`--force` an alias),
  plus `--yes` and `--silent`.
- **Resolve `@/*` from `tsconfig.json` / `jsconfig.json`
  `compilerOptions.paths`** rather than guessing `./src`. ~20 lines, and it is
  what makes honouring an existing `components.json` actually correct.
- **`type` field per registry entry** (`ui` | `lib`) — one field, no second code
  path in `add` when something lib-shaped is added later.
- **Minimal ANSI** — bold/dim/red/green from a 4-line helper, disabled when
  `NO_COLOR` is set or `!process.stdout.isTTY`. The rule above is no colour
  *library*, not no colour.

Deliberately **not** copied from shadcn: the HTTP registry (`npx github:` already
ships the whole tree; distribution is settled above), npm-dependency
installation (there are none), Tailwind config mutation, telemetry, style
variants. Deferred to their own tasks: **66** generated `van.schema.json` +
`$schema`, **67** interactive multi-select for a bare `add`.

## Sub-tasks

Seven commits. The remote is `parkrw/vanillin`, not `progrums/vanillin` — the
prose above predates the rename, `git remote -v` is authoritative.

- [x] 1. Registry generator — walk `ui/`, emit `registry.json` (slug → `files`,
  `requires`, `lib`, `type`). **Reuses `deriveRequires` from
  `scripts/manifest.mjs`** — the graph must not get a second parser (see the
  registry/manifest agreement rule above); adds `deriveLibs`, exports
  `listRegularFiles`. `npm run contracts` refreshes manifests + registry
  together, since both go stale on any `ui/` edit. Files:
  `scripts/build-registry.mjs`, `registry.json`, `scripts/manifest.mjs`,
  `package.json`, `tests/registry.unit.mjs` (on-disk === freshly generated).
- [x] 2. CLI skeleton — arg parsing, `--cwd`/`--yes`/`--silent`, ANSI helper,
  `list`, `build`. `bin` entry in `package.json`; `private: true` stays. Needs
  the `generate()` `uiDir`/`globals` options and the `paths` config key. Files:
  `bin/van.mjs`, `package.json`, `scripts/build-theme.mjs`,
  `scripts/config-schema.mjs`.
- [x] 3. `add` — closure resolution (component + `lib`), the four per-file
  states, per-component atomicity, `--dry-run`, `--overwrite`/`--force`,
  path-escape rejection, `.van.json` sidecar write via `generateManifest`.
  Files: `bin/van.mjs`.
- [x] 4. `diff [slug]` — per-file `edited` vs `upstream-moved`, exit non-zero
  when anything differs so it is usable in CI. Files: `bin/van.mjs`.
- [x] 5. `init` — layout detection (`components.json` aliases, `@/*` via
  `tsconfig`/`jsconfig` paths, default `./components/ui`), config scaffold,
  stylesheet copy, first build, next-steps output. Files: `bin/van.mjs`.
- [x] 8. Framework awareness (added 2026-07-27, user-approved). `init` sniffs
  `package.json` deps → `framework` + `rsc` + the stylesheet location
  (`next-app` → `app/`, vite → `src/styles`), both persisted as top-level config
  keys; `add` prepends `"use client"` to copied JSX that calls hooks or
  `createContext` when `rsc` is true. The kit's own files stay directive-free so
  non-Next bundlers do not warn about module-level directives. **The sidecar
  records the hash of the bytes written, not of the kit's tree**, or every
  RSC-injected file would read as consumer-edited on the next `add`. Files:
  `bin/van.mjs`, `scripts/config-schema.mjs`, `scripts/manifest.mjs`
  (`hashBytes`), `tests/config-schema.unit.mjs`.
  Deliberately **not** copied from shadcn: Tailwind config mutation and npm
  dependency installation — the other two reasons its CLI detects frameworks,
  neither of which exists here.
- [x] 6. Test: CLI against scratch dirs — `init` produces a buildable tree;
  `add dialog` pulls its `lib/` deps; `add alert-dialog` pulls `dialog`
  transitively and its CSS `@import` resolves; re-`add` of an edited file
  refuses without `--overwrite`; re-`add` of an *unmodified* file overwrites
  silently; a `../` slug is rejected; `diff` reports an edit. Files:
  `tests/cli.unit.mjs` — **`.unit.mjs`, not `.test.mjs`**: `tests/run.mjs`
  already runs unit suites as child processes, so no runner branch is needed
  (the spec above predates that).
- [x] 7. Docs — rewrite the installation page (currently a stub saying a CLI "is
  planned") and the README install section. Files:
  `site/pages/docs/installation.jsx`, `README.md`.

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- **Git-install smoke check:** `npx github:parkrw/vanillin#feat/cli list` from a
  scratch dir. Needs the branch pushed first — user-gated.
- **Real integration check:** from a scratch Vite + React app, run
  `npx github:parkrw/vanillin#<tag> init`, then
  `add button dialog data-table`, and render them. The unit tests run against
  the working tree and cannot prove a git install resolves correctly — only
  this can. Do this before calling the task done.
- `van add` output is legible to someone who has never seen the tool.
