import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../../ui/resizable/resizable.jsx"
import "../../ui/resizable/resizable.css"

const panelStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "0.875rem",
  color: "var(--muted-foreground)",
}

export default function ResizablePage() {
  return (
    <>
      <h2>Resizable</h2>

      {/* ——— Horizontal (default) ——— */}
      <section className="pg-section">
        <h3>Horizontal</h3>
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
              defaultSize={30}
              minSize={15}
              maxSize={50}
              collapsible
              collapsedSize={0}
            >
              <div style={panelStyle}>Sidebar</div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel id="c-content" defaultSize={70} minSize={30}>
              <div style={panelStyle}>Content</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </section>

      {/* ——— Nested (horizontal inside vertical) ——— */}
      <section className="pg-section">
        <h3>Nested</h3>
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
