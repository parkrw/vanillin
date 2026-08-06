import { CodeBlock } from "../../code-example.jsx"
import "../../code-example.css"

export default function ConfigurationPage() {
  return (
    <>
      <h2>Configuration</h2>

      <p>
        <code>van.config.json</code> controls theming, component customisation,
        and project layout. The CLI creates it during <code>van init</code>;{" "}
        <code>van build</code> regenerates <code>van.css</code> from it.
        A JSON Schema (<code>van.schema.json</code>) is available for
        editor autocompletion.
      </p>

      <CodeBlock language="json" code={`{
  "$schema": "./van.schema.json",
  "theme": {
    "brand": "oklch(0.55 0.2 265)",
    "radius": "0.5rem",
    "density": "comfortable",
    "motion": { "scale": 1, "ease": "ease-out" },
    "font": {
      "sans": "Inter, ui-sans-serif, system-ui, sans-serif",
      "mono": "JetBrains Mono, ui-monospace, monospace"
    }
  }
}`} />

      <h3>Top-level keys</h3>

      <p>
        Five keys at the root. Only <code>theme</code> is required for
        theming; the rest are set by <code>van init</code> and rarely
        edited by hand.
      </p>

      <ul>
        <li>
          <code>theme</code> — colours, radius, density, motion, fonts,
          typeset, and per-mode overrides
        </li>
        <li>
          <code>components</code> — per-component token, variant, and size
          overrides
        </li>
        <li>
          <code>paths</code> — where the CLI writes files
          (<code>ui</code>, <code>lib</code>, <code>styles</code>,{" "}
          <code>css</code>)
        </li>
        <li>
          <code>framework</code> — one of <code>next-app</code>,{" "}
          <code>next-pages</code>, <code>vite</code>, <code>remix</code>,{" "}
          <code>astro</code>, <code>unknown</code>
        </li>
        <li>
          <code>rsc</code> — boolean; when true, copied components that
          call hooks get a <code>"use client"</code> directive
        </li>
      </ul>

      <h3>theme.brand</h3>

      <p>
        A single oklch colour string, or an object with up to four keys:{" "}
        <code>primary</code>, <code>secondary</code>, <code>accent</code>,{" "}
        <code>neutral</code>. A string is shorthand
        for <code>{"{ primary: \"...\" }"}</code>.
      </p>

      <CodeBlock language="json" code={`// String shorthand — sets primary only
"brand": "oklch(0.55 0.2 265)"

// Object form — all four keys are optional
"brand": {
  "primary":   "oklch(0.55 0.2 265)",
  "secondary": "oklch(0.65 0.14 190)",
  "accent":    "oklch(0.7 0.15 320)",
  "neutral":   "oklch(0.55 0.02 265)"
}`} />

      <p>
        Each key derives a full token pair (<code>--primary</code> +{" "}
        <code>--primary-foreground</code>) with a dark-mode variant.
        Foregrounds are picked by measured WCAG contrast. The{" "}
        <code>neutral</code> key tints the greys — its hue threads
        through <code>--secondary</code>, <code>--muted</code>, and{" "}
        <code>--accent</code> at the existing lightness ramp. An
        explicit <code>secondary</code> or <code>accent</code> wins
        over the tint.
      </p>

      <p>
        Values must be simple <code>oklch(L C H)</code>. Mid-lightness
        colours (around L 0.58) may not support an accessible foreground
        — nudge the lightness up or down.
      </p>

      <h3>theme.radius</h3>

      <p>
        A CSS length string. Sets <code>--radius</code>, from which{" "}
        <code>--radius-sm</code> through <code>--radius-xl</code> derive
        in <code>globals.css</code>.
      </p>

      <CodeBlock language="json" code={`"radius": "0.5rem"`} />

      <h3>theme.density</h3>

      <p>
        A preset name or a number. Presets resolve to scale factors:
      </p>

      <ul>
        <li><code>"compact"</code> — 0.875</li>
        <li><code>"comfortable"</code> — 1 (default)</li>
        <li><code>"spacious"</code> — 1.25</li>
      </ul>

      <p>
        Numeric values are clamped to 0.75–1.5. The scale
        factor drives <code>--density-scale</code>, which multiplies
        every <code>--space-*</code> token. Font size is never scaled.
      </p>

      <CodeBlock language="json" code={`"density": "compact"
// or a raw number
"density": 0.9`} />

      <h3>theme.motion</h3>

      <p>Two keys:</p>

      <ul>
        <li>
          <code>scale</code> — number (0–3). Multiplies{" "}
          <code>--motion-scale</code>, which drives{" "}
          <code>--motion-fast</code> and <code>--motion-medium</code>.
          Set to 0 to disable all animation.
        </li>
        <li>
          <code>ease</code> — a CSS easing string, sets{" "}
          <code>--motion-ease</code>.
        </li>
      </ul>

      <CodeBlock language="json" code={`"motion": {
  "scale": 1,
  "ease": "ease-out"
}`} />

      <h3>theme.font</h3>

      <p>
        Font stacks for <code>--font-sans</code> and{" "}
        <code>--font-mono</code>.
      </p>

      <CodeBlock language="json" code={`"font": {
  "sans": "Inter, ui-sans-serif, system-ui, sans-serif",
  "mono": "JetBrains Mono, ui-monospace, monospace"
}`} />

      <h3>theme.typeset</h3>

      <p>
        Typography defaults: base size, line-height multiplier, block
        spacing, per-role font stacks, and named presets.
      </p>

      <ul>
        <li><code>size</code> — base font-size string (e.g. <code>"1rem"</code>)</li>
        <li><code>leading</code> — line-height multiplier, clamped 1–3</li>
        <li><code>flow</code> — block spacing string (e.g. <code>"1.5rem"</code>)</li>
        <li>
          <code>font</code> — object with <code>body</code>,{" "}
          <code>heading</code>, <code>mono</code> keys
        </li>
        <li>
          <code>presets</code> — named bundles of <code>size</code>,{" "}
          <code>leading</code>, <code>flow</code>
        </li>
      </ul>

      <CodeBlock language="json" code={`"typeset": {
  "size": "1rem",
  "leading": 1.75,
  "flow": "1.5rem",
  "font": {
    "body": "var(--font-sans)",
    "heading": "var(--font-sans)",
    "mono": "var(--font-mono)"
  },
  "presets": {
    "docs": { "size": "1rem", "leading": 1.8, "flow": "1.75rem" },
    "chat": { "size": "0.875rem", "leading": 1.5, "flow": "0.75rem" }
  }
}`} />

      <h3>theme.light / theme.dark</h3>

      <p>
        Per-mode colour token overrides. Keys are token names
        (matching <code>@property</code> registrations
        in <code>globals.css</code>), values are CSS colour strings.
        These are literal overrides — they win over any derived value
        from <code>brand</code>.
      </p>

      <CodeBlock language="json" code={`"light": {
  "accent": "oklch(0.93 0.05 265)"
},
"dark": {
  "accent": "oklch(0.3 0.05 265)"
}`} />

      <h3>components</h3>

      <p>
        Per-component customisation. Each key is a component slug; each
        value is an object with three optional sections:{" "}
        <code>tokens</code>, <code>variants</code>, and{" "}
        <code>sizes</code>. All values are CSS property maps — keys are
        CSS property names (with shorthands <code>bg</code>,{" "}
        <code>fg</code>, <code>radius</code> expanded automatically),
        values are CSS strings.
      </p>

      <h4>tokens</h4>

      <p>
        Base property overrides applied to the component root.
      </p>

      <CodeBlock language="json" code={`"components": {
  "button": {
    "tokens": {
      "border-radius": "9999px",
      "font-weight": "600"
    }
  }
}`} />

      <h4>variants</h4>

      <p>
        Named variant definitions. Each variant is a property map
        applied when the variant is active.
      </p>

      <CodeBlock language="json" code={`"components": {
  "button": {
    "variants": {
      "brand": {
        "bg": "color-mix(in oklab, var(--primary) 15%, var(--background))",
        "fg": "var(--primary)",
        "border-radius": "9999px"
      }
    }
  }
}`} />

      <h4>sizes</h4>

      <p>
        Named size definitions. Like variants, but keyed by size name.
      </p>

      <CodeBlock language="json" code={`"components": {
  "button": {
    "sizes": {
      "xs": {
        "height": "1.75rem",
        "padding-inline": "0.5rem",
        "font-size": "0.75rem"
      }
    }
  }
}`} />

      <h3>paths</h3>

      <p>
        Where the CLI reads and writes files. Set
        by <code>van init</code> based on your project layout. All
        values are project-relative; absolute paths and <code>..</code>{" "}
        segments are rejected.
      </p>

      <ul>
        <li><code>ui</code> — component directory (default: <code>"ui"</code>)</li>
        <li><code>lib</code> — primitives directory (default: <code>"lib"</code>)</li>
        <li><code>styles</code> — stylesheet directory (default: <code>"styles"</code>)</li>
        <li><code>css</code> — generated theme output (default: <code>"styles/van.css"</code>)</li>
      </ul>

      <CodeBlock language="json" code={`"paths": {
  "ui": "src/components/ui",
  "lib": "src/components/lib",
  "styles": "src/styles",
  "css": "src/styles/van.css"
}`} />

      <h3>Validation</h3>

      <p>
        The config is validated
        by <code>scripts/config-schema.mjs</code> at build time. CSS
        injection is guarded: values containing <code>;</code>,{" "}
        <code>{"{"}</code>, <code>{"}"}</code>,{" "}
        <code>{"<"}</code>, <code>@</code>, or <code>url()</code>{" "}
        are rejected. Brand colours must use simple <code>oklch(L C H)</code>{" "}
        form. Unknown keys at any level are errors, not warnings.
      </p>

      <p>
        After editing the config, regenerate
        with <code>van build</code> (or <code>npm run theme</code> in
        the kit checkout).
        See <a href="#theming">Theming</a> for how tokens cascade.
      </p>
    </>
  )
}
