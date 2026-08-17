import { useState } from "react"
import { TimePicker } from "../../ui/time-picker/time-picker.jsx"
import "../../ui/time-picker/time-picker.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const pad = (n) => String(n).padStart(2, "0")

export default function TimePickerPage() {
  const [time, setTime] = useState({ hour: 14, minute: 30, second: 0 })
  const [time24, setTime24] = useState({ hour: 14, minute: 30, second: 0 })
  const [timeSec, setTimeSec] = useState({ hour: 9, minute: 15, second: 45 })

  return (
    <>
      <h2>Time Picker</h2>
      <p>Segmented hour / minute / second fields with arrow-key stepping and locale-aware 12- or 24-hour display. The value is a plain <code>{"{ hour, minute, second }"}</code> object, not a <code>Date</code>.</p>

      <InstallSnippet slug="time-picker" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`import { TimePicker } from "./ui/time-picker/time-picker"
import "./ui/time-picker/time-picker.css"

const [time, setTime] = useState({ hour: 14, minute: 30, second: 0 })

<TimePicker value={time} onChange={setTime} />`}>
          <div className="pg-row">
            <TimePicker value={time} onChange={setTime} data-pg="dp-time-12h" />
            <span className="pg-detail" data-pg="dp-time-12h-state">
              {pad(time.hour)}:{pad(time.minute)}
            </span>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { TimePicker } from "./ui/time-picker/time-picker"
import "./ui/time-picker/time-picker.css"

const [time, setTime] = useState("09:30")

<TimePicker value={time} onValueChange={setTime} />`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>See the live demos below.</p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>24-hour (forced)</h3>
        <ComponentPreview code={`<TimePicker value={time24} onChange={setTime24} hour12={false} />`}>
          <div className="pg-row">
            <TimePicker value={time24} onChange={setTime24} hour12={false} data-pg="dp-time-24h" />
            <span className="pg-detail" data-pg="dp-time-24h-state">
              {pad(time24.hour)}:{pad(time24.minute)}
            </span>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With seconds</h3>
        <ComponentPreview code={`<TimePicker value={timeSec} onChange={setTimeSec} showSeconds />`}>
          <div className="pg-row">
            <TimePicker value={timeSec} onChange={setTimeSec} showSeconds data-pg="dp-time-sec" />
            <span className="pg-detail" data-pg="dp-time-sec-state">
              {pad(timeSec.hour)}:{pad(timeSec.minute)}:{pad(timeSec.second)}
            </span>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "value", type: "{ hour, minute, second }", description: "Controlled value (24h internal)" },
        { name: "defaultValue", type: "{ hour, minute, second }", description: "Initial value (uncontrolled)" },
        { name: "onChange", type: "(value) => void", description: "Called on every change" },
        { name: "locale", type: "string", default: '"en-US"', description: "BCP 47 locale tag; derives the 12h or 24h default" },
        { name: "hour12", type: "boolean", description: "Override locale's hour cycle" },
        { name: "showSeconds", type: "boolean", default: "false", description: "Show seconds segment" },
        { name: "step", type: "number", default: "1", description: "Minutes step" },
        { name: "min", type: "{ hour, minute }", description: "Minimum clamp bound (24h)" },
        { name: "max", type: "{ hour, minute }", description: "Maximum clamp bound (24h)" },
        { name: "disabled", type: "boolean", description: "Disables all segments" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
