# Measuring colour in this repo

Written after task 71, whose first probe produced a page of confident, uniform, wrong numbers. Anything that measures contrast or reads a computed colour here hits all four of these.

## Computed styles come back as `oklch()` / `oklab()`

`styles/defaults.css` defines every token in oklch, so `getComputedStyle(el).backgroundColor` returns `oklch(0.922 0 0)`, not `rgb(...)`. Parsing numbers out of that string and treating them as RGB yields plausible garbage — the first version of `scripts/contrast-nontext.mjs` reported exactly `1.00:1` for every probe and looked like a real finding.

Convert with the canvas instead, which does the colour-space work for you:

```js
const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
ctx.clearRect(0, 0, 1, 1)
ctx.fillStyle = css          // any CSS colour, oklch included
ctx.fillRect(0, 0, 1, 1)
const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data   // a is 0-255
```

`getImageData` returns unpremultiplied values, so alpha survives the round trip.

## Composite alpha before taking a ratio

Half the kit's dark-mode tokens are translucent (`oklch(1 0 0 / 0.15)` is the dark `--border`). A ratio taken against the raw colour is meaningless — composite it over the resolved backdrop first: `fg * a + bg * (1 - a)`. Resolve the backdrop by walking `parentElement` until a background with alpha > 0.9.

## axe measures text contrast only

`axe.run(..., { runOnly: ["color-contrast"] })` implements WCAG 1.4.3, which is about text. It says nothing about a switch track, a checkbox border, or an input outline — WCAG 1.4.11, 3:1, non-text. This kit shipped a `--border` token at 1.26:1 with axe reporting the whole site clean. **A green axe run is not an accessibility result.** `scripts/contrast-nontext.mjs` covers the other half.

## Probe a control nobody complained about

Task 71 measured `.input`'s border purely as a baseline. It failed identically to the four components that *had* been reported, and that is the entire reason the defect was diagnosed as one token rather than four component bugs. Any sweep trying to tell "systemic" from "local" apart needs at least one unreported control in it.

## Dark mode: emulate, don't toggle

`site/color-scheme.js:16` reads `prefers-color-scheme` at import time and owns the `.dark` class from then on. Adding or removing that class after load desyncs the store from the DOM, and the next React render undoes it. Use `browser.newContext({ colorScheme: "dark" })` and load the page fresh — that is also what `tests/run.mjs` does.
