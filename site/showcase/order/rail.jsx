import { useEffect, useRef, useState } from "react"
import { cn } from "../../../lib/cn.js"
import { Button } from "../../../ui/button/button.jsx"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../ui/collapsible/collapsible.jsx"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../../ui/hover-card/hover-card.jsx"
import { LiveValue } from "../../../ui/live-value/live-value.jsx"
import { AlertCircleIcon, ChevronDownIcon, ChevronRightIcon, InfoIcon, PinIcon, RocketIcon } from "../icons.jsx"
import { HOURS_PER_MONTH, money, moneyHr, siteName, stepOfField } from "./pricing.js"
import "../../../ui/button/button.css"
import "../../../ui/collapsible/collapsible.css"
import "../../../ui/hover-card/hover-card.css"
import "../../../ui/live-value/live-value.css"

/* ui/live-value flashes the direction and then clears it; the total keeps
   glowing in the colour of its last move until the next one. */
export function useTrend(value) {
  const prev = useRef(value)
  const [trend, setTrend] = useState(null)
  useEffect(() => {
    if (value > prev.current) setTrend("up")
    else if (value < prev.current) setTrend("down")
    prev.current = value
  }, [value])
  return trend
}

const GROUPS = ["Compute", "Network", "Storage", "Protection", "Licences"]

/* The itemised receipt: monthly and hourly per line, Change beside each. */
export function Receipt({ lines, cost, onChange, className }) {
  const taxLine = lines.find((l) => l.tax)
  return (
    <div className={cn("ck-receipt", className)}>
      {GROUPS.filter((g) => lines.some((l) => l.group === g)).map((g) => (
        <div key={g} className="ck-receipt-group">
          <div className="ck-receipt-group-name">{g}</div>
          {lines.filter((l) => l.group === g).map((l) => (
            <div key={l.id} className="ck-receipt-line" data-line={l.id}>
              <span className="ck-receipt-label">
                {l.label}
                {l.meta && <span className="ck-receipt-meta">{l.meta}</span>}
              </span>
              <span className="ck-receipt-hr">{l.amount ? `${moneyHr(l.amount)}/hr` : ""}</span>
              <span className="ck-receipt-amount">{l.amount ? `${money(l.amount)}/mo` : "included"}</span>
              {onChange && (
                <button type="button" className="ck-receipt-change" onClick={() => onChange(l.step, l.field)} aria-label={`Change ${l.label}`}>
                  Change
                </button>
              )}
            </div>
          ))}
        </div>
      ))}
      <div className="ck-receipt-foot">
        <div className="ck-receipt-line ck-receipt-line--sum">
          <span className="ck-receipt-label">Subtotal</span>
          <span className="ck-receipt-hr">{moneyHr(cost.total)}/hr</span>
          <span className="ck-receipt-amount">{money(cost.total)}/mo</span>
          {onChange && <span />}
        </div>
        {taxLine && (
          <div className="ck-receipt-line" data-line="tax">
            <span className="ck-receipt-label">
              {taxLine.label}
              <span className="ck-receipt-meta">{taxLine.meta}</span>
            </span>
            <span className="ck-receipt-hr">{moneyHr(taxLine.amount)}/hr</span>
            <span className="ck-receipt-amount">{money(taxLine.amount)}/mo</span>
            {onChange && (
              <button type="button" className="ck-receipt-change" onClick={() => onChange(taxLine.step, taxLine.field)} aria-label="Change site">
                Change
              </button>
            )}
          </div>
        )}
        <div className="ck-receipt-line ck-receipt-line--total">
          <span className="ck-receipt-label">Total with tax</span>
          <span className="ck-receipt-hr">{moneyHr(cost.totalWithTax)}/hr</span>
          <span className="ck-receipt-amount">{money(cost.totalWithTax)}/mo</span>
          {onChange && <span />}
        </div>
        <p className="ck-receipt-note">Monthly figures are a {HOURS_PER_MONTH}-hour estimate; usage bills hourly at month end.</p>
      </div>
    </div>
  )
}

/* The live total: blue on the way up, orange on the way down, the receipt
   in a hover card that a click pins open. */
export function TotalPrice({ cost, receipt, onChange, compact = false }) {
  const [hovering, setHovering] = useState(false)
  const [pinned, setPinned] = useState(false)
  const trend = useTrend(cost.total)
  useEffect(() => {
    if (!pinned) return
    const onKey = (e) => {
      if (e.key === "Escape") setPinned(false)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [pinned])
  const go = (step, field) => {
    setPinned(false)
    setHovering(false)
    onChange?.(step, field)
  }
  return (
    <div className={cn("ck-order-total-block", compact && "ck-order-total-block--compact")}>
      <HoverCard open={hovering || pinned} onOpenChange={setHovering} openDelay={200} closeDelay={150}>
        <HoverCardTrigger
          as="button"
          type="button"
          className="hover-card-trigger ck-order-total-glow"
          data-last-trend={trend ?? undefined}
          data-pinned={pinned || undefined}
          aria-pressed={pinned}
          aria-label={`${money(cost.total)} a month before tax. ${pinned ? "Receipt pinned; press to release." : "Hover for the itemised receipt; press to pin it open."}`}
          onClick={() => setPinned((p) => !p)}
        >
          <LiveValue value={cost.total} format={money} className="ck-order-total-live" />
          <span className="ck-order-total-unit">/mo</span>
        </HoverCardTrigger>
        <HoverCardContent className="ck-order-receipt-card" side="bottom" align="end">
          <div className="ck-order-receipt-head">
            <span className="ck-spec-title">Itemised receipt</span>
            {pinned ? (
              <Button variant="ghost" size="sm" className="ck-order-unpin" onClick={() => setPinned(false)}>
                <PinIcon />
                Unpin
              </Button>
            ) : (
              <span className="ck-option-desc">click the total to pin</span>
            )}
          </div>
          <Receipt lines={receipt} cost={cost} onChange={go} />
        </HoverCardContent>
      </HoverCard>
      <div className="ck-order-total-rates">
        <LiveValue value={cost.total} format={moneyHr} className="ck-order-total-hr" />
        <span className="ck-order-total-hr-unit">/hr</span>
        <span className="ck-order-total-sep">·</span>
        <span className="ck-order-total-est">{money(cost.total)}/mo <em>{HOURS_PER_MONTH}-hour estimate</em></span>
      </div>
      <p className="ck-order-total-note">
        <InfoIcon />
        {pinned ? "Receipt pinned · click the total or press Esc to release it" : "Hover the total for the itemised receipt · click to pin it open"}
      </p>
    </div>
  )
}

function IssueList({ issues, onGo }) {
  if (issues.size === 0) return null
  return (
    <ul className="ck-order-rail-issues" aria-label="Problems to fix">
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

/* Desktop: the sticky right rail. Mobile: a compact bar pinned to the
   bottom whose receipt folds open. Both render; the container query shows
   one. */
export function PriceRail({ draft, cost, receipt, step, next, issues, onGo, onNext, totals, onDeploy, deployLabel, canDeploy, deployReason }) {
  const cta =
    step === "review" ? (
      <Button size="lg" className="ck-order-cta" disabled={!canDeploy} onClick={onDeploy} title={canDeploy ? undefined : deployReason}>
        <RocketIcon />
        {deployLabel}
      </Button>
    ) : next ? (
      <Button size="lg" className="ck-order-continue" onClick={onNext}>
        Continue to {next.label}
        <ChevronRightIcon />
      </Button>
    ) : null
  const whole = (
    <div className="ck-order-rail-order">
      <span className="ck-order-rail-order-label">Whole order</span>
      <strong>{money(totals.total)}/mo</strong>
      <span className="ck-option-desc">
        {totals.vdcs} vDC{totals.vdcs === 1 ? "" : "s"} · {money(totals.totalWithTax)}/mo with tax
      </span>
    </div>
  )
  return (
    <>
      <aside className="ck-order-rail" aria-label="Price summary">
        <div className="ck-order-rail-card">
          <div className="ck-order-rail-name">
            <code className="ck-mono">{draft.name || "unnamed"}</code>
            <span>{siteName(draft.site)}</span>
          </div>
          <TotalPrice cost={cost} receipt={receipt} onChange={onGo} />
          {cta}
          {!canDeploy && step === "review" && deployReason && <p className="ck-order-rail-reason">{deployReason}</p>}
          <IssueList issues={issues} onGo={onGo} />
          {whole}
        </div>
      </aside>
      <Collapsible className="ck-order-mobile">
        <div className="ck-order-mobile-row">
          <CollapsibleTrigger className="ck-order-mobile-toggle" aria-label="Order details">
            <ChevronDownIcon />
            <span className="ck-order-mobile-total">
              <LiveValue value={cost.total} format={money} className="ck-order-mobile-live" />
              <span>/mo · {moneyHr(cost.total)}/hr</span>
            </span>
          </CollapsibleTrigger>
          {cta}
        </div>
        <CollapsibleContent>
          <div className="ck-order-mobile-body">
            <Receipt lines={receipt} cost={cost} onChange={onGo} />
            <IssueList issues={issues} onGo={onGo} />
            {whole}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </>
  )
}
