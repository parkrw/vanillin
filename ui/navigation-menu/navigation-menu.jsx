import {
  createContext, useCallback, useContext, useEffect, useId,
  useLayoutEffect, useMemo, useRef, useState,
} from "react"
import { createPortal } from "react-dom"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useAnchorPosition } from "../../lib/use-anchor-position.js"
import { useDirection } from "../../lib/direction.jsx"

const NavigationMenuContext = createContext(null)
const NavigationMenuItemContext = createContext(null)

/**
 * Horizontal nav of hover/click triggers with content panels.
 *
 * Two rendering modes:
 * - **Viewport mode (default, matching shadcn):** one shared panel morphs
 *   between menu contents. Place `<NavigationMenuViewport />` after the list.
 * - **Per-item mode (`viewport={false}`):** each item gets its own anchored
 *   popover panel (the original task-15 behaviour).
 *
 * Root state is the open item's value ("" = all closed); open/close timers
 * live here so trigger and content share them.
 */
export function NavigationMenu({
  value,
  defaultValue = "",
  onValueChange,
  delayDuration = 200,
  skipDelayDuration = 300,
  closeDelay = 150,
  viewport,
  className,
  children,
  ...props
}) {
  const useViewport = viewport !== false

  const [current, setValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const timerRef = useRef(null)
  const closedAtRef = useRef(0)
  const navRef = useRef(null)

  const valueRef = useRef(current)
  valueRef.current = current
  const setValueRef = useRef(setValue)
  setValueRef.current = setValue

  // --- Viewport element registration (state so Content re-renders) ---
  const [viewportEl, setViewportEl] = useState(null)

  // --- Trigger registration for direction detection ---
  const triggerMapRef = useRef(new Map())
  const registerTrigger = useCallback((itemValue, el) => {
    if (el) triggerMapRef.current.set(itemValue, el)
    else triggerMapRef.current.delete(itemValue)
  }, [])

  // --- Direction tracking for data-motion ---
  // prevValueRef holds the PREVIOUS render's value (updated in effect).
  // Reading it during render gives the stale (= previous) value, which
  // is exactly what we need for direction computation.
  const prevValueRef = useRef(current)
  const motionDirectionRef = useRef(null)
  // Compute direction synchronously during render so content panels
  // can read it for their data-motion attribute in the same pass.
  const prevForDirection = prevValueRef.current
  if (useViewport && prevForDirection !== "" && current !== "" && prevForDirection !== current) {
    const prevEl = triggerMapRef.current.get(prevForDirection)
    const nextEl = triggerMapRef.current.get(current)
    if (prevEl && nextEl) {
      const isAfterInDom = !!(
        prevEl.compareDocumentPosition(nextEl) & Node.DOCUMENT_POSITION_FOLLOWING
      )
      // Read actual DOM direction — handles dir="rtl" on <html> without
      // requiring a DirectionProvider wrapper. In RTL the visual order is
      // reversed, so we invert.
      const resolvedDir = getComputedStyle(prevEl).direction
      const forward = resolvedDir === "rtl" ? !isAfterInDom : isAfterInDom
      motionDirectionRef.current = forward ? 1 : -1
    }
  } else if (current === "" || prevForDirection === "" || prevForDirection === current) {
    motionDirectionRef.current = null
  }
  const motionDirection = motionDirectionRef.current

  // Keep the previous-value ref stable for direction + closedAt tracking.
  useEffect(() => {
    if (prevValueRef.current !== "" && current === "") closedAtRef.current = Date.now()
    prevValueRef.current = current
  }, [current])

  // --- Light-dismiss for viewport mode (no popover = no native dismiss) ---
  useEffect(() => {
    if (!useViewport || current === "") return
    const handler = (e) => {
      if (!navRef.current?.contains(e.target)) {
        clearTimeout(timerRef.current)
        setValueRef.current("")
      }
    }
    document.addEventListener("pointerdown", handler)
    return () => document.removeEventListener("pointerdown", handler)
  }, [useViewport, current])

  const cancelSchedule = useCallback(() => {
    clearTimeout(timerRef.current)
  }, [])

  const scheduleOpen = useCallback(
    (itemValue) => {
      clearTimeout(timerRef.current)
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

  const ctx = useMemo(
    () => ({
      value: current,
      setValue,
      scheduleOpen,
      scheduleClose,
      cancelSchedule,
      closeNow,
      useViewport,
      viewportEl,
      setViewportEl,
      registerTrigger,
      motionDirection,
    }),
    [
      current, setValue, scheduleOpen, scheduleClose, cancelSchedule,
      closeNow, useViewport, viewportEl, setViewportEl, registerTrigger,
      motionDirection,
    ]
  )

  return (
    <NavigationMenuContext.Provider value={ctx}>
      <nav ref={navRef} className={cn("navigation-menu", className)} data-viewport={useViewport ? "" : undefined} {...props}>
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
  const { value, setValue, scheduleOpen, scheduleClose, cancelSchedule, closeNow, registerTrigger } =
    useContext(NavigationMenuContext)
  const { itemValue, triggerRef, contentId, focusFirstRef } =
    useContext(NavigationMenuItemContext)
  const open = value === itemValue

  // Register trigger element for direction detection.
  const callbackRef = useCallback(
    (el) => {
      triggerRef.current = el
      registerTrigger(itemValue, el)
    },
    [triggerRef, registerTrigger, itemValue]
  )

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
      ref={callbackRef}
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
  const {
    value, setValue, scheduleClose, cancelSchedule, closeNow,
    useViewport, viewportEl, motionDirection,
  } = useContext(NavigationMenuContext)
  const { itemValue, triggerRef, contentRef, contentId, focusFirstRef } =
    useContext(NavigationMenuItemContext)
  const open = value === itemValue

  // ------ Viewport-less (popover) mode — original task-15 behaviour ------
  if (!useViewport) {
    return (
      <NavigationMenuContentPopover
        side={side}
        align={align}
        sideOffset={sideOffset}
        onKeyDown={onKeyDown}
        className={className}
        open={open}
        itemValue={itemValue}
        triggerRef={triggerRef}
        contentRef={contentRef}
        contentId={contentId}
        focusFirstRef={focusFirstRef}
        setValue={setValue}
        scheduleClose={scheduleClose}
        cancelSchedule={cancelSchedule}
        closeNow={closeNow}
        {...props}
      >
        {children}
      </NavigationMenuContentPopover>
    )
  }

  // ------ Viewport mode — content portals into the shared viewport ------

  // Compute data-motion for directional slide.
  const motionAttr = (() => {
    if (motionDirection === null) return undefined
    if (open) return motionDirection === 1 ? "from-end" : "from-start"
    // Exiting panel (was open last render, now closing).
    return motionDirection === 1 ? "to-start" : "to-end"
  })()

  // Focus first link when ArrowDown opened the panel.
  useEffect(() => {
    if (!open || !focusFirstRef.current) return
    focusFirstRef.current = false
    // Content is portaled — wait a frame for DOM insertion.
    requestAnimationFrame(() => {
      contentRef.current?.querySelector(".navigation-menu-link")?.focus()
    })
  }, [open, contentRef, focusFirstRef])

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "Escape") {
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

  const panel = (
    <div
      ref={contentRef}
      id={contentId}
      data-state={open ? "open" : "closed"}
      data-motion={motionAttr}
      className={cn("navigation-menu-content", className)}
      onKeyDown={handleKeyDown}
      onPointerEnter={cancelSchedule}
      onPointerLeave={scheduleClose}
      {...props}
    >
      {children}
    </div>
  )

  // Portal into the viewport element. If the viewport hasn't mounted yet
  // (viewportEl is null), hold off — the Portal component's deferred
  // mount ensures the viewport ref is set by the time createPortal fires.
  if (!viewportEl) return null
  return createPortal(panel, viewportEl)
}

/**
 * The original per-item popover content panel (viewport={false}).
 * Extracted to keep the branching in NavigationMenuContent clean.
 */
function NavigationMenuContentPopover({
  side,
  align,
  sideOffset,
  onKeyDown,
  className,
  open,
  itemValue,
  triggerRef,
  contentRef,
  contentId,
  focusFirstRef,
  setValue,
  scheduleClose,
  cancelSchedule,
  closeNow,
  children,
  ...props
}) {
  useAnchorPosition(open, triggerRef, contentRef, { side, align, sideOffset })

  const setValueRef = useRef(setValue)
  setValueRef.current = setValue

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

/**
 * Shared morphing viewport — one element that all content panels portal into.
 * Place after NavigationMenuList inside NavigationMenu.
 *
 * Measures the active content's dimensions and drives CSS custom properties
 * `--viewport-width` / `--viewport-height` on the viewport element; the CSS
 * transitions those for the morph. First open fades/scales in; subsequent
 * switches morph size with directional content slides.
 */
export function NavigationMenuViewport({ className, ...props }) {
  const { value, setViewportEl } = useContext(NavigationMenuContext)
  const innerRef = useRef(null)
  const open = value !== ""

  // Register the viewport element in context so Content can portal into it.
  const callbackRef = useCallback(
    (el) => {
      innerRef.current = el
      setViewportEl(el)
    },
    [setViewportEl]
  )

  // --- Size measurement: drive --viewport-width/--viewport-height ---
  const prevSizeRef = useRef(null) // tracks whether we've ever measured
  useLayoutEffect(() => {
    const vp = innerRef.current
    if (!vp) return

    const measure = () => {
      // The active content panel has data-state="open".
      const active = vp.querySelector('.navigation-menu-content[data-state="open"]')
      if (!active) return
      const w = active.offsetWidth
      const h = active.offsetHeight
      if (w === 0 && h === 0) return

      // First measurement: set dimensions without transition so the
      // viewport appears at the correct size (no morph from 0).
      if (prevSizeRef.current === null) {
        vp.style.transition = "none"
        vp.style.setProperty("--viewport-width", w + "px")
        vp.style.setProperty("--viewport-height", h + "px")
        // Force a style flush, then re-enable transitions.
        vp.offsetHeight // eslint-disable-line no-unused-expressions
        vp.style.transition = ""
      } else {
        vp.style.setProperty("--viewport-width", w + "px")
        vp.style.setProperty("--viewport-height", h + "px")
      }
      prevSizeRef.current = { w, h }
    }

    measure()

    const ro = new ResizeObserver(measure)
    // Observe all content panels (active and inactive) — when the active
    // panel changes, its new size triggers the observer.
    vp.querySelectorAll(".navigation-menu-content").forEach((el) => ro.observe(el))

    // Also observe newly-added panels via MutationObserver (portaled in
    // after this effect runs).
    const mo = new MutationObserver(() => {
      ro.disconnect()
      vp.querySelectorAll(".navigation-menu-content").forEach((el) => ro.observe(el))
      measure()
    })
    mo.observe(vp, { childList: true })

    return () => {
      ro.disconnect()
      mo.disconnect()
    }
  }, [value])

  // Reset prevSize when the viewport closes so the next open starts fresh.
  useEffect(() => {
    if (!open) prevSizeRef.current = null
  }, [open])

  return (
    <div className="navigation-menu-viewport-wrapper" data-state={open ? "open" : "closed"}>
      <div
        ref={callbackRef}
        data-state={open ? "open" : "closed"}
        className={cn("navigation-menu-viewport", className)}
        {...props}
      />
    </div>
  )
}

/**
 * Sliding indicator that follows the active trigger. Renders as a
 * decorative `<li>` inside NavigationMenuList.
 *
 * The default child is a small downward-pointing arrow. Pass children
 * to customise.
 */
export function NavigationMenuIndicator({ className, children, ...props }) {
  const { value } = useContext(NavigationMenuContext)
  const ref = useRef(null)
  const open = value !== ""

  const positionIndicator = useCallback(() => {
    const el = ref.current
    if (!el) return
    const list = el.closest(".navigation-menu-list")
    if (!list) return
    const trigger = list.querySelector('.navigation-menu-trigger[data-state="open"]')
    if (!trigger) return
    const isRtl = getComputedStyle(list).direction === "rtl"
    const inlineOffset = isRtl
      ? list.clientWidth - trigger.offsetLeft - trigger.offsetWidth
      : trigger.offsetLeft
    el.style.setProperty("--indicator-offset", inlineOffset + "px")
    el.style.setProperty("--indicator-width", trigger.offsetWidth + "px")
  }, [])

  useLayoutEffect(() => {
    if (open) positionIndicator()
  }, [value, open, positionIndicator])

  // Reposition on window resize (trigger may have moved).
  useEffect(() => {
    if (!open) return
    window.addEventListener("resize", positionIndicator)
    return () => window.removeEventListener("resize", positionIndicator)
  }, [open, positionIndicator])

  return (
    <li
      ref={ref}
      aria-hidden="true"
      data-state={open ? "open" : "closed"}
      className={cn("navigation-menu-indicator", className)}
      {...props}
    >
      {children ?? <div className="navigation-menu-indicator-arrow" />}
    </li>
  )
}
