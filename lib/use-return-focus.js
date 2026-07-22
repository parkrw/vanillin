import { useEffect } from "react"

/**
 * While `enabled`, remember the element that had focus and restore it
 * when `enabled` turns false (or on unmount). Used by every overlay so
 * closing returns focus to its trigger.
 */
export function useReturnFocus(enabled) {
  useEffect(() => {
    if (!enabled) return
    const previous = document.activeElement
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus({ preventScroll: true })
      }
    }
  }, [enabled])
}
