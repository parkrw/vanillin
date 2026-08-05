import { useRef, useState } from "react"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../ui/resizable/resizable.jsx"
import "../../ui/resizable/resizable.css"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"

const panelStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.875rem",
  color: "var(--muted-foreground)",
}

export default function ResizablePage() {
  const sidebarRef = useRef(null)
  const [sidebarState, setSidebarState] = useState("expanded")

  return (
    <>
      <h2>Resizable</h2>

      <p className="pg-section" style={{ maxInlineSize: "40rem" }}>
        Resizable panels split a container into adjustable regions separated by
        draggable handles. Panels can be collapsed, persisted across sessions,
        and controlled programmatically.
      </p>

      {/* ——— Horizontal (default) ——— */}
      <section className="pg-section">
        <h3>Horizontal</h3>
        <p>
          Two panels side by side. Drag the separator or use keyboard arrows
          when focused. <code>minSize</code> prevents either panel from
          disappearing.
        </p>
        <div
          data-pg="r-horizontal"
          style={{
            blockSize: "12rem",
            inlineSize: "100%",
            maxInlineSize: "32rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
          }}
        >
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
      </section>

      {/* ——— Vertical ——— */}
      <section className="pg-section">
        <h3>Vertical</h3>
        <p>
          Set <code>direction="vertical"</code> for a top/bottom split.
          Arrow Up/Down resize; Arrow Left/Right are no-ops.
        </p>
        <div
          data-pg="r-vertical"
          style={{
            blockSize: "16rem",
            inlineSize: "100%",
            maxInlineSize: "32rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
          }}
        >
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
      </section>

      {/* ——— With Handle ——— */}
      <section className="pg-section">
        <h3>With Handle</h3>
        <p>
          Pass <code>withHandle</code> to render a visible grip icon on the
          separator.
        </p>
        <div
          data-pg="r-handle"
          style={{
            blockSize: "12rem",
            inlineSize: "100%",
            maxInlineSize: "32rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
          }}
        >
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
      </section>

      {/* ——— Collapsible ——— */}
      <section className="pg-section">
        <h3>Collapsible</h3>
        <p>
          A <code>collapsible</code> panel snaps shut when dragged past its
          minimum. Press Enter on a focused handle to toggle. The imperative
          handle exposes <code>collapse()</code> and <code>expand()</code>.
        </p>
        <div
          data-pg="r-collapsible"
          style={{
            blockSize: "12rem",
            inlineSize: "100%",
            maxInlineSize: "32rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
          }}
        >
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
      </section>

      {/* ——— Persistent layout ——— */}
      <section className="pg-section">
        <h3>Persistent Layout</h3>
        <p>
          Pass <code>autoSaveId</code> to persist the layout to localStorage.
          Resize the panels below, then reload the page — the layout restores
          without a flash. Storage is keyed by panel IDs and count, so a saved
          3-panel layout is silently dropped if the group changes to 2 panels.
        </p>
        <div
          data-pg="r-persistent"
          style={{
            blockSize: "12rem",
            inlineSize: "100%",
            maxInlineSize: "32rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
          }}
        >
          <ResizablePanelGroup
            direction="horizontal"
            autoSaveId="demo-persistent"
          >
            <ResizablePanel id="p-left" defaultSize={35} minSize={15}>
              <div style={panelStyle}>Left</div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel id="p-right" defaultSize={65} minSize={15}>
              <div style={panelStyle}>Right</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </section>

      {/* ——— Nested (horizontal inside vertical) ——— */}
      <section className="pg-section">
        <h3>Nested</h3>
        <p>
          Groups can be nested. Each group manages its own separators
          independently; F6 cycles only the separators of the focused group.
        </p>
        <div
          data-pg="r-nested"
          style={{
            blockSize: "20rem",
            inlineSize: "100%",
            maxInlineSize: "40rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
          }}
        >
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
      </section>

      {/* ——— Three panels ——— */}
      <section className="pg-section">
        <h3>Three Panels</h3>
        <p>
          Any number of panels and handles. Focus a handle and press F6 to
          cycle to the next handle within the same group, Shift+F6 to go
          backward. The cycle wraps.
        </p>
        <div
          data-pg="r-three"
          style={{
            blockSize: "12rem",
            inlineSize: "100%",
            maxInlineSize: "40rem",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
          }}
        >
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
      </section>
    </>
  )
}
