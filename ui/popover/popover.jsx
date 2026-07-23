import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useAnchorPosition } from "../../lib/use-anchor-position.js"

const PopoverContext = createContext(null)
const PopoverContentContext = createContext(null)

/**
 * Controlled via `open` + `onOpenChange`, uncontrolled via `defaultOpen`.
 * Content uses the native Popover API (popover="auto") — non-modal,
 * no focus trap, native light dismiss (outside click + Esc).
 */
export function Popover({ open, defaultOpen = false, onOpenChange, children }) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const contentId = useId()

  return (
    <PopoverContext.Provider value={{ open: isOpen, setOpen, triggerRef, contentRef, contentId }}>
      {children}
    </PopoverContext.Provider>
  )
}

export function PopoverTrigger({ as: Comp = "button", onClick, ...props }) {
  const { open, setOpen, triggerRef, contentId } = useContext(PopoverContext)
  return (
    <Comp
      ref={triggerRef}
      type={Comp === "button" ? "button" : undefined}
      aria-haspopup="dialog"
      aria-expanded={open ? "true" : "false"}
      aria-controls={contentId}
      data-state={open ? "open" : "closed"}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setOpen((prev) => !prev)
      }}
      {...props}
    />
  )
}

export function PopoverContent({
  side = "bottom",
  align = "center",
  sideOffset = 4,
  className,
  children,
  ...props
}) {
  const { open, setOpen, triggerRef, contentRef, contentId } = useContext(PopoverContext)
  const baseId = useId()
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-desc`

  useAnchorPosition(open, triggerRef, contentRef, { side, align, sideOffset })

  // showingRef tracks the native popover state so the effect and the toggle
  // handler don't fight (redundant showPopover/hidePopover calls throw).
  const showingRef = useRef(false)
  const setOpenRef = useRef(setOpen)
  setOpenRef.current = setOpen

  // Attach the toggle listener once on mount. The element is always in the
  // DOM (UA hides non-open popovers with display:none), so contentRef.current
  // is stable from the first render. Only sync the "closed" case — browsers
  // may also fire newState "open" on showPopover.
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

  // Sync React state -> native popover show/hide.
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
      popover="auto"
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-state={open ? "open" : "closed"}
      className={cn("popover", className)}
      {...props}
    >
      <PopoverContentContext.Provider value={{ titleId, descriptionId }}>
        {children}
      </PopoverContentContext.Provider>
    </div>
  )
}

export function PopoverHeader({ className, ...props }) {
  return <div className={cn("popover-header", className)} {...props} />
}

export function PopoverTitle({ className, ...props }) {
  const { titleId } = useContext(PopoverContentContext)
  return <h3 id={titleId} className={cn("popover-title", className)} {...props} />
}

export function PopoverDescription({ className, ...props }) {
  const { descriptionId } = useContext(PopoverContentContext)
  return <p id={descriptionId} className={cn("popover-description", className)} {...props} />
}
