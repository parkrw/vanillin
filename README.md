# vanillin

**Zero-dependency** React components — vanilla JS, JSX, and plain CSS. No Tailwind, no Radix, no Floating UI. Only React is required.

## Using it in a project

This is not a package — the files land in your project and are yours to edit. The CLI is a faster hand for the copying:

```sh
npm i -D github:parkrw/vanillin          # adds the `van` CLI to your project
van init                                 # config + stylesheets, layout detected
van add button dialog
```

`init` reads your `package.json` and any `components.json` to work out where components belong (`src/components/ui` in a Next or aliased project, `./components/ui` otherwise), writes `van.config.json`, and copies the stylesheets. `add` brings each component's dependencies with it — other components it imports, and the `lib/` primitives it needs. In a Next App Router project the copied components get a `"use client"` directive; elsewhere they don't.

Then import the two stylesheets once, in this order, plus the components you use:

```jsx
import "./styles/globals.css"   // every design token
import "./styles/van.css"       // your overrides, generated from van.config.json

import { Button } from "./components/ui/button/button.jsx"
import "./components/ui/button/button.css"
```

There is nothing to install at runtime — your bundler (Vite, Next, …) compiles the JSX. Copying the folders by hand works exactly as well: `styles/globals.css`, then `lib/`, then the `ui/<component>/` directories you want, keeping `lib/` and `ui/` as siblings.

The other commands:

| | |
|---|---|
| `van list` | every component, marking the ones you have |
| `van build` | regenerate `van.css` after editing `van.config.json` |
| `van diff` | which files you edited, and which the kit has changed since you copied them |

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
