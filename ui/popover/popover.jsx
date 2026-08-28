import {
  createContext,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
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

  // A dangling aria-labelledby is worse than none: it suppresses the fallback
  // naming chain, so an untitled role="dialog" announces as unnamed instead of
  // falling back to its content. PopoverTitle/PopoverDescription mint those
  // ids from children, so only a committed subtree can be checked — hence a
  // layout effect (before paint) rather than render-time state.
  const [wired, setWired] = useState({ title: true, description: true })
  const warnedRef = useRef(false)
  // Each attribute is judged on its own: `??` would let an empty
  // aria-labelledby mask a real aria-label, and an empty value of either
  // names nothing, so it must not silence the warning.
  const nonEmpty = (value) => typeof value === "string" && value.trim() !== ""
  const namedByConsumer = nonEmpty(props["aria-labelledby"]) || nonEmpty(props["aria-label"])

  // No dep array: the parts can appear or disappear on any re-render, and two
  // getElementById reads are DOM reads only, so they force no layout.
  useLayoutEffect(() => {
    // Existence is not enough: a reference to an empty element names nothing,
    // so <PopoverTitle>{undefined}</PopoverTitle> must count as absent. Element
    // content counts alongside text, because an image-only title still carries a
    // name (alt, aria-label) that textContent cannot see — unless it is aria-hidden.
    const named = (id) => {
      const el = document.getElementById(id)
      if (el === null) return false
      if (el.textContent.trim() !== "") return true
      // No text, so any name has to come from element content — and content
      // that is entirely aria-hidden is invisible to AT and names nothing.
      return Array.from(el.children).some((child) => child.getAttribute("aria-hidden") !== "true")
    }
    const title = named(titleId)
    const description = named(descriptionId)
    setWired((prev) =>
      prev.title === title && prev.description === description ? prev : { title, description }
    )
    if (process.env.NODE_ENV !== "production") {
      if (!title && !namedByConsumer && !warnedRef.current) {
        warnedRef.current = true
        console.warn(
          "<PopoverContent> has no <PopoverTitle>. Screen readers will announce an unnamed " +
            "dialog — add a PopoverTitle, or aria-label on PopoverContent."
        )
      }
    }
  })

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
      aria-labelledby={wired.title ? titleId : undefined}
      aria-describedby={wired.description ? descriptionId : undefined}
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
