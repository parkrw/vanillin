import { createContext, useContext, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"

/** Upstream's pattern constants (input-otp). */
export const REGEXP_ONLY_DIGITS = "^\\d+$"
export const REGEXP_ONLY_CHARS = "^[a-zA-Z]+$"
export const REGEXP_ONLY_DIGITS_AND_CHARS = "^[a-zA-Z0-9]+$"

const InputOTPContext = createContext(null)

/**
 * One real <input> sits transparent over the rendered slots: native caret,
 * selection, IME and `autocomplete="one-time-code"` autofill keep working
 * while the boxes are plain divs mirroring `value[index]`. `onChange` gets
 * the string (shadcn/upstream signature), not the event.
 */
export function InputOTP({
  maxLength = 6,
  value,
  defaultValue = "",
  onChange,
  onComplete,
  pattern,
  textAlign = "left",
  disabled = false,
  containerClassName,
  className,
  children,
  ...props
}) {
  const [currentValue, setValue] = useControllableState({
    value,
    defaultValue,
    onChange,
  })
  const [selection, setSelection] = useState({ start: null, end: null })
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)

  const syncSelection = () => {
    const el = inputRef.current
    if (!el) return
    setSelection({ start: el.selectionStart, end: el.selectionEnd })
  }

  // The caret always parks at the end of the typed value — slots are not
  // individually clickable, so there is no hole-in-the-middle state.
  const caretToEnd = () => {
    const el = inputRef.current
    if (!el) return
    const end = Math.min(el.value.length, maxLength)
    el.setSelectionRange(end, end)
    setSelection({ start: end, end })
  }

  const handleChange = (event) => {
    const next = event.target.value.slice(0, maxLength)
    // Upstream rejects a whole change that fails the pattern rather than
    // filtering characters out of it.
    if (pattern && next !== "" && !new RegExp(pattern).test(next)) {
      event.target.value = currentValue
      return
    }
    setValue(next)
    if (next.length === maxLength) onComplete?.(next)
  }

  const slots = Array.from({ length: maxLength }, (_, index) => {
    const { start, end } = selection
    const inSelection =
      start != null && (start === end ? index === Math.min(start, maxLength - 1) : index >= start && index < end)
    const isActive = focused && inSelection
    return {
      char: currentValue[index] ?? null,
      isActive,
      hasFakeCaret: isActive && start === end && currentValue[index] == null,
    }
  })

  return (
    <InputOTPContext.Provider value={{ slots, disabled }}>
      <div
        data-disabled={disabled ? "" : undefined}
        className={cn("input-otp", containerClassName)}
        onPointerDown={() => inputRef.current?.focus()}
      >
        <input
          ref={inputRef}
          type="text"
          inputMode={pattern === REGEXP_ONLY_DIGITS ? "numeric" : "text"}
          autoComplete="one-time-code"
          maxLength={maxLength}
          value={currentValue}
          disabled={disabled || undefined}
          style={{ textAlign }}
          className={cn("input-otp-input", className)}
          onChange={handleChange}
          onSelect={syncSelection}
          onKeyUp={syncSelection}
          onFocus={() => {
            setFocused(true)
            caretToEnd()
          }}
          onClick={caretToEnd}
          onBlur={() => {
            setFocused(false)
            setSelection({ start: null, end: null })
          }}
          {...props}
        />
        {children}
      </div>
    </InputOTPContext.Provider>
  )
}

export function InputOTPGroup({ className, ...props }) {
  return <div className={cn("input-otp-group", className)} {...props} />
}

export function InputOTPSlot({ index, className, ...props }) {
  const { slots, disabled } = useContext(InputOTPContext)
  const { char, isActive, hasFakeCaret } = slots[index] ?? {}

  return (
    <div
      data-active={isActive ? "" : undefined}
      data-disabled={disabled ? "" : undefined}
      data-char={char ?? undefined}
      className={cn("input-otp-slot", className)}
      {...props}
    >
      {char}
      {hasFakeCaret && <span aria-hidden="true" className="input-otp-caret" />}
    </div>
  )
}

export function InputOTPSeparator({ className, children, ...props }) {
  return (
    <div role="separator" className={cn("input-otp-separator", className)} {...props}>
      {children ?? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
        </svg>
      )}
    </div>
  )
}
