# vanillin

shadcn/ui recreated with **zero dependencies** — vanilla React JSX + plain CSS. No Tailwind, no Radix, no Floating UI. The only thing your project needs is React.

## Using it in a project

This is not a package. You copy files in, like shadcn:

1. Copy `styles/globals.css` into your project and import it once (your app entry). It holds every design token — edit this one file to retheme everything, add a `.dark` class on `<html>` for dark mode.
2. Copy `lib/` into your project (shared primitives some components import via relative paths — keep `lib/` and `ui/` as siblings).
3. Copy the `ui/<component>/` folders you want. Each is one `.jsx` + one `.css`; import both:

```jsx
import { Button } from "./ui/button/button.jsx"
import "./ui/button/button.css"
```

Your bundler (Vite, Next, etc.) compiles the JSX. Nothing to install, and the code is yours to edit.

### Component API conventions

- **Controlled or uncontrolled** — stateful components accept `value`/`defaultValue` (or `checked`/`defaultChecked`) plus an `onValueChange`/`onCheckedChange` callback, same names as shadcn/Radix:

  ```jsx
  <Switch defaultChecked />                          // uncontrolled
  <Slider value={volume} onValueChange={setVolume} /> // controlled
  ```

- **`as` prop** replaces Radix's `asChild` for rendering a different element/component: `<CollapsibleTrigger as={Button}>`.
- **Subcomponent names match shadcn exactly** (`AccordionItem`, `TabsTrigger`, …), so shadcn docs and examples map 1:1.
- **Styling hooks**: components expose `data-state` (`open`/`closed`, `checked`, `active`…), `data-orientation`, and `data-disabled` attributes; every part has a stable class (`.accordion-trigger`, `.slider-thumb`). Override by targeting those, or pass `className`.

## Theming

All components consume only CSS custom properties defined in `styles/globals.css`, with the same names shadcn uses (`--background`, `--primary`, `--radius`, …). Any shadcn theme generator output in oklch/hsl drops in.

## Developing vanillin itself

```sh
npm install   # dev-only deps: react, vite, playwright-core
npm run dev   # playground at http://localhost:5173
npm test      # smoke tests (needs Google Chrome installed)
```

### Repo layout

| Path | What it is |
|---|---|
| `ui/<slug>/` | One component: `<slug>.jsx` + `<slug>.css` |
| `lib/` | Shared primitives (`cn`, `useControllableState`, `usePresence`, focus/positioning helpers) |
| `styles/globals.css` | All design tokens, light + dark |
| `playground/` | Vite dev harness — a demo page per component |
| `tests/` | Playwright smoke tests driving the playground |

### Adding a component

1. `ui/<slug>/<slug>.jsx` + `.css`. CSS rules: block class = component name, variants `block--modifier`, subparts `.block-part`; **tokens only** (`var(--…)`), opacity via `color-mix(in oklab, …)`, no hex.
2. Demo page `playground/pages/<slug>.jsx` (default export, imports its own css), then set `page: lazy(...)` on the component's entry in `playground/registry.js`.
3. Test file `tests/<slug>.test.mjs` (see below).

### Tests

`npm test` starts the playground on port 5199, launches your installed Chrome via `playwright-core` (no browser download), and runs every `tests/*.test.mjs`. Each test file default-exports:

```js
export default async function run({ page, baseUrl, test, eq, near }) {
  await page.goto(`${baseUrl}/#my-component`)
  await test("does the thing", async () => {
    eq(await page.locator(".my-component").getAttribute("data-state"), "open")
  })
}
```

`test` records pass/fail without aborting the file; `eq` is strict equality, `near(actual, expected, tolerance)` for pixel/percent values.
