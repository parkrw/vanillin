import { CodeBlock } from "./code-example.jsx"
import "./code-example.css"
import registryData from "../registry.json"

export function InstallSnippet({ slug }) {
  const command = `van add ${slug}`
  const requires = registryData.components?.[slug]?.requires ?? []

  return (
    <div className="pg-install">
      <CodeBlock code={command} language="bash" className="pg-install-block" />
      {requires.length > 0 && (
        <p className="pg-install-deps">
          Requires: {requires.map((dep, i) => (
            <span key={dep}>
              {i > 0 && ", "}
              <a href={`#${dep}`}>{dep}</a>
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
