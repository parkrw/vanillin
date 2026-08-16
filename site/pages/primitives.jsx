// System page layout: description → demos → reference.
import { useCallback, useRef, useState } from "react"
import { Portal } from "../../lib/portal.jsx"
import { useAnchorPosition } from "../../lib/use-anchor-position.js"
import { useDismissableLayer } from "../../lib/use-dismissable-layer.js"
import { useFocusTrap } from "../../lib/use-focus-trap.js"
import { usePresence } from "../../lib/use-presence.js"
import { useReturnFocus } from "../../lib/use-return-focus.js"
import { useRovingFocus } from "../../lib/use-roving-focus.js"
import { useSafeTriangle } from "../../lib/use-safe-triangle.js"
import { Button } from "../../ui/button/button.jsx"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../ui/table/table.jsx"
import "../../ui/button/button.css"
import "../../ui/table/table.css"
import { ComponentPreview } from "../code-example.jsx"
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
              padding: "var(--space-3) var(--space-4)",
              boxShadow: "var(--shadow-md)",
              maxWidth: "16rem",
            }}
          >
            Anchored <b>{side}</b>. Click outside or press Escape to dismiss;
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
            padding: "var(--space-2) var(--space-4)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            transition: "opacity var(--motion-medium) var(--motion-ease), translate var(--motion-medium) var(--motion-ease)",
            opacity: open ? 1 : 0,
            translate: open ? "0 0" : "0 8px",
          }}
        >
          animates out over the transition, then unmounts
        </div>
      )}
    </div>
  )
}

function DemoFocusTrap() {
  const [active, setActive] = useState(false)
  const ref = useRef(null)
  useFocusTrap(ref, active)
  return (
    <div>
      <Button variant="outline" onClick={() => setActive((a) => !a)}>
        {active ? "release trap" : "activate trap"}
      </Button>
      {active && (
        <div
          ref={ref}
          tabIndex="-1"
          style={{
            padding: "var(--space-4)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            marginTop: "var(--space-3)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-2)",
          }}
        >
          <input
            placeholder="First field"
            style={{
              padding: "var(--space-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--input-background)",
              color: "var(--foreground)",
            }}
          />
          <input
            placeholder="Second field"
            style={{
              padding: "var(--space-2)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--input-background)",
              color: "var(--foreground)",
            }}
          />
          <button
            style={{
              padding: "var(--space-2) var(--space-4)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              background: "var(--secondary)",
              color: "var(--secondary-foreground)",
            }}
          >
            Trapped button
          </button>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", margin: 0 }}>
            Tab cycles between these three controls without leaving this container.
          </p>
        </div>
      )}
    </div>
  )
}

function DemoSafeTriangle() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const closeTimer = useRef(null)

  const scheduleClose = useCallback(() => {
    clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 300)
  }, [])
  const cancelClose = useCallback(() => clearTimeout(closeTimer.current), [])

  useSafeTriangle({
    enabled: open,
    triggerRef,
    contentRef,
    onClose: () => setOpen(false),
    onInsideMove: cancelClose,
    onResolve: cancelClose,
  })

  return (
    <div>
      <div style={{ display: "flex", gap: "3rem", alignItems: "start" }}>
        <button
          ref={triggerRef}
          onPointerEnter={() => { cancelClose(); setOpen(true) }}
          onPointerLeave={() => { if (open) scheduleClose() }}
          style={{
            padding: "var(--space-3) var(--space-4)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            background: "var(--card)",
            color: "var(--card-foreground)",
          }}
        >
          Hover trigger
        </button>
        {open && (
          <div
            ref={contentRef}
            onPointerEnter={cancelClose}
            onPointerLeave={() => setOpen(false)}
            style={{
              padding: "var(--space-3) var(--space-4)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              background: "var(--card)",
              color: "var(--card-foreground)",
            }}
          >
            Submenu content. The safe triangle lets the pointer
            traverse the gap without closing this panel.
          </div>
        )}
      </div>
      <p style={{ marginTop: "var(--space-3)", fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
        Without the safe triangle, moving diagonally from trigger to content would close it because the pointer briefly leaves both elements.
      </p>
    </div>
  )
}

export default function PrimitivesPage() {
  return (
    <>
      <h2>Primitives</h2>
      <p>
        The shared <code>lib/</code> hooks that every component builds on. Use them directly when building custom components that need anchored positioning, keyboard navigation, animated mount/unmount, or layer dismissal, without pulling in a finished UI component you would have to reskin.
      </p>

      <section className="pg-section">
        <h3>Anchor positioning + dismissable layer + return focus</h3>
        <p>
          <code>useAnchorPosition</code> places a floating element next to its trigger (with collision flipping). <code>useDismissableLayer</code> closes it on Escape or outside click. <code>useReturnFocus</code> restores focus after close. All three compose: every overlay component (popover, dropdown, combobox, tooltip) is built from them.
        </p>
        <ComponentPreview code={`import { useAnchorPosition } from "./lib/use-anchor-position"
import { useDismissableLayer } from "./lib/use-dismissable-layer"
import { useReturnFocus } from "./lib/use-return-focus"

useAnchorPosition(open, triggerRef, floatingRef, { side: "bottom" })
useDismissableLayer(floatingRef, {
  enabled: open,
  onDismiss: () => setOpen(false),
  exclude: [triggerRef],
})
useReturnFocus(open)`}>
          <div className="pg-row">
            {["top", "bottom", "left", "right"].map((side) => (
              <DemoPopover key={side} side={side} />
            ))}
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Roving tabindex</h3>
        <p>
          <code>useRovingFocus</code> manages <code>tabIndex</code> so Tab enters the group once, then arrow keys / Home / End move between items. Mark focusable children with <code>data-roving</code>.
        </p>
        <ComponentPreview code={`import { useRovingFocus } from "./lib/use-roving-focus"

const ref = useRef(null)
useRovingFocus(ref, { orientation: "horizontal" })

<div ref={ref} role="toolbar">
  <button data-roving>One</button>
  <button data-roving>Two</button>
  <button data-roving>Three</button>
</div>`}>
          <DemoRoving />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Presence (exit animation before unmount)</h3>
        <p>
          <code>usePresence</code> returns <code>true</code> while the element should remain in the DOM, including the exit-animation phase after the logical state goes <code>false</code>. The element unmounts only after its <code>transitionend</code> or <code>animationend</code> fires.
        </p>
        <ComponentPreview code={`import { usePresence } from "./lib/use-presence"

const [open, setOpen] = useState(false)
const ref = useRef(null)
const present = usePresence(open, ref)

{present && (
  <div ref={ref} data-state={open ? "open" : "closed"}
       style={{ transition: "opacity var(--motion-medium) var(--motion-ease)",
                opacity: open ? 1 : 0 }}>
    Content
  </div>
)}`}>
          <DemoPresence />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Focus trap</h3>
        <p>
          <code>useFocusTrap</code> traps Tab and Shift+Tab inside the target element while enabled, and moves focus into it on activation. Give the container <code>tabIndex="-1"</code> so it can receive focus when it has no focusable children. Fallback for overlays not built on <code>&lt;dialog&gt;.showModal()</code> (which traps natively).
        </p>
        <ComponentPreview code={`import { useFocusTrap } from "./lib/use-focus-trap"

const [active, setActive] = useState(false)
const ref = useRef(null)
useFocusTrap(ref, active)

{active && (
  <div ref={ref} tabIndex="-1">
    <input placeholder="First field" />
    <input placeholder="Second field" />
    <button>Trapped button</button>
  </div>
)}`}>
          <DemoFocusTrap />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Safe triangle</h3>
        <p>
          <code>useSafeTriangle</code> computes a triangular grace area from the pointer's leave point on a trigger to the near-edge corners of the submenu content. While the pointer stays inside that triangle, the content remains open. Used by dropdown-menu and context-menu for submenu hover.
        </p>
        <ComponentPreview code={`import { useSafeTriangle } from "./lib/use-safe-triangle"

useSafeTriangle({
  enabled: open,
  triggerRef,
  contentRef,
  onClose: () => setOpen(false),
  onInsideMove: cancelPendingClose,
  onResolve: cancelPendingClose,
})`}>
          <DemoSafeTriangle />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Other exports</h3>
        <p>
          <code>lib/</code> also exports utilities not demoed here: <code>useControllableState</code>, <code>useColorScheme</code>, <code>useSwipe</code>, <code>useHighlight</code>, <code>useDataTable</code>, <code>useForm</code>, <code>DirectionProvider</code>, <code>withViewTransition</code>, <code>cn</code>, <code>commandScore</code>, <code>scrollLock</code>, <code>composeRefs</code>, <code>format</code>, <code>parseDate</code>, <code>schema</code>, and <code>anchorPosition</code> (the non-hook geometry engine).
        </p>
      </section>

      <section className="pg-section">
        <h3>Reference</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hook</TableHead>
              <TableHead>Signature</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell><code>useAnchorPosition</code></TableCell>
              <TableCell><code>{"(open, anchorRef, floatingRef, options?)"}</code></TableCell>
              <TableCell>Positions a floating element against its anchor with collision flipping. Repositions on scroll, resize, and size changes.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>useDismissableLayer</code></TableCell>
              <TableCell><code>{"(ref, { enabled, onDismiss, exclude? })"}</code></TableCell>
              <TableCell>Dismisses on Escape or outside pointerdown. Layers stack so only the topmost responds.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>useReturnFocus</code></TableCell>
              <TableCell><code>{"(enabled)"}</code></TableCell>
              <TableCell>Remembers the focused element on mount and restores focus when <code>enabled</code> turns false or on unmount.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>useFocusTrap</code></TableCell>
              <TableCell><code>{"(ref, enabled?)"}</code></TableCell>
              <TableCell>Traps Tab/Shift+Tab inside <code>ref</code>. Moves focus into the container on activation. Finds the <code>[autofocus]</code> element or first focusable child.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>useRovingFocus</code></TableCell>
              <TableCell><code>{"(ref, { orientation?, loop?, selector? })"}</code></TableCell>
              <TableCell>Arrow-key navigation within a group. Items matching <code>selector</code> (default <code>[data-roving]</code>) get managed <code>tabIndex</code>.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>usePresence</code></TableCell>
              <TableCell><code>{"(open, ref) → boolean"}</code></TableCell>
              <TableCell>Returns whether the element should render. Stays <code>true</code> through exit animations, unmounting only after <code>transitionend</code>/<code>animationend</code>.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>useSafeTriangle</code></TableCell>
              <TableCell><code>{"({ enabled, triggerRef, contentRef, onClose, onInsideMove?, onResolve?, side? })"}</code></TableCell>
              <TableCell>Computes a triangular grace area from the pointer leave point to the content's near edge. Prevents premature close during diagonal pointer movement.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>Portal</code></TableCell>
              <TableCell><code>{"({ container?, children })"}</code></TableCell>
              <TableCell>Renders children into <code>container</code> (default <code>document.body</code>). SSR-safe.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </>
  )
}
