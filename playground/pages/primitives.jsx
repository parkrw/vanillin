import { useRef, useState } from "react"
import { Portal } from "../../lib/portal.jsx"
import { useAnchorPosition } from "../../lib/use-anchor-position.js"
import { useDismissableLayer } from "../../lib/use-dismissable-layer.js"
import { usePresence } from "../../lib/use-presence.js"
import { useReturnFocus } from "../../lib/use-return-focus.js"
import { useRovingFocus } from "../../lib/use-roving-focus.js"

function DemoPopover({ side }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const floatingRef = useRef(null)

  useAnchorPosition(open, triggerRef, floatingRef, { side })
  useDismissableLayer(floatingRef, {
    enabled: open,
    onDismiss: () => setOpen(false),
    exclude: [triggerRef],
  })
  useReturnFocus(open)

  return (
    <>
      <button ref={triggerRef} onClick={() => setOpen((o) => !o)}>
        popover: {side}
      </button>
      {open && (
        <Portal>
          <div
            ref={floatingRef}
            style={{
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "0.75rem 1rem",
              boxShadow: "var(--shadow-md)",
              maxWidth: "16rem",
            }}
          >
            Anchored <b data-side>{side}</b>. Click outside or press Escape to dismiss;
            scroll to watch it track the trigger.
          </div>
        </Portal>
      )}
    </>
  )
}

function DemoRoving() {
  const ref = useRef(null)
  useRovingFocus(ref, { orientation: "horizontal" })
  return (
    <div ref={ref} role="toolbar" aria-label="Roving focus demo" className="pg-row">
      {["one", "two", "three", "four"].map((label) => (
        <button key={label} data-roving>
          {label}
        </button>
      ))}
    </div>
  )
}

function DemoPresence() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const present = usePresence(open, ref)
  return (
    <div className="pg-row">
      <button onClick={() => setOpen((o) => !o)}>{open ? "hide" : "show"}</button>
      {present && (
        <div
          ref={ref}
          data-state={open ? "open" : "closed"}
          style={{
            padding: "0.5rem 1rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            transition: "opacity 300ms, translate 300ms",
            opacity: open ? 1 : 0,
            translate: open ? "0 0" : "0 8px",
          }}
        >
          exits over 300ms, then unmounts
        </div>
      )}
    </div>
  )
}

export default function PrimitivesPage() {
  return (
    <>
      <h2>Primitives</h2>
      <p>Smoke tests for the shared lib/ modules every component builds on.</p>

      <section className="pg-section">
        <h3>Anchor positioning + dismissable layer + return focus</h3>
        <div className="pg-row">
          {["top", "bottom", "left", "right"].map((side) => (
            <DemoPopover key={side} side={side} />
          ))}
        </div>
      </section>

      <section className="pg-section">
        <h3>Roving tabindex (Tab in, then arrow keys / Home / End)</h3>
        <DemoRoving />
      </section>

      <section className="pg-section">
        <h3>Presence (exit animation before unmount)</h3>
        <DemoPresence />
      </section>
    </>
  )
}
