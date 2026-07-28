import { flushSync } from "react-dom"

/** True when the user prefers reduced motion (live query). */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/**
 * Run `update` inside a View Transition when the API is available and
 * the user has not requested reduced motion. Falls back to a plain call
 * when unsupported or when motion is reduced — the update always runs.
 *
 * `options.clipPath` — if set, the new snapshot is revealed by a circle
 * expanding from that `{ x, y }` point. The edge is a soft gradient, not a
 * hard boundary: the reveal is a radial-gradient mask whose opaque core is
 * followed by a feathered band, so the leading edge fades from opaque to
 * transparent in both directions of the swap.
 */
export function withViewTransition(update, options = {}) {
  if (!document.startViewTransition || prefersReducedMotion()) {
    update()
    return
  }

  const transition = document.startViewTransition(() => flushSync(update))

  if (options.clipPath) {
    const { x, y } = options.clipPath
    // Radius = distance from click to farthest viewport corner
    const w = window.innerWidth
    const h = window.innerHeight
    const radius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y))

    transition.ready.then(() => {
      const root = document.documentElement
      // The soft band sits between CORE and 100% of the circle, so the opaque
      // core only reaches `radius` if the circle overshoots it by 1/CORE.
      // Without the overshoot the sweep ends mid-feather and the last frame
      // pops as the snapshot is discarded.
      const reveal = (r) =>
        `radial-gradient(circle ${r}px at ${x}px ${y}px, ` +
        `#000 ${FEATHER_CORE * 100}%, #0000 100%)`

      root.animate(
        {
          maskImage: [reveal(0), reveal(radius / FEATHER_CORE)],
          // Chrome still needs the prefixed property for masks on
          // view-transition pseudo-elements.
          WebkitMaskImage: [reveal(0), reveal(radius / FEATHER_CORE)],
        },
        {
          duration: motionMediumMs(),
          easing: getMotionEase(),
          pseudoElement: "::view-transition-new(root)",
        },
      )
    })
  }

  return transition
}

/** Opaque fraction of the reveal circle; the rest is the feathered edge. */
const FEATHER_CORE = 0.8

/**
 * Set `view-transition-name` on an element, ensuring uniqueness. Call
 * the returned cleanup function after the transition to remove it.
 */
export function setTransitionName(element, name) {
  element.style.viewTransitionName = name
  return () => {
    element.style.viewTransitionName = ""
  }
}

/**
 * Read --motion-medium as milliseconds, falling back to 200ms.
 *
 * The duration tokens are `calc(200ms * var(--motion-scale))` and are not
 * `@property`-registered, so `getPropertyValue` hands back that literal string
 * and `parseFloat` gives NaN. Normalising through a real CSS property is the
 * only way to get a number out — and it is what makes the sweep track
 * `--motion-scale` like every other animation in the kit.
 */
function motionMediumMs() {
  const root = document.documentElement
  const previous = root.style.animationDuration
  root.style.animationDuration = "var(--motion-medium)"
  const seconds = parseFloat(getComputedStyle(root).animationDuration)
  root.style.animationDuration = previous
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 200
}

/** Read --motion-ease from the root element, falling back to ease-out. */
function getMotionEase() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--motion-ease")
      .trim() || "ease-out"
  )
}
