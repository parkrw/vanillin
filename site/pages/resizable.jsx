import { useRef, useState } from "react"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../ui/resizable/resizable.jsx"
import "../../ui/resizable/resizable.css"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const panelStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.875rem",
  color: "var(--muted-foreground)",
}

const frameStyle = {
  blockSize: "12rem",
  inlineSize: "100%",
  maxInlineSize: "32rem",
  borderRadius: "var(--radius-lg)",
  border: "1px solid var(--border)",
}

export default function ResizablePage() {
  const sidebarRef = useRef(null)
  const [sidebarState, setSidebarState] = useState("expanded")

  return (
    <>
      <h2>Resizable</h2>
      <p>Resizable panels split a container into adjustable regions separated by draggable handles, with keyboard support, collapsing, persistence, and nesting.</p>

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          Two panels side by side. Drag the separator or use keyboard arrows
          when focused. <code>minSize</code> prevents either panel from
          disappearing.
        </p>
        <ComponentPreview code={`<div style={{ blockSize: "12rem", border: "1px solid var(--border)" }}>
  <ResizablePanelGroup direction="horizontal">
    <ResizablePanel id="h-one" defaultSize={50} minSize={20}>
      One
    </ResizablePanel>
    <ResizableHandle />
    <ResizablePanel id="h-two" defaultSize={50} minSize={20}>
      Two
    </ResizablePanel>
  </ResizablePanelGroup>
</div>`}>
          <div data-pg="r-horizontal" style={frameStyle}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel id="h-one" defaultSize={50} minSize={20}>
                <div style={panelStyle}>One</div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel id="h-two" defaultSize={50} minSize={20}>
                <div style={panelStyle}>Two</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          The group needs a height from its container. It fills whatever box you give it and never sizes itself.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "./ui/resizable/resizable"
import "./ui/resizable/resizable.css"

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel id="left" defaultSize={50} minSize={20}>
    Left
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel id="right" defaultSize={50} minSize={20}>
    Right
  </ResizablePanel>
</ResizablePanelGroup>`}>
          <div style={frameStyle}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel id="u-left" defaultSize={50} minSize={20}>
                <div style={panelStyle}>Left</div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel id="u-right" defaultSize={50} minSize={20}>
                <div style={panelStyle}>Right</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Panels need <code>id</code> only when the group persists its layout, but giving every panel one keeps the saved key stable if you reorder them.
        </p>
      </section>

      <section className="pg-section">
        <h3>Vertical</h3>
        <p>
          Set <code>direction="vertical"</code> for a top and bottom split.
          Arrow Up and Down resize; Arrow Left and Right are no-ops.
        </p>
        <ComponentPreview code={`<ResizablePanelGroup direction="vertical">
  <ResizablePanel id="v-top" defaultSize={30} minSize={15}>
    Header
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel id="v-bottom" defaultSize={70} minSize={15}>
    Content
  </ResizablePanel>
</ResizablePanelGroup>`}>
          <div data-pg="r-vertical" style={{ ...frameStyle, blockSize: "16rem" }}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel id="v-top" defaultSize={30} minSize={15}>
                <div style={panelStyle}>Header</div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel id="v-bottom" defaultSize={70} minSize={15}>
                <div style={panelStyle}>Content</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          A vertical group reports <code>aria-orientation="horizontal"</code> on its separator: the separator line runs horizontally even though the split is vertical.
        </p>
      </section>

      <section className="pg-section">
        <h3>With handle</h3>
        <p>
          Pass <code>withHandle</code> to render a visible grip icon on the
          separator.
        </p>
        <ComponentPreview code={`<ResizableHandle withHandle />`}>
          <div data-pg="r-handle" style={frameStyle}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel id="wh-one" defaultSize={50} minSize={20}>
                <div style={panelStyle}>One</div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel id="wh-two" defaultSize={50} minSize={20}>
                <div style={panelStyle}>Two</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          The hit area is the same either way. The grip only makes the affordance visible, which matters when the panels have no border of their own.
        </p>
      </section>

      <section className="pg-section">
        <h3>Collapsible</h3>
        <p>
          A <code>collapsible</code> panel snaps shut when dragged past its
          minimum. Press Enter on a focused handle to toggle. The imperative
          handle exposes <code>collapse()</code> and <code>expand()</code>.
        </p>
        <ComponentPreview code={`const sidebarRef = useRef(null)
const [sidebarState, setSidebarState] = useState("expanded")

<ResizablePanelGroup direction="horizontal">
  <ResizablePanel
    id="c-sidebar"
    ref={sidebarRef}
    defaultSize={30}
    minSize={15}
    maxSize={50}
    collapsible
    collapsedSize={0}
    onCollapse={() => setSidebarState("collapsed")}
    onExpand={() => setSidebarState("expanded")}
  >
    Sidebar
  </ResizablePanel>
  <ResizableHandle withHandle />
  <ResizablePanel id="c-content" defaultSize={70} minSize={30}>
    Content
  </ResizablePanel>
</ResizablePanelGroup>

<Button onClick={() => sidebarRef.current?.collapse()}>Collapse</Button>`}>
          <div data-pg="r-collapsible" style={frameStyle}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel
                id="c-sidebar"
                ref={sidebarRef}
                defaultSize={30}
                minSize={15}
                maxSize={50}
                collapsible
                collapsedSize={0}
                onCollapse={() => setSidebarState("collapsed")}
                onExpand={() => setSidebarState("expanded")}
              >
                <div style={panelStyle}>Sidebar</div>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel id="c-content" defaultSize={70} minSize={30}>
                <div style={panelStyle}>Content</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
          <div style={{ marginBlockStart: "0.5rem", fontSize: "0.8125rem" }}>
            <span style={{ color: "var(--muted-foreground)" }}>
              Sidebar is {sidebarState}.{" "}
            </span>
            <Button
              variant="outline"
              size="sm"
              data-pg="rsz-toggle"
              onClick={() =>
                sidebarState === "collapsed"
                  ? sidebarRef.current?.expand()
                  : sidebarRef.current?.collapse()
              }
            >
              {sidebarState === "collapsed" ? "Expand" : "Collapse"}
            </Button>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>onCollapse</code> and <code>onExpand</code> fire on real transitions only, never on mount, so a parent can drive persistence from them without a spurious first write.
        </p>
      </section>

      <section className="pg-section">
        <h3>Persistent layout</h3>
        <p>
          Pass <code>autoSaveId</code> to persist the layout to localStorage.
          Resize the panels below, then reload the page: the layout restores
          without a flash. Storage is keyed by panel IDs and count, so a saved
          3-panel layout is silently dropped if the group changes to 2 panels.
        </p>
        <ComponentPreview code={`<ResizablePanelGroup direction="horizontal" autoSaveId="demo-persistent">
  <ResizablePanel id="p-left" defaultSize={35} minSize={15}>
    Left
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel id="p-right" defaultSize={65} minSize={15}>
    Right
  </ResizablePanel>
</ResizablePanelGroup>`}>
          <div data-pg="r-persistent" style={frameStyle}>
            <ResizablePanelGroup direction="horizontal" autoSaveId="demo-persistent">
              <ResizablePanel id="p-left" defaultSize={35} minSize={15}>
                <div style={panelStyle}>Left</div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel id="p-right" defaultSize={65} minSize={15}>
                <div style={panelStyle}>Right</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Writes are debounced, so dragging does not hammer localStorage. A layout whose stored payload no longer matches the panel list falls back to <code>defaultSize</code> rather than restoring something wrong.
        </p>
      </section>

      <section className="pg-section">
        <h3>Nested</h3>
        <p>
          Groups can be nested. Each group manages its own separators
          independently; F6 cycles only the separators of the focused group.
        </p>
        <ComponentPreview code={`<ResizablePanelGroup direction="vertical">
  <ResizablePanel id="n-top" defaultSize={30} minSize={15}>
    Top
  </ResizablePanel>
  <ResizableHandle />
  <ResizablePanel id="n-bottom" defaultSize={70} minSize={15}>
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel id="n-left" defaultSize={50} minSize={15}>
        Left
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel id="n-right" defaultSize={50} minSize={15}>
        Right
      </ResizablePanel>
    </ResizablePanelGroup>
  </ResizablePanel>
</ResizablePanelGroup>`}>
          <div data-pg="r-nested" style={{ ...frameStyle, blockSize: "20rem", maxInlineSize: "40rem" }}>
            <ResizablePanelGroup direction="vertical">
              <ResizablePanel id="n-top" defaultSize={30} minSize={15}>
                <div style={panelStyle}>Top</div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel id="n-bottom" defaultSize={70} minSize={15}>
                <ResizablePanelGroup direction="horizontal">
                  <ResizablePanel id="n-left" defaultSize={50} minSize={15}>
                    <div style={panelStyle}>Left</div>
                  </ResizablePanel>
                  <ResizableHandle />
                  <ResizablePanel id="n-right" defaultSize={50} minSize={15}>
                    <div style={panelStyle}>Right</div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Resizing the inner group leaves the outer split untouched. Sizes are percentages of the immediate group, so nesting never leaks.
        </p>
      </section>

      <section className="pg-section">
        <h3>Three panels</h3>
        <p>
          Any number of panels and handles. Focus a handle and press F6 to
          cycle to the next handle within the same group, Shift+F6 to go
          backward. The cycle wraps.
        </p>
        <ComponentPreview code={`<ResizablePanelGroup direction="horizontal">
  <ResizablePanel id="t-a" defaultSize={25} minSize={10}>A</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel id="t-b" defaultSize={50} minSize={10}>B</ResizablePanel>
  <ResizableHandle />
  <ResizablePanel id="t-c" defaultSize={25} minSize={10}>C</ResizablePanel>
</ResizablePanelGroup>`}>
          <div data-pg="r-three" style={{ ...frameStyle, maxInlineSize: "40rem" }}>
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel id="t-a" defaultSize={25} minSize={10}>
                <div style={panelStyle}>A</div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel id="t-b" defaultSize={50} minSize={10}>
                <div style={panelStyle}>B</div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel id="t-c" defaultSize={25} minSize={10}>
                <div style={panelStyle}>C</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          A drag moves the two panels either side of the handle and leaves the rest alone, so the group total always stays at 100.
        </p>
      </section>

      <InstallSnippet slug="resizable" />

      <ApiReference props={[
        { name: "ResizablePanelGroup: direction", type: '"horizontal" | "vertical"', description: "Axis along which panels are laid out" },
        { name: "ResizablePanelGroup: autoSaveId", type: "string", description: "Persist layout to localStorage under this key" },
        { name: "ResizablePanel: id", type: "string", description: "Unique panel identifier (required for persistence)" },
        { name: "ResizablePanel: defaultSize", type: "number", description: "Initial size as a percentage of the group" },
        { name: "ResizablePanel: minSize", type: "number", description: "Minimum size percentage" },
        { name: "ResizablePanel: maxSize", type: "number", description: "Maximum size percentage" },
        { name: "ResizablePanel: collapsible", type: "boolean", default: "false", description: "Allow collapsing past minSize to collapsedSize" },
        { name: "ResizablePanel: collapsedSize", type: "number", default: "0", description: "Size when collapsed" },
        { name: "ResizableHandle: withHandle", type: "boolean", default: "false", description: "Render a visible grip icon" },
      ]} />
    </>
  )
}
