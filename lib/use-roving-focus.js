import { useEffect } from "react"

/**
 * Roving-tabindex keyboard navigation for widget groups (tabs, radio
 * groups, menus, toolbars). Items are elements matching `selector`
 * inside `ref`; exactly one keeps tabIndex 0, arrow keys move focus.
 *
 * @param {React.RefObject} ref - container element
 * @param {object} options
 * @param {"horizontal"|"vertical"|"both"} [options.orientation]
 * @param {boolean} [options.loop]
 * @param {string} [options.selector] - default "[data-roving]"
 */
export function useRovingFocus(ref, { orientation = "horizontal", loop = true, selector = "[data-roving]" } = {}) {
  useEffect(() => {
    const node = ref.current
    if (!node) return

    const items = () =>
      Array.from(node.querySelectorAll(selector)).filter(
        (el) => !el.disabled && el.getAttribute("aria-disabled") !== "true" && !el.hidden
      )

    function syncTabIndexes(active) {
      for (const item of items()) item.tabIndex = item === active ? 0 : -1
    }

    function initialActive() {
      const list = items()
      return (
        list.find(
          (el) =>
            el.getAttribute("aria-checked") === "true" ||
            el.getAttribute("aria-selected") === "true" ||
            el.dataset.state === "on" ||
            el.dataset.state === "active"
        ) ?? list[0]
      )
    }

    syncTabIndexes(initialActive())

    function onFocusIn(event) {
      if (event.target.matches?.(selector)) syncTabIndexes(event.target)
    }

    function onKeyDown(event) {
      if (!event.target.matches?.(selector)) return

      const rtl = getComputedStyle(node).direction === "rtl"
      const horizontal = orientation === "horizontal" || orientation === "both"
      const vertical = orientation === "vertical" || orientation === "both"

      let delta = 0
      if (horizontal && event.key === "ArrowRight") delta = rtl ? -1 : 1
      else if (horizontal && event.key === "ArrowLeft") delta = rtl ? 1 : -1
      else if (vertical && event.key === "ArrowDown") delta = 1
      else if (vertical && event.key === "ArrowUp") delta = -1

      const list = items()
      if (list.length === 0) return

      let next
      if (delta !== 0) {
        const index = list.indexOf(event.target)
        let target = index + delta
        if (loop) target = (target + list.length) % list.length
        else target = Math.max(0, Math.min(list.length - 1, target))
        next = list[target]
      } else if (event.key === "Home") {
        next = list[0]
      } else if (event.key === "End") {
        next = list[list.length - 1]
      } else {
        return
      }

      event.preventDefault()
      syncTabIndexes(next)
      next.focus()
    }

    node.addEventListener("focusin", onFocusIn)
    node.addEventListener("keydown", onKeyDown)
    return () => {
      node.removeEventListener("focusin", onFocusIn)
      node.removeEventListener("keydown", onKeyDown)
    }
  }, [ref, orientation, loop, selector])
}
