import { Meter } from "../../ui/meter/meter.jsx"
import "../../ui/meter/meter.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const stack = { width: "60%", display: "flex", flexDirection: "column", gap: "1rem" }
const readout = { display: "flex", justifyContent: "space-between", fontSize: "0.875rem" }

function Reading({ label, used, size, unit = "GB", ...rest }) {
  const pct = Math.round((used / size) * 100)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
      <div style={readout}>
        <span id={`meter-${label}`}>{label}</span>
        <span style={{ color: "var(--muted-foreground)" }}>{used} / {size} {unit} · {pct}%</span>
      </div>
      <Meter
        value={used}
        max={size}
        aria-labelledby={`meter-${label}`}
        aria-valuetext={`${used} of ${size} ${unit}`}
        {...rest}
      />
    </div>
  )
}

export default function MeterPage() {
  return (
    <>
      <h2>Meter</h2>
      <p>
        A level inside a known range, such as disk used or quota spent. It is read
        as a measurement, not as work in flight; use Progress for a task moving
        toward done.
      </p>

      <InstallSnippet slug="meter" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Meter value={41} max={50} aria-label="Storage used" />`}>
          <div style={{ width: "60%" }}>
            <Meter value={41} max={50} aria-label="Storage used" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Meter } from "./ui/meter/meter"
import "./ui/meter/meter.css"

<Meter value={41} max={50} aria-label="Storage used" />`}>
          <div style={{ width: "60%" }}>
            <Meter value={41} max={50} aria-label="Storage used" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Label and readout</h3>
        <p>
          Put the name and the raw figures in the text above the bar, and give the
          bar an <code>aria-valuetext</code> that says the same thing, so a screen
          reader hears &quot;41 of 50 GB&quot; instead of a bare percentage. Without
          one it announces the percentage.
        </p>
        <ComponentPreview code={`<div>
  <div>
    <span id="pool-label">Archive</span>
    <span>41 / 50 GB · 82%</span>
  </div>
  <Meter value={41} max={50} aria-labelledby="pool-label" aria-valuetext="41 of 50 GB" />
</div>`}>
          <div data-pg="meter-readout" style={stack}>
            <Reading label="Archive" used={41} size={50} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Thresholds</h3>
        <p>
          <code>low</code> and <code>high</code> split the range into three, and{" "}
          <code>optimum</code> says which part is the good one. A reading in the good
          part is green, one part away is amber, and two parts away is red. Here a
          disk is best empty, so the optimum is <code>0</code>, amber starts at 75
          and red above 90. A reading exactly on <code>low</code> or{" "}
          <code>high</code> counts as the middle part.
        </p>
        <ComponentPreview code={`<Meter value={40} low={75} high={90} optimum={0} aria-label="Healthy" />
<Meter value={80} low={75} high={90} optimum={0} aria-label="Filling up" />
<Meter value={95} low={75} high={90} optimum={0} aria-label="Nearly full" />`}>
          <div data-pg="meter-thresholds" style={stack}>
            <Reading label="Healthy" used={40} size={100} unit="%" low={75} high={90} optimum={0} />
            <Reading label="Filling up" used={80} size={100} unit="%" low={75} high={90} optimum={0} />
            <Reading label="Nearly full" used={95} size={100} unit="%" low={75} high={90} optimum={0} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>On the line</h3>
        <p>
          Every reading below sits on or next to a boundary of{" "}
          <code>low={"{75}"}</code> and <code>high={"{90}"}</code>.
        </p>
        <div data-pg="meter-edges" style={stack}>
          <Meter value={74.9} low={75} high={90} optimum={0} aria-label="74.9, optimum 0" />
          <Meter value={75} low={75} high={90} optimum={0} aria-label="75, optimum 0" />
          <Meter value={90} low={75} high={90} optimum={0} aria-label="90, optimum 0" />
          <Meter value={90.1} low={75} high={90} optimum={0} aria-label="90.1, optimum 0" />
          <Meter value={50} low={75} high={90} optimum={100} aria-label="50, optimum 100" />
          <Meter value={95} low={75} high={90} optimum={100} aria-label="95, optimum 100" />
          <Meter value={80} low={75} high={90} aria-label="80, optimum unset" />
          <Meter value={95} low={75} high={90} optimum={0} tone="success" aria-label="95, tone success" />
          <Meter value={95} aria-label="95, no thresholds" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Tone</h3>
        <p>
          Pass <code>tone</code> (<code>success</code>, <code>warning</code> or{" "}
          <code>error</code>) to set the colour yourself; it wins over the thresholds.
          The names and colours match Progress. Colour is not the only cue: the width
          of the fill shows the level, and the readout above the bar gives the number.
        </p>
        <ComponentPreview code={`<Meter value={40} tone="success" aria-label="Healthy" />
<Meter value={80} tone="warning" aria-label="Filling up" />
<Meter value={95} tone="error" aria-label="Nearly full" />
<Meter value={60} aria-label="No tone" />`}>
          <div data-pg="meter-tone" style={stack}>
            <Meter value={40} tone="success" aria-label="Healthy" />
            <Meter value={80} tone="warning" aria-label="Filling up" />
            <Meter value={95} tone="error" aria-label="Nearly full" />
            <Meter value={60} aria-label="No tone" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Range</h3>
        <p>
          <code>min</code> and <code>max</code> set the scale (0 and 100 by default).
          A value outside them rests on the nearest end. The range may start above
          zero, as for a temperature.
        </p>
        <ComponentPreview code={`<Meter value={68} min={40} max={90} aria-label="Coolant" aria-valuetext="68 °C" />`}>
          <div data-pg="meter-range" style={stack}>
            <Meter value={68} min={40} max={90} aria-label="Coolant" aria-valuetext="68 °C" />
            <Meter value={140} max={100} aria-label="Past the end" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Right to left</h3>
        <p>The fill starts at the reading edge of the line, so it grows from the right in right-to-left text.</p>
        <ComponentPreview code={`<div dir="rtl"><Meter value={30} aria-label="Quota" /></div>`}>
          <div data-pg="meter-rtl" dir="rtl" style={{ width: "60%" }}>
            <Meter value={30} aria-label="Quota, right to left" />
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "value", type: "number", description: "The reading. Held between min and max" },
        { name: "min", type: "number", default: "0", description: "Bottom of the range" },
        { name: "max", type: "number", default: "100", description: "Top of the range" },
        { name: "low", type: "number", description: "Readings below this are in the low part" },
        { name: "high", type: "number", description: "Readings above this are in the high part" },
        { name: "optimum", type: "number", description: "A value in the good part. Same part as the reading is green, one away amber, two away red. Defaults to the middle of the range once low or high is set" },
        { name: "tone", type: '"success" | "warning" | "error"', description: "Sets the colour directly and overrides the one the thresholds give" },
        { name: "aria-valuetext", type: "string", default: "the percentage", description: 'What a screen reader says, e.g. "41 of 50 GB"' },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
