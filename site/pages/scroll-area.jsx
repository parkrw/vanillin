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

const frame = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)",
}

const tile = {
  flex: "0 0 auto",
  display: "grid",
  placeItems: "center",
  fontSize: "0.875rem",
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--muted)",
}

export default function ScrollAreaPage() {
  return (
    <>
      <h2>Scroll Area</h2>
      <p>An overlay-scrollbar container with thumb drag, track click, hover and scroll indicators, overflow-edge detection, and RTL support.</p>

      <section className="pg-section">
        <h3>Vertical</h3>
        <ComponentPreview code={`<ScrollArea style={{ blockSize: "12rem", inlineSize: "12rem" }}>
  <div style={{ padding: "1rem" }}>
    <h4>Tags</h4>
    {tags.map((tag) => (
      <div key={tag}>
        <div>{tag}</div>
        <Separator />
      </div>
    ))}
  </div>
</ScrollArea>`}>
          <ScrollArea
            data-pg="sa-vertical"
            style={{ ...frame, blockSize: "12rem", inlineSize: "12rem" }}
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
        </ComponentPreview>
        <p className="pg-desc">
          A vertical bar is rendered for you when the content overflows. The bar overlays the content instead of taking layout space, so the box does not reflow when it appears.
        </p>
      </section>

      <section className="pg-section">
        <h3>Horizontal</h3>
        <ComponentPreview code={`<ScrollArea style={{ inlineSize: "20rem" }}>
  <div style={{ display: "flex", gap: "0.75rem", padding: "1rem" }}>
    {columns.map((column) => (
      <div key={column}>{column}</div>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`}>
          <ScrollArea data-pg="sa-horizontal" style={{ ...frame, inlineSize: "20rem" }}>
            <div style={{ display: "flex", gap: "0.75rem", padding: "1rem 1rem 1.25rem" }}>
              {columns.map((column) => (
                <div key={column} style={{ ...tile, inlineSize: "6rem", blockSize: "4rem" }}>
                  {column}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" data-pg="sa-horizontal-bar" />
          </ScrollArea>
        </ComponentPreview>
        <p className="pg-desc">
          A horizontal bar is opt-in: pass <code>ScrollBar</code> as a child of the area. Anything that is not a <code>ScrollBar</code> becomes the scrollable content.
        </p>
      </section>

      <section className="pg-section">
        <h3>Both axes</h3>
        <ComponentPreview code={`<ScrollArea style={{ blockSize: "10rem", inlineSize: "20rem" }}>
  <div style={{ padding: "1rem", inlineSize: "40rem" }}>
    {/* content wider and taller than the box */}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`}>
          <ScrollArea
            data-pg="sa-both"
            style={{ ...frame, blockSize: "10rem", inlineSize: "20rem" }}
          >
            <div style={{ padding: "1rem", inlineSize: "40rem" }}>
              {tags.slice(0, 12).map((tag) => (
                <p key={tag} style={{ margin: "0 0 0.5rem", fontSize: "0.875rem" }}>
                  {tag}: a line long enough to overflow the viewport on both axes at once.
                </p>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </ComponentPreview>
        <p className="pg-desc">
          With both bars mounted, a corner element fills the gap where they meet so neither bar overlaps the other.
        </p>
      </section>

      <section className="pg-section">
        <h3>No overflow</h3>
        <ComponentPreview code={`{/* Content fits: no bar is rendered and the viewport is not focusable. */}
<ScrollArea style={{ blockSize: "6rem", inlineSize: "12rem" }}>
  <div style={{ padding: "1rem" }}>Fits.</div>
</ScrollArea>`}>
          <ScrollArea
            data-pg="sa-short"
            style={{ ...frame, blockSize: "6rem", inlineSize: "12rem" }}
          >
            <div style={{ padding: "1rem", fontSize: "0.875rem" }}>Fits.</div>
          </ScrollArea>
        </ComponentPreview>
        <p className="pg-desc">
          Content that fits produces no bar, and the viewport drops out of the tab order. A container nobody can scroll should not be a tab stop.
        </p>
      </section>

      <section className="pg-section">
        <h3>keepMounted</h3>
        <ComponentPreview code={`<ScrollArea style={{ blockSize: "6rem", inlineSize: "12rem" }}>
  <div style={{ padding: "1rem" }}>Fits.</div>
  <ScrollBar keepMounted />
</ScrollArea>`}>
          <ScrollArea
            data-pg="sa-keep"
            style={{ ...frame, blockSize: "6rem", inlineSize: "12rem" }}
          >
            <div style={{ padding: "1rem", fontSize: "0.875rem" }}>Fits.</div>
            <ScrollBar keepMounted data-pg="sa-keep-bar" />
          </ScrollArea>
        </ComponentPreview>
        <p className="pg-desc">
          <code>keepMounted</code> renders the track even with nothing to scroll. Use it when the content grows later and you would rather not have the layout twitch when the bar appears.
        </p>
      </section>

      <section className="pg-section">
        <h3>RTL</h3>
        <ComponentPreview code={`<DirectionProvider dir="rtl">
  <ScrollArea style={{ blockSize: "10rem", inlineSize: "20rem" }}>
    <div style={{ padding: "1rem", inlineSize: "40rem" }}>…</div>
    <ScrollBar orientation="horizontal" />
  </ScrollArea>
</DirectionProvider>`}>
          <DirectionProvider dir="rtl">
            <ScrollArea
              data-pg="sa-rtl"
              style={{ ...frame, blockSize: "10rem", inlineSize: "20rem" }}
            >
              <div style={{ padding: "1rem", inlineSize: "40rem" }}>
                {["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"].map((line) => (
                  <p key={line} style={{ margin: "0 0 0.5rem", fontSize: "0.875rem" }}>
                    {line}: سطر طويل بما يكفي لتجاوز عرض المنطقة القابلة للتمرير.
                  </p>
                ))}
              </div>
              <ScrollBar orientation="horizontal" data-pg="sa-rtl-bar" />
            </ScrollArea>
          </DirectionProvider>
        </ComponentPreview>
        <p className="pg-desc">
          Under RTL the horizontal thumb starts at the right edge and walks left as you scroll, because scroll offsets run negative from the inline start.
        </p>
      </section>

      <section className="pg-section">
        <h3>Fade mask</h3>
        <p className="pg-desc" style={{ marginBlockEnd: "0.75rem" }}>
          <code>data-overflow-y-start</code> and <code>data-overflow-y-end</code> drive a CSS{" "}
          <code>mask-image</code> fade at clipped edges. Scroll to see the mask appear and disappear.
        </p>
        <ComponentPreview code={`.demo[data-overflow-y-start] .scroll-area-viewport {
  mask-image: linear-gradient(to bottom, transparent, black 2rem);
}
.demo[data-overflow-y-end] .scroll-area-viewport {
  mask-image: linear-gradient(to bottom, black calc(100% - 2rem), transparent);
}`}>
          <ScrollArea
            data-pg="sa-fade"
            className="scroll-area--fade-demo"
            style={{ ...frame, blockSize: "10rem", inlineSize: "16rem" }}
          >
            <div style={{ padding: "1rem" }}>
              {tags.slice(0, 20).map((tag) => (
                <div key={tag} style={{ fontSize: "0.875rem", marginBlockEnd: "0.5rem" }}>
                  {tag}
                </div>
              ))}
            </div>
          </ScrollArea>
        </ComponentPreview>
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
        <p className="pg-desc">
          The component only reports the state. Every fade you see is your own CSS, so the effect can be a shadow, a border, or nothing at all.
        </p>
      </section>

      <section className="pg-section">
        <h3>Overflow edge threshold</h3>
        <p className="pg-desc" style={{ marginBlockEnd: "0.75rem" }}>
          Threshold set to 20px. Scroll slowly from the top: the start attribute only appears
          after 20px of content is clipped.
        </p>
        <ComponentPreview code={`<ScrollArea overflowEdgeThreshold={20} style={{ blockSize: "8rem" }}>
  <div style={{ padding: "1rem" }}>…</div>
</ScrollArea>`}>
          <ScrollArea
            data-pg="sa-threshold"
            overflowEdgeThreshold={20}
            style={{ ...frame, blockSize: "8rem", inlineSize: "16rem" }}
          >
            <div style={{ padding: "1rem" }}>
              {tags.slice(0, 15).map((tag) => (
                <div key={tag} style={{ fontSize: "0.875rem", marginBlockEnd: "0.5rem" }}>
                  {tag}
                </div>
              ))}
            </div>
          </ScrollArea>
        </ComponentPreview>
        <p className="pg-desc">
          Raise the threshold when a sub-pixel rounding error would otherwise flicker the edge attributes on and off at rest.
        </p>
      </section>

      <section className="pg-section">
        <h3>Snap content</h3>
        <p className="pg-desc" style={{ marginBlockEnd: "0.75rem" }}>
          Horizontal scroll-snap content inside a scroll area. Dragging the scrollbar thumb
          suspends snap so it does not re-snap mid-drag.
        </p>
        <ComponentPreview code={`<ScrollArea style={{ inlineSize: "20rem" }}>
  <div style={{ display: "flex", scrollSnapType: "x mandatory", overflowX: "auto" }}>
    {snapItems.map((item) => (
      <div key={item} style={{ scrollSnapAlign: "start" }}>{item}</div>
    ))}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`}>
          <ScrollArea data-pg="sa-snap" style={{ ...frame, inlineSize: "20rem" }}>
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
                    ...tile,
                    inlineSize: "10rem",
                    blockSize: "6rem",
                    fontWeight: 500,
                    scrollSnapAlign: "start",
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </ComponentPreview>
        <p className="pg-desc">
          Snap is restored the moment you release the thumb, so the track settles on a slide instead of wherever the pointer happened to stop.
        </p>
      </section>

      <section className="pg-section">
        <h3>Overscroll squish</h3>
        <p className="pg-desc" style={{ marginBlockEnd: "0.75rem" }}>
          Touch or pen only, since a trackpad already has native overscroll on macOS. Scroll to the top
          or bottom, then keep dragging: the content rubber-bands and springs back on
          release. Disabled under <code>prefers-reduced-motion: reduce</code>.
        </p>
        <ComponentPreview code={`{/* No prop to set: squish is on for touch and pen pointers. */}
<ScrollArea style={{ blockSize: "10rem", inlineSize: "16rem" }}>
  <div style={{ padding: "1rem" }}>…</div>
</ScrollArea>`}>
          <ScrollArea
            data-pg="sa-squish"
            style={{ ...frame, blockSize: "10rem", inlineSize: "16rem" }}
          >
            <div style={{ padding: "1rem" }}>
              {tags.slice(0, 12).map((tag) => (
                <div key={tag} style={{ fontSize: "0.875rem", marginBlockEnd: "0.5rem" }}>
                  {tag}
                </div>
              ))}
            </div>
          </ScrollArea>
        </ComponentPreview>
        <p className="pg-desc">
          A mouse drag past the end does nothing, because a mouse has no momentum to rubber-band against.
        </p>
      </section>

      <InstallSnippet slug="scroll-area" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { ScrollArea, ScrollBar } from "./ui/scroll-area/scroll-area"
import "./ui/scroll-area/scroll-area.css"

<ScrollArea style={{ blockSize: "12rem" }}>
  <div style={{ padding: "1rem" }}>
    {/* scrollable content */}
  </div>
  <ScrollBar orientation="horizontal" />
</ScrollArea>`}>
          <ScrollArea style={{ ...frame, blockSize: "8rem", inlineSize: "14rem" }}>
            <div style={{ padding: "1rem" }}>
              {tags.slice(0, 10).map((tag) => (
                <div key={tag} style={{ fontSize: "0.875rem", marginBlockEnd: "0.5rem" }}>
                  {tag}
                </div>
              ))}
            </div>
          </ScrollArea>
        </ComponentPreview>
        <p className="pg-desc">
          The area needs a bounded size from its own styles or its container. Without one there is nothing to overflow and no bar appears.
        </p>
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
