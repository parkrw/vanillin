export default function ThemingPage() {
  return (
    <>
      <h2>Theming</h2>

      <p>
        Every design token lives in <code>styles/globals.css</code>. Token
        names match shadcn/ui. Edit that one file to retheme everything.
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

      <h3>Density scale</h3>

      <p>
        <code>--density-scale</code> (default&nbsp;1) and a spacing ramp
        (<code>--space-1</code> through <code>--space-8</code>) are defined
        but <strong>not yet applied</strong> to any component. Override{" "}
        <code>--density-scale</code> at <code>:root</code> to prepare for
        future density support (e.g.&nbsp;0.875 for compact, 1.25 for
        spacious), but nothing will change visually until components are
        wired to use the spacing tokens.
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
    </>
  )
}
