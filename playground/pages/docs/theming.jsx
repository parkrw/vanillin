export default function ThemingPage() {
  return (
    <>
      <h2>Theming</h2>

      <p>
        Every design token lives in <code>styles/globals.css</code>. Edit that
        one file to retheme everything.
      </p>

      <h3>Token families</h3>

      <p>
        Tokens are organised into families, each registered with{" "}
        <code>@property</code> for type safety:
      </p>

      <ul>
        <li>
          <strong>Colour</strong> (<code>{"syntax: \"<color>\""}</code>) —
          core semantics (<code>--primary</code>, <code>--secondary</code>,{" "}
          <code>--accent</code>, <code>--destructive</code>,{" "}
          <code>--muted</code>, and their <code>-foreground</code> variants),
          surfaces (<code>--background</code>, <code>--card</code>,{" "}
          <code>--popover</code>), borders/inputs, status families
          (<code>--success</code>, <code>--warning</code>,{" "}
          <code>--info</code>), charts, and sidebar.
        </li>
        <li>
          <strong>Length</strong> (<code>{"syntax: \"<length>\""}</code>) —
          the radius ramp: <code>--radius</code> plus{" "}
          <code>--radius-sm</code> through <code>--radius-xl</code>.
        </li>
        <li>
          <strong>Number</strong> (<code>{"syntax: \"<number>\""}</code>) —
          scale factors: <code>--motion-scale</code> and{" "}
          <code>--density-scale</code>.
        </li>
      </ul>

      <h3>Light and dark in one declaration</h3>

      <p>
        Each colour token uses <code>light-dark()</code> to carry both
        modes in a single declaration:
      </p>

      <pre>
{`:root {
  color-scheme: light;
  --primary: light-dark(oklch(0.205 0 0), oklch(0.922 0 0));
}`}
      </pre>

      <p>
        The <code>.dark</code> class on <code>&lt;html&gt;</code> is still
        the explicit override hook. It sets{" "}
        <code>color-scheme:&nbsp;dark</code>, which makes every{" "}
        <code>light-dark()</code> resolve to its second argument. The kit
        does not follow the OS colour scheme automatically &mdash; light
        mode is the default regardless of <code>prefers-color-scheme</code>,
        and <code>.dark</code> is the only way to switch.
      </p>

      <h3>Overriding a token</h3>

      <p>
        Set the custom property on <code>:root</code> (or any ancestor) to
        override it:
      </p>

      <pre>
{`:root {
  --primary: light-dark(oklch(0.37 0.2 280), oklch(0.75 0.15 280));
}`}
      </pre>

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

      <pre>
{`--primary-hover: oklch(from var(--primary) calc(l - 0.05) c h);`}
      </pre>

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

      <pre>
{`"brand": {
  "primary":   "oklch(0.55 0.2 265)",
  "secondary": "oklch(0.65 0.14 190)",
  "accent":    "oklch(0.7 0.15 320)",
  "neutral":   "oklch(0.55 0.02 265)"
}`}
      </pre>

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
        contrast — the candidate with the higher ratio wins, and generation
        fails if neither reaches 4.5:1. Mid-lightness colours (around
        oklch&nbsp;L&nbsp;0.58) support no accessible foreground; nudge the
        lightness either way. Values must be the simple{" "}
        <code>oklch(L C H)</code> form; unknown keys are validation errors.
      </p>

      <p>
        <strong>Deliberately not derived:</strong> the status families
        (<code>--success</code>, <code>--warning</code>, <code>--info</code>,{" "}
        <code>--destructive</code>) keep their defaults regardless of brand —
        a red &ldquo;success&rdquo; because the brand is red would be worse
        than an off-palette green. Override them token by token in{" "}
        <code>theme.light</code> / <code>theme.dark</code> if needed; those
        literal overrides also win over any derived token. The{" "}
        <code>-hover</code> tokens are never emitted either — they
        auto-derive in <code>globals.css</code> from whatever the base
        tokens resolve to.
      </p>

      <h3>Density modes</h3>

      <p>
        Three named density modes scale all spacing that flows through the{" "}
        <code>--space-*</code> token ramp:
      </p>

      <pre>
{`[data-density="compact"]     { --density-scale: 0.875; }
[data-density="comfortable"] { --density-scale: 1; }
[data-density="spacious"]    { --density-scale: 1.25; }`}
      </pre>

      <p>
        Apply them with the <code>&lt;Density&gt;</code> component or set{" "}
        <code>data-density</code> directly on any element. They are scoped,
        not global &mdash; a compact table inside a comfortable page is the
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

      <h3>Browser support</h3>

      <p>
        The token layer uses three modern CSS features, all verified in
        Chrome&nbsp;150 (HeadlessChrome) with computed-value round-trips:
      </p>

      <ul>
        <li>
          <code>light-dark()</code> — Baseline 2024, supported in all
          evergreen browsers.
        </li>
        <li>
          <strong>Relative colour syntax</strong> (<code>oklch(from
          ...)</code>) — Baseline 2024. <code>CSS.supports</code> alone
          lies about this in some builds; the check uses a real
          computed-value round-trip.
        </li>
        <li>
          <code>@property</code> — Baseline 2024 (Safari 15.4+,
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
        suppress the pointer — no <code>:not(:disabled)</code> guard is needed
        in the base rule.
      </p>

      <p>
        A few components opt into non-pointer cursors:
      </p>
      <ul>
        <li>
          <strong>Slider</strong> thumb — <code>grab</code>, changing to{" "}
          <code>grabbing</code> during a drag (via{" "}
          <code>data-dragging</code> on the root).
        </li>
        <li>
          <strong>Resizable</strong> handle — <code>col-resize</code> or{" "}
          <code>row-resize</code> depending on group direction.
        </li>
        <li>
          <strong>Carousel</strong> track — <code>grab</code> at rest,{" "}
          <code>grabbing</code> once the 5&nbsp;px drag dead zone is passed
          (via <code>data-dragging</code> on the content element).
        </li>
        <li>
          <strong>Scroll area</strong> thumb — <code>default</code>, matching
          native scrollbar behavior.
        </li>
      </ul>
    </>
  )
}
