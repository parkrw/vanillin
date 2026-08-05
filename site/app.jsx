import { Suspense, useEffect, useState } from "react"
import { ModeToggle } from "../ui/mode-toggle/mode-toggle.jsx"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "../ui/breadcrumb/breadcrumb.jsx"
import { setSiteDark, useSiteDark } from "./color-scheme.js"
import { docs, registry } from "./registry.js"

import "../ui/mode-toggle/mode-toggle.css"
import "../ui/breadcrumb/breadcrumb.css"

const sections = [
  { label: "Get started", entries: docs },
  { label: "Components", entries: registry },
]

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1))
  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1))
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return hash || "introduction"
}

export function App() {
  const route = useHashRoute()
  const dark = useSiteDark()
  const entry = docs[route] ?? registry[route]

  return (
    <div className="pg">
      <nav className="pg-nav">
        <h1>vanillin</h1>
        <ModeToggle
          className="pg-theme-toggle"
          isDark={dark}
          onIsDarkChange={setSiteDark}
        />
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
        <Breadcrumb className="pg-breadcrumb">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href={`#${route in docs ? "introduction" : Object.keys(registry)[0]}`}>
                {route in docs ? "Get started" : "Components"}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{entry?.title ?? route}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
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
