# task110: compat-labels
**Goal:** Make every promise the kit already implies explicit — React floor, browser floor, install pin, CSS stance — so consumers stop discovering them by breakage.  **Branch:** `chore/compat-labels`  **Deps:** none
**Owns:** `package.json`, `README.md`, `.github/workflows/deploy.yml` (new release job only — do not touch the test/deploy jobs)

## Why this is first

Everything here is a one-line-to-one-paragraph change, and each closes a gap where the kit's behavior and its stated contract disagree **today**:

- `README.md:3` says "Only React is required," but `ui/select/select.jsx:53` and `ui/resizable/resizable.jsx` destructure `ref` from props (React 19 ref-as-prop — on 18 the ref silently never attaches) and `ui/form/form.jsx:6,10` import `useActionState`/`useFormStatus`, which don't exist in React 18 / react-dom 18. `package.json` has **no `peerDependencies` at all**, so a React 18 install produces no warning of any kind. Note `lib/` itself is React-18-clean (newest API is `useSyncExternalStore`/`useId`) — the coupling is only in those three `ui/` files.
- `README.md:41` documents pinning via `npm i -D github:parkrw/vanillin#v0.1.0`. **Zero git tags exist** (`git tag -l` is empty), so the documented install command fails, and every sidecar's `source: github:parkrw/vanillin@v0.1.0` (`scripts/manifest.mjs:200`) references a ref that doesn't resolve.
- The effective browser floor, measured across the stylesheets, is ~mid-2024: `light-dark()` backs all 47 color tokens with no fallback (Chrome 123 / Safari 17.5 / FF 120+128), plus Popover API, `@property`, `oklch(from …)`. Firefox ESR 115 fails hard. The README makes no browser-support claim at all.
- The kit is deliberately unlayered (`styles/globals.css:17-20`) with unprefixed block classes (`.btn`, `.card`, `.input`) and shadcn-identical token names. That's a defensible choice, but next to Tailwind v4 (whose utilities live in `@layer utilities` and therefore **lose** to the kit's unlayered rules) it's a surprise, not a choice, until it's written down.

## Sub-tasks

- [ ] 1. **Declare the React floor.** Decide it first: either add `"peerDependencies": { "react": ">=19", "react-dom": ">=19" }` and a README sentence, **or** make 18 true (wrap the two ref-as-prop sites in `forwardRef`, feature-gate the `useActionState` path in `ui/form`). Declaring 19 is the cheap and honest option; supporting 18 is real work and belongs in its own task if wanted. Don't do both here.
- [ ] 2. **Cut the `v0.1.0` tag** on the commit `registry.json`'s current `kitVersion` describes, and verify `npm i -D github:parkrw/vanillin#v0.1.0` resolves from a scratch directory. (User pushes tags — stage the request in the Handoff if the hook blocks it.)
- [ ] 3. **Release discipline in CI:** a job (or a check in the existing test job) that fails when `package.json` version changes without a matching tag existing — the inverse drift is what left `v0.1.0` dangling.
- [ ] 4. **README "Browser support" section:** state the floor (Chrome/Edge 123+, Safari 17.5+, Firefox 128+; Firefox ESR 115 not supported), name the load-bearing features (`light-dark()`, Popover API, `@property`, container queries), and note which degrade vs. hard-fail. Keep it to one short table — task123 owns actually *softening* the floor.
- [ ] 5. **README "Cascade & naming" paragraph:** unlayered by design, unprefixed block classes and shadcn-compatible token names, what that means next to Tailwind v4 / another `:root` token system, and the override path (target the stable part classes / pass `className`).
- [ ] 6. **`"engines": { "node": ">=18.17" }`** in `package.json` (CLI uses ESM, `structuredClone`-era APIs; 18.17 is also the `URL.canParse` floor task116 relies on — verify the exact floor by running `bin/van.mjs list` under the oldest Node you claim).

## Verify / done

```sh
npm test > out.txt 2>&1 && grep ^FAIL out.txt   # baseline unchanged — re-measure before starting, name any failures
cd "$(mktemp -d)" && npm init -y >/dev/null && npm i -D "github:parkrw/vanillin#v0.1.0"   # sub-task 2
```

Done when: a React 18 project gets an install-time peer warning (or 18 genuinely works), the pinned install succeeds, and the README states browser floor + cascade stance.

## Out of scope

Fixing any of the browser-floor items themselves (task123), the `.d.ts`/TypeScript story (backlog), and everything in `bin/van.mjs`.

## Handoff

**Status:** NOT STARTED
