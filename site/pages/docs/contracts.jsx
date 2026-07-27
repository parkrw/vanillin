export default function ContractsPage() {
  return (
    <>
      <h2>Component contracts</h2>

      <p>
        Every installed component carries a manifest recording where it came
        from, what it needs, and what its files hashed to &mdash; and a
        conformance suite keeps those manifests true. A manifest nobody
        verifies rots into fiction; the suite is what makes the recorded
        <code> requires</code> honest.
      </p>

      <h3>The manifest</h3>

      <p>
        One sidecar per component: <code>ui/&lt;slug&gt;/.van.json</code>. It
        travels with the folder, so copying a component into another project
        keeps its provenance &mdash; that is the copy-paste property.
      </p>

      <pre>
{`{
  "name": "data-table",
  "kitVersion": "0.1.0",
  "source": "github:parkrw/vanillin@v0.1.0",
  "requires": ["badge", "button", "command", "popover",
               "scroll-area", "separator", "table"],
  "files": {
    "data-table.jsx": "sha256-…",
    "data-table.css": "sha256-…"
  }
}`}
      </pre>

      <ul>
        <li>
          <strong><code>files</code> hashes are the load-bearing field.</strong>{" "}
          They separate &ldquo;unmodified, safe to overwrite&rdquo; from
          &ldquo;customized, must merge&rdquo;. A tool must never overwrite a
          file whose hash no longer matches without explicit confirmation
          &mdash; refusing to update beats destroying a customization.
        </li>
        <li>
          <strong><code>requires</code> lists other <code>ui/</code> slugs
          only.</strong> <code>lib/</code> primitives and tokens are kit
          substrate, versioned by <code>kitVersion</code>, not per component.
        </li>
        <li>
          <strong>One monotonic <code>kitVersion</code>.</strong> Components
          release on their own schedule, but the version recorded is the
          kit&rsquo;s. Copy-paste has no escape hatch for the diamond problem
          &mdash; npm nests two copies in <code>node_modules</code>, but there
          is exactly one <code>ui/table/table.jsx</code> path and one CSS
          cascade &mdash; so a single linear history reduces
          &ldquo;compatible&rdquo; to &ldquo;kitVersion &ge; N&rdquo;.
        </li>
        <li>
          <strong>Unknown fields survive.</strong> Regenerating a manifest
          preserves fields it does not recognize; an older tool must not
          destroy what a newer one wrote.
        </li>
        <li>
          <strong>Provenance only.</strong> Theming lives in{" "}
          <code>van.config.json</code> &mdash; a theme split across sixty
          sidecars has no single place to read it.
        </li>
      </ul>

      <p>
        <strong>This is an install-time boundary, not a runtime one.</strong>{" "}
        Nothing stops <code>ui/button</code> importing <code>ui/tooltip</code>{" "}
        at runtime whatever <code>requires</code> says &mdash; the manifest is
        a lint contract in the sense of Go&rsquo;s{" "}
        <code>vendor/modules.txt</code>, not enforced isolation. The
        conformance suite is what catches the drift.
      </p>

      <p>
        Tooling: <code>node scripts/manifest.mjs</code> reports stale
        manifests; <code>--write</code> regenerates them (idempotent). Hashes
        going stale on a hand-edited component is the signal, not a failure of
        the format &mdash; it is what <code>van update</code> will use to
        decide merge-vs-overwrite.
      </p>

      <h3>Conformance</h3>

      <p>
        <code>tests/conformance.unit.mjs</code> runs as part of{" "}
        <code>npm test</code> and walks every <code>ui/*/</code>: tokens only
        (no hex, no raw <code>rgb()</code>/<code>hsl()</code>, no{" "}
        <code>--shadow-xs</code>); motion via <code>var(--motion-*)</code>{" "}
        except indeterminate loops, which must use a fixed literal and never a
        motion token; block class matches the slug; a demo page and a unique
        registry module per slug; browser tests for interactive components;
        exported components spread a props rest (so a cloned{" "}
        <code>id</code>/<code>aria-*</code> cannot vanish silently); and the
        actual import graph &mdash; JS and CSS <code>@import</code> edges
        &mdash; matches every manifest&rsquo;s <code>requires</code>, with a
        cycle check. Deliberate exceptions live in reasoned allowlists at the
        top of the file; every failure names the file, the rule, and the fix.
      </p>

      <h3>Adding a component that passes</h3>

      <ol>
        <li>
          <code>ui/&lt;slug&gt;/&lt;slug&gt;.jsx</code> +{" "}
          <code>.css</code>; block class <code>.&lt;slug&gt;</code>, variants{" "}
          <code>--modifier</code>, subparts <code>.&lt;slug&gt;-part</code>;
          tokens only; exported components take <code>...props</code> and
          spread them on the root (or forward them to the interactive part
          when the root renders no DOM node, like Select).
        </li>
        <li>
          Demo page <code>site/pages/&lt;slug&gt;.jsx</code> (it is the
          docs page &mdash; carry the prose) and its own{" "}
          <code>site/registry.js</code> entry &mdash; never a shared
          page module.
        </li>
        <li>
          <code>tests/&lt;slug&gt;.test.mjs</code> for anything interactive.
          Assert the precondition alongside the effect &mdash; a computed
          style that is also true of the wrong value proves nothing (a pinned
          column once asserted <code>inset-inline-start: 0px</code>, which
          held for <code>position: relative</code> too; the test now asserts{" "}
          <code>scrollLeft &gt; 0</code> first).
        </li>
        <li>
          <code>node scripts/manifest.mjs --write</code>, then{" "}
          <code>npm test</code> &mdash; conformance tells you exactly what is
          missing.
        </li>
      </ol>
    </>
  )
}
