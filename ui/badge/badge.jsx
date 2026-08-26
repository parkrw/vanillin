import { cn } from "../../lib/cn.js"

/**
 * variant: default | secondary | destructive | outline
 *          | success | warning | info | destructive-soft
 *
 * Status variants (success, warning, info, destructive-soft) use the soft
 * treatment — tinted background, coloured foreground, tinted border — so
 * they stay readable when badges cluster in dense tables.
 *
 * The original `destructive` variant is the solid red badge, kept as-is.
 * `destructive-soft` matches the other status variants'
 * visual weight.
 *
 * `glow` breathes a halo in the variant's own colour on a fixed 2s loop, for
 * the one badge on a page that means "live". Reduced motion leaves it static.
 *
 * Note: status-dot uses `error` for the same semantic state because that
 * is the console convention; badge keeps `destructive` for compatibility.
 */
export function Badge({ variant = "default", glow = false, as: Comp = "span", className, ...props }) {
  return (
    <Comp
      className={cn(
        "badge",
        variant !== "default" && `badge--${variant}`,
        glow && "badge--glow",
        className
      )}
      {...props}
    />
  )
}

function XIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

/**
 * Chip — a Badge with a dismiss affordance and a truncating label.
 *
 * This lives in `ui/badge` rather than its own slug because a chip *is* a
 * badge: same primitive, same meaning, one extra button. `Chip` renders
 * `<Badge variant="secondary" className="badge--chip">`, so the base
 * geometry, focus ring and icon sizing come from `.badge` and only the
 * pill deltas live in `.badge--chip`.
 *
 * The remove button is `tabIndex={-1}` on purpose: Tab must not walk eight
 * chips to reach the control they sit in. Consumers pair it with a
 * Backspace shortcut (see `ui/combobox`).
 *
 * Props:
 *   onRemove    – click handler for the remove button; omit for a static chip
 *   removeLabel – accessible name for that button; defaults to
 *                 `Remove <children>` when children is a string
 *   disabled    – disables the remove button (the chip itself is not focusable)
 */
export function Chip({
  onRemove,
  removeLabel,
  disabled,
  className,
  children,
  ...props
}) {
  const label =
    removeLabel ?? (typeof children === "string" ? `Remove ${children}` : "Remove")

  return (
    <Badge variant="secondary" className={cn("badge--chip", className)} {...props}>
      <span className="badge-chip-text">{children}</span>
      {onRemove && (
        <button
          type="button"
          tabIndex={-1}
          aria-label={label}
          className="badge-chip-remove"
          disabled={disabled || undefined}
          onClick={onRemove}
        >
          <XIcon />
        </button>
      )}
    </Badge>
  )
}
