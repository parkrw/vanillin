# task124: v1-compat-policy
**Goal:** The written contract that makes "backwards compatible from v1.0 on" a checkable claim instead of a hope: a compat policy, a changelog, and a CI fixture that proves every future version still handles v1-era artifacts.  **Branch:** `docs/v1-compat-policy`  **Deps:** 117, 118, 119, 120 (the policy documents machinery — write it after the machinery exists), 110 (tags)
**Owns:** `docs/COMPAT.md` (new), `CHANGELOG.md` (new), `tests/fixtures/compat/**` (new), `tests/compat.unit.mjs` (new), `README.md` (one link), `docs/DECISIONS.md` (the surface rulings)

## Why a document is the deliverable

The kit's de-facto public API is ~800 symbols: 331 component exports, ~470 stable part classes (promised in README's "Styling hooks"), ~40 `data-*` attribute keys *with their value enumerations*, the token vocabulary, the `lib/` signatures, the CLI flags, and the four machine-read formats. The conformance suite machine-checks ~70 of those (one block class per slug, hash/requires integrity, `...rest`). You cannot promise stability over a surface with no definition of what's covered — and `docs/DECISIONS.md:10` settles that there's one monotonic `kitVersion` but never says what a bump *promises*. This task writes the rulings down; each is a yes/no with a reason:

1. **Component props and export names** — covered (yes; the whole point).
2. **Part classes** (`.accordion-trigger`, …) and **`data-*` keys + values** — covered (README already promises them as styling hooks; a rename is a breaking change from v1 on). Note the enforcement gap honestly: only root classes are machine-checked; a follow-up conformance rule extracting the class/data inventory into a checked-in snapshot (drift = failing test) is the cheap enforcement — seed it as a sub-task here, it's what turns the promise from prose into a gate.
3. **Token names** in `globals.css`/`defaults.css` — covered; additions are minor, renames major.
4. **`lib/` export signatures** — covered from v1 (117 gives them an update path; without cover, every component copy is a trap).
5. **Sidecar / registry / config formats** — covered via `schemaVersion` (119): shape changes bump the format version and ship a reader that accepts N-1.
6. **What is NOT covered** — say it explicitly: CSS *declarations inside* rules (visual tuning is not a break), private `_`-prefixed `use-form` internals (**decide**: they're reachable in a copy-paste kit — either promote the needed ones (`Controller` uses them) to documented API or restructure so `Controller` doesn't need them; punting is the one non-answer), docs-site (`site/`) everything, test files.
7. **Deprecation policy** — 118's `deprecated` registry field: announced ≥1 minor before removal, tombstone thereafter.
8. **Semver mapping** — what major/minor/patch mean for a git-tag-distributed kit with no npm ranges: consumers pin tags; the policy is about what a tag-to-tag upgrade may change.

## CHANGELOG

Keep-a-Changelog format, seeded retroactively with one `0.1.0` entry (a paragraph, not archaeology). The release-discipline check from task110 grows one clause: a version bump without a CHANGELOG entry fails CI. `van update`'s conflict/skip output gains one line pointing at the CHANGELOG URL — the primary thing a consumer mid-update wants.

## The compat fixture — the part that keeps everyone honest

`tests/fixtures/compat/v1/`: a frozen miniature consumer project — `van.config.json`, one component dir with its `.van.json` sidecar, a `lib/` file with its sidecar, `styles/` with sidecar — checked in **byte-frozen at v1.0 and never regenerated** (the whole point; add a comment header saying so, because someone will "helpfully" run contracts over it). `tests/compat.unit.mjs` runs the real CLI against a temp copy of it, forever asserting: `van build` succeeds, `van diff` classifies correctly, `van update` (against the current kit, network stubbed) completes without crash and without silent clobber, unknown-newer artifacts refuse politely. This is the test that catches the break *before* the tag, which no amount of current-behavior testing can do. (Directional gap it closes, from the audit: today `tests/` has 70+ files and every one tests current behavior only.)

## Sub-tasks

- [ ] 1. `docs/COMPAT.md` with the eight rulings; the contentious ones (part-class freeze breadth, `_`-internals) go to the user as options-with-recommendation before writing, not after.
- [ ] 2. The class/data-attribute inventory snapshot + conformance rule (enforcement for ruling 2).
- [ ] 3. `CHANGELOG.md` + the CI clause.
- [ ] 4. The compat fixture + `compat.unit.mjs` (unit-runner: pure Node, child-process CLI invocations — the `tests/*.unit.mjs` convention).
- [ ] 5. README: one "Stability" paragraph linking COMPAT.md; DECISIONS entries for the rulings.

## Verify / done

```sh
node tests/run.mjs compat conformance
npm test > out.txt 2>&1 && grep ^FAIL out.txt
```

Done when: COMPAT.md answers all eight rulings with reasons, the fixture test fails if you deliberately rename a part class or bump a format without a reader (prove both, revert — never commit the break), and cutting v1.0 is a mechanical act: bump, CHANGELOG, tag, CI green.

## Out of scope

Actually cutting v1.0 (the user's call, after 110-123 land), the TypeScript surface (own backlog item — but COMPAT.md should state whether `.d.ts`, once added, joins the covered surface: yes), migration codemods (none needed until something breaks; policy says *when* one would be owed).

## Handoff

**Status:** NOT STARTED
