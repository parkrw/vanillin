import { useId } from "react"

import { cn } from "../../lib/cn.js"
import { useColorScheme } from "../../lib/use-color-scheme.js"

/**
 * Icon button that swaps the colour scheme, revealing the new one with the
 * sunrise sweep from `lib/view-transition.js`.
 *
 * It renders **one** control — a button — on purpose. Driving the swap from a
 * Switch or Checkbox instead is a two-line composition over the same hook, so
 * pulling those components in here would hand every consumer three components
 * for one copied file:
 *
 *   const { isDark, toggle } = useColorScheme({ value, onChange })
 *   <Switch checked={isDark} onCheckedChange={() => toggle()} />
 *
 * State is controlled (`isDark` + `onIsDarkChange`) or uncontrolled
 * (`defaultIsDark`). **Applying the scheme is the consumer's job** — this does
 * not write `.dark` or persist anything, so it cannot fight `next-themes`.
 */
export function ModeToggle({
  isDark,
  defaultIsDark = false,
  onIsDarkChange,
  transition = true,
  labels = { toDark: "Switch to dark mode", toLight: "Switch to light mode" },
  className,
  onClick,
  children,
  ...props
}) {
  const { isDark: dark, toggle } = useColorScheme({
    value: isDark,
    defaultValue: defaultIsDark,
    onChange: onIsDarkChange,
    transition,
  })

  return (
    <button
      type="button"
      aria-pressed={dark}
      aria-label={dark ? labels.toLight : labels.toDark}
      data-state={dark ? "dark" : "light"}
      className={cn("mode-toggle", className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) toggle(event)
      }}
      {...props}
    >
      {children ?? <ModeToggleIcon />}
    </button>
  )
}

/**
 * Default sun/moon glyph. One path set, crossfaded by `data-state` on the
 * parent — the rays retract and the crescent mask slides in, so the icon reads
 * as the same light source dimming rather than two swapped pictures.
 */
export function ModeToggleIcon({ className, ...props }) {
  const maskId = useId()
  return (
    <svg
      className={cn("mode-toggle-icon", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      {...props}
    >
      <mask id={maskId}>
        <rect width="24" height="24" fill="white" />
        {/* Parked outside the orb in light mode; slides across to bite the
            crescent out of it in dark mode. */}
        <circle className="mode-toggle-crescent" cx="12" cy="12" r="6" fill="black" />
      </mask>
      {/* Filled, not stroked: masking a stroke ring leaves a thin arc rather
          than a crescent. */}
      <circle
        className="mode-toggle-orb"
        cx="12"
        cy="12"
        r="5"
        fill="currentColor"
        stroke="none"
        mask={`url(#${maskId})`}
      />
      <g className="mode-toggle-rays">
        <path d="M12 1v2" />
        <path d="M12 21v2" />
        <path d="M4.22 4.22l1.42 1.42" />
        <path d="M18.36 18.36l1.42 1.42" />
        <path d="M1 12h2" />
        <path d="M21 12h2" />
        <path d="M4.22 19.78l1.42-1.42" />
        <path d="M18.36 5.64l1.42-1.42" />
      </g>
    </svg>
  )
}
