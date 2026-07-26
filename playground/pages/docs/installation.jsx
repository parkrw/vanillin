export default function InstallationPage() {
  return (
    <>
      <h2>Installation</h2>

      <p>
        <em>
          [Stub] A CLI (<code>van add &lt;component&gt;</code>) is planned
          and will replace these steps.
        </em>
      </p>

      <p>For now, installation is copying files in:</p>

      <ol>
        <li>
          Copy <code>styles/globals.css</code> and import it once at your app
          entry — it holds every design token.
        </li>
        <li>
          Copy <code>lib/</code> — shared primitives some components import via
          relative paths; keep <code>lib/</code> and <code>ui/</code> as
          siblings.
        </li>
        <li>
          Copy the <code>ui/&lt;component&gt;/</code> folders you want. Each is
          one <code>.jsx</code> plus one <code>.css</code>; import both.
        </li>
      </ol>
    </>
  )
}
