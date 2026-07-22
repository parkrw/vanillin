import { createContext, useContext, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useRovingFocus } from "../../lib/use-roving-focus.js"

const RadioGroupContext = createContext(null)

/**
 * Controlled via `value` + `onValueChange`, uncontrolled via `defaultValue`.
 * Arrow keys move focus and select (roving tabindex).
 */
export function RadioGroup({ value, defaultValue, onValueChange, className, ...props }) {
  const ref = useRef(null)
  const [current, setValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  useRovingFocus(ref, { orientation: "both", selector: '[role="radio"]' })
  return (
    <RadioGroupContext.Provider value={{ current, setValue }}>
      <div ref={ref} role="radiogroup" className={cn("radio-group", className)} {...props} />
    </RadioGroupContext.Provider>
  )
}

export function RadioGroupItem({ value, className, onClick, onFocus, ...props }) {
  const { current, setValue } = useContext(RadioGroupContext)
  const checked = current === value
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      className={cn("radio-group-item", className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setValue(value)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        setValue(value)
      }}
      {...props}
    >
      <span className="radio-group-indicator" />
    </button>
  )
}
