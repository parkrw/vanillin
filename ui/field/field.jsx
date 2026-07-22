import { cn } from "../../lib/cn.js"

/**
 * orientation: vertical | horizontal | responsive
 * data-invalid set when invalid — styles label/description via CSS
 */
export function Field({ orientation = "vertical", className, ...props }) {
  return (
    <div
      role="group"
      data-orientation={orientation}
      className={cn(
        "field",
        orientation !== "vertical" && `field--${orientation}`,
        className
      )}
      {...props}
    />
  )
}

export function FieldGroup({ className, ...props }) {
  return <div className={cn("field-group", className)} {...props} />
}

export function FieldSet({ className, ...props }) {
  return <fieldset className={cn("field-set", className)} {...props} />
}

/**
 * variant: legend | label — label matches .field-label sizing
 */
export function FieldLegend({ variant = "legend", className, ...props }) {
  return (
    <legend
      className={cn(
        "field-legend",
        variant !== "legend" && `field-legend--${variant}`,
        className
      )}
      {...props}
    />
  )
}

/* Reuses .label (ui/label) — demo/consumer imports label.css alongside field.css. */
export function FieldLabel({ className, ...props }) {
  return <label className={cn("label", "field-label", className)} {...props} />
}

export function FieldTitle({ className, ...props }) {
  return <div className={cn("field-title", className)} {...props} />
}

export function FieldContent({ className, ...props }) {
  return <div className={cn("field-content", className)} {...props} />
}

export function FieldDescription({ className, ...props }) {
  return <p className={cn("field-description", className)} {...props} />
}

/**
 * errors: array of { message } (falsy entries skipped); children take
 * precedence. Renders nothing when there is nothing to show.
 */
export function FieldError({ errors, children, className, ...props }) {
  let content = children
  if (!content && errors) {
    const messages = errors.filter(Boolean).map((e) => e.message)
    if (messages.length === 1) content = messages[0]
    else if (messages.length > 1)
      content = (
        <ul className="field-error-list">
          {messages.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )
  }
  if (!content) return null
  return (
    <div role="alert" className={cn("field-error", className)} {...props}>
      {content}
    </div>
  )
}

/** Optional children render as inline content over the line (like "or"). */
export function FieldSeparator({ children, className, ...props }) {
  return (
    <div
      role={children ? "none" : "separator"}
      className={cn("field-separator", className)}
      {...props}
    >
      {children && <span className="field-separator-content">{children}</span>}
    </div>
  )
}
