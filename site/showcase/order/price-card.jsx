import { useEffect, useRef, useState } from "react"
import { cn } from "../../../lib/cn.js"
import { Button } from "../../../ui/button/button.jsx"
import { Card, CardContent } from "../../../ui/card/card.jsx"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../../ui/hover-card/hover-card.jsx"
import { LiveValue } from "../../../ui/live-value/live-value.jsx"
import { ORDER_COPY } from "../console-data.js"
import { ChevronRightIcon, InfoIcon, PinIcon } from "../icons.jsx"
import { money, siteName } from "./pricing.js"
import "../../../ui/button/button.css"
import "../../../ui/card/card.css"
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

/* The billed groups, one per step that bills, in the steps' order; each
   knows where its lines are set, so an empty group still leads somewhere. */
const GROUPS = [
  { name: "Compute", step: "infrastructure", field: "cpu" },
  { name: "Network", step: "infrastructure", field: "ips" },
  { name: "Storage", step: "storage", field: "storage" },
  { name: "Backup & DR", step: "bcdr", field: "protection" },
  { name: "Add-ons", step: "addons", field: "addons" },
]

/* The itemised receipt: monthly per line, Change beside each. */
export function Receipt({ lines, cost, onChange, className }) {
  const taxLine = lines.find((l) => l.tax)
  return (
    <div className={cn("ck-receipt", className)}>
      {GROUPS.filter((g) => lines.some((l) => l.group === g.name)).map((g) => (
        <div key={g.name} className="ck-receipt-group">
          <div className="ck-receipt-group-name">{g.name}</div>
          {lines.filter((l) => l.group === g.name).map((l) => (
            <div key={l.id} className="ck-receipt-line" data-line={l.id}>
              <span className="ck-receipt-label">
                {l.label}
                {l.meta && <span className="ck-receipt-meta">{l.meta}</span>}
              </span>
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
          <span className="ck-receipt-amount">{money(cost.total)}/mo</span>
          {onChange && <span />}
        </div>
        {taxLine && (
          <div className="ck-receipt-line" data-line="tax">
            <span className="ck-receipt-label">
              {taxLine.label}
              <span className="ck-receipt-meta">{taxLine.meta}</span>
            </span>
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
          <span className="ck-receipt-amount">{money(cost.totalWithTax)}/mo</span>
          {onChange && <span />}
        </div>
      </div>
    </div>
  )
}

/* The live total: blue on the way up, orange on the way down, the receipt
   in a hover card that a click pins open. The cue under the figure says
   so, and points where the card opens: to the left, over the options,
   where a tall receipt has the room; the anchor maths keep it inside the
   viewport top to bottom, and the card caps itself a rem short of it. */
export function TotalPrice({ cost, receipt, onChange }) {
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
    <div className="ck-order-total-block">
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
          <span className="ck-order-total-figure">
            <LiveValue value={cost.total} format={money} className="ck-order-total-live" />
            <span className="ck-order-total-unit">/mo</span>
          </span>
          <span className="ck-order-total-cue">
            <ChevronRightIcon />
            {pinned ? "Receipt pinned" : "Itemised receipt"}
          </span>
        </HoverCardTrigger>
        <HoverCardContent className="ck-order-receipt-card" side="left" align="start" sideOffset={12}>
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
    </div>
  )
}

/* The price card on the right of the options: this vDC's site, its live
   total with the receipt behind it, one line per billed step that jumps
   there (a step that bills nothing yet still has its line, at zero), the
   sums, then the whole order. */
export function PriceCard({ draft, cost, receipt, totals, committed, onChange }) {
  const groups = GROUPS.map((g) => ({ ...g, amount: receipt.filter((l) => l.group === g.name).reduce((sum, l) => sum + l.amount, 0) }))
  const taxLine = receipt.find((l) => l.tax)
  return (
    <Card className="ck-order-total-card">
      <CardContent className="ck-order-total-body">
        <div className="ck-order-total-head">
          <span className="ck-order-eyebrow">Estimate</span>
          <div className="ck-order-total-name">
            <span>{siteName(draft.site)}</span>
          </div>
        </div>
        <TotalPrice cost={cost} receipt={receipt} onChange={onChange} />
        <div className="ck-order-groups" role="list" aria-label="Monthly by group">
          {groups.map((g) => (
            <button key={g.name} type="button" role="listitem" className="ck-order-group" data-group={g.step} onClick={() => onChange(g.step, g.field)} aria-label={`${g.name}, ${money(g.amount)} a month; change it`}>
              <span className="ck-order-group-name">
                {g.name}
                <ChevronRightIcon />
              </span>
              <span className="ck-order-group-amount">{money(g.amount)}</span>
            </button>
          ))}
        </div>
        <dl className="ck-order-sums">
          <div className="ck-order-sum">
            <dt>Subtotal</dt>
            <dd>{money(cost.total)}</dd>
          </div>
          {taxLine && (
            <div className="ck-order-sum">
              <dt>
                Sales tax <span className="ck-order-sum-meta">{taxLine.meta}</span>
              </dt>
              <dd>{money(taxLine.amount)}</dd>
            </div>
          )}
          <div className="ck-order-sum ck-order-sum--total">
            <dt>Total with tax</dt>
            <dd>
              {money(cost.totalWithTax)}
              <span className="ck-order-sum-unit">/mo</span>
            </dd>
          </div>
        </dl>
        <div className="ck-order-total-order">
          <span className="ck-order-total-order-label">Whole order</span>
          <strong>{money(totals.total)}/mo</strong>
          <span className="ck-option-desc">
            {totals.vdcs} vDC{totals.vdcs === 1 ? "" : "s"}
            {committed > 0 && `, ${committed} in order`} · {money(totals.totalWithTax)}/mo with tax
          </span>
        </div>
        <p className="ck-order-total-note">
          <InfoIcon />
          <span>{ORDER_COPY.dueToday}</span>
        </p>
      </CardContent>
    </Card>
  )
}
