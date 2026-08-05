import { lazy, Suspense, useEffect, useState } from "react"
import { ModeToggle } from "../ui/mode-toggle/mode-toggle.jsx"
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "../ui/breadcrumb/breadcrumb.jsx"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
} from "../ui/navigation-menu/navigation-menu.jsx"
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../ui/command/command.jsx"
import { Button } from "../ui/button/button.jsx"
import { setSiteDark, useSiteDark } from "./color-scheme.js"
import { docs, categories, registry } from "./registry.js"

import "../ui/mode-toggle/mode-toggle.css"
import "../ui/breadcrumb/breadcrumb.css"
import "../ui/navigation-menu/navigation-menu.css"
import "../ui/command/command.css"
import "../ui/button/button.css"

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash.slice(1))
  useEffect(() => {
    const onChange = () => setHash(window.location.hash.slice(1))
    window.addEventListener("hashchange", onChange)
    return () => window.removeEventListener("hashchange", onChange)
  }, [])
  return hash || "home"
}

function categoryForSlug(slug) {
  for (const cat of categories) {
    if (slug in cat.entries) return cat.label
  }
  return null
}

function SearchTrigger({ onClick }) {
  return (
    <Button
      variant="outline"
      className="pg-search-trigger"
      onClick={onClick}
      data-pg="search-trigger"
    >
      <span className="pg-search-trigger-text">Search components...</span>
      <kbd className="pg-search-kbd">
        {/mac/i.test(navigator.userAgent) ? "⌘" : "Ctrl+"}K
      </kbd>
    </Button>
  )
}

function CommandPalette({ open, onOpenChange }) {
  const navigate = (slug) => {
    window.location.hash = slug
    onOpenChange(false)
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} data-pg="cmd-palette">
      <CommandInput placeholder="Search components and docs..." data-pg="cmd-palette-input" />
      <CommandList data-pg="cmd-palette-list">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Get started">
          {Object.entries(docs).map(([slug, { title }]) => (
            <CommandItem key={slug} value={title} onSelect={() => navigate(slug)}>
              {title}
            </CommandItem>
          ))}
        </CommandGroup>
        {categories.map(({ label, entries }) => (
          <CommandGroup key={label} heading={label}>
            {Object.entries(entries).map(([slug, { title }]) => (
              <CommandItem key={slug} value={`${title} ${label}`} onSelect={() => navigate(slug)}>
                {title}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

function TopNav({ dark, onPaletteOpen }) {
  return (
    <header className="pg-topnav">
      <a href="#home" className="pg-logo" data-pg="logo">vanillin</a>

      <NavigationMenu className="pg-topnav-menu">
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink href="#introduction">Docs</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="components">
            <NavigationMenuTrigger>Components</NavigationMenuTrigger>
            <NavigationMenuContent className="pg-topnav-dropdown">
              <ul className="pg-topnav-grid">
                {categories.map(({ label, entries }) => (
                  <li key={label} className="pg-topnav-cat">
                    <div className="pg-topnav-cat-label">{label}</div>
                    <ul className="pg-topnav-cat-list">
                      {Object.entries(entries).slice(0, 6).map(([slug, { title }]) => (
                        <li key={slug}>
                          <NavigationMenuLink href={`#${slug}`} className="pg-topnav-cat-link">
                            {title}
                          </NavigationMenuLink>
                        </li>
                      ))}
                      {Object.keys(entries).length > 6 && (
                        <li>
                          <NavigationMenuLink
                            href={`#${Object.keys(entries)[0]}`}
                            className="pg-topnav-cat-link pg-topnav-cat-more"
                          >
                            +{Object.keys(entries).length - 6} more
                          </NavigationMenuLink>
                        </li>
                      )}
                    </ul>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
        <NavigationMenuViewport />
      </NavigationMenu>

      <div className="pg-topnav-actions">
        <SearchTrigger onClick={onPaletteOpen} />
        <ModeToggle
          className="pg-theme-toggle"
          isDark={dark}
          onIsDarkChange={setSiteDark}
        />
      </div>
    </header>
  )
}

function Sidebar({ route }) {
  const inDocs = route in docs || route === "home"

  if (inDocs) {
    return (
      <nav className="pg-nav" aria-label="Docs navigation">
        <section className="pg-nav-group" aria-label="Get started">
          <div className="pg-nav-label">Get started</div>
          <ul className="pg-nav-list">
            {Object.entries(docs).map(([slug, { title, page }]) => (
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
      </nav>
    )
  }

  return (
    <nav className="pg-nav" aria-label="Components navigation">
      {categories.map(({ label, entries }) => (
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
  )
}

function PageBreadcrumb({ route }) {
  if (route === "home") return null

  const inDocs = route in docs
  const category = !inDocs ? categoryForSlug(route) : null
  const entry = docs[route] ?? registry[route]

  return (
    <Breadcrumb className="pg-breadcrumb">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="#home">Home</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {inDocs ? (
          <BreadcrumbItem>
            <BreadcrumbPage>{entry?.title ?? route}</BreadcrumbPage>
          </BreadcrumbItem>
        ) : (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={`#${Object.keys(registry)[0]}`}>Components</BreadcrumbLink>
            </BreadcrumbItem>
            {category && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href={`#${Object.keys(categories.find(c => c.label === category)?.entries ?? {})[0]}`}>
                    {category}
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{entry?.title ?? route}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

export function App() {
  const route = useHashRoute()
  const dark = useSiteDark()
  const entry = docs[route] ?? registry[route]
  const [paletteOpen, setPaletteOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const isHome = route === "home"

  return (
    <div className="pg">
      <TopNav dark={dark} onPaletteOpen={() => setPaletteOpen(true)} />
      <div className="pg-body">
        {!isHome && <Sidebar route={route} />}
        <main className={isHome ? "pg-main pg-main--home" : "pg-main"}>
          <PageBreadcrumb route={route} />
          {isHome ? (
            <Suspense fallback={null}>
              <HomePage />
            </Suspense>
          ) : entry?.page ? (
            <Suspense fallback={null}>
              <entry.page />
            </Suspense>
          ) : (
            <p>Not built yet.</p>
          )}
        </main>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}

const HomePage = lazy(() => import("./pages/home.jsx"))
