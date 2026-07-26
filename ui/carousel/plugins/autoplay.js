/**
 * Autoplay plugin for the vanillin carousel.
 *
 * Usage:
 *   import { Autoplay } from "../ui/carousel/plugins/autoplay.js"
 *   <Carousel plugins={[Autoplay({ delay: 4000 })]} />
 *
 * Options:
 *   delay        – ms between advances (default 4000). Fixed literal, NOT a
 *                  motion token — autoplay must not track --motion-scale.
 *   stopOnHover  – pause while the pointer hovers the carousel (default true).
 *
 * Pause conditions (always active):
 *   - Pointer hover (when stopOnHover is true)
 *   - Focus within the carousel
 *   - Page hidden (visibilitychange)
 *   - prefers-reduced-motion: reduce — autoplay never starts at all.
 *
 * Contract: { name, init(api, opts), destroy() }
 */

export function Autoplay({ delay = 4000, stopOnHover = true } = {}) {
  let timer = null
  let api = null
  let root = null
  let paused = { hover: false, focus: false, hidden: false }
  let destroyed = false

  const reducedMotion = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches

  const clear = () => {
    if (timer != null) { clearInterval(timer); timer = null }
  }

  const tick = () => {
    if (!api) return
    api.scrollNext()
  }

  const start = () => {
    if (destroyed || reducedMotion()) return
    if (paused.hover || paused.focus || paused.hidden) return
    clear()
    timer = setInterval(tick, delay)
  }

  const evaluate = () => {
    if (paused.hover || paused.focus || paused.hidden) clear()
    else start()
  }

  /* ---- event handlers ---- */

  const onPointerEnter = () => { paused.hover = true; evaluate() }
  const onPointerLeave = () => { paused.hover = false; evaluate() }
  const onFocusIn = () => { paused.focus = true; evaluate() }
  const onFocusOut = (e) => {
    if (root && !root.contains(e.relatedTarget)) {
      paused.focus = false
      evaluate()
    }
  }
  const onVisibilityChange = () => {
    paused.hidden = document.hidden
    evaluate()
  }

  return {
    name: "autoplay",
    init(_api) {
      api = _api
      destroyed = false
      paused = { hover: false, focus: false, hidden: document.hidden }

      if (reducedMotion()) return

      root = api.rootNode()
      if (!root) return

      if (stopOnHover) {
        root.addEventListener("pointerenter", onPointerEnter)
        root.addEventListener("pointerleave", onPointerLeave)
      }
      root.addEventListener("focusin", onFocusIn)
      root.addEventListener("focusout", onFocusOut)
      document.addEventListener("visibilitychange", onVisibilityChange)

      start()
    },
    destroy() {
      destroyed = true
      clear()
      if (root) {
        root.removeEventListener("pointerenter", onPointerEnter)
        root.removeEventListener("pointerleave", onPointerLeave)
        root.removeEventListener("focusin", onFocusIn)
        root.removeEventListener("focusout", onFocusOut)
      }
      document.removeEventListener("visibilitychange", onVisibilityChange)
      root = null
      api = null
    },
  }
}
