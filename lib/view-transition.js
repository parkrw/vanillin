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
 * `options.clipPath` — if set, the new snapshot is revealed with a
 * `clip-path: circle()` expanding from that `{ x, y }` point.
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
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: parseMotionMedium(),
          easing: getMotionEase(),
          pseudoElement: "::view-transition-new(root)",
        },
      )
    })
  }

  return transition
}

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

/** Read --motion-medium from the root element, falling back to 200ms. */
function parseMotionMedium() {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--motion-medium")
    .trim()
  const ms = parseFloat(raw)
  return Number.isFinite(ms) ? ms : 200
}

/** Read --motion-ease from the root element, falling back to ease-out. */
function getMotionEase() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--motion-ease")
      .trim() || "ease-out"
  )
}
