import { Sparkline } from "../../ui/sparkline/sparkline.jsx"
import { Card, CardContent } from "../../ui/card/card.jsx"
import "../../ui/sparkline/sparkline.css"
import "../../ui/card/card.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const requests = [12, 18, 9, 24, 20, 35, 27, 31]
const latency = [42, 38, 45, 40, 36, 39, 33, 35]
const cpu = [61, 64, 58, 70, 66, 72, 69, 74]

const statCard = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "1rem",
}

export default function SparklinePage() {
  return (
    <>
      <h2>Sparkline</h2>
      <p>An inline trend line for the figure beside it: a stroke, a wash under it, and a dot on the latest point.</p>

      <InstallSnippet slug="sparkline" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Sparkline points={[12, 18, 9, 24, 20, 35, 27, 31]} />`}>
          <div className="pg-row" data-pg="spark-default">
            <Sparkline points={requests} />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          The y axis runs from <code>min</code> (default 0) to <code>max</code> (default the data's maximum).
          The stroke is <code>currentColor</code>, so the line takes the colour of the text around it.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Sparkline } from "./ui/sparkline/sparkline"
import "./ui/sparkline/sparkline.css"

<Sparkline points={[12, 18, 9, 24, 20, 35, 27, 31]} />

// A series of percentages: pin the scale so the line does not rescale as it moves.
<Sparkline points={cpu} max={100} />`}>
          <div className="pg-row">
            <Sparkline points={requests} />
            <Sparkline points={cpu} max={100} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Beside a figure</h3>
        <p>
          The sparkline is always <code>aria-hidden</code>: the number is the accessible content,
          and the line only illustrates it. Set <code>color</code> on a parent to tint the line,
          and <code>--sparkline-dot</code> to mark the latest point in a second colour.
        </p>
        <ComponentPreview code={`<Card>
  <CardContent style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <div>
      <div className="stat-num">74%</div>
      <div className="stat-label">CPU</div>
    </div>
    <div style={{ color: "var(--chart-1)", "--sparkline-dot": "var(--chart-2)" }}>
      <Sparkline points={cpu} max={100} />
    </div>
  </CardContent>
</Card>`}>
          <div className="pg-row" data-pg="spark-figure">
            <Card style={{ width: "14rem" }}>
              <CardContent style={statCard}>
                <div>
                  <div className="pg-stat-num">74%</div>
                  <div className="pg-stat-label">CPU</div>
                </div>
                <div style={{ color: "var(--chart-1)", "--sparkline-dot": "var(--chart-2)" }}>
                  <Sparkline points={cpu} max={100} />
                </div>
              </CardContent>
            </Card>
            <Card style={{ width: "14rem" }}>
              <CardContent style={statCard}>
                <div>
                  <div className="pg-stat-num">35 ms</div>
                  <div className="pg-stat-label">Latency</div>
                </div>
                <Sparkline points={latency} />
              </CardContent>
            </Card>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Without area</h3>
        <ComponentPreview code={`<Sparkline points={requests} area={false} />
<Sparkline points={requests} area={false} dot={false} />`}>
          <div className="pg-row" data-pg="spark-noarea">
            <Sparkline points={requests} area={false} />
            <Sparkline points={requests} area={false} dot={false} />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>area={"{false}"}</code> drops the wash; <code>dot={"{false}"}</code> drops the end marker.
        </p>
      </section>

      <section className="pg-section">
        <h3>Single point and empty</h3>
        <ComponentPreview code={`<Sparkline points={[20]} />
<Sparkline points={[]} />`}>
          <div className="pg-row">
            <span data-pg="spark-single"><Sparkline points={[20]} /></span>
            <span data-pg="spark-empty"><Sparkline points={[]} /></span>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          One point draws only the dot, centred. No points draw an empty box of the same size, so
          a stat card keeps its layout while its series loads.
        </p>
      </section>

      <section className="pg-section">
        <h3>Sizing</h3>
        <ComponentPreview code={`<Sparkline points={latency} width={48} height={16} />
<Sparkline points={latency} />
<Sparkline points={latency} width={160} height={40} inset={3} />`}>
          <div className="pg-row" data-pg="spark-sizing">
            <Sparkline points={latency} width={48} height={16} />
            <Sparkline points={latency} />
            <Sparkline points={latency} width={160} height={40} inset={3} />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>width</code> and <code>height</code> are the box in px. <code>inset</code> is the margin the
          stroke and dot keep from its edges, and the dot's radius, so nothing clips at the extremes.
        </p>
      </section>

      <ApiReference title="Sparkline" props={[
        { name: "points", type: "number[]", default: "[]", description: "The series, oldest first" },
        { name: "min", type: "number", default: "0", description: "Bottom of the y axis" },
        { name: "max", type: "number", description: "Top of the y axis; defaults to the largest value in points" },
        { name: "area", type: "boolean", default: "true", description: "Fill under the line with a wash of the stroke colour" },
        { name: "dot", type: "boolean", default: "true", description: "Mark the latest point" },
        { name: "width", type: "number", default: "72", description: "Box width in px" },
        { name: "height", type: "number", default: "24", description: "Box height in px" },
        { name: "inset", type: "number", default: "2", description: "Margin from the box edges, and the dot's radius" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="Custom properties" props={[
        { name: "--sparkline-dot", type: "<color>", default: "currentColor", description: "Fill of the latest-point dot. Set it on any ancestor" },
      ]} />
    </>
  )
}
