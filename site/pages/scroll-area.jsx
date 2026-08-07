import { DirectionProvider } from "../../lib/direction.jsx"
import { Separator } from "../../ui/separator/separator.jsx"
import { ScrollArea, ScrollBar } from "../../ui/scroll-area/scroll-area.jsx"
import "../../ui/scroll-area/scroll-area.css"
import "../../ui/separator/separator.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const tags = Array.from({ length: 40 }, (_, i) => `v1.2.0-beta.${40 - i}`)
const columns = Array.from({ length: 12 }, (_, i) => `Column ${i + 1}`)
const snapItems = Array.from({ length: 8 }, (_, i) => `Slide ${i + 1}`)

export default function ScrollAreaPage() {
  return (
    <>
      <h2>Scroll Area</h2>
      <p>An overlay-scrollbar container with thumb drag, track click, hover/scroll indicators, overflow-edge detection, and RTL support.</p>

      <section className="pg-section">
        <h3>Vertical</h3>
        <ScrollArea
          data-pg="sa-vertical"
          style={{
            blockSize: "12rem",
            inlineSize: "12rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ padding: "1rem" }} data-pg="sa-vertical-content">
            <h4 style={{ margin: "0 0 0.5rem", fontSize: "0.875rem" }}>Tags</h4>
            {tags.map((tag) => (
              <div key={tag}>
                <div style={{ fontSize: "0.875rem" }}>{tag}</div>
                <Separator style={{ marginBlock: "0.5rem" }} />
              </div>
            ))}
          </div>
        </ScrollArea>
      </section>

      <section className="pg-section">
        <h3>Horizontal (ScrollBar passed as a child)</h3>
        <ScrollArea
          data-pg="sa-horizontal"
          style={{
            inlineSize: "20rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ display: "flex", gap: "0.75rem", padding: "1rem 1rem 1.25rem" }}>
            {columns.map((column) => (
              <div
                key={column}
                style={{
                  flex: "0 0 auto",
                  inlineSize: "6rem",
                  blockSize: "4rem",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.875rem",
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--muted)",
                }}
              >
                {column}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" data-pg="sa-horizontal-bar" />
        </ScrollArea>
      </section>

      <section className="pg-section">
        <h3>Both axes (corner)</h3>
        <ScrollArea
          data-pg="sa-both"
          style={{
            blockSize: "10rem",
            inlineSize: "20rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ padding: "1rem", inlineSize: "40rem" }}>
            {tags.slice(0, 12).map((tag) => (
              <p key={tag} style={{ margin: "0 0 0.5rem", fontSize: "0.875rem" }}>
                {tag} — a line long enough to overflow the viewport on both axes at once.
              </p>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      <section className="pg-section">
        <h3>No overflow (no scrollbar, viewport not focusable)</h3>
        <ScrollArea
          data-pg="sa-short"
          style={{
            blockSize: "6rem",
            inlineSize: "12rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ padding: "1rem", fontSize: "0.875rem" }}>Fits.</div>
        </ScrollArea>
      </section>

      <section className="pg-section">
        <h3>keepMounted (track shown without overflow)</h3>
        <ScrollArea
          data-pg="sa-keep"
          style={{
            blockSize: "6rem",
            inlineSize: "12rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ padding: "1rem", fontSize: "0.875rem" }}>Fits.</div>
          <ScrollBar keepMounted data-pg="sa-keep-bar" />
        </ScrollArea>
      </section>

      <section className="pg-section">
        <h3>RTL</h3>
        <DirectionProvider dir="rtl">
          <ScrollArea
            data-pg="sa-rtl"
            style={{
              blockSize: "10rem",
              inlineSize: "20rem",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)",
            }}
          >
            <div style={{ padding: "1rem", inlineSize: "40rem" }}>
              {["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"].map((line) => (
                <p key={line} style={{ margin: "0 0 0.5rem", fontSize: "0.875rem" }}>
                  {line} — سطر طويل بما يكفي لتجاوز عرض المنطقة القابلة للتمرير.
                </p>
              ))}
            </div>
            <ScrollBar orientation="horizontal" data-pg="sa-rtl-bar" />
          </ScrollArea>
        </DirectionProvider>
      </section>

      <section className="pg-section">
        <h3>Fade mask (overflow edge detection)</h3>
        <ScrollArea
          data-pg="sa-fade"
          className="scroll-area--fade-demo"
          style={{
            blockSize: "10rem",
            inlineSize: "16rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ padding: "1rem" }}>
            {tags.slice(0, 20).map((tag) => (
              <div key={tag} style={{ fontSize: "0.875rem", marginBlockEnd: "0.5rem" }}>
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
        <style>{`
          .scroll-area--fade-demo .scroll-area-viewport {
            --fade-size: 2rem;
            --mask-start: transparent, black var(--fade-size);
            --mask-end: black calc(100% - var(--fade-size)), transparent;
            mask-image: linear-gradient(to bottom, black, black);
          }
          .scroll-area--fade-demo[data-overflow-y-start] .scroll-area-viewport {
            mask-image: linear-gradient(to bottom, var(--mask-start), black var(--fade-size));
          }
          .scroll-area--fade-demo[data-overflow-y-end] .scroll-area-viewport {
            mask-image: linear-gradient(to bottom, black calc(100% - var(--fade-size)), var(--mask-end));
          }
          .scroll-area--fade-demo[data-overflow-y-start][data-overflow-y-end] .scroll-area-viewport {
            mask-image: linear-gradient(to bottom, var(--mask-start), var(--mask-end));
          }
        `}</style>
      </section>

      <section className="pg-section">
        <h3>With threshold (overflowEdgeThreshold)</h3>
        <ScrollArea
          data-pg="sa-threshold"
          overflowEdgeThreshold={20}
          style={{
            blockSize: "8rem",
            inlineSize: "16rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ padding: "1rem" }}>
            {tags.slice(0, 15).map((tag) => (
              <div key={tag} style={{ fontSize: "0.875rem", marginBlockEnd: "0.5rem" }}>
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </section>

      <section className="pg-section">
        <h3>Snap content (snap suspension)</h3>
        <ScrollArea
          data-pg="sa-snap"
          style={{
            inlineSize: "20rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div
            data-pg="sa-snap-track"
            style={{
              display: "flex",
              gap: "0.75rem",
              padding: "1rem 1rem 1.25rem",
              scrollSnapType: "x mandatory",
              overflowX: "auto",
              scrollbarWidth: "none",
            }}
          >
            {snapItems.map((item) => (
              <div
                key={item}
                style={{
                  flex: "0 0 auto",
                  inlineSize: "10rem",
                  blockSize: "6rem",
                  display: "grid",
                  placeItems: "center",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  borderRadius: "var(--radius-md)",
                  backgroundColor: "var(--muted)",
                  scrollSnapAlign: "start",
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>

      <section className="pg-section">
        <h3>Overscroll squish</h3>
        <ScrollArea
          data-pg="sa-squish"
          style={{
            blockSize: "10rem",
            inlineSize: "16rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <div style={{ padding: "1rem" }}>
            {tags.slice(0, 12).map((tag) => (
              <div key={tag} style={{ fontSize: "0.875rem", marginBlockEnd: "0.5rem" }}>
                {tag}
              </div>
            ))}
          </div>
        </ScrollArea>
      </section>

      <InstallSnippet slug="scroll-area" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { ScrollArea, ScrollBar } from "./ui/scroll-area/scroll-area"
import "./ui/scroll-area/scroll-area.css"

<ScrollArea style={{ blockSize: "12rem" }}>
  <div style={{ padding: "1rem" }}>
    {/* scrollable content */}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>See the live demos above.</p>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "overflowEdgeThreshold", type: "number", default: "0", description: "Pixels of overflow before data-overflow-* attributes appear" },
        { name: "ScrollBar: orientation", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Scroll axis this bar controls" },
        { name: "ScrollBar: keepMounted", type: "boolean", default: "false", description: "Render the track even without overflow" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
