import { useSyncExternalStore } from "react"
import { systemPrefersDark } from "../lib/use-color-scheme.js"

/**
 * The docs site's single source of truth for the colour scheme.
 *
 * The nav toggle and the mode-toggle demo page both drive it. They used to hold
 * separate `useState` and each write `.dark` themselves, so whichever rendered
 * last won and the other went stale — clicking one then the other appeared to
 * do nothing.
 *
 * This is site plumbing, not kit API: `lib/use-color-scheme.js` deliberately
 * owns no persistence or DOM, because a consumer already has somewhere for this
 * to live (`next-themes`, a cookie, a store). This is that somewhere, for us.
 */
let isDark = systemPrefersDark()
const listeners = new Set()

function emit() {
  document.documentElement.classList.toggle("dark", isDark)
  for (const listener of listeners) listener()
}

// Apply the initial preference before the first paint reads it.
if (typeof document !== "undefined") {
  document.documentElement.classList.toggle("dark", isDark)
}

export function setSiteDark(next) {
  if (next === isDark) return
  isDark = next
  emit()
}

export function useSiteDark() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => isDark,
    () => isDark,
  )
}
