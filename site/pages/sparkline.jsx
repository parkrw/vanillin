import { useTicker } from "../../lib/use-ticker.js"
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
const inbound = [30, 34, 28, 41, 38, 45, 40, 48]
const outbound = [12, 15, 11, 18, 22, 19, 25, 21]
const blue = { light: "oklch(0.55 0.2 250)", dark: "oklch(0.78 0.14 250)" }

/* Deterministic wander around a base, as on the Live Value page: the demo reads as a metric, not noise. */
const drift = (base, spread) => (tick) =>
  Math.round(base + (Math.sin(tick / 2) * 0.6 + Math.sin(tick / 5) * 0.4) * spread)
const sampleCpu = drift(62, 14)
const sampleLoad = drift(58, 32)
/* Each band holds a vertex well clear of both thresholds, and the latest point is amber. */
const load = [24, 32, 28, 45, 70, 68, 94, 72]

/* The last 24 samples of the shared 2s ticker, so the window slides one step a beat. */
function LiveSparkline() {
  const tick = useTicker(2000)
  const points = Array.from({ length: 24 }, (_, i) => sampleCpu(tick - 23 + i))
  return (
    <>
      <span className="pg-stat-num">{points[points.length - 1]}%</span>
      <Sparkline points={points} max={100} />
    </>
  )
}

function LiveMeter() {
  const tick = useTicker(2000)
  const points = Array.from({ length: 24 }, (_, i) => sampleLoad(tick - 23 + i))
  return (
    <>
      <span className="pg-stat-num">{points[points.length - 1]}%</span>
      <Sparkline points={points} max={100} thresholds={[60, 80]} />
    </>
  )
}

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
          The stroke is <code>currentColor</code>, so the line takes the colour of the text around it
          unless <code>color</code> sets one.
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
        <h3>Color</h3>
        <ComponentPreview code={`<Sparkline points={requests} color="var(--chart-1)" />
<Sparkline points={requests} color="var(--chart-2)" />
<Sparkline points={requests} color="var(--chart-3)" />
<Sparkline points={requests} color="var(--chart-4)" />
<Sparkline points={requests} color="var(--chart-5)" />
<Sparkline points={requests} color="var(--chart-3)" dotColor="var(--chart-1)" />`}>
          <div className="pg-row" data-pg="spark-colors">
            {[1, 2, 3, 4, 5].map((n) => (
              <Sparkline key={n} points={requests} color={`var(--chart-${n})`} />
            ))}
            <Sparkline points={requests} color="var(--chart-3)" dotColor="var(--chart-1)" />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>color</code> takes any CSS colour and tints the line, the wash and the dot.{" "}
          <code>dotColor</code> marks the latest point in a second colour.
        </p>
      </section>

      <section className="pg-section">
        <h3>Light and dark</h3>
        <ComponentPreview code={`<Sparkline
  points={requests}
  theme={{ light: "oklch(0.55 0.2 250)", dark: "oklch(0.78 0.14 250)" }}
/>`}>
          <div className="pg-row" data-pg="spark-theme">
            <Sparkline points={requests} theme={blue} />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>theme</code> takes the same <code>{"{ light, dark }"}</code> pair as a chart series and
          switches with the colour scheme. The <code>--chart-*</code> tokens already switch on their own.
        </p>
      </section>

      <section className="pg-section">
        <h3>Area color</h3>
        <ComponentPreview code={`<Sparkline points={requests} color="var(--chart-2)" areaOpacity={0.3} />
<Sparkline points={requests} color="var(--chart-3)" areaColor="var(--chart-4)" areaOpacity={0.4} />`}>
          <div className="pg-row" data-pg="spark-wash">
            <Sparkline points={requests} color="var(--chart-2)" areaOpacity={0.3} />
            <Sparkline points={requests} color="var(--chart-3)" areaColor="var(--chart-4)" areaOpacity={0.4} />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          The wash is the line colour at 12% by default. <code>areaColor</code> gives it its own colour
          and <code>areaOpacity</code> its own strength, from 0 to 1.
        </p>
      </section>

      <section className="pg-section">
        <h3>Multiple series</h3>
        <ComponentPreview code={`<Sparkline series={[{ points: inbound }, { points: outbound }]} />
<Sparkline
  series={[
    { points: inbound, color: "var(--chart-3)" },
    { points: outbound, color: "var(--chart-5)", dotColor: "var(--chart-1)" },
  ]}
  area={false}
/>`}>
          <div className="pg-row" data-pg="spark-series">
            <Sparkline series={[{ points: inbound }, { points: outbound }]} />
            <Sparkline
              series={[
                { points: inbound, color: "var(--chart-3)" },
                { points: outbound, color: "var(--chart-5)", dotColor: "var(--chart-1)" },
              ]}
              area={false}
            />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>series</code> draws several lines on one shared scale, the first at the back. Each item
          takes <code>points</code> and the same colour props as the component. An item without a colour
          takes the chart palette in order, <code>--chart-1</code> first.
        </p>
      </section>

      <section className="pg-section">
        <h3>Live series</h3>
        <p>
          The sparkline holds no state and samples nothing. It draws the <code>points</code> it is
          given, oldest first, and moves only when that array does: keep the last few readings in
          state, append each new one, and pass the slice. Until the first reading lands the empty
          array draws the bare box, so a card keeps its layout.
        </p>
        <ComponentPreview code={`import { useEffect, useState } from "react"
import { Sparkline } from "./ui/sparkline/sparkline"

function CpuTrend() {
  const [points, setPoints] = useState([])
  useEffect(() => {
    const id = setInterval(async () => {
      const v = await readCpu()
      setPoints((s) => [...s.slice(-23), v]) // keep the last 24
    }, 2000)
    return () => clearInterval(id)
  }, [])
  return <Sparkline points={points} max={100} />
}`}>
          <div className="pg-row" data-pg="spark-live">
            <LiveSparkline />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          The preview slides a 24-point window one step every two seconds on the shared{" "}
          <code>useTicker</code> timer, the way the console's stat cards do, so the figure and the
          line move together.
        </p>
      </section>

      <section className="pg-section">
        <h3>Thresholds</h3>
        <p>
          <code>thresholds</code> colours the line like a meter: green below the first value, amber
          from it, red from the second. Each stretch of line and wash takes the band it sits in, so a
          spike shows red where it crossed, and the dot takes the band of the latest point.
        </p>
        <ComponentPreview code={`<Sparkline points={load} max={100} thresholds={[60, 80]} />`}>
          <div className="pg-row">
            <span className="pg-row" data-pg="spark-meter-live"><LiveMeter /></span>
            <span data-pg="spark-meter">
              <Sparkline points={load} max={100} thresholds={[60, 80]} width={160} height={40} inset={3} />
            </span>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          A value equal to a threshold is in the higher band. The bands replace <code>color</code>;{" "}
          <code>dotColor</code> and <code>areaColor</code> still win for their parts. Set{" "}
          <code>--sparkline-ok</code>, <code>--sparkline-warn</code> or <code>--sparkline-critical</code>{" "}
          on any ancestor to recolour a band.
        </p>
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
        { name: "series", type: "{ points, color, theme, dotColor, areaColor, areaOpacity }[]", description: "Several series on one scale, first at the back. Replaces points, color and theme. An item without color or theme takes --chart-1…5 in order" },
        { name: "color", type: "string", default: "currentColor", description: "Colour of the line, and of the wash and dot unless they are set" },
        { name: "theme", type: "{ light, dark }", description: "A colour per scheme, in place of color" },
        { name: "dotColor", type: "string", default: "the line colour", description: "Colour of the latest-point dot" },
        { name: "areaColor", type: "string", default: "the line colour", description: "Colour of the wash" },
        { name: "areaOpacity", type: "number", default: "0.12", description: "Opacity of the wash, 0 to 1" },
        { name: "thresholds", type: "[number, number]", description: "Colour by band, like a meter: green below the first, amber from it, red from the second. Replaces color and theme" },
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
        { name: "--sparkline-area", type: "<color>", default: "currentColor", description: "Fill of the wash. Set it on any ancestor" },
        { name: "--sparkline-area-opacity", type: "<number>", default: "0.12", description: "Opacity of the wash. Set it on any ancestor" },
        { name: "--sparkline-ok", type: "<color>", default: "var(--success)", description: "Below the first threshold" },
        { name: "--sparkline-warn", type: "<color>", default: "--warning, turned yellow", description: "From the first threshold" },
        { name: "--sparkline-critical", type: "<color>", default: "var(--destructive)", description: "From the second threshold" },
      ]} />
    </>
  )
}
