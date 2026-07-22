import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

/** Render children into `container` (default document.body). SSR-safe. */
export function Portal({ container, children }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return null
  return createPortal(children, container ?? document.body)
}
