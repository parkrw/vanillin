import { useState } from "react"
import { Button } from "../../ui/button/button.jsx"
import { Calendar } from "../../ui/calendar/calendar.jsx"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../ui/popover/popover.jsx"
import "../../ui/date-picker/date-picker.css"

/* ---------- helpers ---------- */

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

/* ---------- page ---------- */

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
      <p className="pg-desc" style={{ marginBlockEnd: "1rem" }}>
        A composition of <code>Popover</code> + <code>Calendar</code> + <code>Button</code> (no
        standalone component).
      </p>

      <section className="pg-section">
        <h3>Single date</h3>
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
      </section>

      <section className="pg-section">
        <h3>Date range</h3>
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
                // close only after both ends are chosen
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
      </section>

      <section className="pg-section">
        <h3>Date of birth (dropdown caption)</h3>
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
      </section>

    </>
  )
}
