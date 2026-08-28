import { useEffect } from "react"

// Each entry drops elements explicitly removed from the tab order: an
// `a[href]` or `[contenteditable]` carrying tabindex="-1" is programmatically
// focusable but must never be a Tab stop.
const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "details > summary",
  '[contenteditable]:not([contenteditable="false"])',
  "[tabindex]",
]
  .map((selector) => `${selector}:not([tabindex="-1"])`)
  .join(", ")

// offsetParent is null for `position: fixed` and non-null for
// `visibility: hidden`, so it drops focusable children and keeps invisible
// ones — and it forces a layout read per candidate. checkVisibility answers
// the real question; the offsetParent branch is the pre-Chrome-125 fallback.
const isVisible = (el) =>
  typeof el.checkVisibility === "function"
    ? el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })
    : el.offsetParent !== null

/**
 * Trap Tab/Shift+Tab inside `ref` while `enabled`, and move focus into it
 * on activation. Fallback for overlays not built on <dialog>.showModal()
 * (which traps natively). Give the container tabindex="-1" so it can
 * receive focus when it has no focusable children.
 *
 * Focus is pulled back only when it has fallen to <body> — a deleted element,
 * a click on non-focusable padding. Focus resting on a real element outside
 * the container is left alone, so portalled descendants (a Select list, a
 * nested Popover) stay keyboard-navigable. Containing those escapes needs a
 * layer stack, which this hook does not have: nesting two enabled traps is
 * unsupported, because the later-registered one wins regardless of depth.
 *
 * Initial focus goes to `options.initialFocus`, then a literal `autofocus`
 * attribute, then the first focusable child, then the container. React never
 * emits `autofocus` — its `autoFocus` prop calls .focus() on commit instead —
 * so JSX callers wanting a specific starting element must pass `initialFocus`.
 *
 * @param {React.RefObject} ref - container element
 * @param {boolean} [enabled]
 * @param {object} [options]
 * @param {React.RefObject} [options.initialFocus] - element to focus on activation
 */
export function useFocusTrap(ref, enabled = true, { initialFocus } = {}) {
  useEffect(() => {
    const node = ref.current
    if (!enabled || !node) return

    const focusables = () =>
      Array.from(node.querySelectorAll(FOCUSABLE)).filter(
        (el) => isVisible(el) || el === document.activeElement
      )

    const initial =
      initialFocus?.current ?? node.querySelector("[autofocus]") ?? focusables()[0] ?? node
    initial.focus({ preventScroll: true })

    function onKeyDown(event) {
      if (event.key !== "Tab") return
      const active = document.activeElement
      // Focus escapes the layer whenever the focused element is deleted or a
      // click lands on non-focusable padding: it falls to <body>, where a
      // container-scoped listener never sees the next Tab and the user walks
      // straight out of the "trapped" layer.
      const escaped = !active || active === document.body || active === document.documentElement
      // Some other element holds focus — a portalled child, another layer.
      // Reaching for it here would break its own Tab handling.
      if (!escaped && !node.contains(active)) return
      const items = focusables()
      if (items.length === 0) {
        event.preventDefault()
        node.focus({ preventScroll: true })
        return
      }
      const first = items[0]
      const last = items[items.length - 1]
      if (escaped) {
        event.preventDefault()
        ;(event.shiftKey ? last : first).focus({ preventScroll: true })
      } else if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus({ preventScroll: true })
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    // Capture on document, not the container: the handler has to run even when
    // focus is outside the subtree, and a trap that stopPropagation defeats is
    // not a trap.
    document.addEventListener("keydown", onKeyDown, true)
    return () => document.removeEventListener("keydown", onKeyDown, true)
  }, [enabled, ref, initialFocus])
}
