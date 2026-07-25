import { useState } from "react"
import { DirectionProvider } from "../../lib/direction.jsx"
import { Calendar } from "../../ui/calendar/calendar.jsx"
import "../../ui/calendar/calendar.css"

const framed = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  width: "fit-content",
}

export default function CalendarPage() {
  const [single, setSingle] = useState(new Date(2026, 0, 15))

  return (
    <>
      <h2>Calendar</h2>

      <section className="pg-section">
        <h3>Single</h3>
        <div style={framed}>
          <Calendar
            mode="single"
            selected={single}
            onSelect={setSingle}
            defaultMonth={new Date(2026, 0, 1)}
            locale="en-US"
            data-pg="cal-single"
          />
        </div>
        <p>
          Selected:{" "}
          <span data-pg="cal-single-state">
            {single ? single.toISOString().slice(0, 10) : "none"}
          </span>
        </p>
      </section>

      <section className="pg-section">
        <h3>Current month (today marked)</h3>
        <div style={framed}>
          <Calendar mode="single" locale="en-US" data-pg="cal-today" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Disabled: weekends, plus everything before 2026-01-10</h3>
        <div style={framed}>
          <Calendar
            mode="single"
            defaultMonth={new Date(2026, 0, 1)}
            disabled={[{ dayOfWeek: [0, 6] }, { before: new Date(2026, 0, 10) }]}
            locale="en-US"
            data-pg="cal-disabled"
          />
        </div>
      </section>

      <section className="pg-section">
        <h3>No outside days, bounded to 2026</h3>
        <div style={framed}>
          <Calendar
            mode="single"
            defaultMonth={new Date(2026, 0, 1)}
            startMonth={new Date(2026, 0, 1)}
            endMonth={new Date(2026, 11, 1)}
            showOutsideDays={false}
            locale="en-US"
            data-pg="cal-bounded"
          />
        </div>
      </section>

      <section className="pg-section">
        <h3>Dropdown caption</h3>
        <div style={framed}>
          <Calendar
            mode="single"
            captionLayout="dropdown"
            defaultMonth={new Date(2026, 0, 1)}
            startMonth={new Date(2024, 0, 1)}
            endMonth={new Date(2028, 11, 1)}
            locale="en-US"
            data-pg="cal-dropdown"
          />
        </div>
      </section>

      <section className="pg-section">
        <h3>RTL (Arabic locale)</h3>
        <DirectionProvider dir="rtl">
          <div style={framed}>
            <Calendar
              mode="single"
              defaultMonth={new Date(2026, 0, 1)}
              locale="ar-EG"
              data-pg="cal-rtl"
            />
          </div>
        </DirectionProvider>
      </section>
    </>
  )
}
