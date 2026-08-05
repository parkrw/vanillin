import { useState } from "react"
import { TimePicker } from "../../ui/time-picker/time-picker.jsx"
import "../../ui/time-picker/time-picker.css"

const pad = (n) => String(n).padStart(2, "0")

export default function TimePickerPage() {
  const [time, setTime] = useState({ hour: 14, minute: 30, second: 0 })
  const [time24, setTime24] = useState({ hour: 14, minute: 30, second: 0 })
  const [timeSec, setTimeSec] = useState({ hour: 9, minute: 15, second: 45 })

  return (
    <>
      <h2>Time Picker</h2>
      <p className="pg-desc" style={{ marginBlockEnd: "1rem" }}>
        Segmented hour/minute (and optional second) fields. The 12- or 24-hour presentation comes
        from the locale by default and can be forced with <code>hour12</code>. The value is a plain{" "}
        <code>{"{ hour, minute, second }"}</code> object, not a <code>Date</code> — a time of day has
        no date, and pretending otherwise causes timezone bugs. For a full datetime, compose with{" "}
        <code>DateInput</code> (see the Date Input page).
      </p>

      <section className="pg-section">
        <h3>12-hour (en-US default)</h3>
        <TimePicker value={time} onChange={setTime} data-pg="dp-time-12h" />
        <span
          className="pg-detail"
          style={{ marginInlineStart: "0.5rem" }}
          data-pg="dp-time-12h-state"
        >
          {pad(time.hour)}:{pad(time.minute)}
        </span>
      </section>

      <section className="pg-section">
        <h3>24-hour (forced)</h3>
        <TimePicker value={time24} onChange={setTime24} hour12={false} data-pg="dp-time-24h" />
        <span
          className="pg-detail"
          style={{ marginInlineStart: "0.5rem" }}
          data-pg="dp-time-24h-state"
        >
          {pad(time24.hour)}:{pad(time24.minute)}
        </span>
      </section>

      <section className="pg-section">
        <h3>With seconds</h3>
        <TimePicker value={timeSec} onChange={setTimeSec} showSeconds data-pg="dp-time-sec" />
        <span
          className="pg-detail"
          style={{ marginInlineStart: "0.5rem" }}
          data-pg="dp-time-sec-state"
        >
          {pad(timeSec.hour)}:{pad(timeSec.minute)}:{pad(timeSec.second)}
        </span>
      </section>
    </>
  )
}
