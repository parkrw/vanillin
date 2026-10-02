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
  PieChart,
  RadarChart,
  RadialBarChart,
  Pie,
  Radar,
  RadialBar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Label,
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

const browserData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 187, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 90, fill: "var(--color-other)" },
]

const donutData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  { browser: "firefox", visitors: 287, fill: "var(--color-firefox)" },
  { browser: "edge", visitors: 173, fill: "var(--color-edge)" },
  { browser: "other", visitors: 190, fill: "var(--color-other)" },
]

const browserConfig = {
  visitors: { label: "Visitors" },
  chrome: { label: "Chrome", color: "var(--chart-1)" },
  safari: { label: "Safari", color: "var(--chart-2)" },
  firefox: { label: "Firefox", color: "var(--chart-3)" },
  edge: { label: "Edge", color: "var(--chart-4)" },
  other: { label: "Other", color: "var(--chart-5)" },
}

const stackedData = [{ month: "january", mobile: 570, desktop: 1260 }]

const totalDonut = donutData.reduce((sum, d) => sum + d.visitors, 0)
const totalStacked = stackedData[0].desktop + stackedData[0].mobile

const monthTick = (value) => value.slice(0, 3)

const centreText = (lines) => ({ viewBox }) => (
  <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
    {lines.map(([text, dy, strong]) => (
      <tspan
        key={text}
        x={viewBox.cx}
        y={viewBox.cy + dy}
        style={strong ? { fill: "var(--foreground)", fontSize: "1.875rem", fontWeight: 700 } : { fill: "var(--muted-foreground)" }}
      >
        {text}
      </tspan>
    ))}
  </text>
)

function Frame({ pg, square = false, children }) {
  return (
    <div data-pg={pg} style={{ width: "100%", maxWidth: square ? "16rem" : "40rem" }}>
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
        Bar, line, area, pie, radar and radial charts on plain SVG. A <code>config</code> names and colours each
        series; the drawing primitives take the Recharts names, so Recharts examples paste in unchanged.
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
          invisible to the chart. Pie, radar and radial charts share this shell and sit on a separate polar root. No
          entrance animation, no RTL axis mirroring, no <code>ReferenceLine</code>, <code>Brush</code> or{" "}
          <code>syncId</code>.
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

      <section className="pg-section">
        <h3>Pie</h3>
        <p>
          A <code>Pie</code> carries its own <code>data</code>: <code>dataKey</code> sizes each slice and{" "}
          <code>nameKey</code> names it, which is how the tooltip and legend find its <code>config</code> entry. A
          slice is coloured by a <code>Cell</code> child, else the row's <code>fill</code>, else the config entry its
          name points at, else the palette. Slices start at 3 o'clock and run counter-clockwise, as in Recharts.
          Hovering a slice shows its tooltip; with <code>accessibilityLayer</code> the arrow keys step through them.
        </p>
        <ComponentPreview code={`const chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  …
]

<ChartContainer config={chartConfig} style={{ aspectRatio: "1" }}>
  <PieChart accessibilityLayer aria-label="Visitors by browser">
    <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
    <Pie data={chartData} dataKey="visitors" nameKey="browser" />
  </PieChart>
</ChartContainer>`}>
          <Frame pg="chart-pie" square>
            <ChartContainer config={browserConfig} style={{ aspectRatio: "1" }}>
              <PieChart accessibilityLayer aria-label="Visitors by browser">
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={browserData} dataKey="visitors" nameKey="browser" />
              </PieChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Donut with text</h3>
        <p>
          <code>innerRadius</code> opens the centre; <code>strokeWidth</code> is a gap between slices in the page
          background. A <code>Label</code> child renders its <code>content</code> with the pie's view box, so{" "}
          <code>viewBox.cx</code> and <code>viewBox.cy</code> place text in the hole.
        </p>
        <ComponentPreview code={`<PieChart>
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Pie data={chartData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5}>
    <Label
      content={({ viewBox }) => (
        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
          <tspan x={viewBox.cx} y={viewBox.cy} style={{ fill: "var(--foreground)", fontSize: "1.875rem", fontWeight: 700 }}>
            {total.toLocaleString()}
          </tspan>
          <tspan x={viewBox.cx} y={viewBox.cy + 24} style={{ fill: "var(--muted-foreground)" }}>
            Visitors
          </tspan>
        </text>
      )}
    />
  </Pie>
</PieChart>`}>
          <Frame pg="chart-donut" square>
            <ChartContainer config={browserConfig} style={{ aspectRatio: "1" }}>
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={donutData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5}>
                  <Label content={centreText([[totalDonut.toLocaleString(), 0, true], ["Visitors", 24, false]])} />
                </Pie>
              </PieChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Radar</h3>
        <p>
          A <code>RadarChart</code> takes the rows on the chart, like a bar chart. The <code>PolarAngleAxis</code>{" "}
          <code>dataKey</code> names each spoke, starting at the top and running clockwise; the value runs from the
          centre out over the <code>PolarRadiusAxis</code> domain, <code>[0, "auto"]</code> by default.{" "}
          <code>PolarGrid</code> draws a ring per tick and a line per spoke; <code>gridType="circle"</code> rounds
          the rings. <code>dot</code> marks each point and a second <code>Radar</code> overlays the first.
        </p>
        <ComponentPreview code={`<RadarChart data={chartData}>
  <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
  <PolarAngleAxis dataKey="month" />
  <PolarGrid />
  <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.6} />
</RadarChart>`}>
          <Frame pg="chart-radar" square>
            <ChartContainer config={chartConfig} style={{ aspectRatio: "1" }}>
              <RadarChart data={chartData}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <PolarAngleAxis dataKey="month" />
                <PolarGrid />
                <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.6} />
              </RadarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Radial bar</h3>
        <p>
          A <code>RadialBarChart</code> draws one ring per row between <code>innerRadius</code> and{" "}
          <code>outerRadius</code>, innermost first; the value is the angle, over the sweep from{" "}
          <code>startAngle</code> to <code>endAngle</code> (0° to 360° by default). <code>background</code> paints
          the full sweep behind each bar. Rings colour like slices: <code>Cell</code>, the row's <code>fill</code>,
          the series <code>fill</code>, the palette. The tooltip's <code>nameKey</code> names a ring from its row.
        </p>
        <ComponentPreview code={`<RadialBarChart data={chartData} innerRadius={30} outerRadius={110}>
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="browser" />} />
  <RadialBar dataKey="visitors" background />
</RadialBarChart>`}>
          <Frame pg="chart-radial" square>
            <ChartContainer config={browserConfig} style={{ aspectRatio: "1" }}>
              <RadialBarChart data={browserData} innerRadius={30} outerRadius={110}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel nameKey="browser" />} />
                <RadialBar dataKey="visitors" background />
              </RadialBarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Radial stacked</h3>
        <p>
          Bars sharing a <code>stackId</code> stack along the angle; <code>cornerRadius</code> rounds each bar's
          ends. A <code>PolarRadiusAxis</code> with its ticks and lines off is the host for a <code>Label</code> in
          the centre.
        </p>
        <ComponentPreview code={`const chartData = [{ month: "january", mobile: 570, desktop: 1260 }]

<RadialBarChart data={chartData} endAngle={180} innerRadius={80} outerRadius={110}>
  <RadialBar dataKey="mobile" fill="var(--color-mobile)" stackId="a" cornerRadius={5} />
  <RadialBar dataKey="desktop" fill="var(--color-desktop)" stackId="a" cornerRadius={5} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
    <Label content={({ viewBox }) => ( … viewBox.cx, viewBox.cy … )} />
  </PolarRadiusAxis>
</RadialBarChart>`}>
          <Frame pg="chart-radial-stacked" square>
            <ChartContainer config={chartConfig} style={{ aspectRatio: "1" }}>
              <RadialBarChart data={stackedData} endAngle={180} innerRadius={80} outerRadius={110}>
                <RadialBar dataKey="mobile" fill="var(--color-mobile)" stackId="a" cornerRadius={5} />
                <RadialBar dataKey="desktop" fill="var(--color-desktop)" stackId="a" cornerRadius={5} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
                  <Label content={centreText([[totalStacked.toLocaleString(), -16, true], ["Visitors", 4, false]])} />
                </PolarRadiusAxis>
              </RadialBarChart>
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

      <ApiReference title="PieChart / RadarChart / RadialBarChart" props={[
        { name: "data", type: "object[]", description: "One row per spoke (radar) or ring (radial); a Pie carries its own" },
        { name: "cx / cy", type: "number | string", default: '"50%"', description: "Centre, px or a share of the plot" },
        { name: "innerRadius / outerRadius", type: "number | string", default: '0 / "80%"', description: "px or a share of half the plot's shorter side" },
        { name: "startAngle / endAngle", type: "number", default: "0 / 360 (radar 90 / -270)", description: "Degrees, 0 at 3 o'clock, counter-clockwise positive" },
        { name: "margin", type: "{ top, right, bottom, left }", default: "5 each", description: "Space around the plot, inside the surface" },
        { name: "barCategoryGap / barGap", type: "string | number / number", default: '"10%" / 4', description: "Radial ring spacing, as for bars" },
        { name: "accessibilityLayer", type: "boolean", default: "false", description: "Focusable surface; arrows step slices, spokes or rings" },
      ]} />

      <ApiReference title="Pie / Radar / RadialBar" props={[
        { name: "data", type: "object[]", description: "Pie only: its rows" },
        { name: "dataKey", type: "string", description: "Field of each row this series reads" },
        { name: "nameKey", type: "string", description: "Pie: field naming each slice, looked up in config" },
        { name: "innerRadius / outerRadius / startAngle / endAngle", type: "number | string", description: "Pie: override the chart's" },
        { name: "paddingAngle", type: "number", default: "0", description: "Pie: gap between slices, degrees" },
        { name: "cornerRadius", type: "number", default: "0", description: "Rounded sector corners, px" },
        { name: "fill / fillOpacity", type: "string / number", description: "Series colour; defaults to the next --chart-n, Radar fillOpacity 1" },
        { name: "stroke / strokeWidth", type: "string / number", default: "background / 0", description: "Sector edge, a gap in the page colour; Radar outline" },
        { name: "background", type: "boolean | { fill }", default: "false", description: "RadialBar: a track over the full sweep" },
        { name: "stackId", type: "string", description: "RadialBar: bars sharing one ring" },
        { name: "dot", type: "boolean | { r, fill, fillOpacity, stroke }", default: "false", description: "Radar point markers" },
      ]} />

      <ApiReference title="PolarGrid / PolarAngleAxis / PolarRadiusAxis / Label / Cell" props={[
        { name: "gridType", type: '"polygon" | "circle"', default: '"polygon"', description: "Ring shape" },
        { name: "radialLines", type: "boolean", default: "true", description: "Spokes from the centre" },
        { name: "polarRadius / polarAngles", type: "number[]", description: "Explicit ring radii and spoke angles" },
        { name: "dataKey", type: "string", description: "Angle axis: spoke labels (radar); radius axis: ring labels (radial)" },
        { name: "domain / ticks / tickCount", type: "[lo, hi] / number[] / number", default: '[0, "auto"] / — / 5', description: "The value axis: radius for radar, angle for radial" },
        { name: "tick / tickLine / axisLine", type: "boolean", default: "true", description: "Labels, tick marks and the axis line" },
        { name: "angle / orientation", type: 'number / "left" | "right" | "middle"', default: '0 / "right"', description: "Radius axis direction and label side" },
        { name: "content", type: "({ viewBox }) => node", description: "Label: viewBox is { cx, cy, innerRadius, outerRadius, startAngle, endAngle }" },
        { name: "value", type: "string", description: "Label: plain text at the centre" },
        { name: "fill", type: "string", description: "Cell: colour of the slice or ring at its index" },
      ]} />

      <ApiReference title="ChartTooltip / ChartLegend" props={[
        { name: "content", type: "ReactElement", description: "Cloned with { active, payload, label }; defaults to ChartTooltipContent / ChartLegendContent" },
        { name: "cursor", type: "boolean", default: "true", description: "Band highlight (bars) or vertical line under the pointer; polar charts draw none" },
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
