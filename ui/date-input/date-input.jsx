import { useRef, useState, useId } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { parseDate, formatDateLocale } from "../../lib/parse-date.js"

/**
 * DateInput — a typeable date field that parses natural language and
 * numeric dates on blur, reformats to the locale's canonical form,
 * and announces its interpretation via a live region.
 *
 * Props:
 *   value / defaultValue  — controlled / uncontrolled Date
 *   onChange              — (date: Date | null) => void
 *   locale                — BCP 47 tag (default "en-US")
 *   placeholder           — input placeholder
 *   className             — extra class on the wrapper
 *   disabled              — disables the input
 *   ...rest               — forwarded to the <input>
 */
export function DateInput({
  value,
  defaultValue,
  onChange,
  locale = "en-US",
  placeholder = "Type a date…",
  className,
  disabled,
  id: idProp,
  ...rest
}) {
  const autoId = useId()
  const liveId = idProp ? `${idProp}-live` : `${autoId}-live`

  const [date, setDate] = useControllableState({
    value,
    defaultValue: defaultValue ?? null,
    onChange,
  })

  // The raw text the user sees — kept separate from the Date value
  // so unparseable text is never silently discarded.
  const [text, setText] = useState(() =>
    date ? formatDateLocale(date, locale) : ""
  )
  const [error, setError] = useState(null)
  const [announcement, setAnnouncement] = useState("")
  const inputRef = useRef(null)

  function handleChange(e) {
    setText(e.target.value)
    // Clear error while typing
    if (error) setError(null)
  }

  function handleBlur() {
    const trimmed = text.trim()
    if (!trimmed) {
      // Clearing the field
      setDate(null)
      setError(null)
      setAnnouncement("")
      return
    }

    const result = parseDate(trimmed, { locale })

    if (result) {
      setDate(result.date)
      const formatted = formatDateLocale(result.date, locale)
      setText(formatted)
      setError(null)
      // Announce interpretation for screen readers
      setAnnouncement(`Date set to ${formatted}`)
    } else {
      // Keep the text as-is, mark invalid
      setDate(null)
      setError("Unrecognised date format")
      setAnnouncement("Unrecognised date format")
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter") {
      // Parse on Enter as well
      inputRef.current?.blur()
    }
  }

  return (
    <div className={cn("date-input", className)}>
      <input
        ref={inputRef}
        type="text"
        inputMode="text"
        className="date-input-field"
        value={text}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? liveId : undefined}
        id={idProp}
        {...rest}
      />
      {/* Live region: announces parsed result or error */}
      <div
        id={liveId}
        className="date-input-live"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </div>
    </div>
  )
}
