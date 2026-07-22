import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"

/**
 * Controlled via `checked` + `onCheckedChange`, uncontrolled via `defaultChecked`.
 */
export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  className,
  onClick,
  ...props
}) {
  const [isChecked, setChecked] = useControllableState({
    value: checked,
    defaultValue: defaultChecked,
    onChange: onCheckedChange,
  })
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn("switch", className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setChecked((prev) => !prev)
      }}
      {...props}
    >
      <span className="switch-thumb" />
    </button>
  )
}
