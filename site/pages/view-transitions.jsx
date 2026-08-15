// System page layout: description → demos → reference.
import { useCallback, useRef, useState } from "react"
import { withViewTransition, setTransitionName } from "../../lib/view-transition.js"
import { setSiteDark, useSiteDark } from "../color-scheme.js"
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

const items = [
  { id: "alpha", label: "Alpha", detail: "First item. The shared-element transition morphs this card from its list position to the detail view." },
  { id: "beta", label: "Beta", detail: "Second item. Click another card or the back button to see the reverse morph." },
  { id: "gamma", label: "Gamma", detail: "Third item. Under reduced motion, the view swaps instantly with no animation." },
  { id: "delta", label: "Delta", detail: "Fourth item. The view-transition-name is set only on the active card to avoid duplicate-name aborts." },
]

function ListDetailDemo() {
  const [selected, setSelected] = useState(null)
  const cardRefs = useRef({})

  const selectItem = useCallback((id, el) => {
    const cleanup = el ? setTransitionName(el, "shared-element") : null
    withViewTransition(() => setSelected(id))
    if (cleanup) {
      setTimeout(cleanup, 500)
    }
  }, [])

  if (selected) {
    const item = items.find((i) => i.id === selected)
    return (
      <div
        className="pg-vt-detail"
        style={{ viewTransitionName: "shared-element" }}
      >
        <Button
          variant="outline"
          size="sm"
          data-pg="vt-back"
          onClick={() => {
            const el = document.querySelector(".pg-vt-detail")
            const cleanup = el ? setTransitionName(el, "shared-element") : null
            withViewTransition(() => setSelected(null))
            if (cleanup) setTimeout(cleanup, 500)
          }}
        >
          Back to list
        </Button>
        <h3>{item.label}</h3>
        <p>{item.detail}</p>
      </div>
    )
  }

  return (
    <div className="pg-vt-list">
      {items.map((item) => (
        <button
          key={item.id}
          ref={(el) => { cardRefs.current[item.id] = el }}
          className="pg-vt-card"
          onClick={(e) => selectItem(item.id, e.currentTarget)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}

function WipeDemo() {
  const isDark = useSiteDark()
  return (
    <Button
      variant="outline"
      data-pg="vt-wipe"
      onClick={(event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        withViewTransition(() => setSiteDark(!isDark), {
          clipPath: {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          },
        })
      }}
    >
      Wipe to {isDark ? "light" : "dark"}
    </Button>
  )
}

export default function ViewTransitionsPage() {
  return (
    <>
      <h2>View Transitions</h2>
      <p>
        The <code>withViewTransition</code> helper wraps any state update in the View Transitions API, feature-detecting <code>document.startViewTransition</code> and falling back to a plain update when the API is absent or the user prefers reduced motion.
      </p>

      <section className="pg-section">
        <h3>Circular wipe</h3>
        <p>
          <code>clip-path: circle()</code> expanding from the button centre on
          the <code>::view-transition-new(root)</code> pseudo-element. The radius
          is the distance to the farthest viewport corner, times a small
          overshoot so the last sliver is covered before the clock runs out —
          without it, discarding the snapshot finishes the job in one frame and
          the sweep ends with a pop.
        </p>
        <ComponentPreview code={`import { withViewTransition } from "./lib/view-transition"

withViewTransition(() => setDark(!dark), {
  clipPath: { x: event.clientX, y: event.clientY },
})`}>
          <div className="pg-row">
            <WipeDemo />
          </div>
        </ComponentPreview>
        <p>
          A hard edge is the only option: Chrome ignores <code>mask-image</code>{" "}
          on these pseudo-elements, so a feathered reveal is not merely
          unsupported, it is silently skipped. Duration reads from{" "}
          <code>--motion-medium</code>; the easing is <code>ease-out</code>{" "}
          rather than <code>--motion-ease</code>, because a circle&apos;s area
          grows as the square of its radius and anything faster reads as
          accelerating into the corners. Under reduced motion the scheme switches
          instantly.
        </p>
        <p>
          The nav mode toggle deliberately does <em>not</em> do this — see{" "}
          <a href="#mode-toggle">Mode Toggle</a>.
        </p>
      </section>

      <section className="pg-section">
        <h3>List to detail (shared element)</h3>
        <p>
          Click a card below. The <code>view-transition-name</code> is set
          only on the participating element at click time, then cleared after
          the transition. This avoids the duplicate-name abort that happens
          when multiple elements share a name simultaneously.
        </p>
        <ComponentPreview code={`import { withViewTransition, setTransitionName } from "./lib/view-transition"

const cleanup = setTransitionName(element, "shared-element")
withViewTransition(() => setSelected(id))
setTimeout(cleanup, 500)`}>
          <ListDetailDemo />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Route transitions</h3>
        <p>
          Route changes <em>can</em> be wrapped in{" "}
          <code>withViewTransition</code> for a crossfade between pages, but
          this site does not do so globally. The reason: during a view
          transition the browser overlays snapshot pseudo-elements on top of
          the page, blocking pointer input for the animation's duration. A
          user who clicks immediately after navigating would hit a dead zone.
          The theme toggle and shared-element demo above are scoped to
          explicit user actions where the brief non-interactive window is
          expected; a blanket route crossfade is not.
        </p>
      </section>

      <section className="pg-section">
        <h3>Progressive enhancement</h3>
        <p>
          Every call site falls back to a plain state update when{" "}
          <code>document.startViewTransition</code> is absent. The transition
          is decoration — no interaction depends on it. Supported in Chrome
          111+, Safari 18+, and Firefox 133+.
        </p>
      </section>

      <section className="pg-section">
        <h3>Reference</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Export</TableHead>
              <TableHead>Signature</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell><code>withViewTransition</code></TableCell>
              <TableCell><code>{"(update, options?) => ViewTransition | void"}</code></TableCell>
              <TableCell>Wraps a state update in the View Transitions API. Falls back to a plain call when unsupported or when reduced motion is active. Pass <code>{"{ clipPath: { x, y } }"}</code> for a circular wipe from that point.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>setTransitionName</code></TableCell>
              <TableCell><code>{"(element, name) => () => void"}</code></TableCell>
              <TableCell>Sets <code>view-transition-name</code> on an element. Returns a cleanup function that clears it. Use to assign a name at click time and remove it after the transition to avoid duplicate-name aborts.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </>
  )
}
