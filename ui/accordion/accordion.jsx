import { createContext, useContext, useId, useLayoutEffect, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { usePresence } from "../../lib/use-presence.js"

const AccordionContext = createContext(null)
const AccordionItemContext = createContext(null)

/**
 * type: single | multiple. `value` is a string for single, an array for
 * multiple. `collapsible` (single only) allows closing the open item.
 * Controlled via `value` + `onValueChange`, uncontrolled via `defaultValue`.
 * Arrow keys move focus between triggers; all triggers stay tabbable.
 */
export function Accordion({
  type = "single",
  collapsible = false,
  value,
  defaultValue,
  onValueChange,
  className,
  onKeyDown,
  ...props
}) {
  const ref = useRef(null)
  const [current, setValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? (type === "multiple" ? [] : ""),
    onChange: onValueChange,
  })

  const isOpen = (itemValue) =>
    type === "multiple" ? (current ?? []).includes(itemValue) : current === itemValue

  const toggleValue = (itemValue) => {
    setValue((prev) => {
      if (type === "multiple") {
        const list = prev ?? []
        return list.includes(itemValue) ? list.filter((v) => v !== itemValue) : [...list, itemValue]
      }
      if (prev === itemValue) return collapsible ? "" : prev
      return itemValue
    })
  }

  return (
    <AccordionContext.Provider value={{ isOpen, toggleValue }}>
      <div
        ref={ref}
        className={cn("accordion", className)}
        onKeyDown={(event) => {
          onKeyDown?.(event)
          if (event.defaultPrevented) return
          if (!event.target.classList?.contains("accordion-trigger")) return
          const triggers = Array.from(
            ref.current.querySelectorAll(".accordion-trigger:not(:disabled)")
          )
          const index = triggers.indexOf(event.target)
          let next
          if (event.key === "ArrowDown") next = triggers[(index + 1) % triggers.length]
          else if (event.key === "ArrowUp")
            next = triggers[(index - 1 + triggers.length) % triggers.length]
          else if (event.key === "Home") next = triggers[0]
          else if (event.key === "End") next = triggers[triggers.length - 1]
          else return
          event.preventDefault()
          next?.focus()
        }}
        {...props}
      />
    </AccordionContext.Provider>
  )
}

export function AccordionItem({ value, disabled = false, className, ...props }) {
  const baseId = useId()
  const { isOpen } = useContext(AccordionContext)
  const open = isOpen(value)
  return (
    <AccordionItemContext.Provider
      value={{
        value,
        open,
        disabled,
        triggerId: `${baseId}-trigger`,
        contentId: `${baseId}-content`,
      }}
    >
      <div
        data-state={open ? "open" : "closed"}
        className={cn("accordion-item", className)}
        {...props}
      />
    </AccordionItemContext.Provider>
  )
}

export function AccordionTrigger({ className, children, onClick, ...props }) {
  const { toggleValue } = useContext(AccordionContext)
  const { value, open, disabled, triggerId, contentId } = useContext(AccordionItemContext)
  return (
    <h3 className="accordion-header">
      <button
        type="button"
        id={triggerId}
        aria-expanded={open}
        aria-controls={contentId}
        data-state={open ? "open" : "closed"}
        disabled={disabled}
        className={cn("accordion-trigger", className)}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) toggleValue(value)
        }}
        {...props}
      >
        {children}
        <svg
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
      </button>
    </h3>
  )
}

export function AccordionContent({ className, children, ...props }) {
  const { open, triggerId, contentId } = useContext(AccordionItemContext)
  const ref = useRef(null)
  const present = usePresence(open, ref)

  // The open/close keyframes animate to/from the measured content height;
  // scrollHeight is stable even while the element's own height is animating.
  useLayoutEffect(() => {
    const node = ref.current
    if (node) node.style.setProperty("--accordion-content-height", `${node.scrollHeight}px`)
  }, [present])

  if (!present) return null
  return (
    <div
      ref={ref}
      role="region"
      id={contentId}
      aria-labelledby={triggerId}
      data-state={open ? "open" : "closed"}
      className="accordion-content"
      {...props}
    >
      <div className={cn("accordion-content-inner", className)}>{children}</div>
    </div>
  )
}
