import { useEffect } from "react"

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(", ")

/**
 * Trap Tab/Shift+Tab inside `ref` while `enabled`, and move focus into it
 * on activation. Fallback for overlays not built on <dialog>.showModal()
 * (which traps natively). Give the container tabindex="-1" so it can
 * receive focus when it has no focusable children.
 */
export function useFocusTrap(ref, enabled = true) {
  useEffect(() => {
    const node = ref.current
    if (!enabled || !node) return

    const focusables = () =>
      Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      )

    const initial = node.querySelector("[autofocus]") ?? focusables()[0] ?? node
    initial.focus({ preventScroll: true })

    function onKeyDown(event) {
      if (event.key !== "Tab") return
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    node.addEventListener("keydown", onKeyDown)
    return () => node.removeEventListener("keydown", onKeyDown)
  }, [enabled, ref])
}
