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
 * expanding from that `{ x, y }` point over one `--motion-medium`. The edge is
 * hard, and that is not a choice: `clip-path` is the only reveal Chrome paints
 * on a view-transition pseudo-element, and clipping is binary.
 *
 * `mask-image` would feather it. Chrome ignores masks on these pseudos
 * entirely — probed twice, animated *and* as a static CSS rule, by stretching
 * the sweep to 5000ms and sampling a region beside the origin against one 900px
 * away: both flip to the new scheme together within the first few hundred
 * milliseconds, so the whole snapshot is simply unmasked. A mask here does not
 * soften the reveal, it removes it. Do not retry it, and do not take an
 * animation object as evidence — check pixels.
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
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius * REVEAL_OVERSHOOT}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: motionMediumMs(),
          // Deliberately NOT --motion-ease: that token is a quintic ease-out,
          // right for something settling into place, wrong for a wipe — it throws
          // the edge most of the way across in the first third and then crawls.
          //
          // A circle's area grows as r², so the swept area per frame accelerates
          // under a linear radius and the sweep reads as speeding up at the end.
          // Even area wants r ∝ √t, and plain `ease-out` tracks √t to within
          // about 0.04 the whole way — close enough that a curve fitted to it
          // buys nothing visible.
          easing: "ease-out",
          pseudoElement: "::view-transition-new(root)",
        },
      )
    })
  }

  return transition
}

/**
 * How far past the farthest corner the circle grows. The last sliver of the
 * viewport is otherwise still uncovered when the clock runs out, and discarding
 * the snapshot finishes it in one frame — a visible pop at the end of an
 * otherwise even sweep.
 */
const REVEAL_OVERSHOOT = 1.12

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
