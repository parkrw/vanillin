import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useCallback } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useAnchorPosition } from "../../lib/use-anchor-position.js"

const DropdownMenuContext = createContext(null)

/**
 * Root provider — controlled via `open`/`onOpenChange`, uncontrolled via `defaultOpen`.
 * Carries open state, refs, and a flag for "focus last item on open" (ArrowUp trigger).
 */
export function DropdownMenu({ open, defaultOpen = false, onOpenChange, children }) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const contentId = useId()
  // When ArrowUp opens the menu, we want to focus the last item instead of first.
  const focusLastRef = useRef(false)

  return (
    <DropdownMenuContext.Provider
      value={{ open: isOpen, setOpen, triggerRef, contentRef, contentId, focusLastRef }}
    >
      {children}
    </DropdownMenuContext.Provider>
  )
}

export function DropdownMenuTrigger({ as: Comp = "button", onClick, onKeyDown, className, ...props }) {
  const { open, setOpen, triggerRef, contentId, focusLastRef } = useContext(DropdownMenuContext)

  const handleClick = (event) => {
    onClick?.(event)
    if (!event.defaultPrevented) {
      focusLastRef.current = false
      setOpen((prev) => !prev)
    }
  }

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      focusLastRef.current = false
      setOpen(true)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      focusLastRef.current = true
      setOpen(true)
    }
  }

  return (
    <Comp
      ref={triggerRef}
      type={Comp === "button" ? "button" : undefined}
      aria-haspopup="menu"
      aria-expanded={open ? "true" : "false"}
      aria-controls={contentId}
      data-state={open ? "open" : "closed"}
      className={className}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

/**
 * Collect non-disabled menuitems scoped to this specific menu (not nested submenus).
 */
function getMenuItems(menuEl) {
  if (!menuEl) return []
  return [...menuEl.querySelectorAll('[role^="menuitem"]')].filter(
    (el) => el.closest('[role="menu"]') === menuEl && !el.hasAttribute("aria-disabled")
  )
}

export function DropdownMenuContent({
  side = "bottom",
  align = "start",
  sideOffset = 4,
  className,
  onKeyDown,
  children,
  ...props
}) {
  const { open, setOpen, triggerRef, contentRef, contentId, focusLastRef } =
    useContext(DropdownMenuContext)

  useAnchorPosition(open, triggerRef, contentRef, { side, align, sideOffset })

  // showingRef tracks native popover state to avoid redundant show/hide calls.
  const showingRef = useRef(false)
  const setOpenRef = useRef(setOpen)
  setOpenRef.current = setOpen

  // Attach toggle listener once on mount — sync native close -> React state.
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const handler = (event) => {
      if (event.newState === "closed") {
        showingRef.current = false
        setOpenRef.current(false)
      }
    }
    el.addEventListener("toggle", handler)
    return () => el.removeEventListener("toggle", handler)
  }, [contentRef])

  // Sync React state -> native popover show/hide, then focus.
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    if (open && !showingRef.current) {
      try {
        el.showPopover()
      } catch {
        /* already showing */
      }
      showingRef.current = true
      // Focus the appropriate item after the popover is shown.
      const items = getMenuItems(el)
      if (items.length > 0) {
        const target = focusLastRef.current ? items[items.length - 1] : items[0]
        target.focus()
      }
    } else if (!open && showingRef.current) {
      try {
        el.hidePopover()
      } catch {
        /* already hidden */
      }
      showingRef.current = false
    }
  }, [open, contentRef, focusLastRef])

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const menu = contentRef.current
    if (!menu) return

    const items = getMenuItems(menu)
    if (items.length === 0) return
    const currentIndex = items.indexOf(document.activeElement)

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault()
        const next = currentIndex < items.length - 1 ? currentIndex + 1 : 0
        items[next].focus()
        break
      }
      case "ArrowUp": {
        event.preventDefault()
        const prev = currentIndex > 0 ? currentIndex - 1 : items.length - 1
        items[prev].focus()
        break
      }
      case "Home": {
        event.preventDefault()
        items[0].focus()
        break
      }
      case "End": {
        event.preventDefault()
        items[items.length - 1].focus()
        break
      }
      case "Tab": {
        // Tab closes the menu and returns focus to trigger.
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        break
      }
      default:
        break
    }
  }

  return (
    <div
      ref={contentRef}
      id={contentId}
      popover="auto"
      role="menu"
      data-state={open ? "open" : "closed"}
      className={cn("dropdown-menu", className)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  )
}

export function DropdownMenuItem({
  as: Comp = "div",
  disabled = false,
  onSelect,
  onClick,
  onKeyDown,
  className,
  children,
  ...props
}) {
  const { setOpen, triggerRef } = useContext(DropdownMenuContext)

  const handleSelect = useCallback(() => {
    if (disabled) return
    const selectEvent = new Event("select", { cancelable: true })
    onSelect?.(selectEvent)
    if (!selectEvent.defaultPrevented) {
      setOpen(false)
      // Return focus to trigger after close.
      triggerRef.current?.focus()
    }
  }, [disabled, onSelect, setOpen, triggerRef])

  const handleClick = (event) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    handleSelect()
  }

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      handleSelect()
    }
  }

  return (
    <Comp
      role="menuitem"
      tabIndex={-1}
      className={cn("dropdown-menu-item", className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      {...(disabled ? { "aria-disabled": "true", "data-disabled": "" } : {})}
      {...props}
    >
      {children}
    </Comp>
  )
}

// ── Checkbox Item ─────────────────────────────────────────────────────

export function DropdownMenuCheckboxItem({
  checked,
  defaultChecked = false,
  onCheckedChange,
  onSelect,
  className,
  children,
  ...props
}) {
  const [isChecked, setChecked] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  })

  return (
    <DropdownMenuItem
      role="menuitemcheckbox"
      aria-checked={isChecked ? "true" : "false"}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn("dropdown-menu-checkbox-item", className)}
      onSelect={(event) => {
        onSelect?.(event)
        setChecked((prev) => !prev)
      }}
      {...props}
    >
      <span className="dropdown-menu-item-indicator">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      {children}
    </DropdownMenuItem>
  )
}

// ── Radio Group + Radio Item ──────────────────────────────────────────

const DropdownMenuRadioGroupContext = createContext(null)

export function DropdownMenuRadioGroup({ value, defaultValue, onValueChange, className, children, ...props }) {
  const [current, setValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })

  return (
    <DropdownMenuRadioGroupContext.Provider value={{ current, setValue }}>
      <div role="group" className={cn("dropdown-menu-group", className)} {...props}>
        {children}
      </div>
    </DropdownMenuRadioGroupContext.Provider>
  )
}

export function DropdownMenuRadioItem({ value, onSelect, className, children, ...props }) {
  const { current, setValue } = useContext(DropdownMenuRadioGroupContext)
  const isChecked = current === value

  return (
    <DropdownMenuItem
      role="menuitemradio"
      aria-checked={isChecked ? "true" : "false"}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn("dropdown-menu-radio-item", className)}
      onSelect={(event) => {
        onSelect?.(event)
        setValue(value)
      }}
      {...props}
    >
      <span className="dropdown-menu-item-indicator">
        <span className="dropdown-menu-radio-dot" />
      </span>
      {children}
    </DropdownMenuItem>
  )
}

// ── Structural parts ──────────────────────────────────────────────────

export function DropdownMenuGroup({ className, children, ...props }) {
  return (
    <div role="group" className={cn("dropdown-menu-group", className)} {...props}>
      {children}
    </div>
  )
}

export function DropdownMenuLabel({ className, children, ...props }) {
  return (
    <div className={cn("dropdown-menu-label", className)} {...props}>
      {children}
    </div>
  )
}

export function DropdownMenuSeparator({ className, ...props }) {
  return <div role="separator" className={cn("dropdown-menu-separator", className)} {...props} />
}

export function DropdownMenuShortcut({ className, children, ...props }) {
  return (
    <span aria-hidden="true" className={cn("dropdown-menu-shortcut", className)} {...props}>
      {children}
    </span>
  )
}
