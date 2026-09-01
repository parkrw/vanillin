import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { TableOfContents } from "./toc.jsx"
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
import { docs, docsGroups, categories, registry } from "./registry.js"

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
        {docsGroups.map(({ label, entries }) => (
          <CommandGroup key={label} heading={label}>
            {Object.entries(entries).map(([slug, { title, page }]) => (
              <CommandItem key={slug} value={title} disabled={!page} onSelect={() => navigate(slug)}>
                {title}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
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

function useScrolled() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])
  return scrolled
}

function DocsGroupItem({ group: { label, entries } }) {
  return (
    <NavigationMenuItem value={label}>
      <NavigationMenuTrigger>{label}</NavigationMenuTrigger>
      <NavigationMenuContent>
        <ul className="pg-menu-list">
          {Object.entries(entries).map(([slug, { title, desc, page }]) => (
            <li key={slug}>
              <NavigationMenuLink href={`#${slug}`} className="pg-menu-link" data-todo={!page}>
                <span className="pg-menu-link-title">{title}</span>
                <span className="pg-menu-link-desc">{desc}</span>
              </NavigationMenuLink>
            </li>
          ))}
        </ul>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

function TopNav({ dark, onPaletteOpen }) {
  const scrolled = useScrolled()

  return (
    <header className="pg-topnav" data-scrolled={scrolled}>
      <a href="#home" className="pg-logo" data-pg="logo">vanillin</a>

      <NavigationMenu className="pg-topnav-menu">
        <NavigationMenuList>
          <DocsGroupItem group={docsGroups[0]} />
          <NavigationMenuItem value="components">
            <NavigationMenuTrigger>Components</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="pg-menu-list pg-menu-list--grid">
                {categories.map(({ label, desc, entries }) => (
                  <li key={label}>
                    <NavigationMenuLink
                      href={`#${Object.keys(entries)[0]}`}
                      className="pg-menu-link"
                    >
                      <span className="pg-menu-link-title">
                        {label}
                        <span className="pg-menu-link-count">{Object.keys(entries).length}</span>
                      </span>
                      <span className="pg-menu-link-desc">{desc}</span>
                    </NavigationMenuLink>
                  </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <DocsGroupItem group={docsGroups[1]} />
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

function NavLinkList({ entries, route }) {
  return (
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
  )
}

const SIDEBAR_MIN = 180
const SIDEBAR_MAX = 400
const SIDEBAR_DEFAULT = 230

function Sidebar({ route }) {
  const [openCats, setOpenCats] = useState(() => {
    const initial = new Set()
    const cat = categoryForSlug(route)
    if (cat) initial.add(cat)
    return initial
  })
  const [width, setWidth] = useState(() => {
    const stored = Number(localStorage.getItem("pg-sidebar-width"))
    return stored >= SIDEBAR_MIN && stored <= SIDEBAR_MAX ? stored : SIDEBAR_DEFAULT
  })
  const widthRef = useRef(width)

  useEffect(() => {
    const cat = categoryForSlug(route)
    if (cat) {
      setOpenCats(prev => {
        if (prev.has(cat)) return prev
        const next = new Set(prev)
        next.add(cat)
        return next
      })
    }
  }, [route])

  const toggleCat = (label) => {
    setOpenCats(prev => {
      const next = new Set(prev)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })
  }

  const startResize = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = widthRef.current
    const onMove = (ev) => {
      const next = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, startWidth + ev.clientX - startX))
      widthRef.current = next
      setWidth(next)
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      document.body.style.removeProperty("cursor")
      document.body.style.removeProperty("user-select")
      localStorage.setItem("pg-sidebar-width", String(widthRef.current))
    }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  return (
    <aside className="pg-sidebar" style={{ width }}>
      <nav className="pg-nav" aria-label="Docs navigation">
        <section className="pg-nav-group" aria-label="Get started">
          <div className="pg-nav-label">Get started</div>
          <NavLinkList entries={docsGroups[0].entries} route={route} />
        </section>

        <section className="pg-nav-group" aria-label="Components">
          <div className="pg-nav-label">Components</div>
          {categories.map(({ label, entries }) => {
            const isOpen = openCats.has(label)
            return (
              <div key={label} className="pg-nav-cat" data-open={isOpen}>
                <button
                  className="pg-nav-cat-btn"
                  onClick={() => toggleCat(label)}
                  data-active={route in entries}
                  aria-expanded={isOpen}
                >
                  {label}
                  <svg
                    className="pg-nav-cat-chevron"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M3 4.5 6 7.5 9 4.5" />
                  </svg>
                </button>
                <div className="pg-nav-cat-items">
                  <NavLinkList entries={entries} route={route} />
                </div>
              </div>
            )
          })}
        </section>

        <section className="pg-nav-group" aria-label="Docs">
          <div className="pg-nav-label">Docs</div>
          <NavLinkList entries={docsGroups[1].entries} route={route} />
        </section>
      </nav>
      <div
        className="pg-sidebar-handle"
        onPointerDown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize sidebar"
        data-pg="sidebar-handle"
      />
    </aside>
  )
}

function PageBreadcrumb({ route }) {
  if (route === "home" || route === "console" || route === "order") return null

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

  // The window is the scroll container now (sticky topnav needs it) — hash
  // routing alone never resets it between pages.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [route])

  const isHome = route === "home"
  const isConsole = route === "console"
  const isOrder = route === "order"
  const fullBleed = isHome || isConsole || isOrder

  return (
    <div className="pg">
      <TopNav dark={dark} onPaletteOpen={() => setPaletteOpen(true)} />
      <div className="pg-body">
        {!fullBleed && <Sidebar route={route} />}
        <main
          className={
            isConsole ? "pg-main pg-main--console"
            : isOrder ? "pg-main pg-main--order"
            : isHome ? "pg-main pg-main--home"
            : "pg-main"
          }
        >
          <PageBreadcrumb route={route} />
          {isHome ? (
            <Suspense fallback={null}>
              <HomePage />
            </Suspense>
          ) : isConsole ? (
            <Suspense fallback={null}>
              <ConsolePage />
            </Suspense>
          ) : isOrder ? (
            <Suspense fallback={null}>
              <OrderPage />
            </Suspense>
          ) : entry?.page ? (
            <Suspense fallback={null}>
              <entry.page />
            </Suspense>
          ) : (
            <p>Not built yet.</p>
          )}
        </main>
        {!fullBleed && <TableOfContents route={route} />}
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  )
}

const HomePage = lazy(() => import("./pages/home.jsx"))
const ConsolePage = lazy(() => import("./showcase/console/index.jsx"))
const OrderPage = lazy(() => import("./showcase/order/index.jsx"))
