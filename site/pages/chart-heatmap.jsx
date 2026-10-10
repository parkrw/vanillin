import { useState } from "react"
import { Button } from "../../ui/button/button.jsx"
import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "../../ui/chart/chart.jsx"
import { HeatmapChart, CalendarHeatmap, HeatmapLegend } from "../../ui/chart-heatmap/chart-heatmap.jsx"
import "../../ui/chart/chart.css"
import "../../ui/chart-heatmap/chart-heatmap.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

// ── Sample data ──────────────────────────────────────────────────────

const days = ["Mon", "Tue", "Wed", "Thu", "Fri"]
const hours = ["09", "10", "11", "12", "13", "14", "15", "16"]

/* Value is row * 8 + column, so the lowest cell is top left and the highest bottom right; Wednesday at 12 has no reading. */
const trafficData = days.flatMap((day, row) =>
  hours.flatMap((hour, col) => (row === 2 && col === 3 ? [] : [{ hour, day, visits: row * 8 + col }])),
)

const trafficConfig = {
  visits: { label: "Visits" },
  low: { color: "color-mix(in oklab, var(--chart-1) 12%, var(--background))" },
  high: { color: "var(--chart-1)" },
}

/* 2024 is a leap year that starts on a Monday. Every ninth day has no reading. */
const commits2024 = Array.from({ length: 366 }, (_, i) => ({
  date: new Date(Date.UTC(2024, 0, 1 + i)).toISOString().slice(0, 10),
  count: (i * 37) % 10,
})).filter((_, i) => i % 9 !== 0)

const commitConfig = {
  count: { label: "Commits" },
  low: { color: "color-mix(in oklab, var(--chart-2) 12%, var(--background))" },
  high: { color: "var(--chart-2)" },
}

function Frame({ pg, wide = false, dir, children }) {
  return (
    <div data-pg={pg} dir={dir} style={{ width: "100%", maxWidth: wide ? "56rem" : "40rem" }}>
      {children}
    </div>
  )
}

/* The same readings with the columns reversed, a row left out of the order, and a datum for a row the order does not name. */
const hoursReversed = [...hours].reverse()
const daysOrdered = ["Fri", "Wed", "Mon"]
const orderData = [...trafficData, { hour: "09", day: "Sat", visits: 99 }]

/* Dates as Date objects, in UTC: 5 March 2024 is a 7, 6 March a 2. The two impossible strings are dropped, not rolled onto 5 and 1 March. */
const commitDates = [
  { date: "2024-02-34", count: 99 },
  { date: "2024-02-30", count: 98 },
  { date: new Date(Date.UTC(2024, 2, 5)), count: 7 },
  { date: new Date(Date.UTC(2024, 2, 6)), count: 2 },
]

const calendarShape = { aspectRatio: "4.5 / 1" }

/* The same readings mirrored, so the top-left cell goes from lowest to highest. */
const mirroredTraffic = trafficData.map((d) => ({ ...d, visits: 39 - d.visits }))

/* Every reading equal: the scale has no range. */
const flatTraffic = trafficData.map((d) => ({ ...d, visits: 5 }))

function LiveHeatmap() {
  const [mirrored, setMirrored] = useState(false)
  return (
    <Frame pg="heatmap-live">
      <Button size="sm" variant="outline" onClick={() => setMirrored((m) => !m)}>
        {mirrored ? "Original readings" : "Mirror readings"}
      </Button>
      <ChartContainer config={trafficConfig}>
        <HeatmapChart data={mirrored ? mirroredTraffic : trafficData} xKey="hour" yKey="day" valueKey="visits" domain={[0, null]}>
          <HeatmapLegend />
        </HeatmapChart>
      </ChartContainer>
    </Frame>
  )
}

export default function ChartHeatmapPage() {
  return (
    <>
      <h2>Chart Heatmap</h2>
      <p>
        A grid of cells shaded on a stepped colour scale. <code>HeatmapChart</code> lays out one cell per pair of
        categories; <code>CalendarHeatmap</code> lays out a year of days as week columns by weekday rows. Both sit
        inside the Chart shell, so the tooltip, the keyboard and <code>syncId</code> work as they do on any chart.
      </p>

      <InstallSnippet slug="chart-heatmap" />

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          Each datum names its column, its row and a value. The scale runs from the lowest value to the highest in
          five steps between the <code>low</code> and <code>high</code> entries of the config. A pair with no datum
          is drawn as an outline. Focus the chart and use the arrow keys to move between cells.
        </p>
        <ComponentPreview code={`<ChartContainer config={trafficConfig}>
  <HeatmapChart data={trafficData} xKey="hour" yKey="day" valueKey="visits" accessibilityLayer aria-label="Visits by day and hour">
    <ChartTooltip content={<ChartTooltipContent />} />
    <HeatmapLegend />
  </HeatmapChart>
</ChartContainer>`}>
          <Frame pg="heatmap-default">
            <ChartContainer config={trafficConfig}>
              <HeatmapChart data={trafficData} xKey="hour" yKey="day" valueKey="visits" accessibilityLayer aria-label="Visits by day and hour">
                <ChartTooltip content={<ChartTooltipContent />} />
                <HeatmapLegend />
              </HeatmapChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Fixed domain and steps</h3>
        <p>
          <code>domain</code> pins the ends of the scale, so two charts shade alike; a value past an end takes the end
          colour. <code>steps</code> sets how many shades there are, and the legend follows.
        </p>
        <ComponentPreview code={`<HeatmapChart data={trafficData} xKey="hour" yKey="day" valueKey="visits" domain={[0, 80]} steps={8} cellGap={0.2}>
  <ChartTooltip content={<ChartTooltipContent />} />
  <HeatmapLegend verticalAlign="top" />
</HeatmapChart>`}>
          <Frame pg="heatmap-domain">
            <ChartContainer config={trafficConfig}>
              <HeatmapChart data={trafficData} xKey="hour" yKey="day" valueKey="visits" domain={[0, 80]} steps={8} cellGap={0.2}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <HeatmapLegend verticalAlign="top" />
              </HeatmapChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Calendar</h3>
        <p>
          One cell per day of <code>year</code>, a column per week and a row per weekday, with the month named above
          the week that holds its first day. Days with no datum are outlines.
        </p>
        <ComponentPreview code={`<ChartContainer config={commitConfig} style={{ aspectRatio: "4.5 / 1" }}>
  <CalendarHeatmap data={commits} year={2024} dateKey="date" valueKey="count" locale="en-US" accessibilityLayer aria-label="Commits in 2024">
    <ChartTooltip content={<ChartTooltipContent />} />
    <HeatmapLegend />
  </CalendarHeatmap>
</ChartContainer>`}>
          <Frame pg="heatmap-calendar" wide>
            <ChartContainer config={commitConfig} style={calendarShape}>
              <CalendarHeatmap data={commits2024} year={2024} dateKey="date" valueKey="count" locale="en-US" accessibilityLayer aria-label="Commits in 2024">
                <ChartTooltip content={<ChartTooltipContent />} />
                <HeatmapLegend />
              </CalendarHeatmap>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Week starts on Monday</h3>
        <p>
          <code>weekStart</code> picks the top row: 0 for Sunday, 1 for Monday. 2024 begins on a Monday, so with a Monday
          start its first day sits in the top row of the first column. A plain <code>ChartLegend</code> draws the same
          scale as <code>HeatmapLegend</code>.
        </p>
        <ComponentPreview code={`<CalendarHeatmap data={commits} year={2024} weekStart={1} dateKey="date" valueKey="count" locale="en-US">
  <ChartLegend />
</CalendarHeatmap>`}>
          <Frame pg="heatmap-calendar-monday" wide>
            <ChartContainer config={commitConfig} style={calendarShape}>
              <CalendarHeatmap data={commits2024} year={2024} weekStart={1} dateKey="date" valueKey="count" locale="en-US" accessibilityLayer aria-label="Commits in 2024, weeks from Monday">
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend />
              </CalendarHeatmap>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Order, formatting and bare axes</h3>
        <p>
          <code>xDomain</code> and <code>yDomain</code> set the order of columns and rows and drop any datum they do not
          name. The legend takes a <code>formatter</code> for its end labels, and the tooltip takes the usual one. An axis
          size of 0 leaves that axis's labels out.
        </p>
        <ComponentPreview code={`<HeatmapChart data={trafficData} xKey="hour" yKey="day" valueKey="visits" xDomain={hoursReversed} yDomain={["Fri", "Wed", "Mon"]}>
  <ChartTooltip content={<ChartTooltipContent formatter={(value) => \`\${value} visits\`} />} />
  <HeatmapLegend formatter={(v) => \`\${v} visits\`} />
</HeatmapChart>`}>
          <Frame pg="heatmap-order">
            <ChartContainer config={trafficConfig}>
              <HeatmapChart data={orderData} xKey="hour" yKey="day" valueKey="visits" xDomain={hoursReversed} yDomain={daysOrdered}>
                <ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value} visits`} />} />
                <HeatmapLegend formatter={(v) => `${v} visits`} />
              </HeatmapChart>
            </ChartContainer>
          </Frame>
          <Frame pg="heatmap-bare">
            <ChartContainer config={trafficConfig}>
              <HeatmapChart data={trafficData} xKey="hour" yKey="day" valueKey="visits" yAxisWidth={0} xAxisHeight={0} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>A scale with no range</h3>
        <p>
          When every reading is the same, or a pinned <code>domain</code> end lies past all of the data, the scale has
          no range. Every cell then takes the low shade, so a quiet stretch reads as quiet rather than as a peak.
        </p>
        <ComponentPreview code={`<HeatmapChart data={allFives} … />
<HeatmapChart data={trafficData} domain={[50, null]} … />`}>
          <Frame pg="heatmap-flat">
            <ChartContainer config={trafficConfig}>
              <HeatmapChart data={flatTraffic} xKey="hour" yKey="day" valueKey="visits">
                <HeatmapLegend />
              </HeatmapChart>
            </ChartContainer>
          </Frame>
          <Frame pg="heatmap-floor">
            <ChartContainer config={trafficConfig}>
              <HeatmapChart data={trafficData} xKey="hour" yKey="day" valueKey="visits" domain={[50, null]}>
                <HeatmapLegend />
              </HeatmapChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Right to left</h3>
        <p>
          The grid keeps its order in a right-to-left layout, the first column on the left, so the arrow keys follow
          the screen: ArrowRight moves one cell to the right.
        </p>
        <ComponentPreview code={`<div dir="rtl">
  <HeatmapChart … accessibilityLayer />
</div>`}>
          <Frame pg="heatmap-rtl" dir="rtl">
            <ChartContainer config={trafficConfig}>
              <HeatmapChart data={trafficData} xKey="hour" yKey="day" valueKey="visits" accessibilityLayer aria-label="Visits by day and hour, right to left" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Linked charts and loose props</h3>
        <p>
          Charts sharing a <code>syncId</code> share the active cell by position, even when the grids differ in size.
          <code>year</code> and <code>weekStart</code> also take numeric strings, and a datum's date may be a{" "}
          <code>Date</code>, read in UTC. New <code>data</code> redraws the grid, and a <code>domain</code> end left
          unset or <code>null</code> comes from the data.
        </p>
        <ComponentPreview code={`<HeatmapChart syncId="heat" … />
<CalendarHeatmap syncId="heat" year="2024" weekStart="1" data={[{ date: new Date(Date.UTC(2024, 2, 5)), count: 7 }]} … />`}>
          <Frame pg="heatmap-sync-grid">
            <ChartContainer config={trafficConfig}>
              <HeatmapChart data={trafficData} xKey="hour" yKey="day" valueKey="visits" syncId="heat" accessibilityLayer aria-label="Visits by day and hour, linked">
                <ChartTooltip content={<ChartTooltipContent />} />
              </HeatmapChart>
            </ChartContainer>
          </Frame>
          <Frame pg="heatmap-sync-calendar" wide>
            <ChartContainer config={commitConfig} style={calendarShape}>
              <CalendarHeatmap data={commits2024} year="2024" weekStart="1" dateKey="date" valueKey="count" locale="en-US" syncId="heat">
                <ChartTooltip content={<ChartTooltipContent />} />
              </CalendarHeatmap>
            </ChartContainer>
          </Frame>
          <LiveHeatmap />
          <Frame pg="heatmap-dates" wide>
            <ChartContainer config={commitConfig} style={calendarShape}>
              <CalendarHeatmap data={commitDates} year="2024" weekStart="1" dateKey="date" valueKey="count" locale="en-US">
                <ChartTooltip content={<ChartTooltipContent />} />
              </CalendarHeatmap>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <ApiReference title="HeatmapChart" props={[
        { name: "data", type: "object[]", description: "One datum per cell: a column, a row and a value. A pair with no datum is an outline" },
        { name: "xKey / yKey / valueKey", type: "string", default: '"x" / "y" / "value"', description: "Fields holding the column, the row and the number" },
        { name: "xDomain / yDomain", type: "any[]", description: "Column and row order; defaults to the order each first appears in data" },
        { name: "domain", type: "[lo, hi]", description: "The ends of the colour scale; an end left unset or null is the lowest or highest value" },
        { name: "steps", type: "number", default: "5", description: "Shades between the two ends, at least 2" },
        { name: "cellGap", type: "number", default: "0.1", description: "Gap between cells as a fraction of a cell's pitch" },
        { name: "yAxisWidth / xAxisHeight", type: "number", default: "48 / 24", description: "Room for the row and column labels, px; 0 leaves that axis's labels out" },
        { name: "margin", type: "{ top, right, bottom, left }", default: "5 each", description: "Space around the grid, px" },
        { name: "syncId", type: "string", description: "Charts sharing an id share the active cell, by index" },
        { name: "accessibilityLayer", type: "boolean", default: "false", description: "Focusable; arrows move one cell up, down, left or right, Home and End jump to the first and last, Escape dismisses" },
        { name: "config", type: "ChartContainer prop", description: "low and high set the ends of the scale (colour or light and dark theme); the valueKey entry's label names the value in the tooltip" },
      ]} />

      <ApiReference title="CalendarHeatmap" props={[
        { name: "data", type: "object[]", description: "One datum per day; a day with none is an outline" },
        { name: "year", type: "number", default: "current year", description: "The year drawn, one cell per day" },
        { name: "dateKey / valueKey", type: "string", default: '"date" / "value"', description: 'Fields holding the day ("YYYY-MM-DD", or a Date read in UTC) and the number' },
        { name: "weekStart", type: "0 | 1 | …", default: "0", description: "Weekday of the top row, 0 for Sunday" },
        { name: "locale", type: "string", description: "Month, weekday and tooltip date names; defaults to the browser's" },
        { name: "domain / steps / cellGap", type: "as HeatmapChart", default: "— / 5 / 0.15", description: "Scale ends, shades and gap. Cells are square, sized to the narrower of the width and the height" },
        { name: "yAxisWidth / xAxisHeight / margin / syncId / accessibilityLayer", type: "as HeatmapChart", default: "36 / 20", description: "Weekday label room, month label room and the rest. Up and down move a day, left and right a week" },
      ]} />

      <ApiReference title="HeatmapLegend" props={[
        { name: "formatter", type: "(value) => node", description: "Text for the two ends of the scale" },
        { name: "verticalAlign", type: '"top" | "bottom"', default: '"bottom"', description: "Placement; one swatch per step between the end labels" },
      ]} />
    </>
  )
}
