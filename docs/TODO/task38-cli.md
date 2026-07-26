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
  `components.json` if present (shadcn users have one, and honouring its
  `aliases` is a cheap migration story); otherwise ask, defaulting to
  `./components/ui`. Persist the answer in `van.config.json` so later
  `add` calls are non-interactive.

- **No colour/spinner library.** Plain output, `process.stdout`. If it needs
  to be pretty, ANSI escapes are four lines.

## Sub-tasks

- [ ] 1. `package.json` `bin` entry + a git-install smoke check
  (`npx github:progrums/vanillin#<branch> list` from a scratch dir).
  `private: true` stays. Files: `package.json`, `README.md`.
- [ ] 2. Registry generator — walk `ui/`, parse imports, emit `registry.json`
  with the dependency closure. Files: `scripts/build-registry.mjs`,
  `registry.json`.
- [ ] 3. CLI arg parsing + `list` + `build`. Files: `bin/van.mjs`.
- [ ] 4. `add` with closure resolution, existence/clobber checks, `--dry-run`,
  `--force`, path-escape rejection. Files: `bin/van.mjs`.
- [ ] 5. `init` — config scaffold, globals + lib copy, first build, next-steps
  output. Files: `bin/van.mjs`.
- [ ] 6. Test: run the CLI against a scratch directory — `init` produces a
  buildable tree; `add dialog` pulls its `lib/` deps; `add alert-dialog` pulls
  `dialog` transitively and its CSS `@import` resolves; re-`add` of a modified
  file refuses without `--force`; a `../` slug is rejected. Files:
  `tests/cli.test.mjs` (Node-only — no browser needed; may need a runner
  branch since `tests/run.mjs` assumes Playwright).

## Verify / done

- `node tests/run.mjs` green; `npm run build` clean.
- **Real integration check:** from a scratch Vite + React app, run
  `npx github:progrums/vanillin#<tag> init`, then
  `add button dialog data-table`, and render them. The unit tests run against
  the working tree and cannot prove a git install resolves correctly — only
  this can. Do this before calling the task done.
- `npx van add` output is legible to someone who has never seen the tool.
