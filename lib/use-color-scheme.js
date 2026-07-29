import { useCallback } from "react"
import { useControllableState } from "./use-controllable-state.js"

/**
 * Dark/light state for a mode toggle.
 *
 * Deliberately owns **no persistence and no DOM**. It does not write `.dark`,
 * touch localStorage, or read a cookie — an app on `next-themes` already does
 * all three, and a hook that repeated them would fight it. Wire `onChange` to
 * whatever the app already uses; the kit only tracks the boolean.
 *
 *   const { isDark, toggle } = useColorScheme({
 *     value: theme === "dark",
 *     onChange: (dark) => setTheme(dark ? "dark" : "light"),
 *   })
 *
 * The scheme swap itself is **instant**, on purpose. A page-wide reveal
 * (`withViewTransition`) was tried and removed: the only reveal Chrome paints on
 * a root view-transition pseudo is a hard-edged `clip-path`, and a growing
 * circle cannot be timed to feel the same on a 14" 120Hz laptop and a 27"
 * 60Hz display at once — every easing that settled one made the other worse.
 * The feedback lives in the toggle instead, where its size is fixed.
 */
export function useColorScheme({ value, defaultValue = false, onChange } = {}) {
  const [isDark, setDark] = useControllableState({
    value,
    defaultValue,
    onChange,
  })

  const toggle = useCallback(() => setDark((previous) => !previous), [setDark])

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
