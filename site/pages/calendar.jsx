import { useState } from "react"
import { DirectionProvider } from "../../lib/direction.jsx"
import { Calendar } from "../../ui/calendar/calendar.jsx"
import "../../ui/calendar/calendar.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const framed = {
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  width: "fit-content",
}

export default function CalendarPage() {
  const [single, setSingle] = useState(new Date(2026, 0, 15))
  const [multiple, setMultiple] = useState([])
  const [range, setRange] = useState(undefined)

  return (
    <>
      <h2>Calendar</h2>
      <p>A date picker grid with single, multiple, and range selection — keyboard navigation, RTL, dropdowns, and disabled-day matchers.</p>

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
        <h3>Multiple</h3>
        <div style={framed}>
          <Calendar
            mode="multiple"
            selected={multiple}
            onSelect={setMultiple}
            defaultMonth={new Date(2026, 0, 1)}
            locale="en-US"
            data-pg="cal-multiple"
          />
        </div>
        <p>
          Selected:{" "}
          <span data-pg="cal-multiple-state">
            {multiple.length ? multiple.map((date) => date.getDate()).join(",") : "none"}
          </span>
        </p>
      </section>

      <section className="pg-section">
        <h3>Range over two months, with week numbers</h3>
        <div style={framed}>
          <Calendar
            mode="range"
            selected={range}
            onSelect={setRange}
            numberOfMonths={2}
            showWeekNumber
            defaultMonth={new Date(2026, 0, 1)}
            locale="en-US"
            data-pg="cal-range"
          />
        </div>
        <p>
          Range:{" "}
          <span data-pg="cal-range-state">
            {range?.from
              ? `${range.from.toISOString().slice(0, 10)} → ${range.to ? range.to.toISOString().slice(0, 10) : "…"}`
              : "none"}
          </span>
        </p>
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

      <InstallSnippet slug="calendar" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Calendar } from "./ui/calendar/calendar"
import "./ui/calendar/calendar.css"

const [date, setDate] = useState(new Date())

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
/>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>See the live demos above.</p>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "mode", type: '"single" | "multiple" | "range"', description: "Selection mode" },
        { name: "selected", type: "Date | Date[] | { from: Date, to?: Date }", description: "Current selection (controlled)" },
        { name: "onSelect", type: "(value) => void", description: "Called when selection changes" },
        { name: "defaultMonth", type: "Date", description: "Initial displayed month" },
        { name: "disabled", type: "Matcher | Matcher[]", description: "Days to disable — date, range, dayOfWeek, or function" },
        { name: "locale", type: "string", description: "BCP 47 locale for weekday names and formatting" },
        { name: "numberOfMonths", type: "number", default: "1", description: "Number of month grids to display" },
        { name: "captionLayout", type: '"buttons" | "dropdown"', default: '"buttons"', description: "Month/year navigation style" },
        { name: "showWeekNumber", type: "boolean", default: "false", description: "Show ISO week numbers" },
        { name: "showOutsideDays", type: "boolean", default: "true", description: "Show days from adjacent months" },
        { name: "startMonth", type: "Date", description: "Earliest navigable month" },
        { name: "endMonth", type: "Date", description: "Latest navigable month" },
      ]} />
    </>
  )
}
