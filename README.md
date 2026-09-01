# vanillin

**Zero-dependency** React components — vanilla JS, JSX, and plain CSS. No Tailwind, no Radix, no Floating UI. Only React is required — **React 19 or newer**, and Node 18.17+ for the CLI.

## Using it in a project

This is not a package — the files land in your project and are yours to edit. The CLI is a faster hand for the copying:

```sh
npm i -D github:parkrw/vanillin          # adds the `van` CLI to your project
van init                                 # config + stylesheets, layout detected
van add button dialog
van add --all                            # or take the whole kit at once
```

`init` reads your `package.json` and any `components.json` to work out where components belong (`src/components/ui` in a Next or aliased project, `./components/ui` otherwise), writes `van.config.json`, and copies the stylesheets. `add` brings each component's dependencies with it — other components it imports, and the `lib/` primitives it needs. In a Next App Router project the copied components get a `"use client"` directive; elsewhere they don't.

Then import the stylesheets once, in this order, plus the components you use:

```jsx
import "./styles/globals.css"   // every design token
import "./styles/typeset.css"   // the .typeset prose classes
import "./styles/van.css"       // your overrides, generated from van.config.json

import { Button } from "./components/ui/button/button.jsx"
import "./components/ui/button/button.css"
```

**React 19 or newer is required**, and `package.json` declares it as an optional peer dependency. A React 18 project therefore fails the install with `ERESOLVE` instead of discovering the mismatch at runtime, while a project with no React yet installs the CLI alone — the peer is optional precisely so that `van` never drags React into your tree. Four components use React 19 APIs that have no React 18 equivalent: `ui/select`, `ui/combobox` and `ui/resizable` take `ref` as a plain prop (on 18 the ref silently never attaches), and `ui/form` imports `useActionState` and `useFormStatus`. Everything in `lib/` is React-18-clean, so the coupling is those four files. The CLI itself is Node-stdlib only and needs Node 18.17 or newer.

There is nothing to install at runtime — your bundler (Vite, Next, …) compiles the JSX. Copying the folders by hand works exactly as well: `styles/globals.css`, then `lib/`, then the `ui/<component>/` directories you want, keeping `lib/` and `ui/` as siblings.

`van build` writes any `theme.typeset.presets` you configure into `styles/van.css` as `.typeset-<name>` classes. Those classes set the three rhythm variables and nothing else, so they do nothing until `styles/typeset.css` is imported — which is why `init` copies it.

The other commands:

| | |
|---|---|
| `van list` | every component, marking the ones you have |
| `van build` | regenerate `van.css` after editing `van.config.json` |
| `van diff` | which files you edited, and which the kit has changed since you copied them |

`van add` with no names opens a picker — arrow keys move, space toggles, `a` selects everything, enter confirms. `van add --all` is the same choice without the picker: every component you don't have yet, dependencies included. Add `--overwrite` to it and installed components come down again too.

`add` never overwrites a file you edited — it tells you and skips that component. `van add --overwrite` replaces it deliberately. That distinction comes from the `.van.json` sidecar written next to each component, which records what you were given.

For a one-off — trying the kit, or a single `add` in a project you don't want to touch — run it without installing: `npx github:parkrw/vanillin add button`.

Pin a tag for a stable source, either way: `npm i -D github:parkrw/vanillin#v0.1.0` or `npx github:parkrw/vanillin#v0.1.0 add button`.

### Component API conventions

- **Controlled or uncontrolled** — stateful components accept `value`/`defaultValue` (or `checked`/`defaultChecked`) plus an `onValueChange`/`onCheckedChange` callback:

  ```jsx
  <Switch defaultChecked />                          // uncontrolled
  <Slider value={volume} onValueChange={setVolume} /> // controlled
  ```

- **`as` prop** replaces Radix's `asChild` for rendering a different element/component: `<CollapsibleTrigger as={Button}>`.
- **Subcomponent names match the originals exactly** (`AccordionItem`, `TabsTrigger`, …), so upstream docs and examples map 1:1.
- **Styling hooks**: components expose `data-state` (`open`/`closed`, `checked`, `active`…), `data-orientation`, and `data-disabled` attributes; every part has a stable class (`.accordion-trigger`, `.slider-thumb`). Override by targeting those, or pass `className`.

## Theming

All components consume only CSS custom properties defined in `styles/globals.css`, with the standard names (`--background`, `--primary`, `--radius`, …). Any theme generator output in oklch/hsl drops in.

### Motion

Every animation and transition is driven by motion tokens. `--motion-scale` multiplies all durations (`1` = snappy default), `--motion-ease` sets the curve. For smoother open/close everywhere:

```css
:root {
  --motion-scale: 1.75;
  --motion-ease: cubic-bezier(0.22, 1, 0.36, 1);
}
```

`--motion-fast` (micro-interactions) and `--motion-medium` (accordion & co. open/close) derive from the scale and can also be overridden directly, including per subtree. Indeterminate loops (spinner, skeleton) are intentionally unaffected.

## Browser support

Baseline: **Chrome 123, Edge 123, Safari 17.5, Firefox 129** — roughly mid-2024. Firefox ESR 115 fails hard.

Two features are load-bearing; the rest degrade to something usable.

| Feature | Used for | Chrome | Safari | Firefox | Below the floor |
|---|---|---|---|---|---|
| `light-dark()` | all 47 colour tokens, in `styles/defaults.css` | 123 | 17.5 | 120 | **Hard fail** — every colour is invalid and components render unstyled |
| Popover API | select, combobox, dropdown, context menu, hover card, tooltip, navigation menu | 114 | 17 | 125 | **Hard fail** — those overlays never open |
| `@property` | typed, animatable tokens | 85 | 16.4 | 128 | Degrades — values still apply, transitions between them snap |
| `oklch(from …)` | the five `--*-hover` shades | 119 | 16.4 | 128 | Degrades — hover falls back to each token's registered default |
| `@starting-style` + `transition-behavior: allow-discrete` | overlay enter/exit transitions | 117 | 17.5 | 129 | Degrades — overlays appear and vanish instantly |

Firefox 125–128 renders and behaves correctly; it just loses overlay transitions, and 125–127 also lose token interpolation. Firefox 129 is the floor for full fidelity. Nothing here is polyfillable in CSS, so treat the baseline as a hard requirement rather than a target.

`field-sizing: content` (auto-growing textarea) sits behind `@supports` and is genuinely optional.

## Cascade & naming

**Nothing in the kit uses `@layer`, deliberately, and class names carry no prefix.** Both choices matter the moment you mix vanillin with another stylesheet.

Layered rules lose to unlayered ones at equal specificity, whatever the order. So next to **Tailwind v4** — whose utilities live in `@layer utilities` — a vanillin block class beats a utility class. `<Button className="p-8">` keeps `.btn`'s padding. This surprises people, so it is worth stating plainly: it is not a bug, and it is not something the kit works around for you.

`styles/globals.css` explains why. Token *values* are generated into `styles/defaults.css`; token *machinery* is hand-written in `globals.css` and has to be able to override them. Putting the generated `:root` in a layer would make it lose to every rule in the file it is meant to feed.

Three consequences:

1. **Class names are unprefixed** — `.btn`, `.card`, `.input`, `.badge`. They can collide with your own or another kit's. Rename the block class in the copied CSS if they do; the files are yours.
2. **Token names match shadcn/ui exactly** — `--background`, `--primary`, `--radius`, and the rest. Any shadcn-compatible theme generator drops straight in, and the two kits' tokens will fight if you load both.
3. **To override, raise specificity or reach for `!important`.** A rule of your own at `.btn.p-8` wins on specificity, and Tailwind v4's important modifier (`className="p-8!"`) wins outright, because `!important` beats any unlayered normal declaration. Wrapping *your* rules in `@layer` does not work — that puts them below vanillin, not above.

The import order in "Using it in a project" is therefore load-bearing: `globals.css`, then component CSS, then your `van.css` last.

## Developing vanillin itself

```sh
npm install   # dev-only deps: react, vite, playwright-core
npm run dev   # docs site at http://localhost:5173
npm test      # smoke tests (needs Google Chrome installed)
```

### Repo layout

| Path | What it is |
|---|---|
| `ui/<slug>/` | One component: `<slug>.jsx` + `<slug>.css` |
| `lib/` | Shared primitives (`cn`, `useControllableState`, `usePresence`, focus/positioning helpers) |
| `styles/globals.css` | All design tokens, light + dark |
| `styles/typeset.css` | The `.typeset` prose system — rhythm and element styling for markdown-shaped content |
| `site/` | Docs site (Vite) — a demo page per component |
| `tests/` | Playwright smoke tests driving the docs site |

The docs site's own CSS classes are prefixed `pg-` and its test hooks are
`data-pg="..."` — `pg` is short for "playground", the former name of `site/`.
The prefix keeps site chrome from colliding with component classes; it is
internal and never ships to consumers. Read it as "docs site".

### Adding a component

1. `ui/<slug>/<slug>.jsx` + `.css`. CSS rules: block class = component name, variants `block--modifier`, subparts `.block-part`; **tokens only** (`var(--…)`), opacity via `color-mix(in oklab, …)`, no hex.
2. Demo page `site/pages/<slug>.jsx` (default export, imports its own css), then set `page: lazy(...)` on the component's entry in `site/registry.js`.
3. Test file `tests/<slug>.test.mjs` (see below).

### Tests

`npm test` starts the docs site on port 5199, launches your installed Chrome via `playwright-core` (no browser download), and runs every `tests/*.test.mjs`. Each test file default-exports:

```js
export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#my-component`)
  await test("does the thing", async () => {
    eq(await page.locator(".my-component").getAttribute("data-state"), "open")
  })
}
```

`test` records pass/fail without aborting the file; `eq` is strict equality, `near(actual, expected, tolerance)` for pixel/percent values.
