import { useEffect, useState } from "react"

/**
 * Keep an element mounted through its exit animation. Returns whether the
 * element should render. The component must flip data-state (or a class)
 * on `open` so the exit animation/transition actually runs; unmount
 * happens on animationend/transitionend, with a duration-based fallback.
 *
 * @param {boolean} open
 * @param {React.RefObject} ref - the animated element
 */
export function usePresence(open, ref) {
  const [present, setPresent] = useState(open)

  useEffect(() => {
    if (open) {
      setPresent(true)
      return
    }
    const node = ref.current
    if (!node) {
      setPresent(false)
      return
    }

    const style = getComputedStyle(node)
    const durations = [
      ...style.transitionDuration.split(","),
      ...style.animationDuration.split(","),
    ]
    const delays = [...style.transitionDelay.split(","), ...style.animationDelay.split(",")]
    const maxMs =
      Math.max(0, ...durations.map((d) => parseFloat(d) * 1000 || 0)) +
      Math.max(0, ...delays.map((d) => parseFloat(d) * 1000 || 0))

    if (maxMs === 0) {
      setPresent(false)
      return
    }

    let done = false
    const finish = (event) => {
      if (event && event.target !== node) return
      if (done) return
      done = true
      setPresent(false)
    }
    node.addEventListener("animationend", finish)
    node.addEventListener("transitionend", finish)
    const timer = setTimeout(finish, maxMs + 100)
    return () => {
      node.removeEventListener("animationend", finish)
      node.removeEventListener("transitionend", finish)
      clearTimeout(timer)
    }
  }, [open, ref])

  return present
}
