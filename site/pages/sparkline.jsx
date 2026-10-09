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
/* Free space draining: lower is worse, and the latest point is past the second threshold. */
const free = [85, 80, 72, 60, 45, 30, 25, 15]
/* A failed poll in the middle, and one at the end. */
const gappy = [12, 18, null, 24, 20, null, 27, 31]
const stale = [12, 18, 9, 24, 20, 35, 27, null]
const delta = [3, -2, 5, -4, 1, 2]
const spiky = [40, 60, 130, 90, 70]
/* Errors a minute: one burst flattens the rest on a linear axis, and a quiet minute is zero. */
const errors = [2, 0, 5, 3, 140, 12, 4, 6]
/* Requests sampled each minute, with minutes 4 to 9 missed, and a second source polled on its own clock. */
const start = Date.UTC(2026, 9, 9, 12, 0)
const at = (minutes) => minutes.map((m) => new Date(start + m * 60_000))
const sampledAt = at([0, 1, 2, 3, 10, 11, 12, 13])
const polledAt = at([0, 4, 8, 13])
const polled = [12, 18, 22, 21]

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
          The y axis runs from <code>min</code> to <code>max</code>, each defaulting to the data's end
          folded with 0, so a positive series rises from a zero baseline. The stroke is{" "}
          <code>currentColor</code>, so the line takes the colour of the text around it
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
        <h3>Smooth line</h3>
        <ComponentPreview code={`<Sparkline points={requests} />
<Sparkline points={requests} type="monotone" />
<Sparkline points={requests} width={160} height={40} inset={3} />
<Sparkline points={requests} type="monotone" width={160} height={40} inset={3} />`}>
          <div className="pg-row" data-pg="spark-curve">
            <Sparkline points={requests} />
            <Sparkline points={requests} type="monotone" />
            <Sparkline points={requests} width={160} height={40} inset={3} />
            <Sparkline points={requests} type="monotone" width={160} height={40} inset={3} />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          The line is straight between readings by default. <code>type="monotone"</code> rounds it into
          a curve that still passes through every reading and never overshoots one, so a peak stays a
          peak and the line stays inside the box. <code>type="step"</code> holds each reading until
          the next. The wash follows the same shape.
        </p>
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
        <h3>Gaps</h3>
        <p>
          A sample that is not a finite number, such as a poll that failed, is a gap: the line and
          the wash break there rather than dropping to zero, and the dot stays on the latest reading.
        </p>
        <ComponentPreview code={`<Sparkline points={[12, 18, null, 24, 20, null, 27, 31]} />
<Sparkline points={[12, 18, 9, 24, 20, 35, 27, null]} />`}>
          <div className="pg-row" data-pg="spark-gaps">
            <Sparkline points={gappy} />
            <Sparkline points={stale} />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          A reading with a gap on both sides draws nothing. Keep the window the same length and
          push a <code>null</code> for a missed beat, so the x positions stay honest.
        </p>
      </section>

      <section className="pg-section">
        <h3>Time</h3>
        <p>
          By default the readings sit evenly across the box, one slot each. <code>times</code> places
          each one by its timestamp instead, so a stretch the poller missed reads as a long segment
          rather than vanishing.
        </p>
        <ComponentPreview code={`<Sparkline points={requests} />
<Sparkline points={requests} times={sampledAt} />
<Sparkline
  times={sampledAt}
  series={[{ points: requests }, { points: polled, times: polledAt }]}
/>`}>
          <div className="pg-row" data-pg="spark-time">
            <Sparkline points={requests} />
            <Sparkline points={requests} times={sampledAt} />
            <Sparkline times={sampledAt} series={[{ points: requests }, { points: polled, times: polledAt }]} />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>times</code> takes milliseconds or <code>Date</code>s, one per reading, oldest first.
          A series item takes its own <code>times</code> or shares the component's, so sources polled on
          different clocks still line up. A reading without a time is a gap. To break the line across
          a missed stretch rather than bridge it, push a <code>null</code> reading for it.
        </p>
      </section>

      <section className="pg-section">
        <h3>Range</h3>
        <ComponentPreview code={`<Sparkline points={[3, -2, 5, -4, 1, 2]} />
<Sparkline points={[40, 60, 130, 90, 70]} max={100} />`}>
          <div className="pg-row" data-pg="spark-range">
            <Sparkline points={delta} />
            <Sparkline points={spiky} max={100} />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          A series that crosses zero keeps its baseline inside the box, with the wash filling to
          the zero line on either side. A value past <code>min</code> or <code>max</code> pegs to
          that edge, as a gauge needle does, so a spike over a pinned scale neither clips nor
          rescales the line.
        </p>
      </section>

      <section className="pg-section">
        <h3>Scale</h3>
        <p>
          <code>scale</code> sets how values map to height. On the default linear scale one burst
          flattens everything else onto the floor. <code>"sqrt"</code> plots the square root: the burst
          still tops the box, the quiet minutes get room to show their shape, and zero stays on the
          floor. <code>"log"</code> plots the logarithm, so each step up the box is the same ratio and
          2 to 20 rises as far as 20 to 200.
        </p>
        <ComponentPreview code={`<Sparkline points={errors} />
<Sparkline points={errors} scale="sqrt" />
<Sparkline points={errors} scale="log" />`}>
          <div className="pg-row" data-pg="spark-scale">
            <Sparkline points={errors} width={160} height={40} inset={3} />
            <Sparkline points={errors} scale="sqrt" width={160} height={40} inset={3} />
            <Sparkline points={errors} scale="log" width={160} height={40} inset={3} />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          A log scale has no zero. <code>min</code> and <code>max</code> must be positive, an unset
          end is the smallest or largest positive reading, and a reading of zero or below sits on the
          floor, as the quiet minute does here.
        </p>
      </section>

      <section className="pg-section">
        <h3>Thresholds</h3>
        <p>
          <code>thresholds</code> colours the line like a meter: green below the first value, amber
          from it, red from the second. Each stretch of line and wash takes the band it sits in, so a
          spike shows red where it crossed, and the dot takes the band of the latest point.
        </p>
        <ComponentPreview code={`<Sparkline points={load} max={100} thresholds={[60, 80]} />
<Sparkline points={free} max={100} thresholds={[40, 20]} />`}>
          <div className="pg-row">
            <span className="pg-row" data-pg="spark-meter-live"><LiveMeter /></span>
            <span data-pg="spark-meter">
              <Sparkline points={load} max={100} thresholds={[60, 80]} width={160} height={40} inset={3} />
            </span>
            <span data-pg="spark-meter-down">
              <Sparkline points={free} max={100} thresholds={[40, 20]} width={160} height={40} inset={3} />
            </span>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Descending thresholds read lower-is-worse: free space at <code>{"[40, 20]"}</code> turns amber
          at 40 and red at 20. A value equal to a threshold is in the worse band. The bands replace{" "}
          <code>color</code>; <code>dotColor</code> and <code>areaColor</code> still win for their parts.
          Set <code>--sparkline-ok</code>, <code>--sparkline-warn</code> or{" "}
          <code>--sparkline-critical</code> on any ancestor to recolour a band.
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
        { name: "points", type: "(number | null)[]", default: "[]", description: "The series, oldest first. Anything but a finite number is a gap" },
        { name: "series", type: "{ points, times, color, theme, dotColor, areaColor, areaOpacity }[]", description: "Several series on one scale, first at the back. Replaces points, color and theme. An item without color or theme takes --chart-1…5 in order, and one without times shares the component's" },
        { name: "times", type: "(number | Date)[]", description: "A timestamp per reading. Places each one on x by time instead of evenly by index; a reading without a time is a gap" },
        { name: "scale", type: '"linear" | "sqrt" | "log"', default: '"linear"', description: "How values map to height. sqrt and log give small readings room beside a spike; log needs positive min and max, and puts a reading at or below zero on the floor" },
        { name: "color", type: "string", default: "currentColor", description: "Colour of the line, and of the wash and dot unless they are set" },
        { name: "theme", type: "{ light, dark }", description: "A colour per scheme, in place of color" },
        { name: "dotColor", type: "string", default: "the line colour", description: "Colour of the latest-point dot" },
        { name: "areaColor", type: "string", default: "the line colour", description: "Colour of the wash" },
        { name: "areaOpacity", type: "number", default: "0.12", description: "Opacity of the wash, 0 to 1" },
        { name: "thresholds", type: "[warn, critical]", description: "Colour by band, like a meter: green, amber from warn, red from critical. Ascending is higher-is-worse, descending lower-is-worse. Replaces color and theme" },
        { name: "min", type: "number", default: "the smaller of 0 and the data's minimum", description: "Bottom of the y axis; a value below it pegs to the edge" },
        { name: "max", type: "number", default: "the larger of 0 and the data's maximum", description: "Top of the y axis; a value above it pegs to the edge" },
        { name: "area", type: "boolean", default: "true", description: "Fill under the line with a wash of the stroke colour" },
        { name: "dot", type: "boolean", default: "true", description: "Mark the latest point" },
        { name: "type", type: '"linear" | "monotone" | "step" | …', default: '"linear"', description: "Line shape: straight segments, a curve through every reading that never overshoots, or steps (step, stepBefore, stepAfter)" },
        { name: "width", type: "number", default: "72", description: "Box width in px" },
        { name: "height", type: "number", default: "24", description: "Box height in px" },
        { name: "inset", type: "number", default: "2", description: "Margin from the box edges, and the dot's radius" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="Custom properties" props={[
        { name: "--sparkline-dot", type: "<color>", default: "currentColor", description: "Fill of the latest-point dot. Set it on any ancestor" },
        { name: "--sparkline-area", type: "<color>", default: "currentColor", description: "Fill of the wash. Set it on any ancestor" },
        { name: "--sparkline-area-opacity", type: "<number>", default: "0.12", description: "Opacity of the wash. Set it on any ancestor" },
        { name: "--sparkline-ok", type: "<color>", default: "var(--success)", description: "Before the first threshold" },
        { name: "--sparkline-warn", type: "<color>", default: "--warning, turned yellow", description: "Between the thresholds" },
        { name: "--sparkline-critical", type: "<color>", default: "var(--destructive)", description: "Past the second threshold" },
      ]} />
    </>
  )
}
