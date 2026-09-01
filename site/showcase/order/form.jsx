import { cn } from "../../../lib/cn.js"
import { Button } from "../../../ui/button/button.jsx"
import { Checkbox } from "../../../ui/checkbox/checkbox.jsx"
import { Field, FieldContent, FieldDescription, FieldLabel } from "../../../ui/field/field.jsx"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../../ui/hover-card/hover-card.jsx"
import { Label } from "../../../ui/label/label.jsx"
import { RadioGroupItem } from "../../../ui/radio-group/radio-group.jsx"
import { Slider } from "../../../ui/slider/slider.jsx"
import { Switch } from "../../../ui/switch/switch.jsx"
import { InfoIcon } from "../icons.jsx"
import { compact, money, siteName } from "./pricing.js"
import "../../../ui/button/button.css"
import "../../../ui/checkbox/checkbox.css"
import "../../../ui/field/field.css"
import "../../../ui/hover-card/hover-card.css"
import "../../../ui/label/label.css"
import "../../../ui/radio-group/radio-group.css"
import "../../../ui/slider/slider.css"
import "../../../ui/switch/switch.css"

export function OrderSection({ title, hint, wide, className, children }) {
  return (
    <section className={cn("ck-order-section", wide && "ck-order-section--wide", className)}>
      <div className="ck-order-section-head">
        <h5 className="ck-order-section-title">{title}</h5>
        {hint && <p className="ck-order-hint">{hint}</p>}
      </div>
      <div className="ck-order-section-body">{children}</div>
    </section>
  )
}

/* A radio row: the kit's item, then the name, a short meta tag and the
   one-sentence description. The label forwards clicks to the button. */
export function OptionRow({ value, name, meta, description }) {
  return (
    <label className="ck-option">
      <RadioGroupItem value={value} aria-label={name} />
      <span className="ck-option-text">
        <span className="ck-option-name">
          {name}
          {meta && <span className="ck-option-meta">{meta}</span>}
        </span>
        <span className="ck-option-desc">{description}</span>
      </span>
    </label>
  )
}

/* A switch or checkbox with its title and one sentence, on the kit's field. */
export function SwitchRow({ id, title, meta, description, checked, onCheckedChange, disabled }) {
  return (
    <Field orientation="horizontal" className="ck-switch-row" data-disabled={disabled || undefined}>
      <FieldContent>
        <FieldLabel htmlFor={id}>
          {title}
          {meta && <span className="ck-option-meta">{meta}</span>}
        </FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </Field>
  )
}

export function CheckRow({ id, title, meta, description, checked, onCheckedChange, disabled }) {
  return (
    <Field orientation="horizontal" className="ck-check-row" data-disabled={disabled || undefined}>
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
      <FieldContent>
        <FieldLabel htmlFor={id}>
          {title}
          {meta && <span className="ck-option-meta">{meta}</span>}
        </FieldLabel>
        <FieldDescription>{description}</FieldDescription>
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

/* Label, rate and price on one line, the track under it, then the ticks
   that make the range legible. `tick` is the label interval; the ends are
   always marked. */
export function SliderRow({ name, label, unit, value, min, max, step, tick, onChange, price, rate, description, disabled }) {
  const ticks = [min]
  for (let v = Math.ceil(min / tick) * tick; v < max; v += tick) if (v > min) ticks.push(v)
  ticks.push(max)
  const at = (v) => `${((v - min) / (max - min)) * 100}%`
  return (
    <div className="ck-slider-row" data-disabled={disabled || undefined}>
      <div className="ck-slider-head">
        <span className="ck-slider-label">{label ?? name}</span>
        <span className="ck-slider-rate">{rate}</span>
        <span className="ck-slider-value">
          {value.toLocaleString("en-US")}
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

/* Sticky strip under every configuration step: what this vDC costs so far,
   and the way to the next step. */
export function DraftBar({ draft, cost, next, onNext }) {
  return (
    <div className="ck-order-bar">
      <span className="ck-order-bar-name">
        <code className="ck-mono">{draft.name}</code> · {siteName(draft.site)}
      </span>
      <span className="ck-order-bar-total">
        {money(cost.total)}<span>/mo</span>
      </span>
      <Button size="sm" onClick={onNext}>Next: {next}</Button>
    </div>
  )
}
