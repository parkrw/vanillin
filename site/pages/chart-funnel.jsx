import { ChartContainer, ChartLegend, ChartTooltip, ChartTooltipContent } from "../../ui/chart/chart.jsx"
import { FunnelChart } from "../../ui/chart-funnel/chart-funnel.jsx"
import "../../ui/chart/chart.css"
import "../../ui/chart-funnel/chart-funnel.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

/* 1000 to 400 to 200 to 50: 40%, 50% and 25% stage to stage; 40%, 20% and 5% of the first. */
const stages = [
  { name: "Visits", value: 1000 },
  { name: "Sign-ups", value: 400 },
  { name: "Trials", value: 200 },
  { name: "Paid", value: 50 },
]

const renamed = [
  { step: "Quoted", count: 80 },
  { step: "Accepted", count: 60 },
  { step: "Shipped", count: 30 },
]

/* A stage that grew, one with no usable value, and a negative one. */
const odd = [
  { name: "Seen", value: 100 },
  { name: "Grew", value: 150 },
  { name: "Missing", value: "n/a" },
  { name: "Negative", value: -5 },
  { name: "Zero", value: 0 },
]

const config = { funnel: { label: "Customers", color: "var(--chart-1)" } }

function Frame({ pg, dir, children }) {
  return (
    <div data-pg={pg} dir={dir} style={{ width: "100%", maxWidth: "40rem" }}>
      {children}
    </div>
  )
}

export default function ChartFunnelPage() {
  return (
    <>
      <h2>Chart Funnel</h2>
      <p>
        <code>FunnelChart</code> stacks a list of stages from top to bottom, each as a trapezoid as wide as its value
        is large against the biggest stage. Beside each stage it prints the name and value, and what share of the
        stage before it and of the first stage it holds. It sits inside the Chart shell.
      </p>

      <InstallSnippet slug="chart-funnel" />

      <section className="pg-section">
        <h3>Stages</h3>
        <p>
          A stage's top edge is drawn at its own width and its bottom edge at the width of the next stage, so the
          outline runs on unbroken from one to the next. The last stage has no next one and is a rectangle, as is any stage followed by one with no value. Hovering a
          stage lists its value and both rates in the tooltip.
        </p>
        <ComponentPreview code={`<ChartContainer config={config}>
  <FunnelChart data={stages} accessibilityLayer aria-label="Sign-up funnel">
    <ChartTooltip content={<ChartTooltipContent />} />
  </FunnelChart>
</ChartContainer>`}>
          <Frame pg="funnel-default">
            <ChartContainer config={config}>
              <FunnelChart data={stages} accessibilityLayer aria-label="Sign-up funnel">
                <ChartTooltip content={<ChartTooltipContent />} />
              </FunnelChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Keyboard</h3>
        <p>
          With <code>accessibilityLayer</code> the chart takes focus and the arrow keys step through the stages, down
          or right to the next and up or left to the one before. Home and End jump to the first and last stage, and
          Escape dismisses the tooltip. The chart also gains a generated summary, read by assistive technology through{" "}
          <code>aria-describedby</code>; a summary supplied by the page replaces it.
        </p>
        <ComponentPreview code={`<FunnelChart data={stages} accessibilityLayer aria-label="Sign-up funnel" aria-describedby="funnel-note" />
<p id="funnel-note">Of 1,000 visits, 50 pay.</p>`}>
          <Frame pg="funnel-described">
            <ChartContainer config={config}>
              <FunnelChart data={stages} accessibilityLayer aria-label="Sign-up funnel, described by the page" aria-describedby="funnel-note">
                <ChartTooltip content={<ChartTooltipContent />} />
              </FunnelChart>
            </ChartContainer>
            <p id="funnel-note">Of 1,000 visits, 50 pay.</p>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Field names, formatting and spacing</h3>
        <p>
          <code>nameKey</code> and <code>valueKey</code> name the datum's fields, <code>formatter</code> writes the
          values, <code>stageGap</code> sets the space between stages, and <code>labelSize</code> sets the room for the
          labels; at 0 they are left out.
        </p>
        <ComponentPreview code={`<FunnelChart data={orders} nameKey="step" valueKey="count" formatter={(v) => v + " orders"} stageGap={12} />
<FunnelChart data={stages} labelSize={0} />`}>
          <Frame pg="funnel-options">
            <ChartContainer config={config}>
              <FunnelChart data={renamed} nameKey="step" valueKey="count" formatter={(v) => `${v} orders`} stageGap={12} labelSize={200} />
            </ChartContainer>
          </Frame>
          <Frame pg="funnel-bare">
            <ChartContainer config={config}>
              <FunnelChart data={stages} labelSize={0} />
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Stages that grow, or have no value</h3>
        <p>
          A stage larger than the one before it is drawn as it is, with a rate above 100%. A value that is missing,
          not a number or negative leaves its stage without a shape and its rates blank, and the next stage's rate
          against it is blank too. A stage of 0 keeps its row and its label.
        </p>
        <ComponentPreview code={`<FunnelChart data={[seen, grew, { name: "Missing", value: "n/a" }, negative, zero]} />`}>
          <Frame pg="funnel-odd">
            <ChartContainer config={config}>
              <FunnelChart data={odd} accessibilityLayer aria-label="Funnel with unusual stages">
                <ChartTooltip content={<ChartTooltipContent />} />
              </FunnelChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Legend and colour</h3>
        <p>
          <code>ChartLegend</code> lists the <code>funnel</code> entry of the config under its label, and that entry's{" "}
          <code>color</code> paints the stages.
        </p>
        <ComponentPreview code={`<ChartContainer config={{ funnel: { label: "Customers", color: "rgb(200, 30, 30)" } }}>
  <FunnelChart data={stages}>
    <ChartLegend />
  </FunnelChart>
</ChartContainer>`}>
          <Frame pg="funnel-legend">
            <ChartContainer config={{ funnel: { label: "Customers", color: "rgb(200, 30, 30)" } }}>
              <FunnelChart data={stages}>
                <ChartLegend />
              </FunnelChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Right to left</h3>
        <p>
          The funnel and its labels keep their place in a right-to-left layout. The stages run down the page, not across
          it, so the arrow keys keep their order: ArrowDown and ArrowRight go to the next stage.
        </p>
        <ComponentPreview code={`<div dir="rtl">
  <FunnelChart data={stages} accessibilityLayer />
</div>`}>
          <Frame pg="funnel-rtl" dir="rtl">
            <ChartContainer config={config}>
              <FunnelChart data={stages} accessibilityLayer aria-label="Sign-up funnel, right to left">
                <ChartTooltip content={<ChartTooltipContent />} />
              </FunnelChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Linked charts</h3>
        <p>
          Charts sharing a <code>syncId</code> share the active stage, by position. A chart with fewer stages treats a
          shared position it has none for as no stage: the next arrow forward lands on its first, back on its last.
        </p>
        <ComponentPreview code={`<FunnelChart syncId="stage" data={stages} />
<FunnelChart syncId="stage" data={stages.slice(0, 2)} />`}>
          <Frame pg="funnel-sync-a">
            <ChartContainer config={config}>
              <FunnelChart data={stages} syncId="stage" accessibilityLayer aria-label="Funnel, four stages">
                <ChartTooltip content={<ChartTooltipContent />} />
              </FunnelChart>
            </ChartContainer>
          </Frame>
          <Frame pg="funnel-sync-b">
            <ChartContainer config={config}>
              <FunnelChart data={stages.slice(0, 2)} syncId="stage" accessibilityLayer aria-label="Funnel, two stages">
                <ChartTooltip content={<ChartTooltipContent />} />
              </FunnelChart>
            </ChartContainer>
          </Frame>
        </ComponentPreview>
      </section>

      <ApiReference title="FunnelChart" props={[
        { name: "data", type: "object[]", description: "One datum per stage, in order from the top; each carries a name and a non-negative value" },
        { name: "nameKey / valueKey", type: "string", default: '"name" / "value"', description: "Fields holding the stage name and its value" },
        { name: "formatter", type: "(value) => string", description: "Writes values in the labels, tooltip and summary; the locale's number format by default" },
        { name: "stageGap", type: "number", default: "4", description: "Space between stages, px" },
        { name: "labelSize", type: "number", default: "168", description: "Room for the labels beside the funnel, px; 0 leaves them out" },
        { name: "margin", type: "{ top, right, bottom, left }", default: "5 each", description: "Space around the plot, px" },
        { name: "syncId", type: "string", description: "Charts sharing an id share the active stage, by index" },
        { name: "accessibilityLayer", type: "boolean", default: "false", description: "Focusable, with a generated summary; arrow keys step between stages, Home and End jump, Escape dismisses" },
        { name: "config", type: "ChartContainer prop", description: "The funnel entry's color sets the stage colour; the first chart colour by default" },
      ]} />
      <ApiReference title="Tooltip" props={[
        { name: "ChartTooltip", type: "element", description: "Over a stage it lists the stage's value, its share of the previous stage and its share of the first" },
      ]} />
    </>
  )
}
