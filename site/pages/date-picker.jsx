import { useState } from "react"
import { Button } from "../../ui/button/button.jsx"
import { Calendar } from "../../ui/calendar/calendar.jsx"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../ui/popover/popover.jsx"
import "../../ui/date-picker/date-picker.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const formatDate = (date, locale = "en-US") =>
  date
    ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date)
    : undefined

const formatRange = (range, locale = "en-US") => {
  if (!range?.from) return undefined
  const fmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" })
  if (!range.to) return fmt.format(range.from)
  return `${fmt.format(range.from)} – ${fmt.format(range.to)}`
}

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ inlineSize: "1rem", blockSize: "1rem" }}
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </svg>
  )
}

export default function DatePickerPage() {
  const [single, setSingle] = useState(undefined)
  const [singleOpen, setSingleOpen] = useState(false)
  const [range, setRange] = useState(undefined)
  const [rangeOpen, setRangeOpen] = useState(false)
  const [dob, setDob] = useState(undefined)
  const [dobOpen, setDobOpen] = useState(false)

  return (
    <>
      <h2>Date Picker</h2>
      <p>A composition of <code>Popover</code> + <code>Calendar</code> + <code>Button</code> — not a standalone component, just a documented pattern.</p>

      <InstallSnippet slug="date-picker" />

      <section className="pg-section">
        <h3>Single date</h3>
        <ComponentPreview code={`import { Calendar } from "./ui/calendar/calendar"
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover/popover"
import "./ui/date-picker/date-picker.css"

const [date, setDate] = useState(undefined)
const [open, setOpen] = useState(false)

<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger as={Button} variant="outline" className="date-picker-trigger"
    data-empty={date ? undefined : "true"}>
    <CalendarIcon />
    {formatDate(date) ?? "Pick a date"}
  </PopoverTrigger>
  <PopoverContent className="date-picker-popover" align="start">
    <Calendar mode="single" selected={date}
      onSelect={(d) => { setDate(d); setOpen(false) }} />
  </PopoverContent>
</Popover>`}>
          <div>
            <Popover open={singleOpen} onOpenChange={setSingleOpen}>
              <PopoverTrigger
                as={Button}
                variant="outline"
                className="date-picker-trigger"
                data-empty={single ? undefined : "true"}
                data-pg="dp-single-trigger"
              >
                <CalendarIcon />
                {formatDate(single) ?? "Pick a date"}
              </PopoverTrigger>
              <PopoverContent className="date-picker-popover" align="start" data-pg="dp-single-content">
                <Calendar
                  mode="single"
                  selected={single}
                  onSelect={(date) => {
                    setSingle(date)
                    setSingleOpen(false)
                  }}
                  defaultMonth={new Date(2026, 0, 1)}
                  locale="en-US"
                  data-pg="dp-single-calendar"
                />
              </PopoverContent>
            </Popover>
            <p className="pg-desc">
              Selected:{" "}
              <span data-pg="dp-single-state">
                {single ? single.toISOString().slice(0, 10) : "none"}
              </span>
            </p>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Date range</h3>
        <ComponentPreview code={`<Calendar
  mode="range"
  selected={range}
  onSelect={(value) => {
    setRange(value)
    if (value?.from && value?.to) setOpen(false)
  }}
  numberOfMonths={2}
/>`}>
          <div>
            <Popover open={rangeOpen} onOpenChange={setRangeOpen}>
              <PopoverTrigger
                as={Button}
                variant="outline"
                className="date-picker-trigger"
                data-empty={range?.from ? undefined : "true"}
                data-pg="dp-range-trigger"
              >
                <CalendarIcon />
                {formatRange(range) ?? "Pick a date range"}
              </PopoverTrigger>
              <PopoverContent
                className="date-picker-popover date-picker-popover--wide"
                align="start"
                data-pg="dp-range-content"
              >
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={(value) => {
                    setRange(value)
                    if (value?.from && value?.to) setRangeOpen(false)
                  }}
                  numberOfMonths={2}
                  defaultMonth={new Date(2026, 0, 1)}
                  locale="en-US"
                  data-pg="dp-range-calendar"
                />
              </PopoverContent>
            </Popover>
            <p className="pg-desc">
              Range:{" "}
              <span data-pg="dp-range-state">
                {range?.from
                  ? `${range.from.toISOString().slice(0, 10)} → ${range.to ? range.to.toISOString().slice(0, 10) : "…"}`
                  : "none"}
              </span>
            </p>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Date of birth (dropdown caption)</h3>
        <ComponentPreview code={`<Calendar
  mode="single"
  captionLayout="dropdown"
  startMonth={new Date(1920, 0, 1)}
  endMonth={new Date(2010, 11, 1)}
/>`}>
          <div>
            <Popover open={dobOpen} onOpenChange={setDobOpen}>
              <PopoverTrigger
                as={Button}
                variant="outline"
                className="date-picker-trigger"
                data-empty={dob ? undefined : "true"}
                data-pg="dp-dob-trigger"
              >
                <CalendarIcon />
                {formatDate(dob) ?? "Pick your date of birth"}
              </PopoverTrigger>
              <PopoverContent className="date-picker-popover" align="start" data-pg="dp-dob-content">
                <Calendar
                  mode="single"
                  selected={dob}
                  onSelect={(date) => {
                    setDob(date)
                    setDobOpen(false)
                  }}
                  captionLayout="dropdown"
                  defaultMonth={new Date(1990, 0, 1)}
                  startMonth={new Date(1920, 0, 1)}
                  endMonth={new Date(2010, 11, 1)}
                  locale="en-US"
                  data-pg="dp-dob-calendar"
                />
              </PopoverContent>
            </Popover>
            <p className="pg-desc">
              Selected:{" "}
              <span data-pg="dp-dob-state">
                {dob ? dob.toISOString().slice(0, 10) : "none"}
              </span>
            </p>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference title="Pattern props (on Calendar)" props={[
        { name: "mode", type: '"single" | "range"', description: "Selection mode" },
        { name: "selected", type: "Date | { from, to }", description: "Current selection" },
        { name: "onSelect", type: "(value) => void", description: "Called when the user picks a day" },
        { name: "numberOfMonths", type: "number", default: "1", description: "Months to show side-by-side" },
        { name: "captionLayout", type: '"buttons" | "dropdown"', default: '"buttons"', description: "Navigation style — dropdown for wide year ranges" },
        { name: "defaultMonth", type: "Date", description: "Initially visible month" },
        { name: "startMonth", type: "Date", description: "Earliest navigable month" },
        { name: "endMonth", type: "Date", description: "Latest navigable month" },
        { name: "locale", type: "string", default: '"en-US"', description: "BCP 47 locale for month/day names" },
      ]} />
    </>
  )
}
