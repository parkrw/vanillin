import { Button } from "../../../ui/button/button.jsx"
import { Card, CardHeader, CardTitle, CardContent } from "../../../ui/card/card.jsx"
import { Badge } from "../../../ui/badge/badge.jsx"
import { Input } from "../../../ui/input/input.jsx"
import "../../../ui/button/button.css"
import "../../../ui/card/card.css"
import "../../../ui/badge/badge.css"
import "../../../ui/input/input.css"
import { CodeBlock, ComponentPreview } from "../../code-example.jsx"
import "../../code-example.css"

export default function ThemingPage() {
  return (
    <>
      <h2>Theming</h2>

      <p>
        Design tokens live in two files.{" "}
        <code>styles/defaults.css</code> holds every token value and is
        generated from <code>van.defaults.json</code>.{" "}
        <code>styles/globals.css</code> holds the machinery (registrations,
        derivation ramps, forced-colors repair) and is hand-written.
        Retheme by editing <code>van.config.json</code> and
        running <code>van build</code>, which generates
        a <code>van.css</code> imported after <code>globals.css</code>.
        See <a href="#configuration">Configuration</a> for the full reference.
      </p>

      <h3>The kit&apos;s own theme is generator output</h3>

      <p>
        <code>van.defaults.json</code> is a real, complete config (the same
        schema a consumer writes) and{" "}
        <code>styles/defaults.css</code> is what the generator makes of it. It
        is committed, and the vite build regenerates it before resolving any
        CSS, so it cannot drift from its config.
      </p>

      <p>
        This is the point of the arrangement: there is exactly one{" "}
        <code>:root</code> declaring token values, and it is generated. There
        is no hand-written copy of the defaults for the generator to disagree
        with, and the generator is exercised on every build rather than only
        when someone remembers to run it.
      </p>

      <p>
        What stays hand-written in <code>globals.css</code> is everything that
        is not a value to choose: the <code>@property</code> registrations
        (whose <code>initial-value</code> must be computationally independent:
        no <code>var()</code>, no <code>rem</code>), the ramps that derive from
        a generated root (<code>--radius-sm</code>…<code>--radius-xl</code>{" "}
        from <code>--radius</code>, <code>--space-*</code> from{" "}
        <code>--density-scale</code>, <code>--motion-fast</code>/
        <code>--motion-medium</code> from <code>--motion-scale</code>), the{" "}
        <code>-hover</code> relative-colour derivations, the{" "}
        <code>[data-density]</code> block, the forced-colors repair layer and
        the touch-target floor. Because the ramps derive, changing one
        generated root value moves the whole family.
      </p>

      <p>
        Shadows are the one exception: <code>--shadow-sm</code>/
        <code>-md</code>/<code>-lg</code> are flat values with no config key
        yet, so they sit with the machinery until{" "}
        <code>theme.shadow</code> exists.
      </p>

      <h3>Cascade order</h3>

      <p>
        Nothing uses <code>@layer</code>, deliberately: layered styles lose to
        unlayered ones, so putting the generated tokens in a layer would make
        them lose to every ordinary rule in <code>globals.css</code>.
        Everything is unlayered and plain source order decides:
      </p>

      <CodeBlock language="text" code={`1. defaults.css       generated token values
2. forced-colors.css  repair layer, overrides (1)
3. globals.css        machinery + base element styles
4. component CSS      imported per component
5. your van.css       imported after globals.css`} />

      <p>
        Your own <code>van.css</code> comes last and wins. Note that it wins
        over <code>[data-density]</code> too, since both target the root at
        equal specificity; if you set <code>theme.density</code> there you are
        pinning it, not defaulting it.
      </p>

      <h3>Token families</h3>

      <p>
        Tokens are organised into families, each registered with{" "}
        <code>@property</code> for type safety:
      </p>

      <ul>
        <li>
          <strong>Colour</strong> (<code>{"syntax: \"<color>\""}</code>):
          core semantics (<code>--primary</code>, <code>--secondary</code>,{" "}
          <code>--accent</code>, <code>--destructive</code>,{" "}
          <code>--muted</code>, and their <code>-foreground</code> variants),
          surfaces (<code>--background</code>, <code>--card</code>,{" "}
          <code>--popover</code>), borders/inputs, status families
          (<code>--success</code>, <code>--warning</code>,{" "}
          <code>--info</code>), charts, and sidebar.
        </li>
        <li>
          <strong>Length</strong> (<code>{"syntax: \"<length>\""}</code>):
          the radius ramp: <code>--radius</code> plus{" "}
          <code>--radius-sm</code> through <code>--radius-xl</code>.
        </li>
        <li>
          <strong>Number</strong> (<code>{"syntax: \"<number>\""}</code>):
          scale factors: <code>--motion-scale</code> and{" "}
          <code>--density-scale</code>.
        </li>
      </ul>

      <p>
        The core semantic tokens applied to real components:
      </p>

      <ComponentPreview code={`<Button>Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Badge>Default</Badge>
<Badge variant="secondary">Muted</Badge>`}>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Badge>Default</Badge>
          <Badge variant="secondary">Muted</Badge>
        </div>
      </ComponentPreview>

      <h3>Light and dark in one declaration</h3>

      <p>
        Each colour token uses <code>light-dark()</code> to carry both
        modes in a single declaration:
      </p>

      <CodeBlock language="css" code={`:root {
  color-scheme: light;
  --primary: light-dark(oklch(0.205 0 0), oklch(0.922 0 0));
}`} />

      <p>
        The <code>.dark</code> class on <code>&lt;html&gt;</code> is still
        the explicit override hook. It sets{" "}
        <code>color-scheme:&nbsp;dark</code>, which makes every{" "}
        <code>light-dark()</code> resolve to its second argument. The kit
        does not follow the OS colour scheme automatically: light
        mode is the default regardless of <code>prefers-color-scheme</code>,
        and <code>.dark</code> is the only way to switch.
      </p>

      <p>
        Two pairs are asymmetric on purpose.{" "}
        <code>--destructive-foreground</code> is dark text in dark mode: white
        measures only 2.8:1 on the lighter dark-mode red.{" "}
        <code>--input-background</code> is <code>transparent</code> in light
        mode but a faint <code>--input</code> mix in dark, so bordered form
        controls still read on near-black.
      </p>

      <h3>Overriding a token</h3>

      <p>
        Set the custom property on <code>:root</code> (or any ancestor) to
        override it:
      </p>

      <CodeBlock language="css" code={`:root {
  --primary: light-dark(oklch(0.37 0.2 280), oklch(0.75 0.15 280));
}`} />

      <p>
        Because tokens are registered with <code>@property</code>, a
        malformed value falls back to the <code>initial-value</code>{" "}
        declared in the registration instead of cascading garbage down the
        tree. For example, setting <code>--primary:&nbsp;banana</code> is
        silently ignored and the default colour is used.
      </p>

      <h3>Brand derivation</h3>

      <p>
        Derived interaction-state tokens are built with relative colour
        syntax. Supply one base colour and the hover state follows
        automatically:
      </p>

      <CodeBlock language="css" code="--primary-hover: oklch(from var(--primary) calc(l - 0.05) c h);" />

      <p>
        The same pattern is used for <code>--secondary-hover</code>,{" "}
        <code>--accent-hover</code>, <code>--destructive-hover</code>, and{" "}
        <code>--muted-hover</code>. Because <code>var(--primary)</code> is
        already resolved per-mode by <code>@property</code> +{" "}
        <code>light-dark()</code>, the derivation works in both light and
        dark without separate declarations.
      </p>

      <h3>Brand colours from van.config.json</h3>

      <p>
        The generator derives token families from <code>theme.brand</code>.
        A string is shorthand for <code>{"{ primary: … }"}</code>; the object
        form takes up to four keys:
      </p>

      <CodeBlock language="json" code={`"brand": {
  "primary":   "oklch(0.55 0.2 265)",
  "secondary": "oklch(0.65 0.14 190)",
  "accent":    "oklch(0.7 0.15 320)",
  "neutral":   "oklch(0.55 0.02 265)"
}`} />

      <ul>
        <li>
          <strong><code>primary</code></strong> drives{" "}
          <code>--primary</code>, <code>--primary-foreground</code>, and{" "}
          <code>--ring</code>.
        </li>
        <li>
          <strong><code>secondary</code></strong> and{" "}
          <strong><code>accent</code></strong> each drive their token and{" "}
          <code>-foreground</code> pair.
        </li>
        <li>
          <strong><code>neutral</code></strong> tints the greys: its hue
          (chroma capped at 0.03, lightness ignored) threads through{" "}
          <code>--secondary</code>, <code>--muted</code>,{" "}
          <code>--accent</code> and their <code>-foreground</code> pairs at
          the kit&apos;s existing lightness ramp. This is what stops a themed
          kit from still reading as grey. An explicit{" "}
          <code>secondary</code> or <code>accent</code> key wins over the
          tint.
        </li>
      </ul>

      <p>
        Every key gets a dark-mode variant (lightness boosted, chroma
        slightly reduced) and a foreground picked by <em>measured</em> WCAG
        contrast: the candidate with the higher ratio wins, and generation
        fails if neither reaches 4.5:1. Mid-lightness colours (around
        oklch&nbsp;L&nbsp;0.58) support no accessible foreground; nudge the
        lightness either way. Values must be the simple{" "}
        <code>oklch(L C H)</code> form; unknown keys are validation errors.
      </p>

      <p>
        <strong>Deliberately not derived:</strong> the status families
        (<code>--success</code>, <code>--warning</code>, <code>--info</code>,{" "}
        <code>--destructive</code>) keep their defaults regardless of brand:
        a red "success" because the brand is red would be worse
        than an off-palette green. Override them token by token in{" "}
        <code>theme.light</code> / <code>theme.dark</code> if needed; those
        literal overrides also win over any derived token. The{" "}
        <code>-hover</code> tokens are never emitted either: they
        auto-derive in <code>globals.css</code> from whatever the base
        tokens resolve to.
      </p>

      <h3>Per-component customisation</h3>

      <p>
        The <code>components</code> section
        in <code>van.config.json</code> overrides tokens, adds variants,
        and defines sizes for individual components. All values are CSS
        property maps: the generator expands shorthands
        (<code>bg</code>, <code>fg</code>, <code>radius</code>) and
        emits scoped custom properties in <code>van.css</code>.
      </p>

      <CodeBlock language="json" code={`"components": {
  "button": {
    "tokens": {
      "border-radius": "9999px"
    },
    "variants": {
      "brand": {
        "bg": "color-mix(in oklab, var(--primary) 15%, var(--background))",
        "fg": "var(--primary)",
        "border-radius": "9999px"
      }
    },
    "sizes": {
      "xs": {
        "height": "1.75rem",
        "padding-inline": "0.5rem",
        "font-size": "0.75rem"
      }
    }
  }
}`} />

      <ul>
        <li>
          <strong><code>tokens</code></strong>: base property overrides
          applied to the component root.
        </li>
        <li>
          <strong><code>variants</code></strong>: named property maps
          applied when a variant is active.
        </li>
        <li>
          <strong><code>sizes</code></strong>: named property maps keyed
          by size name, same structure as variants.
        </li>
      </ul>

      <p>
        See <a href="#configuration">Configuration</a> for the full{" "}
        <code>components</code> reference and validation rules.
      </p>

      <h3>Density modes</h3>

      <p>
        Three named density modes scale all spacing that flows through the{" "}
        <code>--space-*</code> token ramp:
      </p>

      <CodeBlock language="css" code={`[data-density="compact"]     { --density-scale: 0.875; }
[data-density="comfortable"] { --density-scale: 1; }
[data-density="spacious"]    { --density-scale: 1.25; }`} />

      <p>
        Apply them with the <code>&lt;Density&gt;</code> component or set{" "}
        <code>data-density</code> directly on any element. They are scoped,
        not global: a compact table inside a comfortable page is the
        intended use case. Nesting works: a <code>data-density</code> inside
        another one wins.
      </p>

      <p>
        <strong>Font size is never scaled.</strong> Density is spacing.
        Shrinking text below 14px fails accessibility and is why compact
        modes usually look broken.
      </p>

      <p>
        <strong>Touch targets are clamped.</strong> Interactive elements
        enforce a 24px minimum (WCAG&nbsp;2.5.8) so compact mode stays
        usable on coarse-pointer devices.
      </p>

      <p>
        For a custom scale, set <code>--density-scale</code> to any number
        directly. The named modes are the API, but the raw variable stays
        supported.
      </p>

      <ComponentPreview code={`<div data-density="compact">
  <Card>
    <CardHeader><CardTitle>Compact</CardTitle></CardHeader>
    <CardContent>
      <Input placeholder="Search..." />
      <Button style={{ marginTop: "0.5rem" }}>Confirm</Button>
    </CardContent>
  </Card>
</div>

<Card>
  <CardHeader><CardTitle>Comfortable</CardTitle></CardHeader>
  <CardContent>
    <Input placeholder="Search..." />
    <Button style={{ marginTop: "0.5rem" }}>Save</Button>
  </CardContent>
</Card>

<div data-density="spacious">
  <Card>
    <CardHeader><CardTitle>Spacious</CardTitle></CardHeader>
    <CardContent>
      <Input placeholder="Search..." />
      <Button style={{ marginTop: "0.5rem" }}>Apply</Button>
    </CardContent>
  </Card>
</div>`}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))", gap: "1rem" }}>
          <div data-density="compact">
            <Card>
              <CardHeader><CardTitle>Compact</CardTitle></CardHeader>
              <CardContent>
                <Input placeholder="Search..." />
                <Button style={{ marginTop: "0.5rem" }}>Confirm</Button>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle>Comfortable</CardTitle></CardHeader>
            <CardContent>
              <Input placeholder="Search..." />
              <Button style={{ marginTop: "0.5rem" }}>Save</Button>
            </CardContent>
          </Card>
          <div data-density="spacious">
            <Card>
              <CardHeader><CardTitle>Spacious</CardTitle></CardHeader>
              <CardContent>
                <Input placeholder="Search..." />
                <Button style={{ marginTop: "0.5rem" }}>Apply</Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </ComponentPreview>

      <h3>Browser support</h3>

      <p>
        The token layer uses three modern CSS features, all verified in
        Chrome&nbsp;150 (HeadlessChrome) with computed-value round-trips:
      </p>

      <ul>
        <li>
          <code>light-dark()</code>: Baseline 2024, supported in all
          evergreen browsers.
        </li>
        <li>
          <strong>Relative colour syntax</strong> (<code>oklch(from
          ...)</code>): Baseline 2024. <code>CSS.supports</code> alone
          lies about this in some builds; the check uses a real
          computed-value round-trip.
        </li>
        <li>
          <code>@property</code>: Baseline 2024 (Safari 15.4+,
          Firefox 128+, Chrome 85+).
        </li>
      </ul>

      <p>
        All three are safe to use without fallback. Browsers that lack them
        are below the kit's support floor.
      </p>

      <h3>Cursor affordance</h3>

      <p>
        A base rule in <code>globals.css</code> sets{" "}
        <code>cursor:&nbsp;pointer</code> on every interactive semantic:{" "}
        <code>button</code>, <code>summary</code>, <code>label[for]</code>,{" "}
        <code>a[href]</code>, <code>select</code>, and ARIA roles{" "}
        <code>button</code>, <code>menuitem</code>,{" "}
        <code>menuitemcheckbox</code>, <code>menuitemradio</code>,{" "}
        <code>option</code>, <code>tab</code>, <code>switch</code>,{" "}
        <code>radio</code>, <code>checkbox</code>, and <code>link</code>.
        New components that use these roles inherit the pointer automatically.
      </p>

      <p>
        Disabled states rely on <code>pointer-events:&nbsp;none</code> (or an
        explicit <code>cursor:&nbsp;not-allowed</code> for form inputs) to
        suppress the pointer; no <code>:not(:disabled)</code> guard is needed
        in the base rule.
      </p>

      <p>
        A few components opt into non-pointer cursors:
      </p>
      <ul>
        <li>
          <strong>Slider</strong> thumb: <code>grab</code>, changing to{" "}
          <code>grabbing</code> during a drag (via{" "}
          <code>data-dragging</code> on the root).
        </li>
        <li>
          <strong>Resizable</strong> handle: <code>col-resize</code> or{" "}
          <code>row-resize</code> depending on group direction.
        </li>
        <li>
          <strong>Carousel</strong> track: <code>grab</code> at rest,{" "}
          <code>grabbing</code> once the 5&nbsp;px drag dead zone is passed
          (via <code>data-dragging</code> on the content element).
        </li>
        <li>
          <strong>Scroll area</strong> thumb: <code>default</code>, matching
          native scrollbar behavior.
        </li>
      </ul>
    </>
  )
}
