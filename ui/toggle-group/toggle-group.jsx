import { createContext, useContext, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useRovingFocus } from "../../lib/use-roving-focus.js"

const ToggleGroupContext = createContext(null)

/**
 * type: single (value is a string, click active item to deselect)
 *       | multiple (value is an array)
 * variant/size: forwarded to every item (same values as Toggle).
 * Controlled via `value` + `onValueChange`, uncontrolled via `defaultValue`.
 * Items reuse toggle.css — import it alongside toggle-group.css.
 */
export function ToggleGroup({
  type = "single",
  value,
  defaultValue,
  onValueChange,
  variant = "default",
  size = "default",
  disabled = false,
  className,
  ...props
}) {
  const ref = useRef(null)
  const [current, setValue] = useControllableState({
    value,
    defaultValue: defaultValue ?? (type === "multiple" ? [] : ""),
    onChange: onValueChange,
  })
  useRovingFocus(ref, { selector: ".toggle-group-item" })
  return (
    <ToggleGroupContext.Provider value={{ type, current, setValue, variant, size, disabled }}>
      <div ref={ref} role="group" className={cn("toggle-group", className)} {...props} />
    </ToggleGroupContext.Provider>
  )
}

export function ToggleGroupItem({ value, disabled, className, onClick, ...props }) {
  const group = useContext(ToggleGroupContext)
  const pressed =
    group.type === "multiple" ? group.current.includes(value) : group.current === value
  return (
    <button
      type="button"
      disabled={disabled || group.disabled}
      aria-pressed={pressed}
      data-state={pressed ? "on" : "off"}
      className={cn(
        "toggle",
        group.variant !== "default" && `toggle--${group.variant}`,
        group.size !== "default" && `toggle--${group.size}`,
        "toggle-group-item",
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        if (group.type === "multiple") {
          group.setValue((prev) =>
            prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
          )
        } else {
          group.setValue((prev) => (prev === value ? "" : value))
        }
      }}
      {...props}
    />
  )
}
