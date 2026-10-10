import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "../../ui/chart/chart.jsx"
import { BoxPlot } from "../../ui/chart-boxplot/chart-boxplot.jsx"
import "../../ui/chart/chart.css"
import "../../ui/chart-boxplot/chart-boxplot.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

/*
 * Alpha: quartiles 15, 17, 19.5 and one high outlier, 45.
 * Beta: 25.5, 30.5, 35.25 with no outliers.
 * Gamma: junk entries mixed in with the samples, dropped; 2 is a low outlier.
 * Delta: quartiles given directly, with an outlier of its own.
 */
const samples = [
  { name: "Alpha", values: [12, 14, 15, 15, 16, 17, 18, 19, 20, 21, 45] },
  { name: "Beta", values: [20, 22, 25, 27, 30, 31, 33, 36, 38, 40] },
  { name: "Gamma", values: [8, 9, Number.NaN, 10, 11, null, 12, Number.POSITIVE_INFINITY, 13, 14, "15", 2] },
  { name: "Delta", min: 18, q1: 24, median: 28, q3: 33, max: 44, outliers: [52] },
]

/* Quartiles with no min or max: the whiskers shrink to the box. */
const quartilesOnly = [{ name: "Epsilon", q1: 10, median: 12, q3: 15 }]

const withGap = [samples[0], { name: "Empty", values: [Number.NaN, null, "x"] }, samples[1]]

const oddValues = [samples[0], { name: "Scalar", values: 42 }, { name: "Dots", q1: 1, median: 2, q3: 3, outliers: 52 }]

const byRegion = [
  { group: "North", samples: [10, 12, 13, 15, 18, 20, 41] },
  { group: "South", samples: [22, 24, 25, 27, 30] },
  { group: "East", samples: [5, 8, 9, 11, 12, 14] },
]

const config = { box: { label: "Latency", color: "var(--chart-1)" } }

function Frame({ pg, dir, children }) {
  return (
    <div data-pg={pg} dir={dir} style={{ width: "100%", maxWidth: "40rem" }}>
      {children}
    </div>
  )
}

export default function ChartBoxPlotPage() {
  return (
    <>
      <h2>Chart Box Plot</h2>
      <p>
        One box per group, drawn from the raw samples or from quartiles you already have. The box spans the lower to the
        upper quartile with a line at the median, whiskers reach out from it, and values beyond the whiskers are
        drawn as dots. It sits inside the Chart shell, so the tooltip, the keyboard and <code>syncId</code> work as they do
        on any chart.
      </p>

      <InstallSnippet slug="chart-boxplot" />

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          Each datum holds its samples under <code>values</code>. Quartiles are interpolated the way R and NumPy do by
          default, whiskers stop at the last value within 1.5 box lengths (the spread between the quartiles), and anything further out is a dot.
          Entries that are not finite numbers are left out. A datum with <code>q1</code>, <code>median</code> and{" "}
          <code>q3</code> of its own (and optionally <code>min</code>, <code>max</code> and <code>outliers</code>) is
          drawn as given, as Delta is here. Focus the chart and use the arrow keys to step between boxes.
        </p>
        <ComponentPreview code={`<ChartContainer config={config}>
  <BoxPlot data={samples} accessibilityLayer aria-label="Latency by service">
    <ChartTooltip content={<ChartTooltipContent />} />
  </BoxPlot>
</ChartContainer>`}>
          <Frame pg="boxplot-default">
            <ChartContainer config={config}>
              <BoxPlot data={samples} accessibilityLayer aria-label="Latency by service">
                <ChartTooltip content={<ChartTooltipContent />} />
              </BoxPlot>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Minimum and maximum whiskers</h3>
        <p>
          <code>whiskers="minmax"</code> runs each whisker to the smallest and largest sample, so there are no outlier
          dots. A datum that brings its own quartiles keeps its own whiskers and outliers; one with no{" "}
          <code>min</code> or <code>max</code> ends its whiskers on the box.
        </p>
        <ComponentPreview code={`<BoxPlot data={samples} whiskers="minmax">`}>
          <Frame pg="boxplot-minmax">
            <ChartContainer config={config}>
              <BoxPlot data={samples} whiskers="minmax">
                <ChartTooltip content={<ChartTooltipContent />} />
              </BoxPlot>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
        <ComponentPreview code={`<BoxPlot data={[{ name: "Epsilon", q1: 10, median: 12, q3: 15 }]}>`}>
          <Frame pg="boxplot-quartiles-only">
            <ChartContainer config={config}>
              <BoxPlot data={quartilesOnly}>
                <ChartTooltip content={<ChartTooltipContent />} />
              </BoxPlot>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Horizontal</h3>
        <p>
          <code>layout="horizontal"</code> lists the groups down the left and runs the value axis along the bottom;{" "}
          <code>whiskerRange</code> moves the fences (at 6 box lengths Alpha's 45 is inside, so it ends the whisker),{" "}
          <code>domain</code> pins the value axis, and an axis size of 0 leaves that axis's labels out.
        </p>
        <ComponentPreview code={`<BoxPlot data={samples.slice(0, 2)} layout="horizontal" whiskerRange={6} domain={[0, 60]} />
<BoxPlot data={samples.slice(0, 2)} valueAxisSize={0} categoryAxisSize={0} />`}>
          <Frame pg="boxplot-horizontal">
            <ChartContainer config={config}>
              <BoxPlot data={samples.slice(0, 2)} layout="horizontal" whiskerRange={6} domain={[0, 60]} accessibilityLayer aria-label="Latency, horizontal">
                <ChartTooltip content={<ChartTooltipContent />} />
              </BoxPlot>
            </ChartContainer>
          </Frame>
          <Frame pg="boxplot-bare">
            <ChartContainer config={config}>
              <BoxPlot data={samples.slice(0, 2)} valueAxisSize={0} categoryAxisSize={0} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Legend and colour</h3>
        <p>
          <code>ChartLegend</code> lists the <code>box</code> entry of the config under its label. That entry's{" "}
          <code>color</code> also paints the boxes, whiskers and dots.
        </p>
        <ComponentPreview code={`<ChartContainer config={{ box: { label: "Latency", color: "rgb(200, 30, 30)" } }}>
  <BoxPlot data={samples}>
    <ChartLegend />
  </BoxPlot>
</ChartContainer>`}>
          <Frame pg="boxplot-legend">
            <ChartContainer config={{ box: { label: "Latency", color: "rgb(200, 30, 30)" } }}>
              <BoxPlot data={samples}>
                <ChartLegend />
              </BoxPlot>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Right to left</h3>
        <p>
          The boxes keep their order in a right-to-left layout, the first on the left, so the arrow keys follow the
          screen: ArrowRight moves one box to the right.
        </p>
        <ComponentPreview code={`<div dir="rtl">
  <BoxPlot data={samples} accessibilityLayer />
</div>`}>
          <Frame pg="boxplot-rtl" dir="rtl">
            <ChartContainer config={config}>
              <BoxPlot data={samples} accessibilityLayer aria-label="Latency by service, right to left">
                <ChartTooltip content={<ChartTooltipContent />} />
              </BoxPlot>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Linked charts</h3>
        <p>
          Charts sharing a <code>syncId</code> share the active box, by position.
        </p>
        <ComponentPreview code={`<BoxPlot syncId="latency" data={samples} />
<BoxPlot syncId="latency" data={samples.slice().reverse()} />`}>
          <Frame pg="boxplot-sync-a">
            <ChartContainer config={config}>
              <BoxPlot data={samples} syncId="latency" accessibilityLayer aria-label="Latency, first chart">
                <ChartTooltip content={<ChartTooltipContent />} />
              </BoxPlot>
            </ChartContainer>
          </Frame>
          <Frame pg="boxplot-sync-b">
            <ChartContainer config={config}>
              <BoxPlot data={samples.slice().reverse()} syncId="latency" accessibilityLayer aria-label="Latency, second chart">
                <ChartTooltip content={<ChartTooltipContent />} />
              </BoxPlot>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Groups with no usable samples</h3>
        <p>
          A group whose samples are all unusable keeps its slot and its name but draws no box, and the keyboard steps
          through it like any other.
        </p>
        <ComponentPreview code={`<BoxPlot data={[alpha, { name: "Empty", values: [NaN, null, "x"] }, beta]} accessibilityLayer />`}>
          <Frame pg="boxplot-junk">
            <ChartContainer config={config}>
              <BoxPlot data={withGap} accessibilityLayer aria-label="Latency with an empty group">
                <ChartTooltip content={<ChartTooltipContent />} />
              </BoxPlot>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Linked charts of different sizes</h3>
        <p>
          A linked chart with fewer boxes treats a shared index it has no box for as none: the next arrow forward lands on its first box, back on its last.
        </p>
        <ComponentPreview code={`<BoxPlot syncId="range" data={samples} />
<BoxPlot syncId="range" layout="horizontal" data={samples.slice(0, 2)} />`}>
          <Frame pg="boxplot-sync-big">
            <ChartContainer config={config}>
              <BoxPlot data={samples} syncId="range" accessibilityLayer aria-label="Latency, four groups">
                <ChartTooltip content={<ChartTooltipContent />} />
              </BoxPlot>
            </ChartContainer>
          </Frame>
          <Frame pg="boxplot-sync-small">
            <ChartContainer config={config}>
              <BoxPlot data={samples.slice(0, 2)} layout="horizontal" syncId="range" accessibilityLayer aria-label="Latency, two groups">
                <ChartTooltip content={<ChartTooltipContent />} />
              </BoxPlot>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Samples that are not a list</h3>
        <p>
          A <code>values</code> or <code>outliers</code> that is not an array counts as empty: the group draws no box, or no dots.
        </p>
        <ComponentPreview code={`<BoxPlot data={[alpha, { name: "Scalar", values: 42 }, { name: "Dots", q1: 1, median: 2, q3: 3, outliers: 52 }]} />`}>
          <Frame pg="boxplot-odd-values">
            <ChartContainer config={config}>
              <BoxPlot data={oddValues} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Field names, ticks, spacing and margin</h3>
        <p>
          <code>categoryKey</code> and <code>valuesKey</code> name the datum's fields, <code>tickCount</code> sets how many
          value ticks to aim for, <code>categoryGap</code> narrows the gaps between boxes, and <code>margin</code> moves the plot in from the edges.
        </p>
        <ComponentPreview code={`<BoxPlot data={byRegion} categoryKey="group" valuesKey="samples" tickCount={3} categoryGap={0.1} margin={{ top: 10, right: 20, bottom: 10, left: 20 }} />`}>
          <Frame pg="boxplot-options">
            <ChartContainer config={config}>
              <BoxPlot data={byRegion} categoryKey="group" valuesKey="samples" tickCount={3} categoryGap={0.1} margin={{ top: 10, right: 20, bottom: 10, left: 20 }} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <ApiReference title="BoxPlot" props={[
        { name: "data", type: "object[]", description: "One datum per box: samples under valuesKey, or q1, median and q3 (with optional min, max and outliers) taken as given" },
        { name: "categoryKey / valuesKey", type: "string", default: '"name" / "values"', description: "Fields holding the group name and its samples" },
        { name: "whiskers", type: '"iqr" | "minmax"', default: '"iqr"', description: "Whiskers stop within whiskerRange box lengths of the box, or run to the extremes. Applies to samples only" },
        { name: "whiskerRange", type: "number", default: "1.5", description: "Fence distance in box lengths (the spread between the quartiles); values beyond it are outlier dots" },
        { name: "layout", type: '"vertical" | "horizontal"', default: '"vertical"', description: "Groups along the bottom, or down the left" },
        { name: "domain / tickCount", type: "[lo, hi] / number", default: '["auto", "auto"] / 5', description: "The value axis; each end is a number or \"auto\"" },
        { name: "categoryGap", type: "number", default: "0.4", description: "Gap between boxes as a fraction of a group's slot" },
        { name: "valueAxisSize / categoryAxisSize", type: "number", default: "48 / 24 (horizontal 24 / 64)", description: "Room for the value labels and the group names, px; 0 leaves that axis's labels out" },
        { name: "margin", type: "{ top, right, bottom, left }", default: "5 each", description: "Space around the plot, px" },
        { name: "syncId", type: "string", description: "Charts sharing an id share the active box, by index" },
        { name: "accessibilityLayer", type: "boolean", default: "false", description: "Focusable; left and right (up and down when horizontal) step between boxes, Home and End jump, Escape dismisses" },
        { name: "config", type: "ChartContainer prop", description: "The box entry's color sets the box and whisker colour; the first chart colour by default" },
      ]} />
      <ApiReference title="Tooltip" props={[
        { name: "ChartTooltip", type: "element", description: "Over a box it lists the upper whisker, upper quartile, median, lower quartile, lower whisker and the number of outliers (minimum and maximum in minmax mode)" },
      ]} />
    </>
  )
}
