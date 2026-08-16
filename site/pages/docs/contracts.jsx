import { CodeBlock } from "../../code-example.jsx"
import "../../code-example.css"

export default function ContractsPage() {
  return (
    <>
      <h2>Component contracts</h2>

      <p>
        Every installed component carries a manifest recording where it came
        from, what it needs, and what its files hashed to. A conformance
        suite keeps those manifests true. A manifest nobody verifies rots
        into fiction; the suite is what makes the
        recorded <code>requires</code> honest and the recorded hashes
        current.
      </p>

      <h3>The manifest</h3>

      <p>
        One sidecar per component: <code>ui/&lt;slug&gt;/.van.json</code>.
        It travels with the folder, so copying a component into another
        project keeps its provenance.
      </p>

      <CodeBlock language="json" code={`{
  "name": "alert-dialog",
  "kitVersion": "0.1.0",
  "source": "github:parkrw/vanillin@v0.1.0",
  "requires": ["button", "dialog"],
  "files": {
    "alert-dialog.css": "sha256-P51iiZ…",
    "alert-dialog.jsx": "sha256-w+hZbv…"
  }
}`} />

      <p>Five fields, each with a specific role:</p>

      <ul>
        <li>
          <strong><code>name</code></strong>: the component slug, matching
          the directory name under <code>ui/</code>.
        </li>
        <li>
          <strong><code>kitVersion</code></strong>: a single monotonic
          version for the kit. Components release on their own schedule, but
          the version recorded is the kit's. Copy-paste has no escape hatch
          for the diamond problem: npm nests two copies
          in <code>node_modules</code>, but there is exactly
          one <code>ui/table/table.jsx</code> path and one CSS cascade, so a
          single linear history reduces "compatible" to "kitVersion is at
          least N."
        </li>
        <li>
          <strong><code>source</code></strong>: the git remote and tag the
          files came from, for provenance. Not consumed by the CLI at
          runtime, but useful for audit and debugging.
        </li>
        <li>
          <strong><code>requires</code></strong>: other <code>ui/</code>{" "}
          slugs this component imports. Derived from the actual import graph
          (JS <code>from "../slug/..."</code> and CSS{" "}
          <code>@import "../slug/..."</code> edges) by{" "}
          <code>scripts/manifest.mjs</code>. <code>lib/</code> primitives
          and tokens are kit substrate versioned
          by <code>kitVersion</code>, not listed here.
        </li>
        <li>
          <strong><code>files</code></strong>: SRI-style SHA-256 hashes of
          every file in the component directory. This is the load-bearing
          field. It separates "unmodified, safe to overwrite"
          from "customized, must merge." A tool must never overwrite a file
          whose hash no longer matches without explicit confirmation;
          refusing to update beats destroying a customization.
        </li>
      </ul>

      <p>
        <strong>Unknown fields survive.</strong> Regenerating a manifest
        preserves fields it does not recognize; an older tool must not
        destroy what a newer one wrote.
      </p>

      <p>
        <strong>Provenance only.</strong> Theming lives
        in <code>van.config.json</code>. A theme split across sixty sidecars
        has no single place to read it.
      </p>

      <p>
        <strong>This is an install-time boundary, not a runtime
        one.</strong> Nothing stops <code>ui/button</code> from
        importing <code>ui/tooltip</code> at runtime regardless of
        what <code>requires</code> says. The manifest is a lint contract in
        the sense of Go's <code>vendor/modules.txt</code>, not enforced
        isolation. The conformance suite is what catches the drift.
      </p>

      <h3>How hashes drive the CLI</h3>

      <p>
        Three hashes decide everything for a given file: what you have on
        disk, what was recorded in <code>.van.json</code> when you installed
        it, and what the current kit ships. Without the recorded middle
        hash, "differs" would be ambiguous: is it your edit, or did the kit
        move forward?
      </p>

      <p>
        The CLI classifies every file into one of these states:
      </p>

      <ul>
        <li>
          <strong>missing</strong>: the file does not exist locally.
        </li>
        <li>
          <strong>identical</strong>: your file matches the current kit
          byte-for-byte. Nothing to do.
        </li>
        <li>
          <strong>unmodified</strong>: your file matches the recorded hash
          (you have not edited it), but the kit has moved on. Safe to
          overwrite.
        </li>
        <li>
          <strong>edited</strong>: your file differs from the recorded hash.
          You changed it. The CLI refuses to overwrite without{" "}
          <code>--overwrite</code>.
        </li>
      </ul>

      <p>
        <code>van add</code> uses this classification to decide what is safe
        to write. When any file in a component is <code>edited</code>, the
        entire component is skipped, because a partial update would leave one
        copy straddling two kit versions. Other components in the same batch
        still land.
      </p>

      <p>
        <code>van diff</code> adds two more states to the
        picture: <strong>upstream-changed</strong> (you have not touched
        the file, but the kit updated
        it) and <strong>diverged</strong> (both sides changed). It reports
        per file and exits non-zero when anything differs, so it works
        as a CI drift check.
      </p>

      <CodeBlock language="bash" code={`van diff
# button (installed from v0.1.0)
#   button.jsx: up to date
#   button.css: edited locally

van diff --all    # include unchanged files in output`} />

      <p>
        <code>van update</code> merges upstream changes into installed
        components. Unmodified files are overwritten directly. Files where
        both sides changed go through a 3-way merge
        using <code>git merge-file</code>: clean merges land automatically,
        conflicts get markers for you to resolve. The manifest is updated
        with new hashes after a successful merge.
        See <a href="#cli">CLI</a> for the full command reference.
      </p>

      <h3>Three registries</h3>

      <p>
        Three files track components. They answer different questions and are
        easy to confuse:
      </p>

      <ul>
        <li>
          <strong><code>ui/&lt;slug&gt;/.van.json</code></strong>, generated
          by <code>scripts/manifest.mjs</code>. Per-copy provenance and file
          hashes, so <code>van diff</code> can tell kit changes from consumer
          edits. Travels with the component directory.
        </li>
        <li>
          <strong><code>registry.json</code></strong>, generated
          by <code>scripts/build-registry.mjs</code>. The graph the CLI
          resolves an <code>add</code> closure from: file lists, component
          dependencies, and <code>lib/</code> dependency edges, keyed by
          slug. This is what <code>van add button</code> reads to know that
          button needs no other components but does need certain{" "}
          <code>lib/</code> files.
        </li>
        <li>
          <strong><code>site/registry.js</code></strong>, hand-written. Docs
          nav structure and <code>lazy()</code> page imports. This is the
          docs site's component catalogue, not consumed by the CLI at all.
        </li>
      </ul>

      <p>
        Both generated files derive <code>requires</code> from the
        same <code>deriveRequires()</code>
        in <code>scripts/manifest.mjs</code>, so the upstream graph and
        consumer copies cannot disagree about what a component depends on.
      </p>

      <p>
        Tooling: <code>node scripts/manifest.mjs</code> reports stale
        manifests; <code>--write</code> regenerates them (idempotent).{" "}
        <code>npm run contracts</code> runs both manifest and registry
        generation. Run it after any <code>ui/</code> edit, or conformance
        fails on stale hashes.
      </p>

      <h3>Conformance</h3>

      <p>
        <code>tests/conformance.unit.mjs</code> runs as part
        of <code>npm test</code> and walks every <code>ui/*/</code>
        directory. It enforces the conventions statically so they cannot
        drift. Every failure names the offending file, the rule, and what
        to fix. New exceptions go in reasoned allowlists at the top of the
        file, never by weakening a rule.
      </p>

      <p>The rules it enforces:</p>

      <ul>
        <li>
          <strong>Tokens only.</strong> No hex colours, no
          raw <code>rgb()</code> or <code>hsl()</code> in CSS property
          values. No <code>--shadow-xs</code> (use{" "}
          <code>--shadow-sm</code>). Colour must come from design tokens
          in <code>globals.css</code>.
        </li>
        <li>
          <strong>Motion via tokens.</strong> Transitions and animations
          use <code>var(--motion-fast)</code>{" "}
          or <code>var(--motion-medium)</code> for duration and{" "}
          <code>var(--motion-ease)</code> for easing. Hard-coded durations
          and easings are rejected. The one exception is indeterminate
          loops (spinners, skeleton pulses): those must use a fixed literal
          and must not reference motion tokens, because they must not track{" "}
          <code>--motion-scale</code>.
        </li>
        <li>
          <strong>Block class naming.</strong> The CSS file defines a class
          matching the directory slug (<code>.accordion</code>{" "}
          in <code>ui/accordion/</code>). Components that intentionally
          diverge (like <code>button</code> using <code>.btn</code>, or
          re-export wrappers like <code>alert-dialog</code>) are listed in
          an allowlist with a reason.
        </li>
        <li>
          <strong>Demo page and registry entry.</strong> Every slug
          has <code>site/pages/&lt;slug&gt;.jsx</code> and a matching entry
          in <code>site/registry.js</code>. No two entries may resolve to the
          same page module (shared page modules hid bugs in the past).
        </li>
        <li>
          <strong>Browser tests for interactive components.</strong> Every
          component that is not purely presentational needs a{" "}
          <code>tests/&lt;slug&gt;.test.mjs</code>. Static components
          (buttons, cards, badges) are listed in an allowlist with a reason.
        </li>
        <li>
          <strong>Manifest freshness.</strong> Every <code>ui/</code> dir
          has a <code>.van.json</code>, the files map matches what is on disk
          (no missing or extra entries), file hashes are current,{" "}
          <code>requires</code> matches what <code>deriveRequires()</code>{" "}
          computes from the actual imports, and <code>kitVersion</code>{" "}
          matches <code>package.json</code>.
        </li>
        <li>
          <strong>No dependency cycles.</strong> The{" "}
          <code>requires</code> graph is checked for cycles with a DFS.
        </li>
        <li>
          <strong>Props rest.</strong> Exported function components
          destructure with a <code>...rest</code> element and spread it on
          the root. Without this, <code>id</code> and <code>aria-*</code>{" "}
          props passed to a component would be silently dropped. Provider
          components that render no DOM node of their own are exempted.
        </li>
      </ul>

      <h3>Adding a component that passes</h3>

      <ol>
        <li>
          Create <code>ui/&lt;slug&gt;/&lt;slug&gt;.jsx</code> and{" "}
          <code>&lt;slug&gt;.css</code>. Block class
          is <code>.&lt;slug&gt;</code>, variants use{" "}
          <code>--modifier</code> suffix, subparts use{" "}
          <code>.&lt;slug&gt;-part</code>. Use tokens from{" "}
          <code>globals.css</code> only. Exported components
          take <code>...props</code> and spread them on the root element.
        </li>
        <li>
          Create a demo page
          at <code>site/pages/&lt;slug&gt;.jsx</code> and add a{" "}
          <code>lazy()</code> entry in <code>site/registry.js</code>. The
          demo page is the docs page: it carries the prose and doubles as the
          test fixture.
        </li>
        <li>
          If the component is interactive, add{" "}
          <code>tests/&lt;slug&gt;.test.mjs</code>. Assert the precondition
          alongside the effect: a computed style that is true of the wrong
          state too proves nothing.
        </li>
        <li>
          Run <code>node scripts/manifest.mjs --write</code> to generate the{" "}
          <code>.van.json</code> sidecar, then <code>npm test</code>.
          Conformance tells you exactly what is missing.
        </li>
      </ol>

      <CodeBlock language="bash" code={`# Generate manifest and registry, then verify
npm run contracts
npm test`} />
    </>
  )
}
