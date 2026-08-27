import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { Button } from "../button/button.jsx"

/**
 * CopyField — a read-only identifier with a one-click copy.
 *
 * For the strings a console shows but nobody types: resource IDs, ARNs,
 * connection strings.
 *
 *   <CopyField value="arn:aws:iam::123456789012:role/console-readonly" />
 *   <CopyField value={connectionString} label="Connection string" secret />
 *   <CopyField value={id} truncate="end" onCopy={(v) => track(v)} />
 *
 * `value` is always copied in full — masking and truncation change what is
 * painted, never what reaches the clipboard.
 *
 * `truncate="middle"` (the default) keeps the last 8 characters in
 * `.copy-field-tail` and ellipsises `.copy-field-head`, so two IDs sharing a
 * prefix stay distinguishable in a narrow column. `"end"` is a plain
 * `text-overflow: ellipsis`; `false` wraps. The mode is on the root as
 * `data-truncate="middle" | "end" | "none"`, which is what the CSS selects on.
 *
 * The copied state lasts COPIED_MS and shows as `data-state="copied"` on the
 * root; the copy → check swap is CSS on that attribute, so React only flips
 * one string. `copiedLabel` becomes the button's accessible name and is
 * announced through the polite live region.
 *
 * Renders a `<div>` by default; `as` swaps the element.
 */

// A JS timeout, not CSS motion: this is how long the confirmation stays
// readable, the same 2s the docs site's code-block copy uses.
const COPIED_MS = 2000
const MASK = "•".repeat(12)
const TAIL_CHARS = 8

export function CopyField({
  value,
  label,
  truncate = "middle",
  secret = false,
  copyLabel = "Copy",
  copiedLabel = "Copied",
  onCopy,
  as: Comp = "div",
  className,
  ...props
}) {
  const [copied, setCopied] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const handleCopy = useCallback(() => {
    writeClipboard(value).then(
      () => {
        setCopied(true)
        clearTimeout(timer.current)
        timer.current = setTimeout(() => setCopied(false), COPIED_MS)
        onCopy?.(value)
      },
      // A refused write leaves the field in its idle state; there is no error
      // slot in the API, and a stuck "Copied" would be the worse lie.
      () => {},
    )
  }, [value, onCopy])

  const masked = secret && !revealed
  // The accessible name carries the field's own label so a form of them does
  // not read as a column of identical "Copy" buttons.
  const named = (base) => (label ? `${base} ${label}` : base)

  return (
    <Comp
      className={cn("copy-field", className)}
      data-state={copied ? "copied" : "idle"}
      data-truncate={truncate === false ? "none" : truncate}
      data-secret={secret ? (revealed ? "revealed" : "masked") : undefined}
      {...props}
    >
      {label && <span className="copy-field-label">{label}</span>}

      {/* IDs and ARNs are not bidi text: pinned LTR so an RTL page does not
          reorder the punctuation inside them. */}
      <code className="copy-field-value" dir="ltr">
        {!masked && truncate === "middle" ? (
          <>
            <span className="copy-field-head">{value.slice(0, -TAIL_CHARS)}</span>
            <span className="copy-field-tail">{value.slice(-TAIL_CHARS)}</span>
          </>
        ) : (
          <span className="copy-field-text">{masked ? MASK : value}</span>
        )}
      </code>

      {secret && (
        <Button
          variant="ghost"
          size="icon"
          className="copy-field-reveal"
          aria-label={named(revealed ? "Hide" : "Reveal")}
          aria-pressed={revealed}
          onClick={() => setRevealed((r) => !r)}
        >
          {revealed ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="copy-field-btn"
        aria-label={named(copied ? copiedLabel : copyLabel)}
        onClick={handleCopy}
      >
        <CopyIcon />
        <CheckIcon />
      </Button>

      <span className="copy-field-live" role="status" aria-live="polite" aria-atomic="true">
        {copied ? copiedLabel : ""}
      </span>
    </Comp>
  )
}

/**
 * The async Clipboard API needs a secure context. Behind plain HTTP —
 * a LAN console, an IP address — `navigator.clipboard` is undefined, so fall
 * back to selecting a throwaway textarea and letting execCommand copy it.
 */
async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)

  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.insetInlineStart = "-9999px"
  document.body.appendChild(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand("copy")
  } finally {
    area.remove()
  }
  if (!ok) throw new Error("copy-field: clipboard write refused")
}

function icon(children, className) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

// Re-declared here rather than shared: ui/ never imports from site/.
function CopyIcon() {
  return icon(
    <>
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>,
    "copy-field-icon copy-field-icon--copy",
  )
}

function CheckIcon() {
  return icon(
    <polyline points="20 6 9 17 4 12" />,
    "copy-field-icon copy-field-icon--check",
  )
}

function EyeIcon() {
  return icon(
    <>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </>,
  )
}

function EyeOffIcon() {
  return icon(
    <>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </>,
  )
}
