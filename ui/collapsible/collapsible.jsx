import { createContext, useContext, useId, useLayoutEffect, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { usePresence } from "../../lib/use-presence.js"

const CollapsibleContext = createContext(null)

/**
 * Controlled via `open` + `onOpenChange`, uncontrolled via `defaultOpen`.
 */
export function Collapsible({
  open,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  className,
  ...props
}) {
  const contentId = useId()
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  return (
    <CollapsibleContext.Provider value={{ open: isOpen, setOpen, disabled, contentId }}>
      <div
        data-state={isOpen ? "open" : "closed"}
        className={cn("collapsible", className)}
        {...props}
      />
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger({ as: Comp = "button", className, onClick, ...props }) {
  const { open, setOpen, disabled, contentId } = useContext(CollapsibleContext)
  return (
    <Comp
      type={Comp === "button" ? "button" : undefined}
      aria-expanded={open}
      aria-controls={contentId}
      data-state={open ? "open" : "closed"}
      disabled={disabled || undefined}
      className={cn("collapsible-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setOpen((prev) => !prev)
      }}
      {...props}
    />
  )
}

export function CollapsibleContent({ className, ...props }) {
  const { open, contentId } = useContext(CollapsibleContext)
  const ref = useRef(null)
  const present = usePresence(open, ref)

  // The open/close keyframes animate to/from the measured content height.
  // scrollHeight is integer-rounded, so fractional content lands the animation
  // on a sub-pixel step; measure the real box with the animation suppressed
  // for the frame instead (layout effects run before paint, so nothing shows).
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const prev = node.style.animation
    node.style.animation = "none"
    const height = node.getBoundingClientRect().height
    node.style.animation = prev
    node.style.setProperty("--collapsible-content-height", `${height}px`)
  }, [present])

  if (!present) return null
  return (
    <div
      ref={ref}
      id={contentId}
      data-state={open ? "open" : "closed"}
      className={cn("collapsible-content", className)}
      {...props}
    />
  )
}
