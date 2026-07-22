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
  isControlledRef.current = isControlled
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const setValue = useCallback((next) => {
    const resolved = typeof next === "function" ? next(currentRef.current) : next
    if (Object.is(resolved, currentRef.current)) return
    if (!isControlledRef.current) setInternal(resolved)
    onChangeRef.current?.(resolved)
  }, [])

  return [current, setValue]
}
