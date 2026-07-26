import { Suspense, useEffect, useState } from "react"
import { withViewTransition } from "../lib/view-transition.js"
import { docs, registry } from "./registry.js"

const sections = [
  { label: "Get started", entries: docs },
  { label: "Components", entries: registry },
]

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1))
  useEffect(() => {
    const onChange = () => {
      const next = window.location.hash.slice(1)
      withViewTransition(() => setHash(next))
    }
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return hash || "introduction"
}

export function App() {
  const route = useHashRoute()
  const [dark, setDark] = useState(false)
  const entry = docs[route] ?? registry[route]

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <div className="pg">
      <nav className="pg-nav">
        <h1>vanillin</h1>
        <button
          className="pg-theme-toggle"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = rect.left + rect.width / 2
            const y = rect.top + rect.height / 2
            withViewTransition(() => setDark((d) => !d), { clipPath: { x, y } })
          }}
        >
          {dark ? "light" : "dark"} mode
        </button>
        {sections.map(({ label, entries }) => (
          <section className="pg-nav-group" key={label} aria-label={label}>
            <div className="pg-nav-label">{label}</div>
            <ul className="pg-nav-list">
              {Object.entries(entries).map(([slug, { title, page }]) => (
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
          </section>
        ))}
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
