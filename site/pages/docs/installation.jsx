import { CodeBlock } from "../../code-example.jsx"
import "../../code-example.css"

export default function InstallationPage() {
  return (
    <>
      <h2>Installation</h2>

      <p>
        Components are copied into your project, not installed from a
        package. The CLI does the copying — it resolves dependencies,
        writes the files, and stops. Nothing is imported from vanillin at
        runtime.
      </p>

      <h3>Prerequisites</h3>

      <ul>
        <li>React 18 or 19</li>
        <li>A bundler that handles JSX and CSS imports (Vite, Next.js, Remix, Astro)</li>
        <li>Node 18+</li>
      </ul>

      <h3>1. Scaffold the project</h3>

      <p>
        <code>van init</code> detects your framework, finds where
        components and styles belong, writes <code>van.config.json</code>,
        and copies the base stylesheets.
      </p>

      <CodeBlock language="bash" code="npx github:parkrw/vanillin init" />

      <p>
        It reads <code>package.json</code> for framework detection
        and <code>tsconfig.json</code> / <code>jsconfig.json</code> for
        path aliases. An existing <code>components.json</code> from
        shadcn is honoured — its aliases map directly to vanillin's{" "}
        <code>paths</code>.
      </p>

      <h3>2. Import the stylesheets</h3>

      <p>
        Add these two imports to your app entry, in this order:
      </p>

      <CodeBlock language="jsx" code={`import "./styles/globals.css"
import "./styles/van.css"`} />

      <p>
        <code>globals.css</code> declares every design token.{" "}
        <code>van.css</code> is generated from your config and
        overrides the defaults. Order matters — <code>van.css</code>{" "}
        must come after <code>globals.css</code> so your theme wins.
      </p>

      <h3>3. Add components</h3>

      <p>
        Copy one or more components by slug. Dependencies are resolved
        automatically — <code>alert-dialog</code> brings{" "}
        <code>dialog</code> and <code>button</code> with it.
      </p>

      <CodeBlock language="bash" code={`npx github:parkrw/vanillin add button dialog card
# or add everything at once
npx github:parkrw/vanillin add --yes`} />

      <p>
        Run bare <code>van add</code> in a terminal for an interactive
        picker — arrow keys to navigate, space to toggle, enter to
        confirm.
      </p>

      <h3>4. Use a component</h3>

      <p>
        Import the JSX and its CSS. Each component is a directory
        under your <code>ui/</code> path.
      </p>

      <CodeBlock language="jsx" code={`import { Button } from "./ui/button/button.jsx"
import "./ui/button/button.css"

function App() {
  return <Button variant="outline">Click me</Button>
}`} />

      <h3>5. Customise the theme</h3>

      <p>
        Edit <code>van.config.json</code> and regenerate:
      </p>

      <CodeBlock language="bash" code="npx github:parkrw/vanillin build" />

      <p>
        See <a href="#configuration">Configuration</a> for the full
        reference.
      </p>

      <h3>Your edits are safe</h3>

      <p>
        Editing copied files is the point. The CLI refuses to overwrite
        a file you changed — each component gets a{" "}
        <code>.van.json</code> sidecar recording the hash of what was
        written, so it can tell your edits from upstream changes.
        One edited file skips that whole component (a partial update
        would straddle two kit versions); the others in the
        same <code>add</code> still land. Use <code>--overwrite</code>{" "}
        to force, or <code>van diff</code> to see what changed.
      </p>

      <h3>By hand</h3>

      <p>
        The CLI is optional. Copy <code>styles/globals.css</code> and
        import it at your app entry; copy <code>lib/</code> as a
        sibling of <code>ui/</code>; copy the{" "}
        <code>ui/&lt;component&gt;/</code> directories you want and
        import each one's <code>.jsx</code> and <code>.css</code>. You
        lose dependency resolution and edit tracking, nothing else.
      </p>
    </>
  )
}
