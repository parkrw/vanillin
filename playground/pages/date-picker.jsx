import { useState } from "react"
import { Button } from "../../ui/button/button.jsx"
import { Calendar } from "../../ui/calendar/calendar.jsx"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "../../ui/popover/popover.jsx"
import { DateInput } from "../../ui/date-input/date-input.jsx"
import { TimePicker } from "../../ui/time-picker/time-picker.jsx"
import "../../ui/date-picker/date-picker.css"
import "../../ui/date-input/date-input.css"
import "../../ui/time-picker/time-picker.css"

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

  /* Date-input + calendar popover composition */
  const [typedDate, setTypedDate] = useState(null)
  const [typedOpen, setTypedOpen] = useState(false)

  /* Datetime composition */
  const [dtDate, setDtDate] = useState(null)
  const [dtTime, setDtTime] = useState({ hour: 9, minute: 0, second: 0 })
  const [dtOpen, setDtOpen] = useState(false)

  return (
    <>
      <h2>Date Picker</h2>
      <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBlockEnd: "1rem" }}>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          Selected:{" "}
          <span data-pg="dp-dob-state">
            {dob ? dob.toISOString().slice(0, 10) : "none"}
          </span>
        </p>
      </section>

      {/* ---- Typeable date input + calendar popover ---- */}

      <section className="pg-section">
        <h3>Typeable date input + calendar</h3>
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBlockEnd: "0.5rem" }}>
          Type a natural date (<code>tomorrow</code>, <code>next fri</code>, <code>3/4/25</code>)
          and blur to parse. The calendar syncs.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "start" }}>
          <DateInput
            value={typedDate}
            onChange={(d) => {
              setTypedDate(d)
              if (d) setTypedOpen(false)
            }}
            placeholder="Type a date…"
            data-pg="dp-typed-input"
            style={{ minInlineSize: "15rem" }}
          />
          <Popover open={typedOpen} onOpenChange={setTypedOpen}>
            <PopoverTrigger as={Button} variant="outline" size="icon" data-pg="dp-typed-trigger">
              <CalendarIcon />
            </PopoverTrigger>
            <PopoverContent className="date-picker-popover" align="start" data-pg="dp-typed-content">
              <Calendar
                mode="single"
                selected={typedDate}
                onSelect={(d) => {
                  setTypedDate(d)
                  setTypedOpen(false)
                }}
                defaultMonth={typedDate ?? new Date(2026, 0, 1)}
                locale="en-US"
                data-pg="dp-typed-calendar"
              />
            </PopoverContent>
          </Popover>
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          Selected:{" "}
          <span data-pg="dp-typed-state">
            {typedDate ? typedDate.toISOString().slice(0, 10) : "none"}
          </span>
        </p>
      </section>

      {/* ---- Datetime composition ---- */}

      <section className="pg-section">
        <h3>Datetime (date input + time picker)</h3>
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)", marginBlockEnd: "0.5rem" }}>
          Compose DateInput and TimePicker for a full datetime value.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "start", flexWrap: "wrap" }}>
          <DateInput
            value={dtDate}
            onChange={setDtDate}
            placeholder="Date…"
            data-pg="dp-dt-date"
            style={{ minInlineSize: "12rem" }}
          />
          <Popover open={dtOpen} onOpenChange={setDtOpen}>
            <PopoverTrigger as={Button} variant="outline" size="icon" data-pg="dp-dt-cal-trigger">
              <CalendarIcon />
            </PopoverTrigger>
            <PopoverContent className="date-picker-popover" align="start">
              <Calendar
                mode="single"
                selected={dtDate}
                onSelect={(d) => { setDtDate(d); setDtOpen(false) }}
                defaultMonth={dtDate ?? new Date(2026, 0, 1)}
                locale="en-US"
              />
            </PopoverContent>
          </Popover>
          <TimePicker
            value={dtTime}
            onChange={setDtTime}
            data-pg="dp-dt-time"
          />
        </div>
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          Value:{" "}
          <span data-pg="dp-dt-state">
            {dtDate
              ? `${dtDate.toISOString().slice(0, 10)} ${String(dtTime.hour).padStart(2, "0")}:${String(dtTime.minute).padStart(2, "0")}`
              : "no date"}
          </span>
        </p>
      </section>

      {/* ---- Standalone time picker ---- */}

      <section className="pg-section">
        <h3>Time picker (standalone)</h3>
        <TimePickerDemo />
      </section>

      {/* ---- Parser grammar reference ---- */}

      <section className="pg-section">
        <h3>Parser reference</h3>
        <div style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", lineHeight: 1.6 }}>
          <p><strong>Accepted grammar</strong> (case-insensitive):</p>
          <ul style={{ paddingInlineStart: "1.25rem", marginBlock: "0.5rem" }}>
            <li><code>today</code>, <code>tomorrow</code>, <code>yesterday</code></li>
            <li>Weekday names, bare or with <code>next</code>/<code>last</code>: <code>friday</code>, <code>next fri</code>, <code>last monday</code></li>
            <li>Relative: <code>in 3 days</code>, <code>in 2 weeks</code>, <code>in 1 month</code>, <code>5 days ago</code></li>
            <li>Month-name forms: <code>4 mar</code>, <code>mar 4</code>, <code>march 4 2025</code>, <code>march 4, 2025</code></li>
            <li>Numeric dates in the <strong>locale's field order</strong> (derived from <code>Intl.DateTimeFormat.formatToParts</code>): <code>3/4/25</code> is March 4 in en-US, 3 April in en-GB. Separators: <code>/</code> <code>-</code> <code>.</code></li>
          </ul>

          <p><strong>Two-digit years</strong> use a sliding window: current year −80 to +20. In 2026, <code>46</code> resolves to 2046 and <code>47</code> to 1947.</p>

          <p><strong>Blur canonicalisation:</strong> on blur, the field reformats to the locale's
          medium date style (e.g. "Mar 4, 2025" in en-US). Unparseable text stays as typed,
          the field shows <code>aria-invalid</code>, and a live region announces "Unrecognised date format".</p>

          <p style={{ marginBlockStart: "0.5rem" }}><strong>Deliberately out of scope:</strong></p>
          <ul style={{ paddingInlineStart: "1.25rem", marginBlock: "0.25rem" }}>
            <li>Time-of-day inside the date string (<code>march 4 3pm</code>)</li>
            <li>Date ranges in one string (<code>march 4 - march 10</code>)</li>
            <li>Complex relative expressions (<code>the first monday of next month</code>)</li>
            <li>Languages beyond what <code>Intl</code> month/weekday names provide</li>
          </ul>

          <p style={{ marginBlockStart: "0.5rem" }}><strong>Timezones:</strong> everything is local-time <code>Date</code>. A timezone-aware picker
          needs <code>Temporal</code>; that is a future task, not half-solved here.</p>
        </div>
      </section>
    </>
  )
}

/* ---------- standalone time-picker demo ---------- */

function TimePickerDemo() {
  const [time, setTime] = useState({ hour: 14, minute: 30, second: 0 })
  const [time24, setTime24] = useState({ hour: 14, minute: 30, second: 0 })
  const [timeSec, setTimeSec] = useState({ hour: 9, minute: 15, second: 45 })
  const pad = (n) => String(n).padStart(2, "0")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBlockEnd: "0.25rem" }}>
          12-hour (en-US default)
        </p>
        <TimePicker value={time} onChange={setTime} data-pg="dp-time-12h" />
        <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginInlineStart: "0.5rem" }}
          data-pg="dp-time-12h-state"
        >
          {pad(time.hour)}:{pad(time.minute)}
        </span>
      </div>
      <div>
        <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBlockEnd: "0.25rem" }}>
          24-hour (forced)
        </p>
        <TimePicker value={time24} onChange={setTime24} hour12={false} data-pg="dp-time-24h" />
        <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginInlineStart: "0.5rem" }}
          data-pg="dp-time-24h-state"
        >
          {pad(time24.hour)}:{pad(time24.minute)}
        </span>
      </div>
      <div>
        <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBlockEnd: "0.25rem" }}>
          With seconds
        </p>
        <TimePicker value={timeSec} onChange={setTimeSec} showSeconds data-pg="dp-time-sec" />
        <span style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginInlineStart: "0.5rem" }}
          data-pg="dp-time-sec-state"
        >
          {pad(timeSec.hour)}:{pad(timeSec.minute)}:{pad(timeSec.second)}
        </span>
      </div>
    </div>
  )
}
