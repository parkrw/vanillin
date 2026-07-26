import { cn } from "../../lib/cn.js"

const STATUS_LABELS = {
  success: "Success",
  warning: "Warning",
  error: "Error",
  info: "Info",
  neutral: "Neutral",
  pending: "Pending",
}

/**
 * status: success | warning | error | info | neutral | pending
 * size: sm | default | lg
 *
 * A small coloured indicator for use in tables, resource lists, and
 * anywhere a concise visual state signal is needed without a label.
 *
 * Accessibility: renders `role="img"` with an `aria-label` derived from
 * `status` by default (overridable via `label`). When the dot sits next
 * to visible text that already names the state, pass `label={null}` to
 * get `aria-hidden="true"` instead.
 *
 * `pending` pulses behind a `prefers-reduced-motion` guard. As an
 * indeterminate loop it does not use `--motion-scale`.
 *
 * `ring` draws a soft halo for the "live / running" look.
 *
 * Note: uses `error` (the console convention) for the same semantic
 * state that Badge calls `destructive` (shadcn parity). The `error`
 * status maps to `--destructive-*` tokens.
 */
export function StatusDot({
  status = "neutral",
  size = "default",
  label,
  ring = false,
  className,
  ...props
}) {
  const isHidden = label === null
  const resolvedLabel = label ?? STATUS_LABELS[status] ?? status

  return (
    <span
      className={cn(
        "status-dot",
        size !== "default" && `status-dot--${size}`,
        ring && "status-dot--ring",
        className,
      )}
      data-status={status}
      {...(isHidden
        ? { "aria-hidden": "true" }
        : { role: "img", "aria-label": resolvedLabel })}
      {...props}
    />
  )
}
