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
 * expanding from that `{ x, y }` point, with a hard edge.
 *
 * `options.sunrise` — the reveal is an ellipse that grows faster vertically
 * than horizontally, so light appears to rise out of (or sink behind) the
 * `{ x, y }` origin. The incoming layer also ramps up from `SUNRISE_DIM`
 * opacity, so the swept region blends with the outgoing one and passes through
 * grey on its way — light → grey → dark, and the reverse coming back.
 *
 * Both properties are animated on the *same* pseudo-element on purpose:
 * `mask-image` would give a genuinely feathered edge but Chrome does not paint
 * masks on view-transition pseudos at all (the snapshot vanishes), while
 * `clip-path` and `opacity` both render. Verified, not assumed — if you change
 * this, check real frames, because the animation object looks correct either
 * way.
 */
export function withViewTransition(update, options = {}) {
  if (!document.startViewTransition || prefersReducedMotion()) {
    update()
    return
  }

  const transition = document.startViewTransition(() => flushSync(update))

  if (options.sunrise) {
    const { x, y } = options.sunrise
    const w = window.innerWidth
    const h = window.innerHeight

    // Cover every corner: an ellipse contains (dx, dy) when
    // (dx/rx)² + (dy/ry)² ≤ 1, and ry = rx * SUNRISE_BIAS.
    const needed = Math.max(
      ...[
        [0, 0],
        [w, 0],
        [0, h],
        [w, h],
      ].map(([cx, cy]) => Math.hypot(cx - x, (cy - y) / SUNRISE_BIAS)),
    )
    const rx = needed
    const ry = rx * SUNRISE_BIAS

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `ellipse(0px 0px at ${x}px ${y}px)`,
            `ellipse(${rx}px ${ry}px at ${x}px ${y}px)`,
          ],
          opacity: [SUNRISE_DIM, 1],
        },
        {
          duration: motionMediumMs() * SUNRISE_DURATION,
          easing: getMotionEase(),
          pseudoElement: "::view-transition-new(root)",
        },
      )
    })

    return transition
  }

  if (options.clipPath) {
    const { x, y } = options.clipPath
    // Radius = distance from click to farthest viewport corner
    const w = window.innerWidth
    const h = window.innerHeight
    const radius = Math.hypot(Math.max(x, w - x), Math.max(y, h - y))

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
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

/**
 * Sunrise tuning. `BIAS` is how much faster the ellipse grows vertically than
 * horizontally — 1 is a plain circle. `DIM` is the incoming layer's starting
 * opacity: it blends with the outgoing one, so a lower value spends longer in
 * grey. `DURATION` is a multiple of --motion-medium, so it still tracks
 * --motion-scale; raise it for more of a slow dimming bulb.
 */
const SUNRISE_BIAS = 1.6
const SUNRISE_DIM = 0.15
const SUNRISE_DURATION = 2

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
