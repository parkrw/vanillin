import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useDirection } from "../../lib/direction.jsx"

/* ---------- dates: native Date at local midnight, no library ---------- */

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1)
const addDays = (date, count) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + count)
const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
const isSameDay = (a, b) => !!a && !!b && startOfDay(a).getTime() === startOfDay(b).getTime()
const isSameMonth = (a, b) =>
  !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()

/** Month arithmetic that keeps the day of month, clamped to the target month. */
function addMonths(date, count) {
  const target = new Date(date.getFullYear(), date.getMonth() + count, 1)
  target.setDate(Math.min(date.getDate(), daysInMonth(target)))
  return target
}

const monthKey = (date) => date.getFullYear() * 12 + date.getMonth()
const dayKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

/** Locale's first weekday as 0=Sunday. `getWeekInfo` counts 1=Monday…7=Sunday. */
function firstDayOfWeek(locale) {
  try {
    const info = new Intl.Locale(locale ?? navigator.language).getWeekInfo?.()
    return info ? info.firstDay % 7 : 0
  } catch {
    return 0
  }
}

/**
 * react-day-picker's matcher shapes: a date, a list, a predicate, an
 * inclusive `{ from, to }` range, an exclusive `{ before, after }` interval,
 * or `{ dayOfWeek }`.
 */
function matches(date, matcher) {
  if (!matcher) return false
  if (Array.isArray(matcher)) return matcher.some((entry) => matches(date, entry))
  if (typeof matcher === "function") return matcher(date)
  if (matcher instanceof Date) return isSameDay(date, matcher)

  const time = startOfDay(date).getTime()
  if (matcher.dayOfWeek !== undefined)
    return [].concat(matcher.dayOfWeek).includes(date.getDay())
  if (matcher.from || matcher.to) {
    const from = matcher.from ? startOfDay(matcher.from).getTime() : -Infinity
    const to = matcher.to ? startOfDay(matcher.to).getTime() : Infinity
    return time >= Math.min(from, to) && time <= Math.max(from, to)
  }
  const afterOk = matcher.after ? time > startOfDay(matcher.after).getTime() : true
  const beforeOk = matcher.before ? time < startOfDay(matcher.before).getTime() : true
  return matcher.after || matcher.before ? afterOk && beforeOk : false
}

function buildWeeks(month, weekStartsOn) {
  const first = startOfMonth(month)
  const lead = (first.getDay() - weekStartsOn + 7) % 7
  const start = addDays(first, -lead)
  const weekCount = Math.ceil((lead + daysInMonth(month)) / 7)
  return Array.from({ length: weekCount }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day))
  )
}

/* ---------- component ---------- */

/**
 * Month grid with a roving tabindex, driven by native `Date`/`Intl`.
 * `mode="single"` for now; `selected` shape follows the mode.
 */
export function Calendar({
  mode = "single",
  selected,
  defaultSelected,
  onSelect,
  month,
  defaultMonth,
  onMonthChange,
  showOutsideDays = true,
  captionLayout = "label",
  startMonth,
  endMonth,
  disabled,
  locale,
  weekStartsOn,
  buttonVariant = "ghost",
  className,
  ...props
}) {
  const rootRef = useRef(null)
  const pendingFocusRef = useRef(null)
  const captionId = useId()
  const direction = useDirection()
  const today = useMemo(() => startOfDay(new Date()), [])

  const [value, setValue] = useControllableState({
    value: selected,
    defaultValue: defaultSelected,
    onChange: onSelect,
  })

  const [displayed, setDisplayed] = useControllableState({
    value: month === undefined ? undefined : startOfMonth(month),
    defaultValue: startOfMonth(defaultMonth ?? firstSelectedDate(mode, selected ?? defaultSelected) ?? today),
    onChange: onMonthChange,
  })

  const [focused, setFocused] = useState(null)
  const weekStart = weekStartsOn ?? firstDayOfWeek(locale)

  const formatters = useMemo(
    () => ({
      caption: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
      weekdayShort: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
      day: new Intl.DateTimeFormat(locale, { dateStyle: "long" }),
    }),
    [locale]
  )

  const outOfBounds = useCallback(
    (date) =>
      (startMonth !== undefined && monthKey(date) < monthKey(startMonth)) ||
      (endMonth !== undefined && monthKey(date) > monthKey(endMonth)),
    [endMonth, startMonth]
  )

  const isDisabled = useCallback(
    (date) => outOfBounds(date) || matches(date, disabled),
    [disabled, outOfBounds]
  )

  const isSelected = useCallback((date) => selectionMatches(mode, value, date), [mode, value])

  // The roving tab stop: wherever focus was left, else the selection, else
  // today, else the first of the month — as long as it is in view.
  const activeDate = useMemo(() => {
    const candidates = [focused, firstSelectedDate(mode, value), today]
    for (const candidate of candidates)
      if (candidate && isSameMonth(candidate, displayed)) return candidate
    return startOfMonth(displayed)
  }, [displayed, focused, mode, today, value])

  useEffect(() => {
    const key = pendingFocusRef.current
    if (!key) return
    pendingFocusRef.current = null
    rootRef.current?.querySelector(`[data-day-key="${key}"]`)?.focus()
  })

  const goToMonth = useCallback(
    (next) => {
      const target = startOfMonth(next)
      if (outOfBounds(target)) return
      setDisplayed(target)
    },
    [outOfBounds, setDisplayed]
  )

  const moveFocus = useCallback(
    (target) => {
      if (outOfBounds(target)) return
      setFocused(target)
      pendingFocusRef.current = dayKey(target)
      if (!isSameMonth(target, displayed)) setDisplayed(startOfMonth(target))
    },
    [displayed, outOfBounds, setDisplayed]
  )

  const focusDay = useCallback((date) => {
    setFocused((prev) => (isSameDay(prev, date) ? prev : date))
  }, [])

  const selectDay = useCallback(
    (date) => {
      setFocused(date)
      if (mode === "multiple") {
        setValue((prev) => {
          const list = prev ?? []
          return list.some((entry) => isSameDay(entry, date))
            ? list.filter((entry) => !isSameDay(entry, date))
            : [...list, date].sort((a, b) => a - b)
        })
        return
      }
      if (mode === "range") {
        setValue((prev) => {
          if (!prev?.from || prev.to) return { from: date, to: undefined }
          return date < prev.from ? { from: date, to: prev.from } : { from: prev.from, to: date }
        })
        return
      }
      setValue((prev) => (isSameDay(prev, date) ? undefined : date))
    },
    [mode, setValue]
  )

  const onKeyDown = (event) => {
    const horizontal = direction === "rtl" ? -1 : 1
    const steps = {
      ArrowLeft: -horizontal,
      ArrowRight: horizontal,
      ArrowUp: -7,
      ArrowDown: 7,
    }

    if (steps[event.key] !== undefined) {
      event.preventDefault()
      moveFocus(addDays(activeDate, steps[event.key]))
      return
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault()
      const offset = (activeDate.getDay() - weekStart + 7) % 7
      moveFocus(addDays(activeDate, event.key === "Home" ? -offset : 6 - offset))
      return
    }
    if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault()
      const step = event.key === "PageUp" ? -1 : 1
      moveFocus(addMonths(activeDate, event.shiftKey ? step * 12 : step))
    }
  }

  const previousMonth = addMonths(startOfMonth(displayed), -1)
  const nextMonth = addMonths(startOfMonth(displayed), 1)

  return (
    <div
      ref={rootRef}
      data-slot="calendar"
      className={cn("calendar", className)}
      onKeyDown={onKeyDown}
      {...props}
    >
      <div className="calendar-nav">
        <button
          type="button"
          aria-label="Previous month"
          className={cn("btn", `btn--${buttonVariant}`, "calendar-nav-button")}
          disabled={outOfBounds(previousMonth)}
          onClick={() => goToMonth(previousMonth)}
        >
          <ChevronIcon orientation="start" />
        </button>
        <button
          type="button"
          aria-label="Next month"
          className={cn("btn", `btn--${buttonVariant}`, "calendar-nav-button")}
          disabled={outOfBounds(nextMonth)}
          onClick={() => goToMonth(nextMonth)}
        >
          <ChevronIcon orientation="end" />
        </button>
      </div>

      <div className="calendar-months">
        <CalendarMonth
          month={startOfMonth(displayed)}
          captionId={captionId}
          captionLayout={captionLayout}
          formatters={formatters}
          weekStart={weekStart}
          showOutsideDays={showOutsideDays}
          activeDate={activeDate}
          today={today}
          isDisabled={isDisabled}
          isSelected={isSelected}
          onSelectDay={selectDay}
          onFocusDay={focusDay}
          onMonthChange={goToMonth}
          startMonth={startMonth}
          endMonth={endMonth}
          locale={locale}
        />
      </div>
    </div>
  )
}

function CalendarMonth({
  month,
  captionId,
  captionLayout,
  formatters,
  weekStart,
  showOutsideDays,
  activeDate,
  today,
  isDisabled,
  isSelected,
  onSelectDay,
  onFocusDay,
  onMonthChange,
  startMonth,
  endMonth,
  locale,
}) {
  const weeks = useMemo(() => buildWeeks(month, weekStart), [month, weekStart])
  const weekdays = useMemo(
    () => weeks[0].map((date) => ({
      short: formatters.weekdayShort.format(date),
      long: formatters.weekdayLong.format(date),
    })),
    [formatters, weeks]
  )

  return (
    <div className="calendar-month">
      <div className="calendar-month-caption">
        {captionLayout === "label" ? (
          <span id={captionId} className="calendar-caption-label">
            {formatters.caption.format(month)}
          </span>
        ) : (
          <CalendarDropdowns
            month={month}
            captionId={captionId}
            locale={locale}
            startMonth={startMonth}
            endMonth={endMonth}
            onMonthChange={onMonthChange}
          />
        )}
      </div>

      <table role="grid" aria-labelledby={captionId} className="calendar-month-grid">
        <thead className="calendar-weekdays">
          <tr>
            {weekdays.map((weekday) => (
              <th key={weekday.long} scope="col" abbr={weekday.long} className="calendar-weekday">
                {weekday.short}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={dayKey(week[0])} className="calendar-week">
              {week.map((date) => {
                const outside = !isSameMonth(date, month)
                if (outside && !showOutsideDays)
                  return <td key={dayKey(date)} className="calendar-day calendar-day--hidden" />
                const selected = isSelected(date)
                return (
                  <td
                    key={dayKey(date)}
                    role="presentation"
                    data-outside={outside ? "" : undefined}
                    data-selected={selected ? "" : undefined}
                    data-today={isSameDay(date, today) ? "" : undefined}
                    className="calendar-day"
                  >
                    <CalendarDayButton
                      date={date}
                      label={formatters.day.format(date)}
                      modifiers={{
                        outside,
                        selected,
                        today: isSameDay(date, today),
                        disabled: isDisabled(date),
                      }}
                      tabIndex={isSameDay(date, activeDate) ? 0 : -1}
                      onClick={() => onSelectDay(date)}
                      // keeps arrow keys relative to wherever focus actually
                      // is, not just to where we last put it
                      onFocus={() => onFocusDay(date)}
                    />
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CalendarDropdowns({ month, captionId, locale, startMonth, endMonth, onMonthChange }) {
  const monthNames = useMemo(() => {
    const format = new Intl.DateTimeFormat(locale, { month: "short" })
    return Array.from({ length: 12 }, (_, index) => format.format(new Date(2024, index, 1)))
  }, [locale])

  const firstYear = (startMonth ?? new Date(month.getFullYear() - 10, 0, 1)).getFullYear()
  const lastYear = (endMonth ?? new Date(month.getFullYear() + 10, 11, 1)).getFullYear()
  const years = Array.from({ length: lastYear - firstYear + 1 }, (_, index) => firstYear + index)

  return (
    <span id={captionId} className="calendar-dropdowns">
      <select
        aria-label="Month"
        className="native-select calendar-dropdown"
        value={month.getMonth()}
        onChange={(event) => onMonthChange(new Date(month.getFullYear(), Number(event.target.value), 1))}
      >
        {monthNames.map((name, index) => (
          <option key={name} value={index}>
            {name}
          </option>
        ))}
      </select>
      <select
        aria-label="Year"
        className="native-select calendar-dropdown"
        value={month.getFullYear()}
        onChange={(event) => onMonthChange(new Date(Number(event.target.value), month.getMonth(), 1))}
      >
        {years.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </span>
  )
}

export function CalendarDayButton({ date, label, modifiers, className, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-selected={modifiers.selected ? "true" : undefined}
      aria-disabled={modifiers.disabled ? "true" : undefined}
      disabled={modifiers.disabled}
      data-day={label}
      data-day-key={dayKey(date)}
      data-outside={modifiers.outside ? "" : undefined}
      data-today={modifiers.today ? "" : undefined}
      data-selected-single={modifiers.selected ? "true" : undefined}
      className={cn("calendar-day-button", className)}
      {...props}
    >
      {date.getDate()}
    </button>
  )
}

function ChevronIcon({ orientation }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={orientation === "start" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  )
}

function firstSelectedDate(mode, value) {
  if (!value) return undefined
  if (mode === "multiple") return value[0]
  if (mode === "range") return value.from
  return value
}

function selectionMatches(mode, value, date) {
  if (!value) return false
  if (mode === "multiple") return value.some((entry) => isSameDay(entry, date))
  if (mode === "range") {
    if (!value.from) return false
    if (!value.to) return isSameDay(value.from, date)
    return matches(date, { from: value.from, to: value.to })
  }
  return isSameDay(value, date)
}
