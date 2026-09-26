import { useEffect, useState } from "react"
import { cn } from "../../../lib/cn.js"
import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert/alert.jsx"
import { Button } from "../../../ui/button/button.jsx"
import { Checkbox } from "../../../ui/checkbox/checkbox.jsx"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../ui/collapsible/collapsible.jsx"
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "../../../ui/field/field.jsx"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../../ui/hover-card/hover-card.jsx"
import { Input } from "../../../ui/input/input.jsx"
import { Label } from "../../../ui/label/label.jsx"
import { RadioGroupItem } from "../../../ui/radio-group/radio-group.jsx"
import { Slider } from "../../../ui/slider/slider.jsx"
import { Switch } from "../../../ui/switch/switch.jsx"
import { ORDER_COPY } from "../console-data.js"
import { AlertCircleIcon, ArrowDownIcon, ChevronRightIcon, InfoIcon, RocketIcon, SparkleIcon } from "../icons.jsx"
import { STEPS, compact, money, stepOfField } from "./pricing.js"
import "../../../ui/alert/alert.css"
import "../../../ui/button/button.css"
import "../../../ui/checkbox/checkbox.css"
import "../../../ui/collapsible/collapsible.css"
import "../../../ui/field/field.css"
import "../../../ui/hover-card/hover-card.css"
import "../../../ui/input/input.css"
import "../../../ui/label/label.css"
import "../../../ui/radio-group/radio-group.css"
import "../../../ui/slider/slider.css"
import "../../../ui/switch/switch.css"

export function OrderSection({ id, title, hint, className, children, aside }) {
  return (
    <section className={cn("ck-order-section", className)} data-section={id}>
      <div className="ck-order-section-head">
        <h5 className="ck-order-section-title">{title}</h5>
        {hint && <p className="ck-order-hint">{hint}</p>}
        {aside}
      </div>
      <div className="ck-order-section-body">{children}</div>
    </section>
  )
}

/* The one error shape: beside the control it belongs to, never a banner. */
export function InlineError({ field, children, className }) {
  if (!children) return null
  return (
    <FieldError className={cn("ck-order-error", className)} data-field={field}>
      <AlertCircleIcon />
      <span>{children}</span>
    </FieldError>
  )
}

/* "Recommended" chip, and the one-sentence reason next to it. */
export function Recommended({ reason, className }) {
  return (
    <span className={cn("ck-recommended", className)}>
      <SparkleIcon />
      Recommended
      {reason && <span className="ck-recommended-reason">{reason}</span>}
    </span>
  )
}

/* Price movement for an option that is not chosen yet. */
export function Delta({ amount, included }) {
  if (included) return <span className="ck-delta ck-delta--included">included</span>
  if (!amount) return <span className="ck-delta">no change</span>
  return (
    <span className="ck-delta" data-sign={amount > 0 ? "up" : "down"}>
      {amount > 0 ? "+" : "−"}{money(Math.abs(amount))}/mo
    </span>
  )
}

/* A radio row: the kit's item, then the name, a short meta tag and the
   one-sentence description. A blocked row stays visible and says why. */
export function OptionRow({ value, name, meta, description, badge, delta, disabled, reason, recommended }) {
  return (
    <label className="ck-option" data-disabled={disabled || undefined} data-recommended={recommended || undefined}>
      <RadioGroupItem value={value} aria-label={name} disabled={disabled} />
      <span className="ck-option-text">
        <span className="ck-option-name">
          {name}
          {meta && <span className="ck-option-meta">{meta}</span>}
          {badge}
        </span>
        <span className="ck-option-desc">{description}</span>
        {disabled && reason && <span className="ck-option-reason">{reason}</span>}
      </span>
      {delta !== undefined && <span className="ck-option-delta">{delta}</span>}
    </label>
  )
}

/* A switch or checkbox with its title and one sentence, on the kit's field. */
export function SwitchRow({ id, title, meta, description, checked, onCheckedChange, disabled, reason, delta }) {
  return (
    <Field orientation="horizontal" className="ck-switch-row" data-disabled={disabled || undefined}>
      <FieldContent>
        <FieldLabel htmlFor={id}>
          {title}
          {meta && <span className="ck-option-meta">{meta}</span>}
          {delta}
        </FieldLabel>
        <FieldDescription>{description}</FieldDescription>
        {disabled && reason && <span className="ck-option-reason">{reason}</span>}
      </FieldContent>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </Field>
  )
}

/* A free option on one line: the checkbox, its name, and the reason in a
   muted clause after it. No card, no switch: it is a small yes or no. */
export function CheckLine({ id, title, note, checked, onCheckedChange, disabled, className }) {
  return (
    <div className={cn("ck-check-line", className)} data-disabled={disabled || undefined}>
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <span className="ck-check-line-text">
        <Label htmlFor={id} className="ck-check-line-label">{title}</Label>
        {note && <span className="ck-check-line-note"> {note}</span>}
      </span>
    </div>
  )
}

export function CheckRow({ id, title, meta, description, checked, onCheckedChange, disabled, reason, delta }) {
  return (
    <Field orientation="horizontal" className="ck-check-row" data-disabled={disabled || undefined}>
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <FieldContent>
        <FieldLabel htmlFor={id}>
          {title}
          {meta && <span className="ck-option-meta">{meta}</span>}
          {delta}
        </FieldLabel>
        <FieldDescription>{description}</FieldDescription>
        {disabled && reason && <span className="ck-option-reason">{reason}</span>}
      </FieldContent>
    </Field>
  )
}

/* A small spec table inside a hover card, for the figures a label cannot hold. */
export function SpecCard({ title, rows, children }) {
  return (
    <HoverCard openDelay={150} closeDelay={100}>
      <HoverCardTrigger as="span" className="ck-hint" tabIndex={0}>
        {children}
        <InfoIcon />
      </HoverCardTrigger>
      <HoverCardContent className="ck-spec-card" side="top">
        <div className="ck-spec-title">{title}</div>
        <dl className="ck-spec-list">
          {rows.map(([k, v]) => (
            <div key={k} className="ck-spec-row">
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </HoverCardContent>
    </HoverCard>
  )
}

/* Snap a typed figure onto the slider's grid. */
const snap = (raw, { min, max, step }, fallback) => {
  const n = Number(raw)
  if (raw === "" || !Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, min + Math.round((n - min) / step) * step))
}

/* Label, rate and price on one line, the track under it, then the ticks
   that make the range legible. The number input is bound to the track, so
   the slider is never the only way in (ui/slider has no input of its own,
   #42). `tick` is the label interval; the ends are always marked. */
export function SliderRow({ name, label, unit, value, min, max, step, tick, onChange, price, rate, description, disabled, error, field }) {
  const ticks = [min]
  for (let v = Math.ceil(min / tick) * tick; v < max; v += tick) if (v > min) ticks.push(v)
  ticks.push(max)
  const at = (v) => `${((v - min) / (max - min)) * 100}%`
  const [text, setText] = useState(String(value))
  const [editing, setEditing] = useState(false)
  useEffect(() => {
    if (!editing) setText(String(value))
  }, [value, editing])
  const commit = () => {
    setEditing(false)
    const next = snap(text, { min, max, step }, value)
    setText(String(next))
    if (next !== value) onChange(next)
  }
  return (
    <div className="ck-slider-row" data-disabled={disabled || undefined} data-field={field}>
      <div className="ck-slider-head">
        <span className="ck-slider-label">{label ?? name}</span>
        <span className="ck-slider-rate">{rate}</span>
        <span className="ck-slider-value">
          <Input
            type="number"
            inputMode="numeric"
            className="ck-slider-input"
            aria-label={`${name} value`}
            value={text}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onFocus={() => setEditing(true)}
            onChange={(e) => setText(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur()
            }}
          />
          {unit && <span className="ck-slider-unit">{unit}</span>}
        </span>
        <span className="ck-slider-price">{money(price)}/mo</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        aria-label={name}
      />
      <div className="ck-slider-ticks" aria-hidden="true">
        {ticks.map((t) => (
          <span key={t} className="ck-slider-tick" style={{ insetInlineStart: at(t) }}>
            {compact(t)}
          </span>
        ))}
      </div>
      <p className="ck-option-desc">{description}</p>
      <InlineError field={field}>{error}</InlineError>
    </div>
  )
}

export function PriceLine({ name, meta, price, description }) {
  return (
    <>
      <div className="ck-order-line">
        <span className="ck-order-line-name">{name}</span>
        {meta && <span className="ck-order-line-meta">{meta}</span>}
        <span className="ck-order-line-price">{money(price)}/mo</span>
      </div>
      {description && <p className="ck-option-desc">{description}</p>}
    </>
  )
}

/* Advanced options fold away behind one line; the spacing lives on the
   inner wrapper so the close animation can reach zero (docs/QUIRKS.md). */
export function Disclosure({ id, label, hint, defaultOpen = false, className, children }) {
  return (
    <Collapsible defaultOpen={defaultOpen} className={cn("ck-disclosure", className)} data-disclosure={id}>
      <CollapsibleTrigger className="ck-disclosure-trigger">
        <ChevronRightIcon />
        <span className="ck-disclosure-label">{label}</span>
        {hint && <span className="ck-disclosure-hint">{hint}</span>}
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ck-disclosure-body">{children}</div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/* Every visible problem as a link to the control that fixes it. */
export function IssueList({ issues, onGo }) {
  if (issues.size === 0) return null
  return (
    <ul className="ck-order-issues" aria-label="Problems to fix">
      {[...issues].map(([field, message]) => (
        <li key={field}>
          <button type="button" className="ck-order-issue" data-field={field} onClick={() => onGo(stepOfField(field), field)}>
            <AlertCircleIcon />
            <span>{message}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}

/* A step that waits on earlier ones says so in one alert, each problem
   with a link to the step that fixes it. */
export function IssueGate({ title, lede, issues, onGo }) {
  if (issues.size === 0) return null
  return (
    <Alert variant="destructive" className="ck-order-gate" data-issues={issues.size}>
      <AlertCircleIcon />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {lede}
        <ul className="ck-order-gate-list">
          {[...issues].map(([field, message]) => (
            <li key={field}>
              <span>{message}</span>
              <Button variant="link" size="sm" className="ck-order-fix" onClick={() => onGo(stepOfField(field), field)}>
                Fix in {STEPS.find((s) => s.id === stepOfField(field)).label}
              </Button>
            </li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}

/* The end of the step strip: the one way forward, then the way down to
   the machines. Checkout has neither: its table is on the step, and its
   CTA is Deploy, in the foot under that table. */
export function StripActions({ next, onNext, machines, onJump }) {
  if (!next) return null
  return (
    <div className="ck-order-strip-actions">
      <Button className="ck-order-continue" onClick={onNext}>
        Continue to {next.label}
        <ChevronRightIcon />
      </Button>
      <Button variant="outline" className="ck-order-jump" onClick={onJump}>
        <ArrowDownIcon />
        <span className="ck-sr-only">Scroll to the </span>Machines
        <span className="ck-order-jump-count">{machines}</span>
      </Button>
    </div>
  )
}

/* Under whichever step is open: what still needs fixing, and on Checkout
   the deploy summary at the row's start with Deploy at its end. A step
   with nothing to say has no foot. */
export function StepFooter({ step, issues, onGo, summary, onDeploy, deployLabel, canDeploy, deployReason }) {
  const checkout = step === "checkout"
  if (!checkout && issues.size === 0) return null
  return (
    <div className="ck-order-foot">
      <IssueList issues={issues} onGo={onGo} />
      {checkout && (
        <div className="ck-order-foot-row">
          {summary && (
            <div className="ck-order-foot-summary">
              <span className="ck-order-deploy-title">{summary}</span>
              <span className="ck-option-desc">{ORDER_COPY.dueToday}</span>
              {!canDeploy && deployReason && <span className="ck-order-deploy-reason">{deployReason}</span>}
            </div>
          )}
          <Button size="lg" className="ck-order-cta" disabled={!canDeploy} onClick={onDeploy} title={canDeploy ? undefined : deployReason}>
            <RocketIcon />
            {deployLabel}
          </Button>
        </div>
      )}
    </div>
  )
}
