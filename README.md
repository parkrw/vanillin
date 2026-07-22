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

## Developing vanillin itself

```sh
npm install   # dev-only deps: react, vite
npm run dev   # playground with a demo page per component
```

## Theming

All components consume only CSS custom properties defined in `styles/globals.css`, with the same names shadcn uses (`--background`, `--primary`, `--radius`, …). Any shadcn theme generator output in oklch/hsl drops in.
