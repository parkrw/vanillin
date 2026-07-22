import { createContext, useContext, useId, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useRovingFocus } from "../../lib/use-roving-focus.js"

const TabsContext = createContext(null)

/**
 * Controlled via `value` + `onValueChange`, uncontrolled via `defaultValue`.
 * Automatic activation: arrow keys move focus and activate the tab.
 */
export function Tabs({ value, defaultValue, onValueChange, className, ...props }) {
  const baseId = useId()
  const [current, setValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  return (
    <TabsContext.Provider value={{ current, setValue, baseId }}>
      <div className={cn("tabs", className)} {...props} />
    </TabsContext.Provider>
  )
}

export function TabsList({ className, ...props }) {
  const ref = useRef(null)
  useRovingFocus(ref, { orientation: "horizontal", selector: '[role="tab"]' })
  return <div ref={ref} role="tablist" className={cn("tabs-list", className)} {...props} />
}

export function TabsTrigger({ value, className, onClick, onFocus, ...props }) {
  const { current, setValue, baseId } = useContext(TabsContext)
  const active = current === value
  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-trigger-${value}`}
      aria-selected={active}
      aria-controls={`${baseId}-content-${value}`}
      data-state={active ? "active" : "inactive"}
      className={cn("tabs-trigger", className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setValue(value)
      }}
      onFocus={(event) => {
        onFocus?.(event)
        setValue(value)
      }}
      {...props}
    />
  )
}

export function TabsContent({ value, className, ...props }) {
  const { current, baseId } = useContext(TabsContext)
  if (current !== value) return null
  return (
    <div
      role="tabpanel"
      id={`${baseId}-content-${value}`}
      aria-labelledby={`${baseId}-trigger-${value}`}
      tabIndex={0}
      className={cn("tabs-content", className)}
      {...props}
    />
  )
}
