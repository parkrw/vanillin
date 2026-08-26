import { useState } from "react"
import { LiveValue } from "../../ui/live-value/live-value.jsx"
import { Button } from "../../ui/button/button.jsx"
import { Card, CardContent } from "../../ui/card/card.jsx"
import "../../ui/live-value/live-value.css"
import "../../ui/button/button.css"
import "../../ui/card/card.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

/* Deterministic wander around a base so the demo reads as a metric, not noise. */
const drift = (base, spread) => (tick) =>
  Math.round(base + (Math.sin(tick / 2) * 0.6 + Math.sin(tick / 5) * 0.4) * spread)

export default function LiveValuePage() {
  const [count, setCount] = useState(42)

  return (
    <>
      <h2>Live Value</h2>

      <p>
        A number that changes on a schedule and shows which way it went. Every{" "}
        <code>LiveValue</code> with the same <code>interval</code> shares one timer,
        so a dashboard of gauges ticks in phase instead of flickering.
      </p>

      <InstallSnippet slug="live-value" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<LiveValue interval={2000} sample={(tick) => readCpu(tick)} format={(v) => \`\${v}%\`} />`}>
          <div className="pg-row" data-pg="lv-default">
            <span className="pg-stat-num">
              <LiveValue interval={2000} sample={drift(62, 6)} format={(v) => `${v}%`} />
            </span>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { LiveValue } from "./ui/live-value/live-value"
import "./ui/live-value/live-value.css"

// Self-sampling: runs sample(tick) on every beat of the shared 2s timer.
<LiveValue interval={2000} sample={(tick) => readCpu(tick)} format={(v) => \`\${v}%\`} />

// Controlled: flashes whenever the value you pass changes.
<LiveValue value={running} format={(v) => \`\${v} running\`} />`}>
          <div className="pg-row">
            <LiveValue interval={2000} sample={drift(62, 6)} format={(v) => `${v}%`} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [count, setCount] = useState(42)

<LiveValue value={count} />
<Button onClick={() => setCount((c) => c + 1)}>+1</Button>
<Button onClick={() => setCount((c) => c - 1)}>-1</Button>`}>
          <div>
            <p className="pg-prose">
              Without <code>sample</code> the component starts no timer. Pass{" "}
              <code>value</code> and it flashes on every change: up in{" "}
              <code>--live-value-up</code>, down in <code>--live-value-down</code>.
              The flash clears when the tick animation ends.
            </p>
            <div className="pg-row" data-pg="lv-controlled">
              <span className="pg-stat-num">
                <LiveValue value={count} />
              </span>
              <Button variant="outline" size="sm" data-pg="lv-inc" onClick={() => setCount((c) => c + 1)}>
                +1
              </Button>
              <Button variant="outline" size="sm" data-pg="lv-dec" onClick={() => setCount((c) => c - 1)}>
                -1
              </Button>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Interval</h3>
        <ComponentPreview code={`<LiveValue interval={300} sample={(tick) => tick} />
<LiveValue interval={300} sample={(tick) => tick} />
<LiveValue interval={60000} sample={(tick) => tick} />`}>
          <div>
            <p className="pg-prose">
              <code>interval</code> is milliseconds between samples. The two fast
              counters share one timer and never drift apart; the slow one holds
              its first sample for a minute. A timer starts with its first
              subscriber and stops with its last.
            </p>
            <div className="pg-row">
              <Card>
                <CardContent className="pg-lv-card">
                  <span className="pg-stat-label">300 ms</span>
                  <span className="pg-stat-num" data-pg="lv-fast">
                    <LiveValue interval={300} sample={(tick) => tick} />
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pg-lv-card">
                  <span className="pg-stat-label">300 ms</span>
                  <span className="pg-stat-num" data-pg="lv-fast-twin">
                    <LiveValue interval={300} sample={(tick) => tick} />
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pg-lv-card">
                  <span className="pg-stat-label">60 s</span>
                  <span className="pg-stat-num" data-pg="lv-slow">
                    <LiveValue interval={60000} sample={(tick) => tick} />
                  </span>
                </CardContent>
              </Card>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Format</h3>
        <ComponentPreview code={`<LiveValue interval={1500} sample={drift(12, 2)} format={(v) => \`\${v} running\`} />
<LiveValue interval={1500} sample={drift(2842, 40)} format={(v) => \`$\${v.toLocaleString()}\`} />`}>
          <div>
            <p className="pg-prose">
              <code>format</code> turns the sampled number into text. The direction
              is judged on the number, so a formatted string still flashes up or
              down. Digits are tabular, so the text does not jitter as it changes.
            </p>
            <div className="pg-row" data-pg="lv-format">
              <LiveValue interval={1500} sample={drift(12, 2)} format={(v) => `${v} running`} />
              <LiveValue interval={1500} sample={drift(2842, 40)} format={(v) => `$${v.toLocaleString()}`} />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Colours</h3>
        <ComponentPreview code={`<div style={{ "--live-value-up": "var(--success)", "--live-value-down": "var(--destructive)" }}>
  <LiveValue interval={1200} sample={drift(50, 10)} />
</div>`}>
          <div>
            <p className="pg-prose">
              The defaults are <code>--warning</code> for up and <code>--info</code>{" "}
              for down. Set <code>--live-value-up</code> and{" "}
              <code>--live-value-down</code> on any ancestor to recolour a whole
              dashboard, or invert them where a rise is good news.
            </p>
            <div
              className="pg-row"
              data-pg="lv-colours"
              style={{ "--live-value-up": "var(--success)", "--live-value-down": "var(--destructive)" }}
            >
              <span className="pg-stat-num">
                <LiveValue interval={1200} sample={drift(50, 10)} />
              </span>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "value", type: "number | string", description: "Controlled value; the text flashes whenever it changes. Ignored when sample is set" },
        { name: "sample", type: "(tick: number) => number | string", description: "Called on every beat of the shared timer; tick 0 is the first render" },
        { name: "interval", type: "number", default: "2000", description: "Milliseconds between samples. LiveValues sharing an interval share one timer" },
        { name: "format", type: "(v) => string", default: "String", description: "Turns the current value into the rendered text" },
        { name: "as", type: "ElementType", default: '"span"', description: "Render as a different element" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
