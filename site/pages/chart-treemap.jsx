import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "../../ui/chart/chart.jsx"
import { TreemapChart } from "../../ui/chart-treemap/chart-treemap.jsx"
import "../../ui/chart/chart.css"
import "../../ui/chart-treemap/chart-treemap.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

/*
 * Sizes are in gigabytes. Media is the largest group, Documents holds a nested
 * Reports group, and Cache is two slivers too small to carry a label.
 */
const disk = {
  name: "Disk",
  children: [
    { name: "Media", children: [{ name: "Video", value: 640 }, { name: "Photos", value: 420 }, { name: "Music", value: 180 }] },
    {
      name: "Documents",
      children: [
        { name: "Reports", children: [{ name: "Q1", value: 60 }, { name: "Q2", value: 80 }, { name: "Q3", value: 95 }] },
        { name: "Contracts", value: 40 },
        { name: "Notes", value: 25 },
      ],
    },
    { name: "Code", children: [{ name: "Repos", value: 300 }, { name: "Build", value: 150 }, { name: "Deps", children: [{ name: "node", value: 220 }, { name: "vendor", value: 90 }] }] },
    { name: "System", value: 260 },
    { name: "Cache", children: [{ name: "tmp", value: 4 }, { name: "logs", value: 3 }] },
  ],
}

const config = { value: { label: "Size (GB)" } }
const gb = (v) => `${v.toLocaleString()} GB`
const shape = { aspectRatio: "16 / 10" }

function Frame({ pg, dir, width = "40rem", children }) {
  return (
    <div data-pg={pg} dir={dir} style={{ width: "100%", maxWidth: width }}>
      {children}
    </div>
  )
}

export default function ChartTreemapPage() {
  return (
    <>
      <h2>Chart Treemap</h2>
      <p>
        Nested groups drawn as tiles whose areas are proportional to their values. A group is a framed region with a
        header, and the items or groups inside it share what is left. It sits inside the Chart shell, so the tooltip, the
        keyboard and <code>syncId</code> work as they do on any chart.
      </p>

      <InstallSnippet slug="chart-treemap" />

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          <code>data</code> is one tree: a node with <code>children</code> is a group, a node with a{" "}
          <code>value</code> is an item, and a group's value is the sum of what is inside it. Each top-level group takes a
          chart colour and passes it to everything inside. A name that does not fit its tile is left out rather than cut
          off, so small tiles are named by the tooltip, which shows the whole path, such as Media › Video. Focus the chart
          and use the arrow keys to walk the tiles in order, group first and then what is inside it.
        </p>
        <ComponentPreview code={`<ChartContainer config={config} style={{ aspectRatio: "16 / 10" }}>
  <TreemapChart data={disk} formatter={gb} accessibilityLayer aria-label="Disk usage by folder">
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend />
  </TreemapChart>
</ChartContainer>`}>
          <Frame pg="treemap-default">
            <ChartContainer config={config} style={shape}>
              <TreemapChart data={disk} formatter={gb} accessibilityLayer aria-label="Disk usage by folder">
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend />
              </TreemapChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Zoom into a group</h3>
        <p>
          With a group focused, <kbd>Enter</kbd> makes it the whole chart, so its contents get the room. The header
          then shows the path from the top, and <kbd>Escape</kbd> climbs back out one level, keeping the group you left
          focused. With a pointer, double-click a group to zoom in and double-click the header of the zoomed group to
          climb out.
        </p>
        <ComponentPreview code={`<TreemapChart data={disk} accessibilityLayer aria-label="Disk usage, zoomable">
  <ChartTooltip content={<ChartTooltipContent />} />
</TreemapChart>`}>
          <Frame pg="treemap-zoom">
            <ChartContainer config={config} style={shape}>
              <TreemapChart data={disk} accessibilityLayer aria-label="Disk usage, zoomable">
                <ChartTooltip content={<ChartTooltipContent />} />
              </TreemapChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Colour by value</h3>
        <p>
          <code>colorBy="value"</code> shades each item on a scale from the <code>low</code> to the <code>high</code>{" "}
          entry of the config, over the items' own range unless <code>domain</code> pins the ends. Groups stay neutral.
          The legend draws the scale.
        </p>
        <ComponentPreview code={`<ChartContainer config={{ ...config, low: { color: "..." }, high: { color: "var(--chart-2)" } }}>
  <TreemapChart data={disk} colorBy="value" domain={[0, 700]} formatter={gb}>
    <ChartTooltip content={<ChartTooltipContent />} />
    <ChartLegend />
  </TreemapChart>
</ChartContainer>`}>
          <Frame pg="treemap-value">
            <ChartContainer
              config={{ ...config, low: { color: "color-mix(in oklab, var(--chart-2) 12%, var(--background))" }, high: { color: "var(--chart-2)" } }}
              style={shape}
            >
              <TreemapChart data={disk} colorBy="value" domain={[0, 700]} formatter={gb}>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend />
              </TreemapChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Small tiles</h3>
        <p>
          In a small chart most names do not fit and are left out, while the tiles keep their proportions. Spacing and
          the group header are set by <code>padding</code> and <code>headerHeight</code>; a header height of 0 draws no
          header.
        </p>
        <ComponentPreview code={`<TreemapChart data={disk} padding={1} headerHeight={0} />`}>
          <Frame pg="treemap-small" width="14rem">
            <ChartContainer config={config} style={{ aspectRatio: "1 / 1" }}>
              <TreemapChart data={disk} padding={1} headerHeight={0} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Right to left</h3>
        <p>The tiles keep their layout, and the arrow keys follow the screen: right steps forward.</p>
        <ComponentPreview code={`<div dir="rtl"><TreemapChart data={disk} accessibilityLayer aria-label="..." /></div>`}>
          <Frame pg="treemap-rtl" dir="rtl">
            <ChartContainer config={config} style={shape}>
              <TreemapChart data={disk} accessibilityLayer aria-label="Disk usage by folder, right to left">
                <ChartTooltip content={<ChartTooltipContent />} />
              </TreemapChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Nothing to draw</h3>
        <p>Items with no positive number are dropped, and a group left with none goes with them. A tree with nothing left draws an empty chart.</p>
        <ComponentPreview code={`<TreemapChart data={{ name: "Empty", children: [{ name: "none", value: 0 }] }} />`}>
          <Frame pg="treemap-empty" width="22rem">
            <ChartContainer config={config} style={{ aspectRatio: "2 / 1" }}>
              <TreemapChart data={{ name: "Empty", children: [{ name: "none", value: 0 }, { name: "junk", value: Number.NaN }] }} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <ApiReference title="TreemapChart" props={[
        { name: "data", type: "{ name, value?, children? }", description: "One tree. A node with children is a group whose value is the sum of its items; a node with a positive value is an item" },
        { name: "colorBy", type: '"group" | "value"', default: '"group"', description: "Each top-level group takes a chart colour (five, then repeating), or items are shaded by value" },
        { name: "domain", type: "[lo, hi]", description: "Pins the ends of the value scale; an end left null takes the items' own. Applies to colorBy=\"value\"" },
        { name: "padding / headerHeight", type: "number", default: "2 / 20", description: "Space inside a group's frame, and the band for its name, px. A header height of 0 draws none" },
        { name: "formatter", type: "(value) => string", description: "Shapes the values on tiles, in the summary and on the legend scale" },
        { name: "margin", type: "{ top, right, bottom, left }", default: "2 each", description: "Space around the tiles, px" },
        { name: "syncId", type: "string", description: "Charts sharing an id share the active tile, by index" },
        { name: "accessibilityLayer", type: "boolean", default: "false", description: "Focusable, with a generated summary read once. Arrows walk the tiles in order, Home and End jump, Enter zooms into a group, Escape climbs out and then dismisses" },
        { name: "config", type: "ChartContainer prop", description: "The value entry's label names the tooltip row; low and high set the scale of colorBy=\"value\"" },
      ]} />
      <ApiReference title="Legend" props={[
        { name: "ChartLegend / TreemapLegend", type: "element", description: "Names the top-level groups with their colours, or draws the value scale with its end labels" },
      ]} />
      <ApiReference title="Tooltip" props={[
        { name: "ChartTooltip", type: "element", description: "Over a tile, titled with its path (Group › Item) and listing its value; over a group, the sum of what it holds" },
      ]} />
    </>
  )
}
