import { useCallback, useRef, useState } from "react"

/**
 * Controlled/uncontrolled state. Controlled when `value` !== undefined;
 * otherwise internal state seeded with `defaultValue`. `onChange` fires
 * on every change in both modes.
 */
export function useControllableState({ value, defaultValue, onChange }) {
  const [internal, setInternal] = useState(defaultValue)
  const isControlled = value !== undefined
  const current = isControlled ? value : internal

  const currentRef = useRef(current)
  currentRef.current = current
  const isControlledRef = useRef(isControlled)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const warnedRef = useRef(false)
  const pendingRef = useRef(null)

  if (process.env.NODE_ENV !== "production") {
    if (isControlledRef.current !== isControlled && !warnedRef.current) {
      warnedRef.current = true
      console.warn(
        `A component switched from ${isControlledRef.current ? "controlled" : "uncontrolled"} ` +
          `to ${isControlled ? "controlled" : "uncontrolled"}. Decide one mode for the ` +
          "component's lifetime — an async `value={data?.x}` starts as undefined, so pass " +
          "`value={data?.x ?? fallback}` or render the component only once the data is in."
      )
    }
  }
  isControlledRef.current = isControlled

  const setValue = useCallback((next) => {
    if (isControlledRef.current) {
      // Two setter calls in one task must see each other, and in controlled
      // mode the prop cannot carry the first one yet — hence a base that
      // outlives the call. It expires on the next microtask rather than
      // persisting: a parent that *rejects* the change never re-renders, and a
      // base left ahead of the prop would make the following click compute
      // from a value the component never held.
      const base = pendingRef.current ? pendingRef.current.value : currentRef.current
      const resolved = typeof next === "function" ? next(base) : next
      pendingRef.current = { value: resolved }
      queueMicrotask(() => {
        pendingRef.current = null
      })
      // No same-value guard here, unlike the uncontrolled branch: a controlled
      // parent that rejected the last change still holds the old value, so
      // swallowing the repeat makes the user's second identical choice
      // unreachable — whether a value is a no-op is the parent's call.
      onChangeRef.current?.(resolved)
      return
    }
    const resolved = typeof next === "function" ? next(currentRef.current) : next
    if (Object.is(resolved, currentRef.current)) return
    setInternal(resolved)
    // Durable here, unlike the controlled base above: the render this schedules
    // will agree with it.
    currentRef.current = resolved
    onChangeRef.current?.(resolved)
  }, [])

  return [current, setValue]
}
