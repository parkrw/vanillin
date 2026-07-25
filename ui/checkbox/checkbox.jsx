import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"

/**
 * Controlled via `checked` + `onCheckedChange`, uncontrolled via `defaultChecked`.
 * `checked` accepts `true`, `false`, or `"indeterminate"` (tri-state).
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

  const dataState =
    isChecked === "indeterminate" ? "indeterminate" : isChecked ? "checked" : "unchecked"

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isChecked === "indeterminate" ? "mixed" : isChecked}
      data-state={dataState}
      className={cn("checkbox", className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented)
          setChecked((prev) => (prev === "indeterminate" ? true : !prev))
      }}
      {...props}
    >
      {isChecked === "indeterminate" ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14" />
        </svg>
      ) : isChecked ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      ) : null}
    </button>
  )
}
