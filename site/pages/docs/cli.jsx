import { CodeBlock } from "../../code-example.jsx"
import "../../code-example.css"

export default function CliPage() {
  return (
    <>
      <h2>CLI</h2>

      <p>
        <code>van</code> copies components into your project. It resolves
        dependencies, writes files, and stops; nothing is imported from
        vanillin at runtime. Node 18+ stdlib only, no dependencies.
      </p>

      <CodeBlock language="bash" code="van <command> [options]" />

      <p>
        Install with <code>npm i -D github:parkrw/vanillin</code> to
        get the <code>van</code> command in your project. For a one-off
        run without installing,{" "}
        <code>npx github:parkrw/vanillin &lt;command&gt;</code> works
        the same.
      </p>

      <h3>init</h3>

      <p>
        Scaffold <code>van.config.json</code> and the base stylesheets.
        Detects your framework from <code>package.json</code> and
        resolves path aliases from <code>tsconfig.json</code> /{" "}
        <code>jsconfig.json</code>. An
        existing <code>components.json</code> from shadcn is honoured.
      </p>

      <CodeBlock language="bash" code="van init" />

      <p>
        Writes <code>van.config.json</code> with detected{" "}
        <code>framework</code>, <code>rsc</code>, and{" "}
        <code>paths</code>. Copies <code>globals.css</code>,{" "}
        <code>defaults.css</code>, and <code>forced-colors.css</code>{" "}
        into your styles directory. Generates an
        initial <code>van.css</code> from the config.
      </p>

      <p>
        Under React Server Components (Next App Router), components
        that call hooks get a <code>"use client"</code> directive
        injected automatically. The kit's own files carry none, so
        bundlers that don't need the directive never see it.
      </p>

      <h3>add</h3>

      <p>
        Copy one or more components and their transitive dependencies.
        Slugs are validated against the registry; unknown names fail
        immediately.
      </p>

      <CodeBlock language="bash" code={`van add button dialog card
van add --all          # every component you don't have yet
van add --dry-run      # print what would be written, write nothing`} />

      <p>
        Run bare <code>van add</code> in a terminal for an interactive
        picker: arrow keys to move, space to toggle, <code>a</code>{" "}
        to select all, enter to confirm, <code>q</code> to cancel.
      </p>

      <p>
        <code>--all</code> makes the same choice without the picker, so it
        also works in a script or a CI job with no terminal to draw one. It
        takes no slugs, and covers only what you are missing unless you add{" "}
        <code>--overwrite</code>, which brings installed components down
        again as well. <code>--yes</code> is the older spelling and behaves
        identically.
      </p>

      <p>
        Each component gets a <code>.van.json</code> sidecar recording
        hashes of the files that were written. If a file has been edited
        since it was copied, <code>add</code> refuses to overwrite it:
        one edited file skips that entire component (a partial update
        would straddle two kit versions), while the rest of the batch
        still lands. Use <code>--overwrite</code> to force.
      </p>

      <h3>diff</h3>

      <p>
        Compare installed components against the kit. Reports which
        files you edited, which the kit changed since you copied them,
        and which are both. Exits non-zero when anything differs, so it
        works as a CI drift check.
      </p>

      <CodeBlock language="bash" code={`van diff              # all installed components
van diff button       # one component
van diff --all        # include unchanged files in output`} />

      <p>
        File states: <strong>edited locally</strong> (your hash differs
        from recorded), <strong>upstream changed</strong> (kit moved
        on, you haven't touched it), <strong>diverged</strong> (both
        sides changed), <strong>current</strong> (matches the kit).
      </p>

      <h3>update</h3>

      <p>
        Merge upstream changes into installed components. Unmodified
        files are overwritten directly. Files where both sides changed
        go through a 3-way merge using <code>git merge-file</code>:
        clean merges land automatically, conflicts get markers for you
        to resolve.
      </p>

      <CodeBlock language="bash" code={`van update            # all installed components
van update button     # one component
van update --overwrite  # replace even your edited files`} />

      <h3>build</h3>

      <p>
        Regenerate <code>van.css</code>{" "}
        from <code>van.config.json</code>. Run this after editing the
        config.
      </p>

      <CodeBlock language="bash" code="van build" />

      <p>
        See <a href="#configuration">Configuration</a> for the full
        config reference.
      </p>

      <h3>list</h3>

      <p>
        Print every component in the registry, marking installed ones
        with a checkmark. Shows dependency information for each.
      </p>

      <CodeBlock language="bash" code="van list" />

      <h3>Global flags</h3>

      <ul>
        <li><code>--cwd &lt;dir&gt;</code>: run against a different directory</li>
        <li><code>--all</code>: every component (add); include unchanged files (diff)</li>
        <li><code>--dry-run</code>: print what would be written, write nothing (add, update)</li>
        <li><code>--overwrite</code>: replace files you have edited (add, update)</li>
        <li><code>--yes</code>: assume yes for prompts</li>
        <li><code>--silent</code>: suppress non-error output</li>
        <li><code>--no-color</code>: disable ANSI colour</li>
        <li><code>--help</code>, <code>--version</code></li>
      </ul>
    </>
  )
}
