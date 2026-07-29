import { cn } from "../../lib/cn.js"
import { useColorScheme } from "../../lib/use-color-scheme.js"

/**
 * Icon button that swaps the colour scheme. A table lamp: it rocks on its foot
 * as if the pull chain had been yanked, and the light goes out.
 *
 * The scheme swap is instant — the feedback is all inside the button. A
 * page-wide reveal was tried first and removed; see `lib/use-color-scheme.js`
 * for why a growing circle cannot be timed for every display at once.
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
        if (event.defaultPrevented) return
        swing(event.currentTarget)
        toggle()
      }}
      {...props}
    >
      {children ?? <ModeToggleIcon />}
    </button>
  )
}

/**
 * Restart the swing.
 *
 * The keyframes live in CSS so the swing tracks `--motion-scale` and
 * `--motion-ease` like the rest of the kit, and reduced motion switches it off
 * in a media query rather than a branch here. All this does is re-trigger it:
 * remove the class, read a layout property to force the removal to take effect,
 * add it back. Without that read the browser coalesces both mutations into one
 * style pass, sees no change, and the animation does not replay on a second
 * click.
 *
 * The class is dropped again on `animationend`. Leaving it on looks harmless but
 * is not: the rule's duration is `calc(var(--motion-medium) * 1.4)`, so a live
 * theme control that changes `--motion-scale` would give every finished
 * animation a new active phase and set the lamps rocking on their own.
 *
 * Queried rather than held in a ref so a custom `children` glyph can opt in by
 * carrying the same class.
 */
function swing(button) {
  const lamp = button.querySelector(".mode-toggle-lamp")
  if (!lamp) return
  lamp.classList.remove(SWINGING)
  void lamp.getBoundingClientRect()
  lamp.classList.add(SWINGING)
  lamp.addEventListener("animationend", () => lamp.classList.remove(SWINGING), {
    once: true,
  })
}

const SWINGING = "mode-toggle-lamp--swing"

/**
 * Default table-lamp glyph, standing on the bottom of the viewBox so the whole
 * lamp rocks about its foot. `data-state` on the parent turns the light off, and
 * it is meant to be unmissable: lit, the shade is filled and throws a wash of
 * light across the table; off, it is a bare outline.
 */
export function ModeToggleIcon({ className, ...props }) {
  return (
    <svg
      className={cn("mode-toggle-icon", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <g className="mode-toggle-lamp">
        {/* Drawn first so the stem and foot sit on top of the light, and filled
            rather than stroked: at 20px a 2px ray reads as noise, a solid cone
            reads as light. */}
        <path
          className="mode-toggle-glow"
          d="M5.5 11.5L2 21h20l-3.5-9.5z"
          fill="currentColor"
          stroke="none"
        />
        <path className="mode-toggle-stem" d="M12 11v9" />
        <path className="mode-toggle-foot" d="M8.5 20.5h7" />
        {/* Left unfilled in both schemes. Filling it to mean "lit" only works in
            dark mode — in light mode a solid shade is a near-black blob, which
            reads as the lamp being *more* off. A bulb drawn inside it does not
            survive either: at 20px the dot merges with the shade outline and the
            whole glyph turns muddy. The cone alone carries on/off, and it is the
            one part that stays legible small. */}
        <path className="mode-toggle-shade" d="M8.5 3.5h7l3 7.5H5.5z" />
      </g>
    </svg>
  )
}
