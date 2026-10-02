import { useId } from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  BarChart,
  LineChart,
  AreaChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "../../ui/chart/chart.jsx"
import "../../ui/chart/chart.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

// ── Sample data ──────────────────────────────────────────────────────

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
}

const negativeData = [
  { month: "January", visitors: 186 },
  { month: "February", visitors: 205 },
  { month: "March", visitors: -207 },
  { month: "April", visitors: 173 },
  { month: "May", visitors: -209 },
  { month: "June", visitors: 214 },
]

const negativeConfig = {
  visitors: { label: "Visitors", color: "var(--chart-1)" },
}

const themedConfig = {
  desktop: { label: "Desktop", theme: { light: "oklch(0.55 0.2 250)", dark: "oklch(0.78 0.14 250)" } },
  mobile: { label: "Mobile", color: "oklch(0.6 0.118 184.704)" },
}

const contrastData = chartData.map((d, i) => ({
  month: d.month,
  s1: 120 + i * 10,
  s2: 140 + i * 10,
  s3: 160 + i * 10,
  s4: 180 + i * 10,
  s5: 200 + i * 10,
}))

const contrastConfig = {
  s1: { label: "Series 1", color: "var(--chart-1)" },
  s2: { label: "Series 2", color: "var(--chart-2)" },
  s3: { label: "Series 3", color: "var(--chart-3)" },
  s4: { label: "Series 4", color: "var(--chart-4)" },
  s5: { label: "Series 5", color: "var(--chart-5)" },
}

const monthTick = (value) => value.slice(0, 3)

function Frame({ pg, children }) {
  return (
    <div data-pg={pg} style={{ width: "100%", maxWidth: "40rem" }}>
      {children}
    </div>
  )
}

function GradientArea() {
  const id = useId().replace(/[^\w-]/g, "")
  const desktopId = `fill-desktop-${id}`
  const mobileId = `fill-mobile-${id}`
  return (
    <ChartContainer config={chartConfig}>
      <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
        <defs>
          <linearGradient id={desktopId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id={mobileId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
        <Area dataKey="mobile" type="natural" fill={`url(#${mobileId})`} fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
        <Area dataKey="desktop" type="natural" fill={`url(#${desktopId})`} fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
      </AreaChart>
    </ChartContainer>
  )
}

export default function ChartPage() {
  return (
    <>
      <h2>Chart</h2>
      <p>
        Bar, line and area charts on plain SVG. A <code>config</code> names and colours each series; the drawing
        primitives take the Recharts names, so Recharts examples paste in unchanged.
      </p>

      <InstallSnippet slug="chart" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<ChartContainer config={chartConfig}>
  <BarChart data={chartData}>
    <CartesianGrid vertical={false} />
    <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend content={<ChartLegendContent />} />
    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
    <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
  </BarChart>
</ChartContainer>`}>
          <Frame pg="chart-default">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  BarChart, Bar, XAxis, CartesianGrid,
} from "./ui/chart/chart"
import "./ui/chart/chart.css"

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]

const chartConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
}

<ChartContainer config={chartConfig}>
  <BarChart accessibilityLayer data={chartData} aria-label="Visitors by month">
    <CartesianGrid vertical={false} />
    <XAxis
      dataKey="month"
      tickLine={false}
      tickMargin={10}
      axisLine={false}
      tickFormatter={(value) => value.slice(0, 3)}
    />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
    <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
  </BarChart>
</ChartContainer>`}>
          <Frame>
            <ChartContainer config={chartConfig}>
              <BarChart accessibilityLayer data={chartData} aria-label="Visitors by month">
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
        <p className="pg-desc">
          Each <code>config</code> key becomes a <code>--color-&lt;key&gt;</code> custom property scoped to the chart,
          which <code>fill</code> and <code>stroke</code> read back. Series, axes, grid, tooltip and legend must be
          direct children of the chart or sit in a Fragment: a wrapper component around <code>&lt;Bar&gt;</code> is
          invisible to the chart. Cartesian only — no pie, radar or radial, no entrance animation, no RTL axis
          mirroring, no <code>ReferenceLine</code>, <code>Brush</code> or <code>syncId</code>.
        </p>
      </section>

      <section className="pg-section">
        <h3>Axes</h3>
        <p>
          A <code>YAxis</code> reserves a fixed <code>width</code> rather than measuring its labels; a chart with no{" "}
          <code>YAxis</code> still scales from the data. <code>tickFormatter</code> shapes each label and{" "}
          <code>hide</code> drops an axis and its space.
        </p>
        <ComponentPreview code={`<BarChart data={chartData}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />
  <YAxis tickLine={false} axisLine={false} width={40} />
  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
  <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
</BarChart>`}>
          <Frame pg="chart-bar">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Stacked</h3>
        <p>
          Bars sharing a <code>stackId</code> stack: positives pile up from zero, negatives down.{" "}
          <code>verticalAlign="top"</code> puts the legend above the plot.
        </p>
        <ComponentPreview code={`<BarChart data={chartData}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />
  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
  <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
  <Bar dataKey="desktop" stackId="a" fill="var(--color-desktop)" radius={[0, 0, 4, 4]} />
  <Bar dataKey="mobile" stackId="a" fill="var(--color-mobile)" radius={[4, 4, 0, 0]} />
</BarChart>`}>
          <Frame pg="chart-stacked">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <ChartLegend verticalAlign="top" content={<ChartLegendContent />} />
                <Bar dataKey="desktop" stackId="a" fill="var(--color-desktop)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="mobile" stackId="a" fill="var(--color-mobile)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Horizontal</h3>
        <p>
          Recharts' naming: <code>layout="vertical"</code> runs the bars across. The category axis is then the{" "}
          <code>YAxis</code> and the value axis the <code>XAxis</code>; <code>type</code> is accepted for parity but
          the layout decides which is which.
        </p>
        <ComponentPreview code={`<BarChart data={chartData} layout="vertical" margin={{ left: -20 }}>
  <XAxis type="number" dataKey="desktop" hide />
  <YAxis dataKey="month" type="category" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Bar dataKey="desktop" fill="var(--color-desktop)" radius={5} />
</BarChart>`}>
          <Frame pg="chart-horizontal">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" dataKey="desktop" hide />
                <YAxis dataKey="month" type="category" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={5} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Negative values</h3>
        <p>
          The default value domain is <code>[0, "auto"]</code>: zero is always in range and the ends round onto the
          tick grid, so negatives extend below the baseline rather than clipping.
        </p>
        <ComponentPreview code={`<BarChart data={negativeData}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />
  <YAxis tickLine={false} axisLine={false} width={40} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Bar dataKey="visitors" fill="var(--color-visitors)" />
</BarChart>`}>
          <Frame pg="chart-negative">
            <ChartContainer config={negativeConfig}>
              <BarChart data={negativeData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="visitors" fill="var(--color-visitors)" />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Labels</h3>
        <p>
          <code>LabelList</code> is a child of its series. <code>position</code> takes top, bottom, left, right, the
          inside variants and center; <code>dataKey</code> labels with another field; <code>formatter</code> shapes
          the text.
        </p>
        <ComponentPreview code={`<BarChart data={chartData} margin={{ top: 20 }}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8}>
    <LabelList position="top" offset={12} />
  </Bar>
</BarChart>`}>
          <Frame pg="chart-labels">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData} margin={{ top: 20 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8}>
                  <LabelList position="top" offset={12} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Line</h3>
        <p>
          Line and area charts spread their points edge to edge; any <code>Bar</code> in the chart switches the
          category axis to bands.
        </p>
        <ComponentPreview code={`<LineChart data={chartData} margin={{ left: 12, right: 12 }}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Line dataKey="desktop" type="linear" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
</LineChart>`}>
          <Frame pg="chart-line-linear">
            <ChartContainer config={chartConfig}>
              <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line dataKey="desktop" type="linear" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Curve types</h3>
        <p>
          <code>type</code> picks the curve: <code>linear</code>, <code>monotone</code> (Fritsch–Carlson, never
          overshoots a datum), <code>step</code>, <code>stepBefore</code>, <code>stepAfter</code>.{" "}
          <code>natural</code> and <code>basis</code> are aliases for monotone.
        </p>
        <ComponentPreview code={`<LineChart data={chartData} margin={{ left: 12, right: 12 }}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
  <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
  <Line dataKey="mobile" type="monotone" stroke="var(--color-mobile)" strokeWidth={2} dot={false} />
</LineChart>`}>
          <Frame pg="chart-line-monotone">
            <ChartContainer config={chartConfig}>
              <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
                <Line dataKey="mobile" type="monotone" stroke="var(--color-mobile)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Dots</h3>
        <p>
          <code>dot</code> marks every point and takes <code>{"{ r, fill, stroke }"}</code>; <code>activeDot</code>{" "}
          marks the one under the tooltip.
        </p>
        <ComponentPreview code={`<Line
  dataKey="desktop"
  type="natural"
  stroke="var(--color-desktop)"
  strokeWidth={2}
  dot={{ fill: "var(--color-desktop)" }}
  activeDot={{ r: 6 }}
/>`}>
          <Frame pg="chart-line-dots">
            <ChartContainer config={chartConfig}>
              <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line
                  dataKey="desktop"
                  type="natural"
                  stroke="var(--color-desktop)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-desktop)" }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Area</h3>
        <p>
          Host SVG elements pass through into the surface, so a <code>&lt;defs&gt;</code> gradient resolves by id.
          Take ids from <code>useId</code> so two charts on a page never share one.
        </p>
        <ComponentPreview code={`<AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
  <defs>
    <linearGradient id={desktopId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="var(--color-desktop)" stopOpacity={0.8} />
      <stop offset="95%" stopColor="var(--color-desktop)" stopOpacity={0.1} />
    </linearGradient>
    <linearGradient id={mobileId} x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="var(--color-mobile)" stopOpacity={0.8} />
      <stop offset="95%" stopColor="var(--color-mobile)" stopOpacity={0.1} />
    </linearGradient>
  </defs>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dot" />} />
  <Area dataKey="mobile" type="natural" fill={\`url(#\${mobileId})\`} fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
  <Area dataKey="desktop" type="natural" fill={\`url(#\${desktopId})\`} fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
</AreaChart>`}>
          <Frame pg="chart-area">
            <GradientArea />
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Stacked area</h3>
        <p>Areas with a <code>stackId</code> stack like bars.</p>
        <ComponentPreview code={`<AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
  <Area dataKey="mobile" fill="var(--color-mobile)" fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
  <Area dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
</AreaChart>`}>
          <Frame pg="chart-area-stacked">
            <ChartContainer config={chartConfig}>
              <AreaChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="mobile" fill="var(--color-mobile)" fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
                <Area dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
              </AreaChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Tooltip indicator</h3>
        <p>
          <code>indicator</code> is <code>dot</code>, <code>line</code> or <code>dashed</code>. The tooltip is
          positioned inside the plot from the pointer and never captures it; a touch tooltip stays until a press lands
          outside the chart.
        </p>
        <ComponentPreview code={`<ChartTooltip content={<ChartTooltipContent indicator="line" />} />`}>
          <Frame pg="chart-tooltip-line">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="desktop" stackId="a" fill="var(--color-desktop)" radius={[0, 0, 4, 4]} />
                <Bar dataKey="mobile" stackId="a" fill="var(--color-mobile)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Tooltip without label</h3>
        <ComponentPreview code={`<ChartTooltip content={<ChartTooltipContent indicator="dashed" hideLabel />} />`}>
          <Frame pg="chart-tooltip-dashed">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip content={<ChartTooltipContent indicator="dashed" hideLabel />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
        <p className="pg-desc">
          <code>hideLabel</code> drops the heading, <code>hideIndicator</code> the swatch.
        </p>
      </section>

      <section className="pg-section">
        <h3>Tooltip formatters</h3>
        <p>
          <code>labelFormatter</code> rewrites the heading; <code>formatter</code> replaces each row.{" "}
          <code>nameKey</code> and <code>labelKey</code> look up <code>config</code> by another field.
        </p>
        <ComponentPreview code={`<ChartTooltip
  content={
    <ChartTooltipContent
      labelFormatter={(value) => \`\${value} 2024\`}
      formatter={(value, name) => <span>{name}: {value} visitors</span>}
    />
  }
/>`}>
          <Frame pg="chart-tooltip-formatter">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value) => `${value} 2024`}
                      formatter={(value, name) => (
                        <span className="pg-chart-formatted">
                          {name}: {value} visitors
                        </span>
                      )}
                    />
                  }
                />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Tooltip without cursor</h3>
        <ComponentPreview code={`<ChartTooltip cursor={false} content={<ChartTooltipContent />} />`}>
          <Frame pg="chart-tooltip-nocursor">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
        <p className="pg-desc">
          <code>cursor={"{false}"}</code> removes the band highlight under the pointer.
        </p>
      </section>

      <section className="pg-section">
        <h3>Theme config</h3>
        <p>
          A series can carry <code>theme: {"{ light, dark }"}</code> instead of <code>color</code>. It is emitted as
          one <code>light-dark()</code> value in a single <code>[data-chart]</code> rule, never a <code>.dark</code>{" "}
          selector, because the kit resolves colour at the root's <code>color-scheme</code>. Keys must match{" "}
          <code>[\w-]+</code>; values containing <code>&lt;</code>, braces or semicolons are dropped.
        </p>
        <ComponentPreview code={`const chartConfig = {
  desktop: { label: "Desktop", theme: { light: "oklch(0.55 0.2 250)", dark: "oklch(0.78 0.14 250)" } },
  mobile: { label: "Mobile", color: "oklch(0.6 0.118 184.704)" },
}`}>
          <Frame pg="chart-theme">
            <ChartContainer config={themedConfig}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Accessibility layer</h3>
        <p>
          <code>accessibilityLayer</code> makes the surface focusable (<code>role="application"</code>). Focus opens
          the tooltip on the first category; ArrowLeft and ArrowRight step (flipped under <code>dir="rtl"</code>),
          Home and End jump, Escape closes. Without it an <code>aria-label</code> gives the surface{" "}
          <code>role="img"</code> and nothing is focusable.
        </p>
        <ComponentPreview code={`<LineChart data={chartData} accessibilityLayer aria-label="Desktop and mobile visitors, January to June">
  …
</LineChart>`}>
          <Frame pg="chart-keyboard">
            <ChartContainer config={chartConfig}>
              <LineChart data={chartData} accessibilityLayer aria-label="Desktop and mobile visitors, January to June" margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line dataKey="desktop" type="monotone" stroke="var(--color-desktop)" strokeWidth={2} dot={false} />
                <Line dataKey="mobile" type="monotone" stroke="var(--color-mobile)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Palette</h3>
        <p>
          The five <code>--chart-n</code> tokens, light and dark. A series with no <code>fill</code> or{" "}
          <code>stroke</code> takes the next one in order.
        </p>
        <ComponentPreview code={`<Bar dataKey="s1" fill="var(--color-s1)" />
<Bar dataKey="s2" fill="var(--color-s2)" />
<Bar dataKey="s3" fill="var(--color-s3)" />
<Bar dataKey="s4" fill="var(--color-s4)" />
<Bar dataKey="s5" fill="var(--color-s5)" />`}>
          <Frame pg="chart-contrast">
            <ChartContainer config={contrastConfig}>
              <BarChart data={contrastData}>
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="s1" fill="var(--color-s1)" />
                <Bar dataKey="s2" fill="var(--color-s2)" />
                <Bar dataKey="s3" fill="var(--color-s3)" />
                <Bar dataKey="s4" fill="var(--color-s4)" />
                <Bar dataKey="s5" fill="var(--color-s5)" />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <ApiReference title="ChartContainer" props={[
        { name: "config", type: "ChartConfig", description: "Per-series { label, icon, color | theme: { light, dark } }, keyed by dataKey. Emits --color-<key>" },
        { name: "id", type: "string", description: "Overrides the generated data-chart id" },
        { name: "initialDimension", type: "{ width, height }", default: "{ 320, 200 }", description: "Surface size before the first measurement" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="BarChart / LineChart / AreaChart" props={[
        { name: "data", type: "object[]", description: "One row per category" },
        { name: "layout", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "vertical runs the bars across (Recharts naming)" },
        { name: "margin", type: "{ top, right, bottom, left }", default: "5 each", description: "Space around the plot, inside the surface" },
        { name: "barCategoryGap", type: "string | number", default: '"10%"', description: "Gap either side of a band, as a fraction of the band or in px" },
        { name: "barGap", type: "number", default: "4", description: "Gap between bars in one band, px" },
        { name: "accessibilityLayer", type: "boolean", default: "false", description: "Focusable surface with keyboard navigation" },
        { name: "aria-label", type: "string", description: "Names the surface; gives role=img without accessibilityLayer" },
      ]} />

      <ApiReference title="Bar / Line / Area" props={[
        { name: "dataKey", type: "string", description: "Field of each row this series reads" },
        { name: "name", type: "string", description: "Tooltip and legend name; defaults to dataKey" },
        { name: "fill / stroke", type: "string", description: "Series colour; defaults to the next --chart-n" },
        { name: "fillOpacity", type: "number", description: "Area default 0.4" },
        { name: "radius", type: "number | [tl, tr, br, bl]", default: "0", description: "Bar corner radius" },
        { name: "stackId", type: "string", description: "Bars or areas sharing one stack" },
        { name: "barSize / maxBarSize", type: "number", description: "Bar width, fixed or capped, px" },
        { name: "type", type: '"linear" | "monotone" | "step" | …', default: '"linear"', description: "Curve: linear, monotone, step, stepBefore, stepAfter; natural and basis alias monotone" },
        { name: "strokeWidth", type: "number", description: "Line 2, Area 1.5" },
        { name: "dot / activeDot", type: "boolean | { r, fill, stroke }", description: "Point markers; the active one follows the tooltip" },
        { name: "connectNulls", type: "boolean", default: "false", description: "Bridge null values instead of breaking the line" },
      ]} />

      <ApiReference title="XAxis / YAxis / CartesianGrid / LabelList" props={[
        { name: "dataKey", type: "string", description: "Category field (category axis) or label field (LabelList)" },
        { name: "hide", type: "boolean", default: "false", description: "Draw nothing and reserve no space" },
        { name: "tickLine / axisLine", type: "boolean", default: "true", description: "Tick marks and the axis line" },
        { name: "tickMargin / tickSize", type: "number", default: "2 / 6", description: "Label offset and tick length, px" },
        { name: "tickFormatter", type: "(value, index) => string", description: "Shapes each label" },
        { name: "interval", type: '"preserveStartEnd" | number', default: '"preserveStartEnd"', description: "Tick thinning: keep the ends and drop overlaps, or show every n+1th" },
        { name: "domain", type: "[lo, hi]", default: '[0, "auto"]', description: 'Value axis ends: numbers, "auto", "dataMin", "dataMax" or a function of the data end' },
        { name: "ticks / tickCount", type: "number[] / number", default: "— / 5", description: "Explicit value ticks, or how many nice ones" },
        { name: "width / height", type: "number", default: "60 / 30", description: "Space the axis reserves" },
        { name: "horizontal / vertical", type: "boolean", default: "true", description: "CartesianGrid line sets" },
        { name: "position", type: "string", default: '"top"', description: "LabelList placement: top, bottom, left, right, inside*, center" },
        { name: "offset / formatter", type: "number / fn", default: "5", description: "LabelList distance from the datum and text shaping" },
      ]} />

      <ApiReference title="ChartTooltip / ChartLegend" props={[
        { name: "content", type: "ReactElement", description: "Cloned with { active, payload, label }; defaults to ChartTooltipContent / ChartLegendContent" },
        { name: "cursor", type: "boolean", default: "true", description: "Band highlight (bars) or vertical line under the pointer" },
        { name: "defaultIndex", type: "number", description: "Category shown before any interaction" },
        { name: "verticalAlign", type: '"top" | "bottom"', default: '"bottom"', description: "Legend placement" },
        { name: "indicator", type: '"dot" | "line" | "dashed"', default: '"dot"', description: "ChartTooltipContent swatch shape" },
        { name: "hideLabel / hideIndicator", type: "boolean", default: "false", description: "Tooltip content switches; hideIcon for the legend" },
        { name: "labelFormatter", type: "(value, payload) => node", description: "Tooltip heading" },
        { name: "formatter", type: "fn", description: "(value, name, item, index, payload) => node; replaces the row" },
        { name: "nameKey / labelKey", type: "string", description: "Look up config by another field of the payload" },
      ]} />
    </>
  )
}
