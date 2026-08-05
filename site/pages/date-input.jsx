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
import "../../ui/date-input/date-input.css"
import "../../ui/time-picker/time-picker.css"
/* .date-picker-popover is the shared popover-around-a-calendar pattern class. */
import "../../ui/date-picker/date-picker.css"

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

export default function DateInputPage() {
  const [typedDate, setTypedDate] = useState(null)
  const [typedOpen, setTypedOpen] = useState(false)

  /* Datetime composition */
  const [dtDate, setDtDate] = useState(null)
  const [dtTime, setDtTime] = useState({ hour: 9, minute: 0, second: 0 })
  const [dtOpen, setDtOpen] = useState(false)

  return (
    <>
      <h2>Date Input</h2>
      <p className="pg-desc" style={{ marginBlockEnd: "1rem" }}>
        A text field that parses natural-language dates on blur, using a zero-dependency
        parser over <code>Intl</code>. Pairs with <code>Calendar</code> in a popover, or with{" "}
        <code>TimePicker</code> for a full datetime.
      </p>

      <section className="pg-section">
        <h3>Typeable date input + calendar</h3>
        <p className="pg-desc" style={{ marginBlockEnd: "0.5rem" }}>
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
        <p className="pg-desc">
          Selected:{" "}
          <span data-pg="dp-typed-state">
            {typedDate ? typedDate.toISOString().slice(0, 10) : "none"}
          </span>
        </p>
      </section>

      <section className="pg-section">
        <h3>Datetime (date input + time picker)</h3>
        <p className="pg-desc" style={{ marginBlockEnd: "0.5rem" }}>
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
        <p className="pg-desc">
          Value:{" "}
          <span data-pg="dp-dt-state">
            {dtDate
              ? `${dtDate.toISOString().slice(0, 10)} ${String(dtTime.hour).padStart(2, "0")}:${String(dtTime.minute).padStart(2, "0")}`
              : "no date"}
          </span>
        </p>
      </section>

      <section className="pg-section">
        <h3>Parser reference</h3>
        <div className="pg-detail" style={{ lineHeight: 1.6 }}>
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
