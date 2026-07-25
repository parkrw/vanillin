import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { Input } from "../input/input.jsx"
import { Separator } from "../separator/separator.jsx"
import { Skeleton } from "../skeleton/skeleton.jsx"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../sheet/sheet.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../tooltip/tooltip.jsx"

// ---------------------------------------------------------------------------
// Constants (match shadcn)
// ---------------------------------------------------------------------------

const SIDEBAR_COOKIE_NAME = "sidebar_state"
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
const SIDEBAR_WIDTH = "16rem"
const SIDEBAR_WIDTH_MOBILE = "18rem"
const SIDEBAR_WIDTH_ICON = "3rem"
const SIDEBAR_KEYBOARD_SHORTCUT = "b"

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const SidebarContext = createContext(null)

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within a SidebarProvider.")
  return ctx
}

// ---------------------------------------------------------------------------
// useIsMobile — matchMedia below 768px
// ---------------------------------------------------------------------------

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 767px)")
    const handler = () => setIsMobile(mql.matches)
    handler()
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])
  return isMobile
}

// ---------------------------------------------------------------------------
// SidebarProvider
// ---------------------------------------------------------------------------

export function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange,
  className,
  style,
  children,
  ...props
}) {
  const isMobile = useIsMobile()
  const [openMobile, setOpenMobile] = useState(false)

  const [open, setOpen] = useControllableState({
    value: openProp,
    defaultValue: defaultOpen,
    onChange: (v) => {
      onOpenChange?.(v)
      // Persist to cookie
      document.cookie = `${SIDEBAR_COOKIE_NAME}=${v}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`
    },
  })

  const toggleSidebar = useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev)
    } else {
      setOpen((prev) => !prev)
    }
  }, [isMobile, setOpen])

  // Keyboard shortcut: Cmd+B / Ctrl+B
  const toggleRef = useRef(toggleSidebar)
  toggleRef.current = toggleSidebar
  useEffect(() => {
    const handler = (e) => {
      if (e.key === SIDEBAR_KEYBOARD_SHORTCUT && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        toggleRef.current()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const state = open ? "expanded" : "collapsed"

  const ctx = useMemo(
    () => ({ state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar]
  )

  return (
    <SidebarContext.Provider value={ctx}>
      <TooltipProvider delayDuration={0}>
        <div
          style={{
            "--sidebar-width": SIDEBAR_WIDTH,
            "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
            ...style,
          }}
          className={cn("sidebar-provider", className)}
          data-sidebar="provider"
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

export function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useSidebar()

  if (collapsible === "none") {
    return (
      <div
        className={cn("sidebar sidebar--none", className)}
        data-sidebar="sidebar"
        {...props}
      >
        {children}
      </div>
    )
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-mobile="true"
          className="sidebar sidebar--mobile"
          style={{ "--sidebar-width": SIDEBAR_WIDTH_MOBILE }}
          side={side}
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="sidebar-mobile-inner">{children}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="sidebar-wrapper"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
    >
      {/* Gap spacer — keeps the main content from overlapping the fixed sidebar */}
      <div
        className={cn(
          "sidebar-gap",
          (variant === "floating" || variant === "inset") && "sidebar-gap--inset"
        )}
      />
      {/* Fixed panel */}
      <div
        className={cn(
          "sidebar",
          `sidebar--${side}`,
          (variant === "floating" || variant === "inset") && "sidebar--inset",
          variant === "sidebar" && "sidebar--bordered",
          className
        )}
        data-sidebar="sidebar"
        {...props}
      >
        <div
          className={cn(
            "sidebar-inner",
            variant === "floating" && "sidebar-inner--floating"
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// SidebarTrigger
// ---------------------------------------------------------------------------

export function SidebarTrigger({ as: Comp = "button", className, onClick, ...props }) {
  const { toggleSidebar } = useSidebar()
  return (
    <Comp
      type={Comp === "button" ? "button" : undefined}
      data-sidebar="trigger"
      aria-label="Toggle Sidebar"
      className={cn("sidebar-trigger", className)}
      onClick={(e) => {
        onClick?.(e)
        if (!e.defaultPrevented) toggleSidebar()
      }}
      {...props}
    >
      {/* PanelLeft icon */}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect width="18" height="18" x="3" y="3" rx="2" />
        <path d="M9 3v18" />
      </svg>
      <span className="sr-only">Toggle Sidebar</span>
    </Comp>
  )
}

// ---------------------------------------------------------------------------
// SidebarRail
// ---------------------------------------------------------------------------

export function SidebarRail({ className, ...props }) {
  const { toggleSidebar } = useSidebar()
  return (
    <button
      type="button"
      data-sidebar="rail"
      aria-label="Toggle Sidebar"
      tabIndex={-1}
      onClick={toggleSidebar}
      title="Toggle Sidebar"
      className={cn("sidebar-rail", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// SidebarInset
// ---------------------------------------------------------------------------

export function SidebarInset({ as: Comp = "main", className, ...props }) {
  return <Comp className={cn("sidebar-inset", className)} {...props} />
}

// ---------------------------------------------------------------------------
// SidebarInput
// ---------------------------------------------------------------------------

export function SidebarInput({ className, ...props }) {
  return (
    <Input
      data-sidebar="input"
      className={cn("sidebar-input", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// SidebarHeader / Footer / Content
// ---------------------------------------------------------------------------

export function SidebarHeader({ className, ...props }) {
  return <div data-sidebar="header" className={cn("sidebar-header", className)} {...props} />
}

export function SidebarFooter({ className, ...props }) {
  return <div data-sidebar="footer" className={cn("sidebar-footer", className)} {...props} />
}

export function SidebarContent({ className, ...props }) {
  return <div data-sidebar="content" className={cn("sidebar-content", className)} {...props} />
}

// ---------------------------------------------------------------------------
// SidebarGroup + GroupLabel / GroupAction / GroupContent
// ---------------------------------------------------------------------------

export function SidebarGroup({ className, ...props }) {
  return <div data-sidebar="group" className={cn("sidebar-group", className)} {...props} />
}

export function SidebarGroupLabel({ as: Comp = "div", className, ...props }) {
  return (
    <Comp
      data-sidebar="group-label"
      className={cn("sidebar-group-label", className)}
      {...props}
    />
  )
}

export function SidebarGroupAction({ as: Comp = "button", className, ...props }) {
  return (
    <Comp
      type={Comp === "button" ? "button" : undefined}
      data-sidebar="group-action"
      className={cn("sidebar-group-action", className)}
      {...props}
    />
  )
}

export function SidebarGroupContent({ className, ...props }) {
  return (
    <div
      data-sidebar="group-content"
      className={cn("sidebar-group-content", className)}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// SidebarMenu + MenuItem / MenuButton / MenuAction / MenuBadge / MenuSkeleton
// ---------------------------------------------------------------------------

export function SidebarMenu({ className, ...props }) {
  return <ul data-sidebar="menu" className={cn("sidebar-menu", className)} {...props} />
}

export function SidebarMenuItem({ className, ...props }) {
  return <li data-sidebar="menu-item" className={cn("sidebar-menu-item", className)} {...props} />
}

export function SidebarMenuButton({
  as: Comp = "button",
  isActive = false,
  variant = "default",
  size = "default",
  tooltip,
  className,
  ...props
}) {
  const { isMobile, state } = useSidebar()

  const button = (
    <Comp
      type={Comp === "button" ? "button" : undefined}
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "sidebar-menu-button",
        variant === "outline" && "sidebar-menu-button--outline",
        size === "sm" && "sidebar-menu-button--sm",
        size === "lg" && "sidebar-menu-button--lg",
        className
      )}
      {...props}
    />
  )

  if (!tooltip) return button

  const tooltipProps = typeof tooltip === "string" ? { children: tooltip } : tooltip

  return (
    <Tooltip>
      <TooltipTrigger as={Comp} {...button.props}>
        {button.props.children}
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="center"
        hidden={state !== "collapsed" || isMobile}
        {...tooltipProps}
      />
    </Tooltip>
  )
}

export function SidebarMenuAction({ as: Comp = "button", showOnHover = false, className, ...props }) {
  return (
    <Comp
      type={Comp === "button" ? "button" : undefined}
      data-sidebar="menu-action"
      className={cn(
        "sidebar-menu-action",
        showOnHover && "sidebar-menu-action--hover-only",
        className
      )}
      {...props}
    />
  )
}

export function SidebarMenuBadge({ className, ...props }) {
  return (
    <div
      data-sidebar="menu-badge"
      className={cn("sidebar-menu-badge", className)}
      {...props}
    />
  )
}

export function SidebarMenuSkeleton({ showIcon = false, className, ...props }) {
  const width = useMemo(() => `${Math.floor(Math.random() * 40) + 50}%`, [])
  return (
    <div
      data-sidebar="menu-skeleton"
      className={cn("sidebar-menu-skeleton", className)}
      {...props}
    >
      {showIcon && <Skeleton className="sidebar-menu-skeleton-icon" />}
      <Skeleton className="sidebar-menu-skeleton-text" style={{ "--skeleton-width": width }} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// SidebarMenuSub + SubItem / SubButton
// ---------------------------------------------------------------------------

export function SidebarMenuSub({ className, ...props }) {
  return <ul data-sidebar="menu-sub" className={cn("sidebar-menu-sub", className)} {...props} />
}

export function SidebarMenuSubItem(props) {
  return <li data-sidebar="menu-sub-item" {...props} />
}

export function SidebarMenuSubButton({
  as: Comp = "a",
  size = "md",
  isActive,
  className,
  ...props
}) {
  return (
    <Comp
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      className={cn(
        "sidebar-menu-sub-button",
        size === "sm" && "sidebar-menu-sub-button--sm",
        className
      )}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// SidebarSeparator
// ---------------------------------------------------------------------------

export function SidebarSeparator({ className, ...props }) {
  return (
    <Separator
      data-sidebar="separator"
      className={cn("sidebar-separator", className)}
      {...props}
    />
  )
}
