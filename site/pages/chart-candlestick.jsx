import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "../../ui/chart/chart.jsx"
import { CandlestickChart, CandlestickVolume } from "../../ui/chart-candlestick/chart-candlestick.jsx"
import "../../ui/chart/chart.css"
import "../../ui/chart-candlestick/chart-candlestick.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

/*
 * Eight sessions. Day 0 rises 100 to 110, day 1 falls 110 to 104, day 4 opens
 * and closes at 108 (no body), and day 5 has no usable prices.
 */
const sessions = [
  { date: "Mon 1", open: 100, high: 112, low: 98, close: 110, volume: 1200 },
  { date: "Tue 2", open: 110, high: 115, low: 102, close: 104, volume: 2400 },
  { date: "Wed 3", open: 104, high: 109, low: 101, close: 108, volume: 900 },
  { date: "Thu 4", open: 108, high: 118, low: 106, close: 117, volume: 3100 },
  { date: "Fri 5", open: 108, high: 111, low: 105, close: 108, volume: 700 },
  { date: "Mon 8", open: null, high: null, low: null, close: null, volume: 0 },
  { date: "Tue 9", open: 116, high: 120, low: 110, close: 112, volume: 1800 },
  { date: "Wed 10", open: 112, high: 114, low: 107, close: 109, volume: 1500 },
]

// The same rows under other field names, and the same rows with nothing traded.
const renamed = sessions.map((s) => ({ day: s.date, o: s.open, h: s.high, l: s.low, c: s.close, vol: s.volume }))
const untraded = sessions.map((s) => ({ ...s, volume: 0 }))
const longer = [
  ...sessions,
  { date: "Thu 11", open: 109, high: 113, low: 104, close: 111, volume: 1300 },
  { date: "Fri 12", open: 111, high: 116, low: 110, close: 115, volume: 1600 },
  { date: "Mon 15", open: 115, high: 117, low: 108, close: 109, volume: 2100 },
  { date: "Tue 16", open: 109, high: 112, low: 103, close: 105, volume: 1900 },
]

const config = {
  up: { label: "Rising", color: "var(--chart-2)" },
  down: { label: "Falling", color: "var(--chart-1)" },
}

function Frame({ pg, dir, children }) {
  return (
    <div data-pg={pg} dir={dir} style={{ width: "100%", maxWidth: "40rem" }}>
      {children}
    </div>
  )
}

export default function ChartCandlestickPage() {
  return (
    <>
      <h2>Chart Candlestick</h2>
      <p>
        Price movement over time, one mark per row of open, high, low and close. A candle draws a body between the open and
        the close with a thin line through it from the low to the high; an OHLC mark draws only the line, with a tick to
        the left at the open and to the right at the close. A second pane can show volume beneath. Both sit inside the
        Chart shell, so the tooltip, the keyboard and <code>syncId</code> work as they do on any chart.
      </p>

      <InstallSnippet slug="chart-candlestick" />

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          A rising row (the close above the open) is drawn with a light body in the <code>up</code> colour and a falling
          one with a solid body in the <code>down</code> colour, so the two differ in more than hue. A row whose open
          equals its close has a flat body in the text colour. A row missing any of the four prices keeps its slot but
          draws nothing. Focus the chart and use the arrow keys to step between rows.
        </p>
        <ComponentPreview code={`<ChartContainer config={config}>
  <CandlestickChart data={sessions} accessibilityLayer aria-label="Price by session">
    <ChartTooltip content={<ChartTooltipContent />} />
  </CandlestickChart>
</ChartContainer>`}>
          <Frame pg="candlestick-default">
            <ChartContainer config={config}>
              <CandlestickChart data={sessions} accessibilityLayer aria-label="Price by session">
                <ChartTooltip content={<ChartTooltipContent />} />
              </CandlestickChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>OHLC ticks</h3>
        <p>
          <code>variant="ohlc"</code> swaps the body for ticks. <code>domain</code> pins the price axis.
        </p>
        <ComponentPreview code={`<CandlestickChart data={sessions} variant="ohlc" domain={[90, 130]} />`}>
          <Frame pg="candlestick-ohlc">
            <ChartContainer config={config}>
              <CandlestickChart data={sessions} variant="ohlc" domain={[90, 130]} accessibilityLayer aria-label="Price by session, ticks">
                <ChartTooltip content={<ChartTooltipContent />} />
              </CandlestickChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With a volume pane</h3>
        <p>
          <code>CandlestickVolume</code> is a second chart of bars from the same rows, each in the colour of its row's
          direction; its legend lists the same up and down entries as the price pane. Give both the same{" "}
          <code>syncId</code>, <code>margin</code>, <code>valueAxisSize</code> and <code>categoryGap</code>: the active
          row is shared, so hovering a candle lights its volume bar and the other way round, and the columns line up.{" "}
          <code>categoryAxisSize={"{0}"}</code> on the price pane leaves the row labels to the volume pane beneath it.
        </p>
        <ComponentPreview code={`<ChartContainer config={config}>
  <CandlestickChart data={sessions} syncId="price" categoryAxisSize={0} />
</ChartContainer>
<ChartContainer config={config} style={{ aspectRatio: "16 / 4" }}>
  <CandlestickVolume data={sessions} syncId="price" />
</ChartContainer>`}>
          <Frame pg="candlestick-linked">
            <ChartContainer config={config}>
              <CandlestickChart data={sessions} syncId="price" categoryAxisSize={0} accessibilityLayer aria-label="Price by session">
                <ChartTooltip content={<ChartTooltipContent />} />
              </CandlestickChart>
            </ChartContainer>
            <ChartContainer config={config} style={{ aspectRatio: "16 / 4" }}>
              <CandlestickVolume data={sessions} syncId="price" accessibilityLayer aria-label="Volume by session">
                <ChartTooltip content={<ChartTooltipContent />} />
              </CandlestickVolume>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>No volume</h3>
        <p>
          When every volume is zero, or there are no rows, the volume axis runs from 0 to 1 and the baseline stays at the
          bottom of the pane.
        </p>
        <ComponentPreview code={`<CandlestickVolume data={sessions.map((s) => ({ ...s, volume: 0 }))} />
<CandlestickVolume data={[]} />`}>
          <Frame pg="candlestick-zero-volume">
            <ChartContainer config={config} style={{ aspectRatio: "16 / 4" }}>
              <CandlestickVolume data={untraded} accessibilityLayer aria-label="Volume by session, none traded" />
            </ChartContainer>
          </Frame>
          <Frame pg="candlestick-empty-volume">
            <ChartContainer config={config} style={{ aspectRatio: "16 / 4" }}>
              <CandlestickVolume data={[]} aria-label="Volume, no rows" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Legend and colour</h3>
        <p>
          <code>ChartLegend</code> lists the <code>up</code> and <code>down</code> entries of the config under their labels,
          and those entries' <code>color</code> paint the marks, in the volume pane too.
        </p>
        <ComponentPreview code={`<ChartContainer config={{ up: { label: "Gain", color: "rgb(20, 120, 60)" }, down: { label: "Loss", color: "rgb(200, 30, 30)" } }}>
  <CandlestickChart data={sessions}>
    <ChartLegend />
  </CandlestickChart>
  <CandlestickVolume data={sessions}>
    <ChartLegend />
  </CandlestickVolume>
</ChartContainer>`}>
          <Frame pg="candlestick-legend">
            <ChartContainer config={{ up: { label: "Gain", color: "rgb(20, 120, 60)" }, down: { label: "Loss", color: "rgb(200, 30, 30)" } }}>
              <CandlestickChart data={sessions}>
                <ChartLegend />
              </CandlestickChart>
            </ChartContainer>
            <ChartContainer config={{ up: { label: "Gain", color: "rgb(20, 120, 60)" }, down: { label: "Loss", color: "rgb(200, 30, 30)" } }} style={{ aspectRatio: "16 / 4" }}>
              <CandlestickVolume data={sessions}>
                <ChartLegend />
              </CandlestickVolume>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Default colours</h3>
        <p>
          Without <code>up</code> and <code>down</code> entries in the config, rising rows take the chart's second palette
          colour and falling rows its first.
        </p>
        <ComponentPreview code={`<ChartContainer config={{}}>
  <CandlestickChart data={sessions} />
</ChartContainer>`}>
          <Frame pg="candlestick-fallback">
            <ChartContainer config={{}}>
              <CandlestickChart data={sessions} aria-label="Price by session, default colours" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Field names</h3>
        <p>
          Rows that name their fields differently are read with <code>openKey</code>, <code>highKey</code>,{" "}
          <code>lowKey</code>, <code>closeKey</code> and <code>categoryKey</code>; the volume pane takes{" "}
          <code>volumeKey</code> besides. The drawing matches the one from rows with the default names.
        </p>
        <ComponentPreview code={`<CandlestickChart data={rows} openKey="o" highKey="h" lowKey="l" closeKey="c" categoryKey="day" syncId="fields" categoryAxisSize={0} />
<CandlestickVolume data={rows} volumeKey="vol" openKey="o" closeKey="c" categoryKey="day" syncId="fields" />`}>
          <Frame pg="candlestick-fields">
            <ChartContainer config={config}>
              <CandlestickChart data={renamed} openKey="o" highKey="h" lowKey="l" closeKey="c" categoryKey="day" syncId="fields" categoryAxisSize={0} aria-label="Price by session, renamed fields" />
            </ChartContainer>
            <ChartContainer config={config} style={{ aspectRatio: "16 / 4" }}>
              <CandlestickVolume data={renamed} volumeKey="vol" openKey="o" closeKey="c" categoryKey="day" syncId="fields" aria-label="Volume by session, renamed fields" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Linked charts of different lengths</h3>
        <p>
          The active row is shared by position. A chart with fewer rows treats a position it has no row for as none:
          the next arrow forward lands on its first row, back on its last.
        </p>
        <ComponentPreview code={`<CandlestickChart data={twelveSessions} syncId="span" />
<CandlestickChart data={eightSessions} syncId="span" />`}>
          <Frame pg="candlestick-sync-long">
            <ChartContainer config={config}>
              <CandlestickChart data={longer} syncId="span" accessibilityLayer aria-label="Price, twelve sessions" />
            </ChartContainer>
          </Frame>
          <Frame pg="candlestick-sync-short">
            <ChartContainer config={config}>
              <CandlestickChart data={sessions} syncId="span" accessibilityLayer aria-label="Price, eight sessions" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Right to left</h3>
        <p>The rows keep their order in a right-to-left layout, the first on the left, so the arrow keys follow the screen.</p>
        <ComponentPreview code={`<div dir="rtl">
  <CandlestickChart data={sessions} accessibilityLayer />
</div>`}>
          <Frame pg="candlestick-rtl" dir="rtl">
            <ChartContainer config={config}>
              <CandlestickChart data={sessions} accessibilityLayer aria-label="Price by session, right to left">
                <ChartTooltip content={<ChartTooltipContent />} />
              </CandlestickChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <ApiReference title="CandlestickChart" props={[
        { name: "data", type: "object[]", description: "One row per mark, in order; a row missing any of the four prices draws nothing" },
        { name: "variant", type: '"candle" | "ohlc"', default: '"candle"', description: "A body between open and close, or open and close ticks" },
        { name: "openKey / highKey / lowKey / closeKey", type: "string", default: '"open" / "high" / "low" / "close"', description: "Fields holding the four prices" },
        { name: "categoryKey", type: "string", default: '"date"', description: "Field holding the row's label; one slot per row, in data order" },
        { name: "domain / tickCount", type: "[lo, hi] / number", default: '["auto", "auto"] / 5', description: "The price axis; each end is a number or \"auto\"" },
        { name: "categoryGap", type: "number", default: "0.3", description: "Gap between marks as a fraction of a row's slot" },
        { name: "valueAxisSize / categoryAxisSize", type: "number", default: "56 / 24", description: "Room for the price labels and the row labels, px; 0 leaves that axis's labels out" },
        { name: "margin", type: "{ top, right, bottom, left }", default: "5 each", description: "Space around the plot, px" },
        { name: "syncId", type: "string", description: "Charts sharing an id share the active row, by index" },
        { name: "accessibilityLayer", type: "boolean", default: "false", description: "Focusable; left and right step between rows, Home and End jump, Escape dismisses" },
        { name: "config", type: "ChartContainer prop", description: "The up and down entries' color set the rising and falling colours" },
      ]} />
      <ApiReference title="CandlestickVolume" props={[
        { name: "data", type: "object[]", description: "The same rows; bars are the volumeKey field, coloured by whether close is above open" },
        { name: "volumeKey / openKey / closeKey / categoryKey", type: "string", default: '"volume" / "open" / "close" / "date"', description: "Fields to read" },
        { name: "tickCount", type: "number", default: "3", description: "Volume ticks to aim for; the axis starts at zero" },
        { name: "syncId, margin, valueAxisSize, categoryGap", type: "as CandlestickChart", description: "Match the price pane's values so the columns line up" },
        { name: "categoryAxisSize, accessibilityLayer", type: "as CandlestickChart", description: "This pane's own; categoryAxisSize={0} on the price pane leaves the row labels to this one" },
      ]} />
      <ApiReference title="Tooltip" props={[
        { name: "ChartTooltip", type: "element", description: "Over a row it lists the open, high, low and close; in the volume pane, the volume" },
      ]} />
    </>
  )
}
