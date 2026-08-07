import { useRef, useState } from "react"
import { Portal } from "../../lib/portal.jsx"
import { useAnchorPosition } from "../../lib/use-anchor-position.js"
import { useDismissableLayer } from "../../lib/use-dismissable-layer.js"
import { usePresence } from "../../lib/use-presence.js"
import { useReturnFocus } from "../../lib/use-return-focus.js"
import { useRovingFocus } from "../../lib/use-roving-focus.js"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import { CodeBlock } from "../code-example.jsx"
import "../code-example.css"

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
      <Button variant="outline" ref={triggerRef} onClick={() => setOpen((o) => !o)}>
        popover: {side}
      </Button>
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
      <Button variant="outline" onClick={() => setOpen((o) => !o)}>{open ? "hide" : "show"}</Button>
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
      <p>
        The shared <code>lib/</code> hooks that every component builds on. Use them directly when building custom components that need anchored positioning, keyboard navigation, animated mount/unmount, or layer dismissal — without pulling in a finished UI component you would have to reskin.
      </p>

      <section className="pg-section">
        <h3>Anchor positioning + dismissable layer + return focus</h3>
        <p>
          <code>useAnchorPosition</code> places a floating element next to its trigger (with collision flipping). <code>useDismissableLayer</code> closes it on Escape or outside click. <code>useReturnFocus</code> restores focus after close. All three compose — every overlay component (popover, dropdown, combobox, tooltip) is built from them.
        </p>
        <div className="pg-row">
          {["top", "bottom", "left", "right"].map((side) => (
            <DemoPopover key={side} side={side} />
          ))}
        </div>
        <CodeBlock code={`import { useAnchorPosition } from "./lib/use-anchor-position"
import { useDismissableLayer } from "./lib/use-dismissable-layer"
import { useReturnFocus } from "./lib/use-return-focus"

useAnchorPosition(open, triggerRef, floatingRef, { side: "bottom" })
useDismissableLayer(floatingRef, {
  enabled: open,
  onDismiss: () => setOpen(false),
  exclude: [triggerRef],
})
useReturnFocus(open)`} />
      </section>

      <section className="pg-section">
        <h3>Roving tabindex</h3>
        <p>
          <code>useRovingFocus</code> manages <code>tabIndex</code> so Tab enters the group once, then arrow keys / Home / End move between items. Mark focusable children with <code>data-roving</code>.
        </p>
        <DemoRoving />
        <CodeBlock code={`import { useRovingFocus } from "./lib/use-roving-focus"

const ref = useRef(null)
useRovingFocus(ref, { orientation: "horizontal" })

<div ref={ref} role="toolbar">
  <button data-roving>One</button>
  <button data-roving>Two</button>
  <button data-roving>Three</button>
</div>`} />
      </section>

      <section className="pg-section">
        <h3>Presence (exit animation before unmount)</h3>
        <p>
          <code>usePresence</code> returns <code>true</code> while the element should remain in the DOM — including the exit-animation phase after the logical state goes <code>false</code>. The element unmounts only after its <code>transitionend</code> or <code>animationend</code> fires.
        </p>
        <DemoPresence />
        <CodeBlock code={`import { usePresence } from "./lib/use-presence"

const [open, setOpen] = useState(false)
const ref = useRef(null)
const present = usePresence(open, ref)

{present && (
  <div ref={ref} data-state={open ? "open" : "closed"}
       style={{ transition: "opacity 300ms", opacity: open ? 1 : 0 }}>
    Content
  </div>
)}`} />
      </section>

      <section className="pg-section">
        <h3>Overlay and interaction primitives</h3>
        <ul>
          <li><code>useAnchorPosition</code> — floating placement with collision detection</li>
          <li><code>useDismissableLayer</code> — Escape / outside-click dismissal, nested-layer aware</li>
          <li><code>useReturnFocus</code> — restores focus to the trigger after close</li>
          <li><code>useFocusTrap</code> — traps Tab within a dialog or modal sheet</li>
          <li><code>useRovingFocus</code> — arrow-key navigation within a group</li>
          <li><code>usePresence</code> — exit animation before unmount</li>
          <li><code>useSafeTriangle</code> — hoverable gap between trigger and submenu</li>
          <li><code>Portal</code> — renders children into <code>document.body</code></li>
        </ul>
        <p>
          <code>lib/</code> also exports utilities not demoed here: <code>useControllableState</code>, <code>useColorScheme</code>, <code>useSwipe</code>, <code>useHighlight</code>, <code>useDataTable</code>, <code>useForm</code>, <code>DirectionProvider</code>, <code>withViewTransition</code>, <code>cn</code>, <code>commandScore</code>, <code>scrollLock</code>, <code>composeRefs</code>, <code>format</code>, <code>parseDate</code>, <code>schema</code>, and <code>anchorPosition</code> (the non-hook geometry engine).
        </p>
      </section>
    </>
  )
}
