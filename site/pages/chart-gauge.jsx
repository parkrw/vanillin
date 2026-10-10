import { ChartContainer } from "../../ui/chart/chart.jsx"
import { BulletChart, GaugeChart } from "../../ui/chart-gauge/chart-gauge.jsx"
import "../../ui/chart/chart.css"
import "../../ui/chart-gauge/chart-gauge.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const bands = [
  { to: 50, label: "Poor" },
  { to: 80, label: "Fair" },
  { to: 100, label: "Good" },
]

/* Raw --warning is 2.31:1 on white, under 3:1 for a fill whose colour is the information; 30% toward its foreground clears it in light, and dark keeps the token. */
const WARNING = "light-dark(color-mix(in oklab, var(--warning) 70%, var(--warning-foreground) 30%), var(--warning))"

/* Error budget used: low is healthy, so the tones run green to red. */
const toneBands = [
  { to: 60, label: "Healthy", color: "var(--success)" },
  { to: 85, label: "Warning", color: WARNING },
  { to: 100, label: "Critical", color: "var(--destructive)" },
]

const horizontal = { aspectRatio: "4 / 1" }
const upright = { aspectRatio: "1 / 2" }
const dial = { aspectRatio: "3 / 2" }

function Frame({ pg, narrow = false, children }) {
  return (
    <div data-pg={pg} style={{ width: "100%", maxWidth: narrow ? "12rem" : "32rem" }}>
      {children}
    </div>
  )
}

export default function ChartGaugePage() {
  return (
    <>
      <h2>Chart Gauge</h2>
      <p>
        Two charts for a single reading. <code>BulletChart</code> draws a measure bar over range bands with a target
        tick, along a line or up a column. <code>GaugeChart</code> draws the reading on an arc, as a needle or a fill.
        Both print the value beside the drawing and sit inside the Chart shell.
      </p>

      <InstallSnippet slug="chart-gauge" />

      <section className="pg-section">
        <h3>Bullet</h3>
        <p>
          The bar is the measure, the tick is the target, and the bands behind them are graded greys from the lowest
          range to the highest. A line is drawn at each boundary between ranges, because neighbouring greys are close, and
          each range is also named in the printed value and in the summary, by its <code>label</code> or, without one,
          by its span such as 50–80. With <code>accessibilityLayer</code> the chart gains a generated summary, read by assistive
          technology through <code>aria-describedby</code>.
        </p>
        <ComponentPreview code={`<ChartContainer style={{ aspectRatio: "4 / 1" }}>
  <BulletChart value={72} target={85} bands={bands} label="Revenue" accessibilityLayer aria-label="Revenue against target" />
</ChartContainer>`}>
          <Frame pg="bullet-horizontal">
            <ChartContainer style={horizontal}>
              <BulletChart value={72} target={85} bands={bands} label="Revenue" accessibilityLayer aria-label="Revenue against target" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Bullet, vertical</h3>
        <p>
          <code>layout="vertical"</code> stands the scale on end, with the low end at the bottom. A summary supplied
          by the page through <code>aria-describedby</code> replaces the generated one.
        </p>
        <ComponentPreview code={`<BulletChart layout="vertical" value={72} target={85} bands={bands} accessibilityLayer aria-label="Revenue against target, vertical" aria-describedby="bullet-note" />
<p id="bullet-note">Revenue is 72 against a target of 85.</p>`}>
          <Frame pg="bullet-vertical" narrow>
            <ChartContainer style={upright}>
              <BulletChart layout="vertical" value={72} target={85} bands={bands} accessibilityLayer aria-label="Revenue against target, vertical" aria-describedby="bullet-note" />
            </ChartContainer>
            <p id="bullet-note">Revenue is 72 against a target of 85.</p>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Gauge</h3>
        <p>
          The default is a half circle from the left, with a needle. <code>bands</code> split the ring into ranges,
          and a value past either end rests on that end. Without <code>accessibilityLayer</code> there is no summary
          and nothing is added to the svg.
        </p>
        <ComponentPreview code={`<GaugeChart value={72} bands={bands} label="Score" />
<GaugeChart value={130} bands={bands} label="Over range" />
<GaugeChart value={72} bands={bands} label="Score" accessibilityLayer aria-label="Score" />`}>
          <Frame pg="gauge-needle">
            <ChartContainer style={dial}>
              <GaugeChart value={72} bands={bands} label="Score" />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-over">
            <ChartContainer style={dial}>
              <GaugeChart value={130} bands={bands} label="Over range" />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-layer">
            <ChartContainer style={dial}>
              <GaugeChart value={72} bands={bands} label="Score" accessibilityLayer aria-label="Score" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Fill and status colours</h3>
        <p>
          <code>variant="fill"</code> fills the arc up to the value; where a band names a <code>color</code>, the fill
          takes the colour of the band the value is in, and thin gaps mark where the bands meet. The band name beside
          the value says the same thing in words. A wider sweep is set with <code>startAngle</code> and{" "}
          <code>endAngle</code>.
        </p>
        <ComponentPreview code={`<GaugeChart variant="fill" value={72} bands={toneBands} label="Error budget used" />
<GaugeChart variant="fill" value={40} startAngle={225} endAngle={-45} thickness={0.15} label="Disk" formatter={(v) => \`\${v}%\`} />`}>
          <Frame pg="gauge-fill">
            <ChartContainer style={dial}>
              <GaugeChart variant="fill" value={72} bands={toneBands} label="Error budget used" />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-wide">
            <ChartContainer style={{ aspectRatio: "1 / 1" }}>
              <GaugeChart variant="fill" value={40} startAngle={225} endAngle={-45} thickness={0.15} label="Disk" formatter={(v) => `${v}%`} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Edge cases</h3>
        <p>
          A missing value draws nothing and is read as no value. A target past the end is drawn at the end and still
          counts against the reading as given. Bands may be bare numbers in any order, and a scale given high to low
          is read low to high.
        </p>
        <ComponentPreview code={`<BulletChart value={105} target={120} bands={bands} accessibilityLayer aria-label="Over the scale" />
<BulletChart target={85} bands={bands} accessibilityLayer aria-label="Nothing yet" />
<GaugeChart variant="fill" value={Number.NaN} bands={toneBands} accessibilityLayer aria-label="Nothing yet" />
<BulletChart value={10} min={-50} max={50} target={70} bands={[50, 0, -20]} accessibilityLayer aria-label="Offset scale" />
<BulletChart value={40} axisSize={0} bands={bands} aria-labelledby="bullet-bare-title" />
<p id="bullet-bare-title">Bare bullet</p>
<BulletChart value={72.1} target={85.3} formatter={(v) => \`\${v}%\`} accessibilityLayer aria-label="Share" />
<GaugeChart value={72} target={85} accessibilityLayer aria-label="Score" />
<BulletChart value={85} target={85} accessibilityLayer aria-label="On target" />
<BulletChart value={90} target={85} accessibilityLayer aria-label="Past target" />
<BulletChart value={72} scale="log" accessibilityLayer aria-label="Stray prop" />
<GaugeChart variant="fill" startAngle={150} endAngle={30} />
<GaugeChart value={50} />
<BulletChart value={1e-7} target={3e-7} max={1e-6} accessibilityLayer aria-label="Tiny" />
<BulletChart value={72} bands={[50, 80, 100]} accessibilityLayer />
<GaugeChart value={72} label="Load" accessibilityLayer />
<BulletChart value={72} min={100} max={0} />
<BulletChart value={72} bands={[{ to: 50, color: "rgb(255, 0, 0)" }, 100]} />
<GaugeChart value={72} bands={[{ to: 50, color: "rgb(255, 0, 0)" }, 100]} />
<BulletChart value={0} target={2e-11} max={1e-10} accessibilityLayer aria-label="Sliver" />
<GaugeChart variant="fill" value={50} endAngle={3.6e7} />
<GaugeChart value={Number.NaN} bands={bands} />
<GaugeChart value={72} accessibilityLayer />
<GaugeChart value={50} margin={{ left: 40 }} />
<BulletChart value={0} target={1e-101} max={1e-100} axisSize={0} accessibilityLayer aria-label="Speck" />
<BulletChart value={50} bands={[0, 30, 30, 70, 150]} />
<BulletChart value={0.0015} target={0.0019} accessibilityLayer aria-label="Fraction" />
<ChartContainer config={{ measure: { color: "rgb(200, 30, 30)" } }} style={dial}>
  <GaugeChart variant="fill" value={72} bands={toneBands} />
</ChartContainer>
<BulletChart value={5} target={5.0004} accessibilityLayer aria-label="Near" />
<BulletChart value={0.99996} target={1} max={2} accessibilityLayer aria-label="Near one" />
<GaugeChart value={25} min={-50} max={50} />
<GaugeChart value={25} min={100} max={0} />`}>
          <Frame pg="bullet-over">
            <ChartContainer style={horizontal}>
              <BulletChart value={105} target={120} bands={bands} accessibilityLayer aria-label="Over the scale" />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-empty">
            <ChartContainer style={horizontal}>
              <BulletChart target={85} bands={bands} accessibilityLayer aria-label="Nothing yet" />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-empty">
            <ChartContainer style={dial}>
              <GaugeChart variant="fill" value={Number.NaN} bands={toneBands} accessibilityLayer aria-label="Nothing yet" />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-scale">
            <ChartContainer style={horizontal}>
              <BulletChart value={10} min={-50} max={50} target={70} bands={[50, 0, -20]} accessibilityLayer aria-label="Offset scale" />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-bare">
            <ChartContainer style={horizontal}>
              <BulletChart value={40} axisSize={0} bands={bands} aria-labelledby="bullet-bare-title" />
            </ChartContainer>
            <p id="bullet-bare-title">Bare bullet</p>
          </Frame>
          <Frame pg="bullet-unit">
            <ChartContainer style={horizontal}>
              <BulletChart value={72.1} target={85.3} formatter={(v) => `${v}%`} accessibilityLayer aria-label="Share" />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-target">
            <ChartContainer style={dial}>
              <GaugeChart value={72} target={85} accessibilityLayer aria-label="Score" />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-met">
            <ChartContainer style={horizontal}>
              <BulletChart value={85} target={85} accessibilityLayer aria-label="On target" />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-past">
            <ChartContainer style={horizontal}>
              <BulletChart value={90} target={85} accessibilityLayer aria-label="Past target" />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-stray">
            <ChartContainer style={horizontal}>
              <BulletChart value={72} scale="log" accessibilityLayer aria-label="Stray prop" />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-short">
            <ChartContainer style={{ aspectRatio: "4 / 1" }}>
              <GaugeChart variant="fill" startAngle={150} endAngle={30} />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-flat">
            <ChartContainer style={{ aspectRatio: "4 / 1" }}>
              <GaugeChart value={50} />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-tiny">
            <ChartContainer style={horizontal}>
              <BulletChart value={1e-7} target={3e-7} max={1e-6} accessibilityLayer aria-label="Tiny" />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-unnamed">
            <ChartContainer style={horizontal}>
              <BulletChart value={72} bands={[50, 80, 100]} accessibilityLayer />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-unnamed">
            <ChartContainer style={dial}>
              <GaugeChart value={72} label="Load" accessibilityLayer />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-swapped">
            <ChartContainer style={horizontal}>
              <BulletChart value={72} min={100} max={0} />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-colour">
            <ChartContainer style={horizontal}>
              <BulletChart value={72} bands={[{ to: 50, color: "rgb(255, 0, 0)" }, 100]} />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-colour">
            <ChartContainer style={dial}>
              <GaugeChart value={72} bands={[{ to: 50, color: "rgb(255, 0, 0)" }, 100]} />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-sliver">
            <ChartContainer style={horizontal}>
              <BulletChart value={0} target={2e-11} max={1e-10} accessibilityLayer aria-label="Sliver" />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-huge">
            <ChartContainer style={dial}>
              <GaugeChart variant="fill" value={50} endAngle={3.6e7} />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-hollow">
            <ChartContainer style={dial}>
              <GaugeChart value={Number.NaN} bands={bands} />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-bare">
            <ChartContainer style={dial}>
              <GaugeChart value={72} accessibilityLayer />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-margin">
            <ChartContainer style={{ aspectRatio: "4 / 1" }}>
              <GaugeChart value={50} margin={{ left: 40 }} />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-minute">
            <ChartContainer style={horizontal}>
              <BulletChart value={0} target={1e-101} max={1e-100} axisSize={0} accessibilityLayer aria-label="Speck" />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-clamp">
            <ChartContainer style={horizontal}>
              <BulletChart value={50} bands={[0, 30, 30, 70, 150]} />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-fraction">
            <ChartContainer style={horizontal}>
              <BulletChart value={0.0015} target={0.0019} accessibilityLayer aria-label="Fraction" />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-tone-over">
            <ChartContainer config={{ measure: { color: "rgb(200, 30, 30)" } }} style={dial}>
              <GaugeChart variant="fill" value={72} bands={toneBands} />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-near">
            <ChartContainer style={horizontal}>
              <BulletChart value={5} target={5.0004} accessibilityLayer aria-label="Near" />
            </ChartContainer>
          </Frame>
          <Frame pg="bullet-near-one">
            <ChartContainer style={horizontal}>
              <BulletChart value={0.99996} target={1} max={2} accessibilityLayer aria-label="Near one" />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-offset">
            <ChartContainer style={dial}>
              <GaugeChart value={25} min={-50} max={50} />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-reversed">
            <ChartContainer style={dial}>
              <GaugeChart value={25} min={100} max={0} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Measure colour</h3>
        <p>
          The measure bar and the gauge fill take their colour from the container&apos;s config, under the key{" "}
          <code>measure</code>. A band that names a <code>color</code> still sets the fill of a fill gauge.
        </p>
        <ComponentPreview code={`<ChartContainer config={{ measure: { color: "rgb(200, 30, 30)" } }} style={horizontal}>
  <BulletChart value={72} bands={bands} />
</ChartContainer>
<ChartContainer config={{ measure: { color: "rgb(200, 30, 30)" } }} style={dial}>
  <GaugeChart variant="fill" value={72} />
</ChartContainer>`}>
          <Frame pg="bullet-measure-colour">
            <ChartContainer config={{ measure: { color: "rgb(200, 30, 30)" } }} style={horizontal}>
              <BulletChart value={72} bands={bands} />
            </ChartContainer>
          </Frame>
          <Frame pg="gauge-measure-colour">
            <ChartContainer config={{ measure: { color: "rgb(200, 30, 30)" } }} style={dial}>
              <GaugeChart variant="fill" value={72} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <ApiReference title="BulletChart" props={[
        { name: "value", type: "number", description: "The measure; held to the scale. Missing or NaN draws no measure and reads as no value" },
        { name: "min / max", type: "number", default: "0 / 100", description: "Ends of the scale" },
        { name: "target", type: "number", description: "A tick across the bar; left out when not given" },
        { name: "bands", type: "(number | { to, label, color })[]", description: "Range upper bounds, in any order; each runs from the one before. Defaults to graded greys" },
        { name: "layout", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Vertical puts the low end at the bottom" },
        { name: "axisSize", type: "number", default: "24 / 40", description: "Room for the scale labels, px; 0 leaves them out" },
        { name: "label / formatter", type: "node / (value) => string", description: "A caption in the printed value; the text for the value, every scale label and the summary, so it returns a string" },
        { name: "accessibilityLayer", type: "boolean", default: "false", description: "Marks the svg as an image and points it at a generated summary; an aria-describedby you pass is used instead" },
        { name: "ChartContainer config", type: "{ measure: { color } }", description: "Recolours the measure bar; the gauge fill takes it too when no band colour applies" },
        { name: "margin", type: "{ top, right, bottom, left }", default: "5 each", description: "Space around the drawing, px" },
      ]} />

      <ApiReference title="GaugeChart" props={[
        { name: "value / min / max", type: "number", default: "— / 0 / 100", description: "The reading, held to the scale" },
        { name: "variant", type: '"needle" | "fill"', default: '"needle"', description: "A needle over the ring, or the ring filled up to the value" },
        { name: "bands", type: "(number | { to, label, color })[]", description: "Needle: the ring's ranges. Fill: where the dividers fall, and the fill takes a band's color when it has one" },
        { name: "startAngle / endAngle", type: "number", default: "180 / 0", description: "Degrees, 0 at three o'clock and counter-clockwise; the default sweeps over the top from left to right" },
        { name: "thickness", type: "number", default: "0.22", description: "Ring width as a share of the radius" },
        { name: "label / formatter / accessibilityLayer / margin", type: "as BulletChart", description: "The same on both" },
      ]} />
    </>
  )
}
