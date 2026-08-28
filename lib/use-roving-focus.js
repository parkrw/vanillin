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

    const allItems = () => Array.from(node.querySelectorAll(selector))
    const items = () =>
      allItems().filter(
        (el) => !el.disabled && el.getAttribute("aria-disabled") !== "true" && !el.hidden
      )

    let active = null

    // Every match is written, not just the eligible ones: an item that becomes
    // disabled while holding tabIndex 0 would otherwise keep the group's only
    // tab stop on a control the user cannot operate.
    function syncTabIndexes(next) {
      active = next ?? null
      for (const item of allItems()) item.tabIndex = item === active ? 0 : -1
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

    // getComputedStyle forces a style recalc, so direction is read once per
    // effect run and refreshed on focusin, not on every arrow press.
    let rtl = getComputedStyle(node).direction === "rtl"

    syncTabIndexes(initialActive())

    // Items mount, unmount and change eligibility long after the effect ran — a
    // tab closes, a toolbar button appears, an item goes aria-disabled. Without
    // re-syncing, the item holding tabIndex 0 can leave the set and strand every
    // survivor at -1, which makes the whole group unreachable by Tab (WCAG
    // 2.1.1). tabindex is deliberately outside the attribute filter, so the sync
    // below cannot retrigger the observer.
    let known = items()
    const sameSet = (a, b) => a.length === b.length && a.every((el, index) => el === b[index])
    const observer = new MutationObserver(() => {
      const list = items()
      if (sameSet(list, known)) return
      known = list
      syncTabIndexes(list.includes(active) ? active : initialActive())
    })
    observer.observe(node, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["disabled", "aria-disabled", "hidden"],
    })

    function onFocusIn(event) {
      rtl = getComputedStyle(node).direction === "rtl"
      if (event.target.matches?.(selector)) syncTabIndexes(event.target)
    }

    function onKeyDown(event) {
      if (!event.target.matches?.(selector)) return

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
      observer.disconnect()
      node.removeEventListener("focusin", onFocusIn)
      node.removeEventListener("keydown", onKeyDown)
    }
  }, [ref, orientation, loop, selector])
}
