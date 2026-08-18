import { useEffect, useRef } from "react"
import { Badge } from "../../../ui/badge/badge.jsx"
import { Progress } from "../../../ui/progress/progress.jsx"
import { StatusDot } from "../../../ui/status-dot/status-dot.jsx"
import { STATUS_WIDGETS } from "./panels-data.js"

import "../../../ui/badge/badge.css"
import "../../../ui/progress/progress.css"
import "../../../ui/status-dot/status-dot.css"
import "./panels.css"

/* Ring geometry. The circumference is baked into panels.css as
   --ackp-circumference, so both files must agree on the radius. */
const RING_RADIUS = 42

/**
 * Where each widget parks when the reader has asked for reduced motion.
 * Spread so the grid still reads as a set of gauges rather than one value.
 */
const staticPercent = (index) => 20 + ((index * 17) % 70)

function Ring() {
  return (
    <svg className="ackp-ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="ackp-ring-track" cx="50" cy="50" r={RING_RADIUS} />
      <circle className="ackp-ring-value" cx="50" cy="50" r={RING_RADIUS} />
    </svg>
  )
}

function Widget({ widget, index }) {
  const isRing = widget.kind === "ring"
  return (
    <div
      className="ackp-widget"
      data-pg="status-widget"
      data-kind={widget.kind}
      data-tone={widget.tone}
      data-duration={widget.duration}
      style={{
        "--ackp-duration": `${widget.duration}s`,
        "--ackp-static": String(staticPercent(index)),
      }}
    >
      <div className="ackp-widget-visual">
        {isRing ? (
          <div
            className="ackp-ring-wrap"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            aria-valuetext="0%"
            aria-label={widget.label}
          >
            <Ring />
            <span className="ackp-readout" data-pg="status-readout">
              0%
            </span>
          </div>
        ) : (
          <div className="ackp-bar-wrap">
            <Progress
              className="ackp-bar"
              value={0}
              aria-label={widget.label}
              data-pg="status-bar"
            />
            <span className="ackp-readout" data-pg="status-readout">
              0%
            </span>
          </div>
        )}
      </div>
      <div className="ackp-widget-meta">
        <StatusDot status={widget.tone} label={null} className="ackp-widget-dot" />
        <div className="ackp-widget-text">
          <span className="ackp-widget-label">{widget.label}</span>
          <span className="ackp-widget-detail">{widget.detail}</span>
        </div>
      </div>
    </div>
  )
}

export function StatusShowcase() {
  const rootRef = useRef(null)

  /*
   * The sweep itself is a CSS animation on the registered custom property
   * --ackp-progress, so the ring and the bar interpolate on the compositor
   * and never re-render React. This effect only mirrors that one value into
   * the readout text and the progressbar's ARIA, which keeps a single source
   * of truth: the animation. Under prefers-reduced-motion the animation is
   * off and the property holds a static value, so one pass is enough.
   */
  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const widgets = [...root.querySelectorAll("[data-pg='status-widget']")].map((el) => ({
      el,
      meter: el.querySelector("[role='progressbar']"),
      readout: el.querySelector("[data-pg='status-readout']"),
    }))

    const sync = () => {
      for (const { el, meter, readout } of widgets) {
        const raw = Number.parseFloat(getComputedStyle(el).getPropertyValue("--ackp-progress"))
        const percent = Math.round(Number.isFinite(raw) ? raw : 0)
        if (readout.textContent !== `${percent}%`) readout.textContent = `${percent}%`
        meter.setAttribute("aria-valuenow", String(percent))
        meter.setAttribute("aria-valuetext", `${percent}%`)
      }
    }

    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    let frame = 0
    const start = () => {
      cancelAnimationFrame(frame)
      if (query.matches) {
        sync()
        return
      }
      const tick = () => {
        sync()
        frame = requestAnimationFrame(tick)
      }
      tick()
    }

    start()
    query.addEventListener("change", start)
    return () => {
      cancelAnimationFrame(frame)
      query.removeEventListener("change", start)
    }
  }, [])

  return (
    <div className="ackp-panel ackp-status" data-pg="panel-status" ref={rootRef}>
      <header className="ackp-panel-head">
        <div className="ackp-panel-heading">
          <h4 className="ackp-panel-title">Operations status</h4>
          <p className="ackp-panel-sub">Live tasks across the Acme Cloud fleet</p>
        </div>
        <div className="ackp-panel-badges">
          <Badge variant="success">8 running</Badge>
          <Badge variant="outline">0 failed</Badge>
        </div>
      </header>

      <div className="ackp-status-grid">
        {STATUS_WIDGETS.map((widget, index) => (
          <Widget key={widget.id} widget={widget} index={index} />
        ))}
      </div>
    </div>
  )
}
