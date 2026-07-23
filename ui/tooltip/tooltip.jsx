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

// ---------------------------------------------------------------------------
// Provider — app-level shared delay + skip-delay window
// ---------------------------------------------------------------------------

const ProviderContext = createContext({ delayDuration: 0, getDelay: () => 0, onOpenChange: null })

/** Shared delay context. Wrap tooltip groups so moving between them within
 *  the skip-delay window opens instantly. */
export function TooltipProvider({ delayDuration = 0, children }) {
  const lastClosedRef = useRef(0)

  // Called by every Tooltip in this provider tree whenever one opens or
  // closes, so we can track the skip-delay window.
  const onOpenChange = useCallback((open) => {
    if (!open) lastClosedRef.current = Date.now()
  }, [])

  const getDelay = useCallback(() => {
    const elapsed = Date.now() - lastClosedRef.current
    // Skip-delay window: if a tooltip closed < 300ms ago, open instantly.
    return elapsed < 300 ? 0 : delayDuration
  }, [delayDuration])

  return (
    <ProviderContext.Provider value={{ delayDuration, getDelay, onOpenChange }}>
      {children}
    </ProviderContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Tooltip (state owner)
// ---------------------------------------------------------------------------

const TooltipContext = createContext(null)

export function Tooltip({ open, defaultOpen = false, onOpenChange, children }) {
  const provider = useContext(ProviderContext)
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: (v) => {
      onOpenChange?.(v)
      provider.onOpenChange?.(v)
    },
  })
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const contentId = useId()

  // Document-level Esc handler — tooltip triggers may not have focus
  // (hover alone doesn't focus), so a trigger-only keydown handler misses Esc.
  const setOpenRef = useRef(setOpen)
  setOpenRef.current = setOpen
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === "Escape") {
        setOpenRef.current(false)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen])

  return (
    <TooltipContext.Provider
      value={{ open: isOpen, setOpen, triggerRef, contentRef, contentId, provider }}
    >
      {children}
    </TooltipContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export function TooltipTrigger({
  as: Comp = "button",
  onPointerEnter: onPointerEnterProp,
  onPointerLeave: onPointerLeaveProp,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...props
}) {
  const { open, setOpen, triggerRef, contentId, provider } = useContext(TooltipContext)
  const delayRef = useRef(null)

  const scheduleOpen = useCallback(
    (pointerType) => {
      // Never open for touch
      if (pointerType === "touch") return
      clearTimeout(delayRef.current)
      const delay = provider.getDelay()
      if (delay <= 0) {
        setOpen(true)
      } else {
        delayRef.current = setTimeout(() => setOpen(true), delay)
      }
    },
    [setOpen, provider]
  )

  const cancelOpen = useCallback(() => {
    clearTimeout(delayRef.current)
    setOpen(false)
  }, [setOpen])

  // Clean up timer on unmount
  useEffect(() => () => clearTimeout(delayRef.current), [])

  return (
    <Comp
      ref={triggerRef}
      type={Comp === "button" ? "button" : undefined}
      aria-describedby={open ? contentId : undefined}
      data-state={open ? "open" : "closed"}
      onPointerEnter={(e) => {
        onPointerEnterProp?.(e)
        if (!e.defaultPrevented) scheduleOpen(e.pointerType)
      }}
      onPointerLeave={(e) => {
        onPointerLeaveProp?.(e)
        if (!e.defaultPrevented) cancelOpen()
      }}
      onFocus={(e) => {
        onFocusProp?.(e)
        // Keyboard focus opens immediately — the hover delay never applies.
        if (!e.defaultPrevented) {
          clearTimeout(delayRef.current)
          setOpen(true)
        }
      }}
      onBlur={(e) => {
        onBlurProp?.(e)
        if (!e.defaultPrevented) cancelOpen()
      }}
      {...props}
    />
  )
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export function TooltipContent({
  side = "top",
  align = "center",
  sideOffset = 6,
  className,
  children,
  ...props
}) {
  const { open, triggerRef, contentRef, contentId } = useContext(TooltipContext)

  useAnchorPosition(open, triggerRef, contentRef, { side, align, sideOffset })

  // showingRef guards against redundant showPopover/hidePopover calls.
  const showingRef = useRef(false)

  // Sync React state -> native popover show/hide (popover="manual").
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
      role="tooltip"
      data-state={open ? "open" : "closed"}
      className={cn("tooltip", className)}
      {...props}
    >
      {children}
    </div>
  )
}
