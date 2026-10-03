import { useId, useState } from "react"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  BarChart,
  LineChart,
  AreaChart,
  ComposedChart,
  ScatterChart,
  Scatter,
  ZAxis,
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
  Sector,
  Cell,
  Rectangle,
  Dot,
} from "../../ui/chart/chart.jsx"
import { NativeSelect, NativeSelectOption } from "../../ui/native-select/native-select.jsx"
import "../../ui/chart/chart.css"
import "../../ui/native-select/native-select.css"
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

const labelConfig = {
  ...chartConfig,
  label: { color: "var(--background)" },
}

const expandData = [
  { month: "January", desktop: 186, mobile: 80, other: 45 },
  { month: "February", desktop: 305, mobile: 200, other: 100 },
  { month: "March", desktop: 237, mobile: 120, other: 150 },
  { month: "April", desktop: 73, mobile: 190, other: 50 },
  { month: "May", desktop: 209, mobile: 130, other: 100 },
  { month: "June", desktop: 214, mobile: 140, other: 160 },
]

const expandConfig = {
  ...chartConfig,
  other: { label: "Other", color: "var(--chart-3)" },
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

const browserLineConfig = {
  ...browserConfig,
  visitors: { label: "Visitors", color: "var(--chart-2)" },
}

const stackedData = [{ month: "january", mobile: 570, desktop: 1260 }]

const schoolA = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
]

const schoolB = [
  { x: 200, y: 260, z: 240 },
  { x: 240, y: 290, z: 220 },
  { x: 190, y: 290, z: 250 },
  { x: 198, y: 250, z: 210 },
  { x: 180, y: 280, z: 260 },
  { x: 210, y: 220, z: 230 },
]

const schoolConfig = {
  stature: { label: "Stature" },
  weight: { label: "Weight" },
  score: { label: "Score" },
  a: { label: "School A", color: "var(--chart-1)" },
  b: { label: "School B", color: "var(--chart-2)" },
}

const desktopData = [
  { month: "january", desktop: 186, fill: "var(--color-january)" },
  { month: "february", desktop: 305, fill: "var(--color-february)" },
  { month: "march", desktop: 237, fill: "var(--color-march)" },
  { month: "april", desktop: 173, fill: "var(--color-april)" },
  { month: "may", desktop: 209, fill: "var(--color-may)" },
]

const mobileData = [
  { month: "january", mobile: 80, fill: "var(--color-january)" },
  { month: "february", mobile: 200, fill: "var(--color-february)" },
  { month: "march", mobile: 120, fill: "var(--color-march)" },
  { month: "april", mobile: 190, fill: "var(--color-april)" },
  { month: "may", mobile: 130, fill: "var(--color-may)" },
]

const monthConfig = {
  visitors: { label: "Visitors" },
  desktop: { label: "Desktop" },
  mobile: { label: "Mobile" },
  january: { label: "January", color: "var(--chart-1)" },
  february: { label: "February", color: "var(--chart-2)" },
  march: { label: "March", color: "var(--chart-3)" },
  april: { label: "April", color: "var(--chart-4)" },
  may: { label: "May", color: "var(--chart-5)" },
}

// Recharts' interactive pie: the hovered or pinned slice grows an outer ring.
const raisedSector = ({ outerRadius = 0, ...props }) => (
  <g>
    <Sector {...props} outerRadius={outerRadius + 10} />
    <Sector {...props} outerRadius={outerRadius + 25} innerRadius={outerRadius + 12} />
  </g>
)

const totalDonut = donutData.reduce((sum, d) => sum + d.visitors, 0)
const totalStacked = stackedData[0].desktop + stackedData[0].mobile

const monthTick = (value) => value.slice(0, 3)
const browserTick = (value) => browserConfig[value]?.label
const percentTick = (value) => `${Math.round(value * 100)}%`

const dashedBar = (props) => (
  <Rectangle {...props} fillOpacity={0.8} stroke={props.payload.fill} strokeDasharray={4} strokeDashoffset={4} />
)

const triangleBar = ({ x, y, width, height, fill }) => (
  <path d={`M ${x} ${y + height} L ${x + width / 2} ${y} L ${x + width} ${y + height} Z`} fill={fill} />
)

const valueBadge = ({ x, y, width, value }) => (
  <g>
    <rect x={x + width / 2 - 20} y={y - 26} width={40} height={20} rx={6} fill="var(--muted)" />
    <text x={x + width / 2} y={y - 16} textAnchor="middle" dominantBaseline="middle" fill="var(--foreground)">
      {value}
    </text>
  </g>
)

const commitDot = ({ cx, cy }) => (
  <svg x={cx - 12} y={cy - 12} width={24} height={24} viewBox="0 0 24 24" fill="var(--background)" stroke="var(--color-desktop)" strokeWidth={2} strokeLinecap="round">
    <path d="M12 3v6" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 15v6" />
  </svg>
)

const browserDot = ({ payload, cx, cy }) => <Dot r={5} cx={cx} cy={cy} fill={payload.fill} stroke={payload.fill} />

const valueOverMonth = ({ x, y, textAnchor, index }) => {
  const row = chartData[index]
  return (
    <text x={x} y={index === 0 ? y - 10 : y} textAnchor={textAnchor} fontSize={13} fontWeight={500}>
      <tspan style={{ fill: "var(--foreground)" }}>{row.desktop}</tspan>
      <tspan>/</tspan>
      <tspan style={{ fill: "var(--foreground)" }}>{row.mobile}</tspan>
      <tspan x={x} dy="1rem" fontSize={12} fontWeight={400}>
        {row.month}
      </tspan>
    </text>
  )
}

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

function PinnedPie() {
  const [browser, setBrowser] = useState(browserData[0].browser)
  const activeIndex = browserData.findIndex((row) => row.browser === browser)
  return (
    <>
      <NativeSelect value={browser} onChange={(event) => setBrowser(event.target.value)} aria-label="Pinned slice" style={{ maxWidth: "10rem" }}>
        {browserData.map((row) => (
          <NativeSelectOption key={row.browser} value={row.browser}>
            {browserConfig[row.browser].label}
          </NativeSelectOption>
        ))}
      </NativeSelect>
      <ChartContainer config={browserConfig} style={{ aspectRatio: "1" }}>
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie data={browserData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5} activeIndex={activeIndex} activeShape={raisedSector}>
            <Label content={centreText([[browserData[activeIndex].visitors.toLocaleString(), 0, true], ["Visitors", 24, false]])} />
          </Pie>
        </PieChart>
      </ChartContainer>
    </>
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
        <h3>Stacked to 100%</h3>
        <p>
          <code>stackOffset="expand"</code> on the chart scales every stack to the same height, so each bar shows its
          share of the month. The value axis runs from 0 to 1, read here as percentages through{" "}
          <code>tickFormatter</code>; the tooltip still shows the counts.
        </p>
        <ComponentPreview code={`<BarChart data={chartData} stackOffset="expand">
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />
  <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={(v) => \`\${Math.round(v * 100)}%\`} />
  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
  <Bar dataKey="desktop" stackId="a" fill="var(--color-desktop)" />
  <Bar dataKey="mobile" stackId="a" fill="var(--color-mobile)" />
  <Bar dataKey="other" stackId="a" fill="var(--color-other)" />
</BarChart>`}>
          <Frame pg="chart-bar-expand">
            <ChartContainer config={expandConfig}>
              <BarChart data={expandData} stackOffset="expand">
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <YAxis tickLine={false} axisLine={false} width={40} tickFormatter={percentTick} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" stackId="a" fill="var(--color-desktop)" />
                <Bar dataKey="mobile" stackId="a" fill="var(--color-mobile)" />
                <Bar dataKey="other" stackId="a" fill="var(--color-other)" />
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
          tick grid, so negatives extend below the baseline rather than clipping. A <code>radius</code> list
          names the corners of an upright bar and flips with a negative one, so <code>[4, 4, 0, 0]</code> rounds
          every bar at its value end.
        </p>
        <ComponentPreview code={`<BarChart data={negativeData}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />
  <YAxis tickLine={false} axisLine={false} width={40} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Bar dataKey="visitors" fill="var(--color-visitors)" radius={[4, 4, 0, 0]} />
</BarChart>`}>
          <Frame pg="chart-negative">
            <ChartContainer config={negativeConfig}>
              <BarChart data={negativeData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="visitors" fill="var(--color-visitors)" radius={[4, 4, 0, 0]} />
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
        <h3>Labels inside bars</h3>
        <p>
          Two <code>LabelList</code>s on one bar: the month inside its start, the value past its end. A{" "}
          <code>LabelList</code> with a <code>dataKey</code> labels with that field instead of the bar's value, and{" "}
          <code>fill</code> colours its text.
        </p>
        <ComponentPreview code={`<BarChart data={chartData} layout="vertical" margin={{ right: 16 }}>
  <CartesianGrid horizontal={false} />
  <YAxis dataKey="month" type="category" hide />
  <XAxis dataKey="desktop" type="number" hide />
  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
  <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4}>
    <LabelList dataKey="month" position="insideLeft" offset={8} fill="var(--color-label)" />
    <LabelList dataKey="desktop" position="right" offset={8} />
  </Bar>
</BarChart>`}>
          <Frame pg="chart-bar-label-custom">
            <ChartContainer config={labelConfig}>
              <BarChart data={chartData} layout="vertical" margin={{ right: 16 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="month" type="category" hide />
                <XAxis dataKey="desktop" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4}>
                  <LabelList dataKey="month" position="insideLeft" offset={8} fill="var(--color-label)" />
                  <LabelList dataKey="desktop" position="right" offset={8} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Label content</h3>
        <p>
          <code>content</code> draws each label yourself: an element, or a function of the bar's box (
          <code>x</code>, <code>y</code>, <code>width</code>, <code>height</code>) with its <code>value</code> and{" "}
          <code>index</code>. On a line or area the box is the point, with no size.
        </p>
        <ComponentPreview code={`const valueBadge = ({ x, y, width, value }) => (
  <g>
    <rect x={x + width / 2 - 20} y={y - 26} width={40} height={20} rx={6} fill="var(--muted)" />
    <text x={x + width / 2} y={y - 16} textAnchor="middle" dominantBaseline="middle" fill="var(--foreground)">
      {value}
    </text>
  </g>
)

<BarChart data={chartData} margin={{ top: 30 }}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />
  <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8}>
    <LabelList content={valueBadge} />
  </Bar>
</BarChart>`}>
          <Frame pg="chart-label-content">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData} margin={{ top: 30 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={8}>
                  <LabelList content={valueBadge} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Negative bars with labels</h3>
        <p>
          A <code>Cell</code> per row colours that bar, here by sign. Labels follow the bar's direction:{" "}
          <code>position="top"</code> sits past the value end, so a negative bar's label hangs below it.
        </p>
        <ComponentPreview code={`<BarChart data={negativeData}>
  <CartesianGrid vertical={false} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel hideIndicator />} />
  <Bar dataKey="visitors">
    <LabelList position="top" dataKey="month" />
    {negativeData.map((item) => (
      <Cell key={item.month} fill={item.visitors > 0 ? "var(--chart-1)" : "var(--chart-2)"} />
    ))}
  </Bar>
</BarChart>`}>
          <Frame pg="chart-bar-negative">
            <ChartContainer config={negativeConfig}>
              <BarChart data={negativeData}>
                <CartesianGrid vertical={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel hideIndicator />} />
                <Bar dataKey="visitors">
                  <LabelList position="top" dataKey="month" />
                  {negativeData.map((item) => (
                    <Cell key={item.month} fill={item.visitors > 0 ? "var(--chart-1)" : "var(--chart-2)"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>A colour per bar</h3>
        <p>
          A bar takes the <code>fill</code> of its row when the row has one. A <code>Cell</code> beats the row, and
          the row beats the series <code>fill</code>.
        </p>
        <ComponentPreview code={`const chartData = [
  { browser: "chrome", visitors: 275, fill: "var(--color-chrome)" },
  { browser: "safari", visitors: 200, fill: "var(--color-safari)" },
  …
]

<BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
  <YAxis dataKey="browser" type="category" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => chartConfig[v]?.label} />
  <XAxis dataKey="visitors" type="number" hide />
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Bar dataKey="visitors" layout="vertical" radius={5} />
</BarChart>`}>
          <Frame pg="chart-bar-mixed">
            <ChartContainer config={browserConfig}>
              <BarChart data={browserData} layout="vertical" margin={{ left: 0 }}>
                <YAxis dataKey="browser" type="category" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={browserTick} />
                <XAxis dataKey="visitors" type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="visitors" layout="vertical" radius={5} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Active bar</h3>
        <p>
          <code>activeBar</code> redraws the active bar: an object of props laid over it, an element, or a function
          of the bar. <code>activeIndex</code> pins which bar is active; without it the bar under the pointer is.{" "}
          <code>Rectangle</code> is the plain bar to build on.
        </p>
        <ComponentPreview code={`<BarChart data={chartData}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="browser" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => chartConfig[v]?.label} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Bar
    dataKey="visitors"
    strokeWidth={2}
    radius={8}
    activeIndex={2}
    activeBar={(props) => (
      <Rectangle {...props} fillOpacity={0.8} stroke={props.payload.fill} strokeDasharray={4} strokeDashoffset={4} />
    )}
  />
</BarChart>`}>
          <Frame pg="chart-bar-active">
            <ChartContainer config={browserConfig}>
              <BarChart data={browserData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="browser" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={browserTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="visitors" strokeWidth={2} radius={8} activeIndex={2} activeBar={dashedBar} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Bar shape</h3>
        <p>
          <code>shape</code> draws every bar: a function of the bar's box, colour, row and value, or an element
          cloned over them.
        </p>
        <ComponentPreview code={`const triangleBar = ({ x, y, width, height, fill }) => (
  <path d={\`M \${x} \${y + height} L \${x + width / 2} \${y} L \${x + width} \${y + height} Z\`} fill={fill} />
)

<BarChart data={chartData}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(v) => v.slice(0, 3)} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Bar dataKey="desktop" fill="var(--color-desktop)" shape={triangleBar} />
</BarChart>`}>
          <Frame pg="chart-bar-shape">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={monthTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" shape={triangleBar} />
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
        <h3>Custom dots</h3>
        <p>
          <code>dot</code> and <code>activeDot</code> also take an element or a function of the point:{" "}
          <code>cx</code>, <code>cy</code>, <code>r</code>, <code>index</code>, <code>value</code> and the row as{" "}
          <code>payload</code>. Here each point is a commit marker.
        </p>
        <ComponentPreview code={`<Line
  dataKey="desktop"
  type="natural"
  stroke="var(--color-desktop)"
  strokeWidth={2}
  dot={({ cx, cy }) => (
    <svg x={cx - 12} y={cy - 12} width={24} height={24} viewBox="0 0 24 24" fill="var(--background)" stroke="var(--color-desktop)" strokeWidth={2} strokeLinecap="round">
      <path d="M12 3v6" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 15v6" />
    </svg>
  )}
/>`}>
          <Frame pg="chart-line-dots-custom">
            <ChartContainer config={chartConfig}>
              <LineChart data={chartData} margin={{ left: 12, right: 12 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Line dataKey="desktop" type="natural" stroke="var(--color-desktop)" strokeWidth={2} dot={commitDot} />
              </LineChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Dot colours</h3>
        <p>
          <code>Dot</code> is the plain marker. A <code>dot</code> function can colour each one from its row.
        </p>
        <ComponentPreview code={`<LineChart data={chartData} margin={{ top: 24, left: 24, right: 24 }}>
  <CartesianGrid vertical={false} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" nameKey="visitors" hideLabel />} />
  <Line
    dataKey="visitors"
    type="natural"
    stroke="var(--color-visitors)"
    strokeWidth={2}
    dot={({ payload, cx, cy }) => <Dot r={5} cx={cx} cy={cy} fill={payload.fill} stroke={payload.fill} />}
  />
</LineChart>`}>
          <Frame pg="chart-line-dots-colors">
            <ChartContainer config={browserLineConfig}>
              <LineChart data={browserData} margin={{ top: 24, left: 24, right: 24 }}>
                <CartesianGrid vertical={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" nameKey="visitors" hideLabel />} />
                <Line dataKey="visitors" type="natural" stroke="var(--color-visitors)" strokeWidth={2} dot={browserDot} />
              </LineChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Line labels</h3>
        <p>
          A <code>LabelList</code> on a line labels each point. Here it reads the browser field and{" "}
          <code>formatter</code> turns it into the configured name.
        </p>
        <ComponentPreview code={`<LineChart data={chartData} margin={{ top: 24, left: 24, right: 24 }}>
  <CartesianGrid vertical={false} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" nameKey="visitors" hideLabel />} />
  <Line dataKey="visitors" type="natural" stroke="var(--color-visitors)" strokeWidth={2} dot={{ fill: "var(--color-visitors)" }} activeDot={{ r: 6 }}>
    <LabelList position="top" offset={12} dataKey="browser" formatter={(value) => chartConfig[value]?.label} />
  </Line>
</LineChart>`}>
          <Frame pg="chart-line-label-custom">
            <ChartContainer config={browserLineConfig}>
              <LineChart data={browserData} margin={{ top: 24, left: 24, right: 24 }}>
                <CartesianGrid vertical={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" nameKey="visitors" hideLabel />} />
                <Line
                  dataKey="visitors"
                  type="natural"
                  stroke="var(--color-visitors)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-visitors)" }}
                  activeDot={{ r: 6 }}
                >
                  <LabelList position="top" offset={12} dataKey="browser" formatter={browserTick} />
                </Line>
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
        <h3>Stacked area to 100%</h3>
        <p>
          With <code>stackOffset="expand"</code> each month's stack fills the plot, so the bands show shares rather
          than totals. The tooltip still shows the counts.
        </p>
        <ComponentPreview code={`<AreaChart data={chartData} margin={{ left: 12, right: 12, top: 12 }} stackOffset="expand">
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />
  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
  <Area dataKey="other" type="natural" fill="var(--color-other)" fillOpacity={0.1} stroke="var(--color-other)" stackId="a" />
  <Area dataKey="mobile" type="natural" fill="var(--color-mobile)" fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
  <Area dataKey="desktop" type="natural" fill="var(--color-desktop)" fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
</AreaChart>`}>
          <Frame pg="chart-area-expand">
            <ChartContainer config={expandConfig}>
              <AreaChart data={expandData} margin={{ left: 12, right: 12, top: 12 }} stackOffset="expand">
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <Area dataKey="other" type="natural" fill="var(--color-other)" fillOpacity={0.1} stroke="var(--color-other)" stackId="a" />
                <Area dataKey="mobile" type="natural" fill="var(--color-mobile)" fillOpacity={0.4} stroke="var(--color-mobile)" stackId="a" />
                <Area dataKey="desktop" type="natural" fill="var(--color-desktop)" fillOpacity={0.4} stroke="var(--color-desktop)" stackId="a" />
              </AreaChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Composed</h3>
        <p>
          <code>ComposedChart</code> takes <code>Bar</code>, <code>Line</code> and <code>Area</code> together. Any
          bar present puts the categories on bands, and the line and area points sit on the band centres, so one
          tooltip names every series at a category.
        </p>
        <ComponentPreview code={`<ComposedChart data={chartData}>
  <CartesianGrid vertical={false} />
  <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(v) => v.slice(0, 3)} />
  <ChartTooltip content={<ChartTooltipContent />} />
  <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
  <Line dataKey="mobile" stroke="var(--color-mobile)" type="monotone" />
</ComposedChart>`}>
          <Frame pg="chart-composed">
            <ChartContainer config={chartConfig}>
              <ComposedChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Line dataKey="mobile" stroke="var(--color-mobile)" type="monotone" />
              </ComposedChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Scatter</h3>
        <p>
          A <code>ScatterChart</code> puts numbers on both axes: <code>XAxis</code> and <code>YAxis</code>{" "}
          <code>dataKey</code> name the fields, their <code>name</code> labels the tooltip rows through the config, and
          each <code>Scatter</code> carries its own rows. A <code>ZAxis</code> sizes the dots by area over its{" "}
          <code>range</code> in px², as in Recharts. The pointer takes the nearest dot of any series; the arrow keys
          step the first series. <code>line</code> joins a series' dots in row order.
        </p>
        <ComponentPreview code={`<ScatterChart accessibilityLayer aria-label="Stature against weight">
  <CartesianGrid />
  <XAxis type="number" dataKey="x" name="stature" unit="cm" />
  <YAxis type="number" dataKey="y" name="weight" unit="kg" />
  <ZAxis dataKey="z" name="score" range={[60, 400]} />
  <ChartTooltip content={<ChartTooltipContent />} />
  <ChartLegend content={<ChartLegendContent />} />
  <Scatter name="a" data={schoolA} fill="var(--color-a)" />
  <Scatter name="b" data={schoolB} fill="var(--color-b)" />
</ScatterChart>`}>
          <Frame pg="chart-scatter">
            <ChartContainer config={schoolConfig}>
              <ScatterChart accessibilityLayer aria-label="Stature against weight">
                <CartesianGrid />
                <XAxis type="number" dataKey="x" name="stature" unit="cm" />
                <YAxis type="number" dataKey="y" name="weight" unit="kg" />
                <ZAxis dataKey="z" name="score" range={[60, 400]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Scatter name="a" data={schoolA} fill="var(--color-a)" />
                <Scatter name="b" data={schoolB} fill="var(--color-b)" />
              </ScatterChart>
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
        <h3>Tooltip on click</h3>
        <ComponentPreview code={`<ChartTooltip trigger="click" content={<ChartTooltipContent />} />`}>
          <Frame pg="chart-tooltip-click">
            <ChartContainer config={chartConfig}>
              <BarChart data={chartData}>
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={monthTick} />
                <ChartTooltip trigger="click" content={<ChartTooltipContent />} />
                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
              </BarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
        <p className="pg-desc">
          <code>trigger="click"</code> opens the tooltip on a press instead of the pointer passing over: the same
          band again closes it, another band moves it, a press outside the chart dismisses it. Hover alone shows
          nothing. Pie, radar and radial charts take it the same way.
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
        <h3>Pie with labels</h3>
        <p>
          <code>label</code> writes each slice's value outside the disc, 20px past the edge along the slice's middle, and{" "}
          <code>labelLine</code> (on by default) joins the edge to it in the slice colour. Pass an object to restyle the text
          or move it (<code>offsetRadius</code>), or a function of the slice (<code>value</code>, <code>name</code>,{" "}
          <code>percent</code>, <code>payload</code>, <code>x</code>, <code>y</code>, <code>textAnchor</code>) to return your
          own text or element. <code>labelLine={"{false}"}</code> drops the lines.
        </p>
        <ComponentPreview code={`<ChartContainer config={chartConfig}>
  <PieChart>
    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
    <Pie data={chartData} dataKey="visitors" nameKey="browser" label />
  </PieChart>
</ChartContainer>`}>
          <Frame pg="chart-pie-labels">
            <ChartContainer config={browserConfig}>
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Pie data={browserData} dataKey="visitors" nameKey="browser" label />
              </PieChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Pie with an active slice</h3>
        <p>
          <code>activeShape</code> redraws the slice under the pointer, or the one the arrow keys reach. It takes a
          function of the slice's geometry (<code>cx</code>, <code>cy</code>, <code>innerRadius</code>,{" "}
          <code>outerRadius</code>, <code>startAngle</code>, <code>endAngle</code>, <code>fill</code>) returning an
          element, or an object of overrides; <code>Sector</code> draws one sector from those props, so a shape can
          grow the slice or add a ring around it. <code>inactiveShape</code> takes the same forms and redraws every
          other slice while one is active, here to fade them.
        </p>
        <ComponentPreview code={`<PieChart>
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Pie
    data={chartData}
    dataKey="visitors"
    nameKey="browser"
    innerRadius={60}
    strokeWidth={5}
    activeShape={({ outerRadius = 0, ...props }) => (
      <g>
        <Sector {...props} outerRadius={outerRadius + 10} />
        <Sector {...props} outerRadius={outerRadius + 25} innerRadius={outerRadius + 12} />
      </g>
    )}
    inactiveShape={{ fillOpacity: 0.4 }}
  />
</PieChart>`}>
          <Frame pg="chart-pie-active" square>
            <ChartContainer config={browserConfig} style={{ aspectRatio: "1" }}>
              <PieChart accessibilityLayer aria-label="Visitors by browser, active slice raised">
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie data={browserData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5} activeShape={raisedSector} inactiveShape={{ fillOpacity: 0.4 }} />
              </PieChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Pie with a pinned slice</h3>
        <p>
          <code>activeIndex</code> pins the active slice: the pointer still drives the tooltip, but the shape stays
          where the prop says, as in Recharts. Here a select chooses the browser and a <code>Label</code> in the hole
          reads its value.
        </p>
        <ComponentPreview code={`const [browser, setBrowser] = useState("chrome")
const activeIndex = chartData.findIndex((row) => row.browser === browser)

<NativeSelect value={browser} onChange={(event) => setBrowser(event.target.value)}>
  {chartData.map((row) => (
    <NativeSelectOption key={row.browser} value={row.browser}>{chartConfig[row.browser].label}</NativeSelectOption>
  ))}
</NativeSelect>
<PieChart>
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <Pie data={chartData} dataKey="visitors" nameKey="browser" innerRadius={60} strokeWidth={5} activeIndex={activeIndex} activeShape={raisedSector}>
    <Label content={({ viewBox }) => ( … chartData[activeIndex].visitors … )} />
  </Pie>
</PieChart>`}>
          <Frame pg="chart-pie-pinned" square>
            <PinnedPie />
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Two pies</h3>
        <p>
          A second <code>Pie</code> with its own radii nests inside or around the first. The pointer picks the pie by
          radius, so the tooltip reads whichever slice is under it; the arrow keys follow the first. The legend lists
          every pie's slices, each name once. With <code>labelKey</code> and a <code>labelFormatter</code> the tooltip
          can name the series as well as the slice.
        </p>
        <ComponentPreview code={`<PieChart>
  <ChartTooltip
    content={
      <ChartTooltipContent
        labelKey="visitors"
        nameKey="month"
        indicator="line"
        labelFormatter={(_, payload) => chartConfig[payload?.[0].dataKey].label}
      />
    }
  />
  <ChartLegend content={<ChartLegendContent />} />
  <Pie data={desktopData} dataKey="desktop" nameKey="month" outerRadius={60} />
  <Pie data={mobileData} dataKey="mobile" nameKey="month" innerRadius={70} outerRadius={90} />
</PieChart>`}>
          <Frame pg="chart-pie-two" square>
            <ChartContainer config={monthConfig} style={{ aspectRatio: "1" }}>
              <PieChart accessibilityLayer aria-label="Visitors by month, desktop inside mobile">
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelKey="visitors"
                      nameKey="month"
                      indicator="line"
                      labelFormatter={(_, payload) => monthConfig[payload?.[0].dataKey].label}
                    />
                  }
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Pie data={desktopData} dataKey="desktop" nameKey="month" outerRadius={60} />
                <Pie data={mobileData} dataKey="mobile" nameKey="month" innerRadius={70} outerRadius={90} />
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
        <h3>Radar ticks</h3>
        <p>
          <code>tick</code> on <code>PolarAngleAxis</code> also takes an element or a function of the tick:{" "}
          <code>x</code>, <code>y</code>, <code>textAnchor</code>, <code>index</code>, and{" "}
          <code>payload.value</code> for the label. Here each spoke shows both values over its month. Text the tick
          leaves uncoloured takes the tick colour.
        </p>
        <ComponentPreview code={`<RadarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
  <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
  <PolarAngleAxis
    dataKey="month"
    tick={({ x, y, textAnchor, index }) => {
      const row = chartData[index]
      return (
        <text x={x} y={index === 0 ? y - 10 : y} textAnchor={textAnchor} fontSize={13} fontWeight={500}>
          <tspan style={{ fill: "var(--foreground)" }}>{row.desktop}</tspan>
          <tspan>/</tspan>
          <tspan style={{ fill: "var(--foreground)" }}>{row.mobile}</tspan>
          <tspan x={x} dy="1rem" fontSize={12} fontWeight={400}>{row.month}</tspan>
        </text>
      )
    }}
  />
  <PolarGrid />
  <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.6} />
  <Radar dataKey="mobile" fill="var(--color-mobile)" />
</RadarChart>`}>
          <Frame pg="chart-radar-label-custom" square>
            <ChartContainer config={chartConfig} style={{ aspectRatio: "1" }}>
              <RadarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
                <PolarAngleAxis dataKey="month" tick={valueOverMonth} />
                <PolarGrid />
                <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.6} />
                <Radar dataKey="mobile" fill="var(--color-mobile)" />
              </RadarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Filled grid</h3>
        <p>
          <code>fill</code> and <code>fillOpacity</code> on <code>PolarGrid</code> fill each ring. The rings overlap,
          so the tint deepens toward the centre.
        </p>
        <ComponentPreview code={`<RadarChart data={chartData}>
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <PolarGrid fill="var(--color-desktop)" fillOpacity={0.2} />
  <PolarAngleAxis dataKey="month" />
  <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.5} />
</RadarChart>`}>
          <Frame pg="chart-radar-grid-fill" square>
            <ChartContainer config={chartConfig} style={{ aspectRatio: "1" }}>
              <RadarChart data={chartData}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <PolarGrid fill="var(--color-desktop)" fillOpacity={0.2} />
                <PolarAngleAxis dataKey="month" />
                <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.5} />
              </RadarChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Filled circle grid</h3>
        <p>The same fill on round rings.</p>
        <ComponentPreview code={`<RadarChart data={chartData}>
  <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
  <PolarGrid gridType="circle" fill="var(--color-desktop)" fillOpacity={0.2} />
  <PolarAngleAxis dataKey="month" />
  <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.5} />
</RadarChart>`}>
          <Frame pg="chart-radar-grid-circle-fill" square>
            <ChartContainer config={chartConfig} style={{ aspectRatio: "1" }}>
              <RadarChart data={chartData}>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <PolarGrid gridType="circle" fill="var(--color-desktop)" fillOpacity={0.2} />
                <PolarAngleAxis dataKey="month" />
                <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.5} />
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
          <code>startAngle</code> to <code>endAngle</code> (0° to 360° by default). With no{" "}
          <code>PolarAngleAxis</code> the sweep spans the data exactly, so the largest ring closes the circle and a
          stacked total fills a gauge; a <code>PolarAngleAxis</code> rounds the domain to its ticks instead.{" "}
          <code>background</code> paints the full sweep behind each bar. Rings colour like slices: <code>Cell</code>, the row's <code>fill</code>,
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

      <ApiReference title="BarChart / LineChart / AreaChart / ComposedChart" props={[
        { name: "data", type: "object[]", description: "One row per category" },
        { name: "layout", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "vertical runs the bars across (Recharts naming)" },
        { name: "margin", type: "{ top, right, bottom, left }", default: "5 each", description: "Space around the plot, inside the surface" },
        { name: "barCategoryGap", type: "string | number", default: '"10%"', description: "Gap either side of a band, as a fraction of the band or in px" },
        { name: "barGap", type: "number", default: "4", description: "Gap between bars in one band, px" },
        { name: "stackOffset", type: '"none" | "expand"', default: '"none"', description: "expand scales every stack to span 0 to 1; the tooltip keeps the raw values" },
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
        { name: "shape", type: "(bar) => node | element", description: "Bar: draws every bar from { x, y, width, height, radius, fill, index, value, payload }" },
        { name: "activeBar", type: "boolean | object | (bar) => node | element", default: "false", description: "Bar: redraws the active bar; an object is laid over its props" },
        { name: "activeIndex", type: "number", description: "Bar: pins the active bar instead of following the pointer" },
        { name: "type", type: '"linear" | "monotone" | "step" | …', default: '"linear"', description: "Curve: linear, monotone, step, stepBefore, stepAfter; natural and basis alias monotone" },
        { name: "strokeWidth", type: "number", description: "Line 2, Area 1.5" },
        { name: "dot / activeDot", type: "boolean | { r, fill, stroke } | (point) => node | element", description: "Point markers; the active one follows the tooltip. point is { cx, cy, r, index, value, payload }" },
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
        { name: "content", type: "(label) => node | element", description: "LabelList: draws each label from { x, y, width, height, value, index, offset, position }" },
        { name: "fill", type: "string", description: "LabelList text colour" },
      ]} />

      <ApiReference title="ScatterChart / Scatter / ZAxis" props={[
        { name: "data", type: "object[]", description: "Scatter: its rows; x, y and z are read by the axes' dataKey" },
        { name: "name", type: "string", description: "Scatter: series name, the legend entry, tooltip heading and config key" },
        { name: "fill / fillOpacity / stroke / strokeWidth", type: "string / number", description: "Dot paint; Cell children override per row" },
        { name: "line", type: "boolean | { strokeWidth, strokeDasharray }", default: "false", description: "Join the dots in row order" },
        { name: "shape", type: "(dot) => node | element", description: "Replaces the circle; dot is { cx, cy, r, fill, index, payload, x, y, z }" },
        { name: "type / name / unit", type: '"number" / string / string', description: "XAxis and YAxis: numeric field, tooltip row name, unit (kept on the payload)" },
        { name: "dataKey / range", type: "string / [min, max]", default: "— / [64, 64]", description: "ZAxis: field and dot area range in px²" },
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
        { name: "label", type: "boolean | { offsetRadius, fill, … } | (slice) => node | string", default: "false", description: "Pie: a value outside each slice, 20px past the edge" },
        { name: "labelLine", type: "boolean | { stroke, … } | (slice) => node", default: "true", description: "Pie: a line from the edge to the label, drawn only with label" },
        { name: "activeShape", type: "(slice) => node | { outerRadius, fill, … }", description: "Pie: redraws the active slice; the slice props feed a Sector" },
        { name: "activeIndex", type: "number | number[]", description: "Pie: pins the active slice instead of following the pointer" },
        { name: "inactiveShape", type: "(slice) => node | { fillOpacity, … }", description: "Pie: redraws every other slice while one is active" },
        { name: "cornerRadius", type: "number", default: "0", description: "Rounded sector corners, px" },
        { name: "fill / fillOpacity", type: "string / number", description: "Series colour; defaults to the next --chart-n, Radar fillOpacity 1" },
        { name: "stroke / strokeWidth", type: "string / number", default: "background / 0", description: "Sector edge, a gap in the page colour; Radar outline" },
        { name: "background", type: "boolean | { fill }", default: "false", description: "RadialBar: a track over the full sweep" },
        { name: "stackId", type: "string", description: "RadialBar: bars sharing one ring" },
        { name: "dot", type: "boolean | { r, fill, fillOpacity, stroke }", default: "false", description: "Radar point markers" },
      ]} />

      <ApiReference title="Rectangle / Dot" props={[
        { name: "x / y / width / height", type: "number", description: "Rectangle: the bar's box, signed from the value end toward the base" },
        { name: "radius", type: "number | [tl, tr, br, bl]", default: "0", description: "Rectangle: corner radius; flips with a negative box so it stays on the value end" },
        { name: "cx / cy / r", type: "number", description: "Dot: centre and radius" },
        { name: "…", type: "SVG attributes", description: "Land on the path or circle" },
      ]} />

      <ApiReference title="PolarGrid / PolarAngleAxis / PolarRadiusAxis / Label / Cell / Sector" props={[
        { name: "gridType", type: '"polygon" | "circle"', default: '"polygon"', description: "Ring shape" },
        { name: "radialLines", type: "boolean", default: "true", description: "Spokes from the centre" },
        { name: "fill / fillOpacity", type: "string / number", description: "PolarGrid: fills each ring; nested rings deepen the tint" },
        { name: "polarRadius / polarAngles", type: "number[]", description: "Explicit ring radii and spoke angles" },
        { name: "dataKey", type: "string", description: "Angle axis: spoke labels (radar); radius axis: ring labels (radial)" },
        { name: "domain / ticks / tickCount", type: "[lo, hi] / number[] / number", default: '[0, "auto"] / — / 5', description: "The value axis: radius for radar, angle for radial" },
        { name: "tick / tickLine / axisLine", type: "boolean", default: "true", description: "Labels, tick marks and the axis line" },
        { name: "tick", type: "(tick) => node | element", description: "PolarAngleAxis: draws each label from { x, y, textAnchor, dominantBaseline, index, payload: { value, coordinate } }" },
        { name: "angle / orientation", type: 'number / "left" | "right" | "middle"', default: '0 / "right"', description: "Radius axis direction and label side" },
        { name: "content", type: "({ viewBox }) => node", description: "Label: viewBox is { cx, cy, innerRadius, outerRadius, startAngle, endAngle }" },
        { name: "value", type: "string", description: "Label: plain text at the centre" },
        { name: "fill", type: "string", description: "Cell: colour of the bar, slice or ring at its index" },
        { name: "cx / cy / innerRadius / outerRadius / startAngle / endAngle", type: "number", description: "Sector: one sector's geometry; other props land on the path" },
      ]} />

      <ApiReference title="ChartTooltip / ChartLegend" props={[
        { name: "content", type: "ReactElement", description: "Cloned with { active, payload, label }; defaults to ChartTooltipContent / ChartLegendContent" },
        { name: "cursor", type: "boolean", default: "true", description: "Band highlight (bars) or vertical line under the pointer; polar charts draw none" },
        { name: "defaultIndex", type: "number", description: "Category shown before any interaction" },
        { name: "trigger", type: '"hover" | "click"', default: '"hover"', description: "Open as the pointer passes, or on a press; a press outside dismisses" },
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
