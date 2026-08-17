import { AspectRatio } from "../../ui/aspect-ratio/aspect-ratio.jsx"
import "../../ui/aspect-ratio/aspect-ratio.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function AspectRatioPage() {
  return (
    <>
      <h2>Aspect Ratio</h2>
      <p>Locks a container to a width-to-height ratio so embedded media and placeholder regions hold their shape while loading or resizing.</p>

      <InstallSnippet slug="aspect-ratio" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<AspectRatio ratio={16 / 9}>
  <img src="..." alt="..." style={{ objectFit: "cover", width: "100%", height: "100%" }} />
</AspectRatio>`}>
          <div style={{ maxWidth: "28rem" }}>
            <AspectRatio ratio={16 / 9}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-lg)", backgroundColor: "var(--muted)", color: "var(--muted-foreground)", width: "100%", height: "100%" }}>
                16 : 9
              </div>
            </AspectRatio>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { AspectRatio } from "./ui/aspect-ratio/aspect-ratio"
import "./ui/aspect-ratio/aspect-ratio.css"

<AspectRatio ratio={16 / 9}>
  <img src="..." alt="..." style={{ objectFit: "cover", width: "100%", height: "100%" }} />
</AspectRatio>`}>
          <div style={{ maxWidth: "28rem" }}>
            <AspectRatio ratio={16 / 9}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-lg)", backgroundColor: "var(--muted)", color: "var(--muted-foreground)", width: "100%", height: "100%" }}>
                16 : 9
              </div>
            </AspectRatio>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Common ratios</h3>
        <ComponentPreview code={`<AspectRatio ratio={16 / 9}>16 : 9</AspectRatio>
<AspectRatio ratio={4 / 3}>4 : 3</AspectRatio>
<AspectRatio ratio={1}>1 : 1</AspectRatio>`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
            {[[16, 9], [4, 3], [1, 1]].map(([w, h]) => (
              <AspectRatio key={`${w}:${h}`} ratio={w / h}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-lg)", backgroundColor: "var(--muted)", color: "var(--muted-foreground)", width: "100%", height: "100%" }}>
                  {w} : {h}
                </div>
              </AspectRatio>
            ))}
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Video embed</h3>
        <ComponentPreview code={`<AspectRatio ratio={16 / 9}>
  <iframe
    src="https://www.youtube.com/embed/..."
    style={{ width: "100%", height: "100%", border: 0 }}
    allow="accelerometer; autoplay; clipboard-write"
    allowFullScreen
  />
</AspectRatio>`}>
          <div style={{ maxWidth: "28rem" }}>
            <AspectRatio ratio={16 / 9}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "var(--radius-lg)", backgroundColor: "var(--muted)", color: "var(--muted-foreground)", width: "100%", height: "100%", fontSize: "0.875rem" }}>
                iframe placeholder (16 : 9)
              </div>
            </AspectRatio>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "ratio", type: "number", default: "1", description: "Width divided by height (e.g. 16/9, 4/3, 1)" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
