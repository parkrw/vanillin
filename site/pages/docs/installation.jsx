export default function InstallationPage() {
  return (
    <>
      <h2>Installation</h2>

      <p>
        Components are copied into your project, not installed from a package.
        The CLI does the copying — it resolves what a component depends on,
        writes the files, and stops. Nothing is imported from vanillin at
        runtime, so there is no version to keep in step and no upgrade that can
        break your app.
      </p>

      <pre>
        <code>{`npx github:parkrw/vanillin init
npx github:parkrw/vanillin add button dialog`}</code>
      </pre>

      <h3>What init does</h3>

      <p>
        It works out where your project keeps things rather than assuming. An
        existing <code>components.json</code> is honoured, with its aliases
        resolved through your <code>tsconfig.json</code> or{" "}
        <code>jsconfig.json</code> <code>compilerOptions.paths</code> — so{" "}
        <code>@/components/ui</code> becomes <code>src/components/ui</code>.
        Failing that, components go in <code>./components/ui</code>. Your{" "}
        <code>package.json</code> decides where stylesheets belong:{" "}
        <code>app/</code> for the Next App Router, <code>src/styles/</code> for
        Vite.
      </p>

      <p>
        The answers are written to <code>van.config.json</code> as{" "}
        <code>paths</code>, <code>framework</code> and <code>rsc</code>, so
        later <code>add</code> calls need no questions. Then it copies{" "}
        <code>globals.css</code> and the two files it imports, and generates
        your <code>van.css</code>. Import both, in this order:
      </p>

      <pre>
        <code>{`import "./styles/globals.css"
import "./styles/van.css"`}</code>
      </pre>

      <h3>What add does</h3>

      <p>
        It resolves the closure: the component, the other components it imports
        (<code>add alert-dialog</code> brings <code>dialog</code> and{" "}
        <code>button</code>), and the <code>lib/</code> primitives those need.
        Under React Server Components — a Next App Router project — the copied
        JSX that calls hooks gets a <code>&quot;use client&quot;</code>{" "}
        directive. The kit&apos;s own files carry none, so bundlers that
        don&apos;t want the directive never see it.
      </p>

      <p>
        <code>--dry-run</code> prints the file list and writes nothing.
      </p>

      <h3>Your edits are safe</h3>

      <p>
        Editing the files you copied is the point of the model, so{" "}
        <code>add</code> refuses to overwrite an edit. It can tell an edit from
        upstream having moved on because each component gets a{" "}
        <code>.van.json</code> sidecar recording the hash of every file you were
        given: a file that still matches that record is safe to update, a file
        that doesn&apos;t is yours. Refusal is per component — one edited file
        skips that whole component, because a half-updated copy would straddle
        two kit versions — and the others in the same <code>add</code> still
        land. <code>--overwrite</code> replaces them anyway, and says what it
        replaced.
      </p>

      <p>
        <code>van diff</code> is the read-only half of the same question. It
        reports which of your files are edited, which the kit has changed since
        you copied them, and which are both, exiting non-zero when anything
        differs so you can run it in CI.
      </p>

      <h3>Commands</h3>

      <ul>
        <li>
          <code>van init</code> — scaffold <code>van.config.json</code> and the
          stylesheets
        </li>
        <li>
          <code>van add &lt;component…&gt;</code> — copy components and their
          dependencies
        </li>
        <li>
          <code>van diff [component]</code> — local edits vs upstream changes
        </li>
        <li>
          <code>van build</code> — regenerate <code>van.css</code> after editing
          the config
        </li>
        <li>
          <code>van list</code> — every component, marking the installed ones
        </li>
      </ul>

      <p>
        Global flags: <code>--cwd &lt;dir&gt;</code>, <code>--yes</code>,{" "}
        <code>--silent</code>, <code>--no-color</code>, <code>--help</code>,{" "}
        <code>--version</code>.
      </p>

      <h3>By hand</h3>

      <p>
        The CLI is a convenience, not a requirement. Copy{" "}
        <code>styles/globals.css</code> and import it once at your app entry;
        copy <code>lib/</code>, keeping it a sibling of <code>ui/</code>; copy
        the <code>ui/&lt;component&gt;/</code> folders you want and import each
        one&apos;s <code>.jsx</code> and <code>.css</code>. You lose the
        dependency resolution and the edit protection, nothing else.
      </p>
    </>
  )
}
