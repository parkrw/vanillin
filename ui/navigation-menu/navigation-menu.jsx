import { createContext, useCallback, useContext, useEffect, useId, useLayoutEffect, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useAnchorPosition } from "../../lib/use-anchor-position.js"
import { useDirection } from "../../lib/direction.jsx"

const NavigationMenuContext = createContext(null)
const NavigationMenuItemContext = createContext(null)

/**
 * Horizontal nav of hover/click triggers, each with an anchored links panel
 * (popover recipe). Root state is the open item's value ("" = all closed);
 * open/close timers live here so trigger and content share them — the pointer
 * may travel into the panel (hover-card precedent). Panels are per-item
 * (shadcn's viewport={false} mode); the shared morphing viewport is a
 * non-goal, so `viewport` is swallowed and Viewport/Indicator are no-ops.
 */
export function NavigationMenu({
  value,
  defaultValue = "",
  onValueChange,
  delayDuration = 200,
  skipDelayDuration = 300,
  closeDelay = 150,
  viewport: _viewport,
  className,
  children,
  ...props
}) {
  const [current, setValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const timerRef = useRef(null)
  const closedAtRef = useRef(0)

  const valueRef = useRef(current)
  valueRef.current = current
  const setValueRef = useRef(setValue)
  setValueRef.current = setValue

  // Timestamp real open->closed transitions for the skip window (re-hover
  // soon after a close opens instantly, tooltip precedent). Mount stamps
  // nothing — value starts "" without anything having closed.
  const prevValueRef = useRef(current)
  useEffect(() => {
    if (prevValueRef.current !== "" && current === "") closedAtRef.current = Date.now()
    prevValueRef.current = current
  }, [current])

  const cancelSchedule = useCallback(() => {
    clearTimeout(timerRef.current)
  }, [])

  const scheduleOpen = useCallback(
    (itemValue) => {
      clearTimeout(timerRef.current)
      // Already open: hovering another trigger switches immediately.
      const skip =
        valueRef.current !== "" ||
        Date.now() - closedAtRef.current < skipDelayDuration
      if (skip) setValueRef.current(itemValue)
      else timerRef.current = setTimeout(() => setValueRef.current(itemValue), delayDuration)
    },
    [delayDuration, skipDelayDuration]
  )

  const scheduleClose = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setValueRef.current(""), closeDelay)
  }, [closeDelay])

  const closeNow = useCallback(() => {
    clearTimeout(timerRef.current)
    setValueRef.current("")
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <NavigationMenuContext.Provider
      value={{ value: current, setValue, scheduleOpen, scheduleClose, cancelSchedule, closeNow }}
    >
      <nav className={cn("navigation-menu", className)} {...props}>
        {children}
      </nav>
    </NavigationMenuContext.Provider>
  )
}

export function NavigationMenuList({ onKeyDown, className, ...props }) {
  const listRef = useRef(null)
  const dir = useDirection()
  const nextKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight"
  const prevKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft"

  // Triggers and top-level links are all natively tabbable (no roving —
  // that's tabs/radio/toolbars only); arrows are a convenience on top.
  // Panel-internal keys never move list focus.
  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key !== nextKey && event.key !== prevKey) return
    if (event.target.closest(".navigation-menu-content")) return
    const focusables = [...listRef.current.querySelectorAll(
      ".navigation-menu-trigger, .navigation-menu-link"
    )].filter((el) => !el.closest(".navigation-menu-content") && !el.disabled)
    const index = focusables.indexOf(event.target)
    if (index === -1) return
    event.preventDefault()
    const delta = event.key === nextKey ? 1 : -1
    focusables[(index + delta + focusables.length) % focusables.length]?.focus()
  }

  return (
    <ul
      ref={listRef}
      className={cn("navigation-menu-list", className)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

/** One nav entry — value defaults to a generated id (menubar precedent). */
export function NavigationMenuItem({ value: valueProp, className, children, ...props }) {
  const autoValue = useId()
  const itemValue = valueProp ?? autoValue
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const contentId = useId()
  const focusFirstRef = useRef(false)

  return (
    <NavigationMenuItemContext.Provider
      value={{ itemValue, triggerRef, contentRef, contentId, focusFirstRef }}
    >
      <li className={cn("navigation-menu-item", className)} {...props}>
        {children}
      </li>
    </NavigationMenuItemContext.Provider>
  )
}

export function NavigationMenuTrigger({
  as: Comp = "button",
  onClick,
  onKeyDown,
  onPointerDown,
  onPointerEnter,
  onPointerLeave,
  className,
  children,
  ...props
}) {
  const { value, setValue, scheduleOpen, scheduleClose, cancelSchedule, closeNow } =
    useContext(NavigationMenuContext)
  const { itemValue, triggerRef, contentId, focusFirstRef } =
    useContext(NavigationMenuItemContext)
  const open = value === itemValue

  // Pointerdown light-dismisses the auto popover; the queued toggle may sync
  // state to closed before the click arrives. Snapshot "was open" so the
  // click always means close then (task-14 gotcha).
  const wasOpenRef = useRef(false)

  const handlePointerDown = (event) => {
    onPointerDown?.(event)
    if (event.defaultPrevented) return
    wasOpenRef.current = open
  }

  const handleClick = (event) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    cancelSchedule()
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = false
    if (wasOpen) setValue((prev) => (prev === itemValue ? "" : prev))
    else setValue((prev) => (prev === itemValue ? "" : itemValue))
  }

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "ArrowDown") {
      event.preventDefault()
      focusFirstRef.current = true
      cancelSchedule()
      setValue(itemValue)
    } else if (event.key === "Escape" && open) {
      closeNow()
    }
  }

  const handlePointerEnter = (event) => {
    onPointerEnter?.(event)
    // Hover is a mouse affordance — never open for touch.
    if (event.defaultPrevented || event.pointerType === "touch") return
    scheduleOpen(itemValue)
  }

  const handlePointerLeave = (event) => {
    onPointerLeave?.(event)
    if (event.defaultPrevented || event.pointerType === "touch") return
    if (open) scheduleClose()
    else cancelSchedule()
  }

  return (
    <Comp
      ref={triggerRef}
      type={Comp === "button" ? "button" : undefined}
      aria-expanded={open ? "true" : "false"}
      aria-controls={contentId}
      data-state={open ? "open" : "closed"}
      className={cn("navigation-menu-trigger", className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      {...props}
    >
      {children}
      <svg
        className="navigation-menu-trigger-chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </Comp>
  )
}

export function NavigationMenuContent({
  side = "bottom",
  align = "start",
  sideOffset = 6,
  onKeyDown,
  className,
  children,
  ...props
}) {
  const { value, setValue, scheduleClose, cancelSchedule, closeNow } =
    useContext(NavigationMenuContext)
  const { itemValue, triggerRef, contentRef, contentId, focusFirstRef } =
    useContext(NavigationMenuItemContext)
  const open = value === itemValue

  useAnchorPosition(open, triggerRef, contentRef, { side, align, sideOffset })

  const setValueRef = useRef(setValue)
  setValueRef.current = setValue

  // Sync native dismissal (outside click, Esc) back into state. A close only
  // clears the root value if this item still owns it — a hover switch has
  // already handed it to the next item (menubar precedent).
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const handler = (event) => {
      if (event.newState === "closed") {
        setValueRef.current((prev) => (prev === itemValue ? "" : prev))
      }
    }
    el.addEventListener("toggle", handler)
    return () => el.removeEventListener("toggle", handler)
  }, [contentRef, itemValue])

  // State -> native popover, gated on live :popover-open (a shadow flag
  // drifts after native light dismiss — task-13 gotcha).
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const showing = el.matches(":popover-open")
    if (open && !showing) {
      try { el.showPopover() } catch { /* already showing */ }
      if (focusFirstRef.current) el.querySelector(".navigation-menu-link")?.focus()
    } else if (!open && showing) {
      try { el.hidePopover() } catch { /* already hidden */ }
    }
    focusFirstRef.current = false
  }, [open, contentRef, focusFirstRef])

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "Escape") {
      // Native light dismiss also fires; close through state and put focus
      // back on the trigger ourselves.
      closeNow()
      triggerRef.current?.focus()
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const links = [...event.currentTarget.querySelectorAll(".navigation-menu-link")]
      if (links.length === 0) return
      const index = links.indexOf(document.activeElement)
      const delta = event.key === "ArrowDown" ? 1 : -1
      links[(index + delta + links.length) % links.length]?.focus()
    }
  }

  return (
    <div
      ref={contentRef}
      id={contentId}
      popover="auto"
      data-state={open ? "open" : "closed"}
      className={cn("navigation-menu-content", className)}
      onKeyDown={handleKeyDown}
      onPointerEnter={cancelSchedule}
      onPointerLeave={scheduleClose}
      {...props}
    >
      {children}
    </div>
  )
}

export function NavigationMenuLink({ as: Comp = "a", active, onClick, className, ...props }) {
  const { closeNow } = useContext(NavigationMenuContext)

  return (
    <Comp
      data-active={active ? "" : undefined}
      aria-current={active ? "page" : undefined}
      className={cn("navigation-menu-link", className)}
      onClick={(event) => {
        onClick?.(event)
        // Navigating away closes the menu (Radix parity).
        if (!event.defaultPrevented) closeNow()
      }}
      {...props}
    />
  )
}

/** Class string for styling a bare Link like a trigger (shadcn export). */
export function navigationMenuTriggerStyle() {
  return "navigation-menu-trigger"
}

/** Compat no-op — panels are per-item, there is no shared morphing viewport. */
export function NavigationMenuViewport() {
  return null
}

/** Compat no-op — the sliding active-trigger arrow needs the shared viewport. */
export function NavigationMenuIndicator() {
  return null
}
