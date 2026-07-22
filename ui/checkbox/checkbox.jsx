import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"

/**
 * Controlled via `checked` + `onCheckedChange`, uncontrolled via `defaultChecked`.
 */
export function Checkbox({
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
      role="checkbox"
      aria-checked={isChecked}
      data-state={isChecked ? "checked" : "unchecked"}
      className={cn("checkbox", className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setChecked((prev) => !prev)
      }}
      {...props}
    >
      {isChecked && (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )}
    </button>
  )
}
