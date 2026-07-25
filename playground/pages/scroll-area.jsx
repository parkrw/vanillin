import { DirectionProvider } from "../../lib/direction.jsx"
import { Separator } from "../../ui/separator/separator.jsx"
import { ScrollArea, ScrollBar } from "../../ui/scroll-area/scroll-area.jsx"
import "../../ui/scroll-area/scroll-area.css"
import "../../ui/separator/separator.css"

const tags = Array.from({ length: 40 }, (_, i) => `v1.2.0-beta.${40 - i}`)
const columns = Array.from({ length: 12 }, (_, i) => `Column ${i + 1}`)

export default function ScrollAreaPage() {
  return (
    <>
      <h2>Scroll Area</h2>

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
    </>
  )
}
