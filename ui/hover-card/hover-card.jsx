import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useAnchorPosition } from "../../lib/use-anchor-position.js"

const HoverCardContext = createContext(null)

/**
 * Rich link-preview popup for sighted users (shadcn/Radix anatomy:
 * HoverCard / HoverCardTrigger / HoverCardContent). Unlike tooltip, the
 * pointer may travel into the content — the root owns shared open/close
 * timers so trigger and content cancel each other's pending close.
 */
export function HoverCard({
  open,
  defaultOpen = false,
  onOpenChange,
  openDelay = 700,
  closeDelay = 300,
  children,
}) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const contentId = useId()
  const timerRef = useRef(null)

  const setOpenRef = useRef(setOpen)
  setOpenRef.current = setOpen

  const scheduleOpen = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setOpenRef.current(true), openDelay)
  }, [openDelay])

  const scheduleClose = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setOpenRef.current(false), closeDelay)
  }, [closeDelay])

  const cancelSchedule = useCallback(() => {
    clearTimeout(timerRef.current)
  }, [])

  const openNow = useCallback(() => {
    clearTimeout(timerRef.current)
    setOpenRef.current(true)
  }, [])

  const closeNow = useCallback(() => {
    clearTimeout(timerRef.current)
    setOpenRef.current(false)
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  // Document-level Esc — the trigger may not have focus (hover alone
  // doesn't focus), so a trigger-only keydown handler misses Esc.
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === "Escape") closeNow()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen, closeNow])

  return (
    <HoverCardContext.Provider
      value={{
        open: isOpen,
        triggerRef,
        contentRef,
        contentId,
        scheduleOpen,
        scheduleClose,
        cancelSchedule,
        openNow,
        closeNow,
      }}
    >
      {children}
    </HoverCardContext.Provider>
  )
}

export function HoverCardTrigger({
  as: Comp = "a",
  onPointerEnter: onPointerEnterProp,
  onPointerLeave: onPointerLeaveProp,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...props
}) {
  const { open, triggerRef, scheduleOpen, scheduleClose, openNow, closeNow } =
    useContext(HoverCardContext)

  return (
    <Comp
      ref={triggerRef}
      className="hover-card-trigger"
      data-state={open ? "open" : "closed"}
      onPointerEnter={(e) => {
        onPointerEnterProp?.(e)
        // Hover preview only — never open for touch.
        if (!e.defaultPrevented && e.pointerType !== "touch") scheduleOpen()
      }}
      onPointerLeave={(e) => {
        onPointerLeaveProp?.(e)
        if (!e.defaultPrevented) scheduleClose()
      }}
      onFocus={(e) => {
        onFocusProp?.(e)
        // Keyboard focus opens instantly — the hover delay never applies.
        if (!e.defaultPrevented) openNow()
      }}
      onBlur={(e) => {
        onBlurProp?.(e)
        if (!e.defaultPrevented) closeNow()
      }}
      {...props}
    />
  )
}

export function HoverCardContent({
  side = "bottom",
  align = "center",
  sideOffset = 4,
  className,
  children,
  ...props
}) {
  const { open, triggerRef, contentRef, contentId, scheduleClose, cancelSchedule } =
    useContext(HoverCardContext)

  useAnchorPosition(open, triggerRef, contentRef, { side, align, sideOffset })

  // showingRef guards against redundant showPopover/hidePopover calls.
  const showingRef = useRef(false)

  // Sync React state -> native popover show/hide. popover="manual" — auto's
  // light dismiss would fight the hover open/close logic.
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    if (open && !showingRef.current) {
      try { el.showPopover() } catch { /* already showing */ }
      showingRef.current = true
    } else if (!open && showingRef.current) {
      try { el.hidePopover() } catch { /* already hidden */ }
      showingRef.current = false
    }
  }, [open, contentRef])

  return (
    <div
      ref={contentRef}
      id={contentId}
      popover="manual"
      data-state={open ? "open" : "closed"}
      className={cn("hover-card", className)}
      onPointerEnter={cancelSchedule}
      onPointerLeave={scheduleClose}
      {...props}
    >
      {children}
    </div>
  )
}
