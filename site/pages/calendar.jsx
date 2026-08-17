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
      <p>A date picker grid with single, multiple, and range selection, plus keyboard navigation, RTL, dropdowns, and disabled-day matchers.</p>

      <InstallSnippet slug="calendar" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
  defaultMonth={new Date(2026, 0, 1)}
  locale="en-US"
/>`}>
          <div>
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
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Calendar } from "./ui/calendar/calendar"
import "./ui/calendar/calendar.css"

const [date, setDate] = useState(new Date())

<Calendar
  mode="single"
  selected={date}
  onSelect={setDate}
/>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>See the live demos below.</p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Current month (today marked)</h3>
        <ComponentPreview code={`<Calendar mode="single" locale="en-US" />`}>
          <div style={framed}>
            <Calendar mode="single" locale="en-US" data-pg="cal-today" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Disabled: weekends, plus everything before 2026-01-10</h3>
        <ComponentPreview code={`<Calendar
  mode="single"
  defaultMonth={new Date(2026, 0, 1)}
  disabled={[
    { dayOfWeek: [0, 6] },
    { before: new Date(2026, 0, 10) },
  ]}
  locale="en-US"
/>`}>
          <div style={framed}>
            <Calendar
              mode="single"
              defaultMonth={new Date(2026, 0, 1)}
              disabled={[{ dayOfWeek: [0, 6] }, { before: new Date(2026, 0, 10) }]}
              locale="en-US"
              data-pg="cal-disabled"
            />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>No outside days, bounded to 2026</h3>
        <ComponentPreview code={`<Calendar
  mode="single"
  defaultMonth={new Date(2026, 0, 1)}
  startMonth={new Date(2026, 0, 1)}
  endMonth={new Date(2026, 11, 1)}
  showOutsideDays={false}
  locale="en-US"
/>`}>
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
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Dropdown caption</h3>
        <ComponentPreview code={`<Calendar
  mode="single"
  captionLayout="dropdown"
  defaultMonth={new Date(2026, 0, 1)}
  startMonth={new Date(2024, 0, 1)}
  endMonth={new Date(2028, 11, 1)}
  locale="en-US"
/>`}>
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
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Multiple</h3>
        <ComponentPreview code={`<Calendar
  mode="multiple"
  selected={dates}
  onSelect={setDates}
  defaultMonth={new Date(2026, 0, 1)}
  locale="en-US"
/>`}>
          <div>
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
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Range over two months, with week numbers</h3>
        <ComponentPreview code={`<Calendar
  mode="range"
  selected={range}
  onSelect={setRange}
  numberOfMonths={2}
  showWeekNumber
  defaultMonth={new Date(2026, 0, 1)}
  locale="en-US"
/>`}>
          <div>
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
          </div>
        </ComponentPreview>
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

      <ApiReference props={[
        { name: "mode", type: '"single" | "multiple" | "range"', description: "Selection mode" },
        { name: "selected", type: "Date | Date[] | { from: Date, to?: Date }", description: "Current selection (controlled)" },
        { name: "defaultSelected", type: "Date | Date[] | { from: Date, to?: Date }", description: "Initial selection (uncontrolled)" },
        { name: "onSelect", type: "(value) => void", description: "Called when selection changes" },
        { name: "month", type: "Date", description: "Controlled displayed month" },
        { name: "defaultMonth", type: "Date", description: "Initial displayed month (uncontrolled)" },
        { name: "onMonthChange", type: "(month: Date) => void", description: "Called when the displayed month changes" },
        { name: "disabled", type: "Matcher | Matcher[]", description: "Days to disable: date, range, dayOfWeek, or function" },
        { name: "locale", type: "string", description: "BCP 47 locale for weekday names and formatting" },
        { name: "weekStartsOn", type: "number", description: "Override the locale's first day of week (0=Sunday)" },
        { name: "numberOfMonths", type: "number", default: "1", description: "Number of month grids to display" },
        { name: "captionLayout", type: '"label" | "dropdown"', default: '"label"', description: "Month/year navigation style" },
        { name: "showWeekNumber", type: "boolean", default: "false", description: "Show ISO week numbers" },
        { name: "showOutsideDays", type: "boolean", default: "true", description: "Show days from adjacent months" },
        { name: "startMonth", type: "Date", description: "Earliest navigable month" },
        { name: "endMonth", type: "Date", description: "Latest navigable month" },
        { name: "buttonVariant", type: '"ghost" | "outline"', default: '"ghost"', description: "Variant for day buttons" },
      ]} />
    </>
  )
}
