import { Suspense, useEffect, useState } from "react"
import { registry } from "./registry.js"

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1))
  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1))
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return hash || "primitives"
}

export function App() {
  const route = useHashRoute()
  const [dark, setDark] = useState(false)
  const entry = registry[route]

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <div className="pg">
      <nav className="pg-nav">
        <h1>vanillin</h1>
        <button className="pg-theme-toggle" onClick={() => setDark((d) => !d)}>
          {dark ? "light" : "dark"} mode
        </button>
        <ul className="pg-nav-list">
          {Object.entries(registry).map(([slug, { title, page }]) => (
            <li key={slug}>
              <a
                className="pg-nav-link"
                href={`#${slug}`}
                data-active={route === slug}
                data-todo={!page}
              >
                {title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="pg-main">
        {entry?.page ? (
          <Suspense fallback={null}>
            <entry.page />
          </Suspense>
        ) : (
          <p>Not built yet.</p>
        )}
      </main>
    </div>
  )
}
