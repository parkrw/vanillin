import { useEffect, useRef, useState } from "react"
import { Avatar, AvatarFallback } from "../../../ui/avatar/avatar.jsx"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../ui/collapsible/collapsible.jsx"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../../../ui/dropdown-menu/dropdown-menu.jsx"
import { ModeToggle } from "../../../ui/mode-toggle/mode-toggle.jsx"
import { Separator } from "../../../ui/separator/separator.jsx"
import { toast } from "../../../ui/toast/toast.jsx"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../ui/tooltip/tooltip.jsx"
import { NAV_GROUPS, OVERVIEW, PROJECTS, REGIONS } from "../console-data.js"
import { BellIcon, CATEGORY_ICONS, CartIcon, ChevronDownIcon, ChevronsLeftIcon, ChevronsRightIcon, KeyIcon, SearchIcon, serviceIcon } from "../icons.jsx"
import { Tip, fakeTask } from "../shared.jsx"
import "../../../ui/avatar/avatar.css"
import "../../../ui/collapsible/collapsible.css"
import "../../../ui/dropdown-menu/dropdown-menu.css"
import "../../../ui/mode-toggle/mode-toggle.css"
import "../../../ui/separator/separator.css"
import "../../../ui/toast/toast.css"
import "../../../ui/tooltip/tooltip.css"

/* The console's own toggle only rocks its lamp; the site's navbar owns the scheme. */
const THEME_HINT = "Change the theme in the vanillin navbar at the top of the page"
/* The site owns the palette chord (site/app.jsx), so this search behaves like
   the vanillin site's own: same chord, same palette. The label follows the
   platform the same way site/app.jsx does — ⌘ on a Mac, Ctrl+ elsewhere. */
const searchHint = () =>
  `Search behaves as it does on the vanillin site — press ${
    /mac/i.test(navigator.userAgent) ? "⌘" : "Ctrl+"
  }K anywhere`

function ContextPill({ label, value, options, onChange, menuLabel }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="ck-pill">
        <span className="ck-pill-label">{label}</span>
        {value}
        <span className="ck-pill-caret" aria-hidden="true">
          <ChevronDownIcon />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="ck-pill-menu">
        {menuLabel && (
          <>
            <DropdownMenuLabel>{menuLabel}</DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuRadioGroup value={value} onValueChange={onChange}>
          {options.map((opt) => (
            <DropdownMenuRadioItem key={opt} value={opt}>{opt}</DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function ConsoleTopbar({ project, setProject, region, setRegion, orderHref, onOpenPalette }) {
  const hint = searchHint()
  /* addToast never collapses ids — a repeated id would leave several toasts
     sharing one, and dismiss filters on equality, so it would then clear them
     all. Keep the last id and dismiss it instead, so repeated clicks show one
     hint rather than a stack. */
  const lastHint = useRef(null)
  // Decorative only: the lamp flips, the page theme never moves.
  const [moon, setMoon] = useState(false)
  return (
    <header className="ck-topbar">
      <div className="ck-brand">
        <span className="ck-brand-mark"><KeyIcon /></span>
        <span className="ck-brand-name">Acme Cloud</span>
        <span className="ck-brand-app">Console</span>
      </div>
      <Tip label={hint} side="bottom">
        <button
          type="button"
          className="ck-search"
          aria-describedby="ck-search-hint"
          onClick={() => {
            onOpenPalette()
            if (lastHint.current) toast.dismiss(lastHint.current)
            lastHint.current = toast(hint)
          }}
        >
          <SearchIcon />
          <span>Search resources...</span>
        </button>
      </Tip>
      {/* Tooltip carries the hint for pointer users, but ui/tooltip puts
          aria-describedby on its trigger span, which is not focusable — so a
          keyboard user tabbing to the button would hear nothing without this. */}
      <span id="ck-search-hint" className="ck-sr-only">{hint}</span>
      <div className="ck-topbar-right">
        <ContextPill label="Project" value={project} options={PROJECTS} onChange={setProject} menuLabel="Switch project" />
        <ContextPill label="Region" value={region} options={REGIONS} onChange={setRegion} />
        <a className="ck-topbar-order" href={orderHref}>
          <CartIcon />
          <span>Order a VDC</span>
        </a>
        <Tip label={THEME_HINT} side="bottom">
          <ModeToggle
            className="ck-topbar-btn ck-theme-toggle"
            isDark={moon}
            onIsDarkChange={(dark) => {
              setMoon(dark)
              toast(THEME_HINT)
            }}
            labels={{ toDark: "Switch to dark theme", toLight: "Switch to light theme" }}
          />
        </Tip>
        <Tooltip>
          <TooltipTrigger
            className="ck-topbar-btn ck-bell"
            aria-label="Notifications, 1 unread"
            onClick={() => toast.info("2 alarms firing", { description: "compute-node-down, storage-capacity-high" })}
          >
            <BellIcon />
            <span className="ck-topbar-badge" />
          </TooltipTrigger>
          <TooltipContent side="bottom">Notifications</TooltipContent>
        </Tooltip>
        <DropdownMenu>
          <DropdownMenuTrigger className="ck-topbar-user">
            <Avatar className="ck-user-avatar"><AvatarFallback>PW</AvatarFallback></Avatar>
            <span>pwilliams</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>ops@acme.cloud</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => fakeTask("Rotate API key", "New key delivered to your inbox")}>
              Rotate API key
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => toast("Signed out of the demo", { description: "Not really. It is a showcase." })}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

/* ── Primary rail: Overview + the categories, one row each ───────────── */

export function PriRail({ category, collapsed, onNavigate, onToggleCollapse }) {
  const isActive = (cat) => cat.id === category.id
  // Land on the first plain service, never a site: arriving at a category
  // should not force one of its folds open before the reader asks.
  const go = (cat) => onNavigate((cat.items.find((s) => !s.collapsible) ?? cat.items[0]).id)
  const OverviewIcon = CATEGORY_ICONS.overview

  if (collapsed) {
    return (
      <nav className="ck-pri ck-rail--collapsed" aria-label="Console services">
        <div className="ck-rail-head">
          <Tooltip>
            <TooltipTrigger
              className="ck-rail-btn"
              data-active={isActive(OVERVIEW) || undefined}
              onClick={() => go(OVERVIEW)}
              aria-label="Overview"
            >
              <OverviewIcon />
            </TooltipTrigger>
            <TooltipContent side="right">Overview</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger className="ck-rail-btn" onClick={onToggleCollapse} aria-label="Expand sidebar">
              <ChevronsRightIcon />
            </TooltipTrigger>
            <TooltipContent side="right">Expand sidebar</TooltipContent>
          </Tooltip>
        </div>
        {NAV_GROUPS.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id]
          return (
            <Tooltip key={cat.id}>
              <TooltipTrigger
                className="ck-rail-item"
                data-active={isActive(cat) || undefined}
                onClick={() => go(cat)}
              >
                <Icon />
                <span className="ck-rail-label">{cat.label}</span>
              </TooltipTrigger>
              <TooltipContent side="right">{cat.label}</TooltipContent>
            </Tooltip>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="ck-pri ck-nav" aria-label="Console services">
      <Tooltip>
        <TooltipTrigger className="ck-rail-toggle" onClick={onToggleCollapse} aria-label="Collapse sidebar">
          <ChevronsLeftIcon />
        </TooltipTrigger>
        <TooltipContent side="right">Collapse sidebar</TooltipContent>
      </Tooltip>
      <button
        type="button"
        className="ck-nav-link ck-nav-overview"
        data-active={isActive(OVERVIEW) || undefined}
        onClick={() => go(OVERVIEW)}
      >
        <span className="ck-nav-icon"><OverviewIcon /></span>
        <span className="ck-nav-text">Overview</span>
      </button>
      <Separator decorative className="ck-nav-sep" />
      {NAV_GROUPS.map((cat) => {
        const Icon = CATEGORY_ICONS[cat.id]
        return (
          <button
            key={cat.id}
            type="button"
            className="ck-nav-link ck-nav-cat"
            data-active={isActive(cat) || undefined}
            onClick={() => go(cat)}
          >
            <span className="ck-nav-icon"><Icon /></span>
            <span className="ck-nav-text">{cat.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

/* ── Secondary rail: the services of the selected category ───────────── */

export function SecRail({ category, svc, page, collapsed, onNavigate, onToggleCollapse }) {
  // Landing on a vDC opens its site; nothing else closes one.
  const [openSites, setOpenSites] = useState(() => new Set())
  const activeSite = svc.collapsible ? svc.id : null
  useEffect(() => {
    if (activeSite) setOpenSites((prev) => (prev.has(activeSite) ? prev : new Set(prev).add(activeSite)))
  }, [activeSite])
  const toggleSite = (id) =>
    setOpenSites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const toggle = (
    <Tooltip>
      <TooltipTrigger
        className="ck-rail-toggle ck-sec-collapse"
        onClick={onToggleCollapse}
        aria-label={collapsed ? "Expand section rail" : "Collapse section rail"}
      >
        {collapsed ? <ChevronsRightIcon /> : <ChevronsLeftIcon />}
      </TooltipTrigger>
      <TooltipContent side="right">{collapsed ? "Expand" : "Collapse"}</TooltipContent>
    </Tooltip>
  )

  if (collapsed) {
    return (
      <aside className="ck-sec ck-rail--collapsed" aria-label={`${category.label} services`}>
        {toggle}
        {category.items.map((item) => {
          const Icon = serviceIcon(item)
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger
                className="ck-sec-group"
                data-active={item.id === svc.id || undefined}
                onClick={() => onNavigate(item.id)}
              >
                <Icon />
                <span className="ck-sec-group-name">{item.short ?? item.name}</span>
              </TooltipTrigger>
              <TooltipContent side="right">{item.name}</TooltipContent>
            </Tooltip>
          )
        })}
      </aside>
    )
  }

  return (
    <aside className="ck-sec" aria-label={`${category.label} services`}>
      {toggle}
      {category.items.map((item) => {
        const Icon = serviceIcon(item)
        if (item.collapsible) {
          return (
            <Collapsible
              key={item.id}
              className="ck-sec-cat"
              open={openSites.has(item.id)}
              onOpenChange={() => toggleSite(item.id)}
            >
              <CollapsibleTrigger className="ck-sec-group ck-sec-cat-trigger" data-active={item.id === svc.id || undefined}>
                <Icon />
                <span className="ck-sec-group-name">{item.name}</span>
                <span className="ck-sec-cat-caret" aria-hidden="true"><ChevronDownIcon /></span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="ck-sec-cat-items">
                  {item.pages.map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="ck-sec-link"
                      data-active={(item.id === svc.id && p === page) || undefined}
                      onClick={() => onNavigate(item.id, p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        }
        return (
          <button
            key={item.id}
            type="button"
            className="ck-sec-group"
            data-active={item.id === svc.id || undefined}
            onClick={() => onNavigate(item.id)}
          >
            <Icon />
            <span className="ck-sec-group-name">{item.name}</span>
          </button>
        )
      })}
      {category.quickLinks && (
        <>
          <Separator decorative className="ck-sec-sep" />
          <div className="ck-sec-quick-label">Quick links</div>
          {category.quickLinks.map((q) => (
            <button
              key={q.label}
              type="button"
              className="ck-sec-quick"
              onClick={() => onNavigate(q.svc, q.page)}
            >
              {q.label}
            </button>
          ))}
        </>
      )}
    </aside>
  )
}
