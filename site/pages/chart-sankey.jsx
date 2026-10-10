import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "../../ui/chart/chart.jsx"
import { SankeyChart } from "../../ui/chart-sankey/chart-sankey.jsx"
import "../../ui/chart/chart.css"
import "../../ui/chart-sankey/chart-sankey.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

/*
 * Three income sources (60, 20, 5) feed one budget of 85, which splits into
 * housing 35, food 15, savings 25 and other 10. Every node balances.
 */
const nodes = [
  { id: "salary", name: "Salary" },
  { id: "freelance", name: "Freelance" },
  { id: "interest", name: "Interest" },
  { id: "budget", name: "Budget" },
  { id: "housing", name: "Housing" },
  { id: "food", name: "Food" },
  { id: "savings", name: "Savings" },
  { id: "other", name: "Other" },
]

const links = [
  { source: "salary", target: "budget", value: 60 },
  { source: "freelance", target: "budget", value: 20 },
  { source: "interest", target: "budget", value: 5 },
  { source: "budget", target: "housing", value: 35 },
  { source: "budget", target: "food", value: 15 },
  { source: "budget", target: "savings", value: 25 },
  { source: "budget", target: "other", value: 10 },
]

/* Interest feeds savings directly, skipping the budget: savings has no outflow and one source in column 0. */
const shortcutLinks = [
  { source: "salary", target: "budget", value: 60 },
  { source: "freelance", target: "budget", value: 20 },
  { source: "interest", target: "savings", value: 5 },
  { source: "budget", target: "housing", value: 40 },
  { source: "budget", target: "food", value: 20 },
  { source: "budget", target: "other", value: 20 },
]

const loop = [
  { source: "budget", target: "food", value: 5 },
  { source: "food", target: "budget", value: 5 },
]

const config = {
  salary: { label: "Salary", color: "var(--chart-1)" },
  freelance: { label: "Freelance" },
  interest: { label: "Interest" },
  budget: { label: "Budget" },
  housing: { label: "Housing", theme: { light: "oklch(0.45 0.15 30)", dark: "oklch(0.75 0.15 30)" } },
  food: { label: "Food" },
  savings: { label: "Savings" },
  other: { label: "Other" },
}

function Frame({ pg, dir, children }) {
  return (
    <div data-pg={pg} dir={dir} style={{ width: "100%", maxWidth: "40rem", height: "16rem" }}>
      {children}
    </div>
  )
}

export default function ChartSankeyPage() {
  return (
    <>
      <h2>Chart Sankey</h2>
      <p>
        Flows between stages, drawn as nodes joined by bands whose thickness is the amount carried. Give it the nodes and
        the links between them and it places the columns, stacks the nodes and routes each band. It sits inside the Chart
        shell, so the tooltip, the keyboard and <code>syncId</code> work as they do on any chart.
      </p>

      <InstallSnippet slug="chart-sankey" />

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          Each link names a <code>source</code> and a <code>target</code> by node <code>id</code>, and a{" "}
          <code>value</code>. A node is as tall as the larger of what flows in and what flows out, and one scale covers the
          whole diagram, so a band keeps its width from end to end. Hover a node to bring its flows forward and fade the
          rest; hover a band to see just that flow. The tooltip lists the amounts. Focus the chart and use the arrow keys:
          up and down move between nodes in a column, or between the bands leaving the same node; right follows a flow
          downstream and left follows it back.
        </p>
        <ComponentPreview code={`<ChartContainer config={config}>
  <SankeyChart nodes={nodes} links={links} accessibilityLayer aria-label="Where income goes">
    <ChartTooltip content={<ChartTooltipContent />} />
  </SankeyChart>
</ChartContainer>`}>
          <Frame pg="sankey-default">
            <ChartContainer config={{}} style={{ height: "100%" }}>
              <SankeyChart nodes={nodes} links={links} accessibilityLayer aria-label="Where income goes">
                <ChartTooltip content={<ChartTooltipContent />} />
              </SankeyChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Link colour</h3>
        <p>
          <code>linkColor</code> colours each band like the node it leaves (<code>"source"</code>, the default), the node
          it enters (<code>"target"</code>), or fades from one to the other (<code>"gradient"</code>).
        </p>
        <ComponentPreview code={`<SankeyChart nodes={nodes} links={links} linkColor="target" />
<SankeyChart nodes={nodes} links={links} linkColor="gradient" />`}>
          <Frame pg="sankey-target">
            <ChartContainer config={{}} style={{ height: "100%" }}>
              <SankeyChart nodes={nodes} links={links} linkColor="target" />
            </ChartContainer>
          </Frame>
          <Frame pg="sankey-gradient">
            <ChartContainer config={{}} style={{ height: "100%" }}>
              <SankeyChart nodes={nodes} links={links} linkColor="gradient" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Colours and legend</h3>
        <p>
          Nodes take the chart colours in the order given. A config entry named by a node's <code>id</code> sets its
          colour and its label (Housing here follows the theme), and <code>ChartLegend</code> lists the nodes under those
          labels, so give each node an entry to have it named there.
        </p>
        <ComponentPreview code={`<ChartContainer config={{ salary: { label: "Salary", color: "var(--chart-1)" }, housing: { label: "Housing", theme: { light: "…", dark: "…" } }, … }}>
  <SankeyChart nodes={nodes} links={links}>
    <ChartLegend />
  </SankeyChart>
</ChartContainer>`}>
          <Frame pg="sankey-colors">
            <ChartContainer config={config} style={{ height: "100%" }}>
              <SankeyChart nodes={nodes} links={links}>
                <ChartLegend />
              </SankeyChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Alignment</h3>
        <p>
          Nodes with no outflow sit in the last column by default, so every outcome lines up. <code>align="left"</code>{" "}
          leaves each one a column past its deepest source: here Savings is fed by Interest alone, so it sits one column in
          instead of with the other outcomes.
        </p>
        <ComponentPreview code={`<SankeyChart nodes={nodes} links={shortcutLinks} align="left" />`}>
          <Frame pg="sankey-left">
            <ChartContainer config={{}} style={{ height: "100%" }}>
              <SankeyChart nodes={nodes} links={shortcutLinks} align="left" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Right to left</h3>
        <p>
          The diagram keeps its direction, sources on the left, so the arrow keys follow the screen: ArrowRight moves
          downstream.
        </p>
        <ComponentPreview code={`<div dir="rtl">
  <SankeyChart nodes={nodes} links={links} accessibilityLayer />
</div>`}>
          <Frame pg="sankey-rtl" dir="rtl">
            <ChartContainer config={{}} style={{ height: "100%" }}>
              <SankeyChart nodes={nodes} links={links} accessibilityLayer aria-label="Where income goes, right to left">
                <ChartTooltip content={<ChartTooltipContent />} />
              </SankeyChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Sizing and bare</h3>
        <p>
          <code>nodeWidth</code> and <code>nodePadding</code> set the bar width and the gap between nodes in a column, in
          px; both shrink to fit a small box. <code>labelSize</code> is the room kept for names at either side, and 0
          leaves the names out. <code>margin</code> moves the diagram in from the edges.
        </p>
        <ComponentPreview code={`<SankeyChart nodes={nodes} links={links} nodeWidth={24} nodePadding={20} labelSize={0} />`}>
          <Frame pg="sankey-bare">
            <ChartContainer config={{}} style={{ height: "100%" }}>
              <SankeyChart nodes={nodes} links={links} nodeWidth={24} nodePadding={20} labelSize={0} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Nothing to draw</h3>
        <p>
          With no nodes the chart draws an empty box. Links that form a loop have no left-to-right order, so the chart
          draws nothing rather than something misleading (below); links with a zero or negative value
          are left out.
        </p>
        <ComponentPreview code={`<SankeyChart nodes={[]} links={[]} accessibilityLayer aria-label="No flows" />`}>
          <Frame pg="sankey-empty">
            <ChartContainer config={{}} style={{ height: "100%" }}>
              <SankeyChart nodes={[]} links={[]} accessibilityLayer aria-label="No flows" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Links that loop</h3>
        <ComponentPreview code={`<SankeyChart nodes={nodes} links={[{ source: "budget", target: "food", value: 5 }, { source: "food", target: "budget", value: 5 }]} accessibilityLayer aria-label="A loop" />`}>
          <Frame pg="sankey-cycle">
            <ChartContainer config={{}} style={{ height: "100%" }}>
              <SankeyChart nodes={nodes} links={loop} accessibilityLayer aria-label="A loop" />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <ApiReference title="SankeyChart" props={[
        { name: "nodes", type: "{ id, name? }[]", description: "One entry per node; id is what links refer to and must be unique. name is the label when the config has none" },
        { name: "links", type: "{ source, target, value }[]", description: "Flows between node ids. A link with a value that is not a positive number is left out; an unknown id throws and a loop draws nothing" },
        { name: "linkColor", type: '"source" | "target" | "gradient"', default: '"source"', description: "Colour each band like the node it leaves, the node it enters, or fade between them" },
        { name: "align", type: '"justify" | "left"', default: '"justify"', description: "Put nodes with no outflow in the last column, or one column past their deepest source" },
        { name: "nodeWidth / nodePadding", type: "number", default: "12 / 8", description: "Bar width and gap between nodes in a column, px; both shrink to fit" },
        { name: "iterations", type: "number", default: "6", description: "Passes that move nodes toward the centre of what they connect to" },
        { name: "labelSize", type: "number", default: "72", description: "Room for names at each side, px; 0 leaves the names out" },
        { name: "margin", type: "{ top, right, bottom, left }", default: "5 each", description: "Space around the diagram, px" },
        { name: "syncId", type: "string", description: "Charts sharing an id share the active stop, by index" },
        { name: "accessibilityLayer", type: "boolean", default: "false", description: "Focusable; arrows step between nodes and bands, Home and End jump to the first and last, Escape dismisses. Writes a generated summary into aria-describedby when none is given" },
        { name: "config", type: "ChartContainer prop", description: "An entry named by a node id sets that node's label and colour, and names it in ChartLegend; without one the node takes the chart colours in order" },
      ]} />
      <ApiReference title="Tooltip" props={[
        { name: "ChartTooltip", type: "element", description: "Over a node it lists the inflow and outflow; over a band it names both ends and lists the flow" },
      ]} />
    </>
  )
}
