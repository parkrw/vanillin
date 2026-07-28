import { useCallback } from "react"
import { useControllableState } from "./use-controllable-state.js"
import { withViewTransition } from "./view-transition.js"

/**
 * Dark/light state for a mode toggle.
 *
 * Deliberately owns **no persistence and no DOM**. It does not write `.dark`,
 * touch localStorage, or read a cookie — an app on `next-themes` already does
 * all three, and a hook that repeated them would fight it. Wire `onChange` to
 * whatever the app already uses; the kit only tracks the boolean and drives the
 * transition.
 *
 *   const { isDark, toggle } = useColorScheme({
 *     value: theme === "dark",
 *     onChange: (dark) => setTheme(dark ? "dark" : "light"),
 *   })
 *
 * `toggle(event)` runs the change inside a View Transition when the event
 * carries a position, so the sweep can originate from whatever was clicked.
 * Pass `transition: false` to opt out and get a plain state update.
 */
export function useColorScheme({
  value,
  defaultValue = false,
  onChange,
  transition = true,
} = {}) {
  const [isDark, setDark] = useControllableState({
    value,
    defaultValue,
    onChange,
  })

  const toggle = useCallback(
    (event) => {
      const flip = () => setDark((previous) => !previous)
      if (!transition) {
        flip()
        return
      }
      withViewTransition(flip, { sunrise: originOf(event) })
    },
    [setDark, transition],
  )

  return { isDark, toggle, setDark }
}

/**
 * Whether the OS asks for a dark UI right now. Use it to seed an uncontrolled
 * toggle so the first paint matches the user's system preference:
 *
 *   <ModeToggle defaultIsDark={systemPrefersDark()} />
 *
 * Deliberately a plain read, not a subscription — following the OS live would
 * override a choice the user just made by hand.
 */
export function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches === true
  )
}

/**
 * Centre of the element that produced `event`, for the sweep origin. Falls
 * back to the viewport centre when called without an event (keyboard-driven
 * toggles from elsewhere, tests, programmatic flips).
 */
function originOf(event) {
  const target = event?.currentTarget
  if (!target?.getBoundingClientRect) {
    return { x: window.innerWidth / 2, y: 0 }
  }
  const rect = target.getBoundingClientRect()
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
}
