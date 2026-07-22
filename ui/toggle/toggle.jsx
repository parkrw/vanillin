import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"

/**
 * variant: default | outline
 * size: default | sm | lg
 * Controlled via `pressed` + `onPressedChange`, uncontrolled via `defaultPressed`.
 */
export function Toggle({
  pressed,
  defaultPressed = false,
  onPressedChange,
  variant = "default",
  size = "default",
  className,
  onClick,
  ...props
}) {
  const [isPressed, setPressed] = useControllableState({
    value: pressed,
    defaultValue: defaultPressed,
    onChange: onPressedChange,
  })
  return (
    <button
      type="button"
      aria-pressed={isPressed}
      data-state={isPressed ? "on" : "off"}
      className={cn(
        "toggle",
        variant !== "default" && `toggle--${variant}`,
        size !== "default" && `toggle--${size}`,
        className
      )}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setPressed((prev) => !prev)
      }}
      {...props}
    />
  )
}
