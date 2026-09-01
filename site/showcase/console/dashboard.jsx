import { useTicker } from "../../../lib/use-ticker.js"
import { Badge } from "../../../ui/badge/badge.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card/card.jsx"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../../../ui/hover-card/hover-card.jsx"
import { Item, ItemActions, ItemContent, ItemGroup, ItemTitle } from "../../../ui/item/item.jsx"
import { LiveValue } from "../../../ui/live-value/live-value.jsx"
import { Progress } from "../../../ui/progress/progress.jsx"
import { StatusDot } from "../../../ui/status-dot/status-dot.jsx"
import { EVENTS, HEALTH, INCOMING_EVENTS, STATS, UTILIZATION } from "../console-data.js"
import { drift, history } from "../console-live.js"
import { Dot, TICK_MS, TONE_BADGE } from "../shared.jsx"
import "../../../ui/badge/badge.css"
import "../../../ui/card/card.css"
import "../../../ui/hover-card/hover-card.css"
import "../../../ui/item/item.css"
import "../../../ui/live-value/live-value.css"
import "../../../ui/progress/progress.css"
import "../../../ui/status-dot/status-dot.css"

/* The overview dashboard: every number on it breathes. */

function Sparkline({ points, width = 72, height = 24, max = 100 }) {
  const step = width / (points.length - 1)
  const y = (v) => height - 2 - (v / max) * (height - 4)
  const coords = points.map((v, i) => `${(i * step).toFixed(1)},${y(v).toFixed(1)}`)
  const last = points[points.length - 1]
  return (
    <svg className="ck-spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polygon className="ck-spark-fill" points={`0,${height} ${coords.join(" ")} ${width},${height}`} />
      <polyline points={coords.join(" ")} />
      <circle cx={width} cy={y(last)} r="2" />
    </svg>
  )
}

const SPARK = Object.fromEntries(STATS.map((s, i) => [s.label, drift(`spark:${s.label}`, 40 + i * 8, { spread: 18 })]))
const RUNNING = drift("stat:running", 38, { spread: 1, min: 37, max: 39 })

export function StatCards() {
  const tick = useTicker(TICK_MS)
  return (
    <div className="ck-stats">
      {STATS.map((s) => (
        <HoverCard key={s.label} openDelay={200} closeDelay={150}>
          <HoverCardTrigger as={Card} className="ck-stat">
            <CardContent className="ck-stat-body">
              <div className="ck-stat-num">{s.num}</div>
              <div className="ck-stat-label">{s.label}</div>
              <div className="ck-stat-sub" data-tone={s.tone}>
                <Dot tone={s.tone} size="sm" />
                {s.label === "Virtual Machines" ? (
                  <LiveValue value={RUNNING(tick)} format={(v) => `${v} active`} />
                ) : (
                  s.sub
                )}
              </div>
              <div className="ck-stat-spark">
                <Sparkline points={history(SPARK[s.label], tick)} />
              </div>
            </CardContent>
          </HoverCardTrigger>
          <HoverCardContent className="ck-stat-hover">
            <div className="ck-stat-hover-title">{s.label}</div>
            {s.detail.map((d) => (
              <div key={d.label} className="ck-stat-hover-row">
                {d.tone && <Dot tone={d.tone} size="sm" />}
                <span className="ck-stat-hover-label">{d.label}</span>
                <span className="ck-stat-hover-val">{d.value}</span>
              </div>
            ))}
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  )
}

export function DashCard({ title, live, className, children }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="ck-card-title">
          {title}
          {live && <StatusDot status="success" label="Live" size="sm" ring className="ck-card-live" />}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

const UTIL = Object.fromEntries(
  UTILIZATION.map((u) => [u.label, drift(`util:${u.label}`, u.pct, { spread: 3, min: 1, max: 99 })])
)

export function UtilizationCard() {
  const tick = useTicker(TICK_MS)
  return (
    <DashCard title="Resource utilization" live>
      <div className="ck-util">
        {UTILIZATION.map((u) => {
          const pct = UTIL[u.label](tick)
          const tone = pct >= 85 ? "error" : pct >= 60 ? "warning" : "success"
          return (
            <div key={u.label} className="ck-util-row">
              <span className="ck-util-label">{u.label}</span>
              <Progress value={pct} className="ck-util-bar" data-tone={tone} />
              <span className="ck-util-val">
                <LiveValue value={pct} format={(v) => `${v}%`} /> · {u.detail}
              </span>
            </div>
          )
        })}
      </div>
    </DashCard>
  )
}

export function HealthCard() {
  return (
    <DashCard title="Service health">
      <ItemGroup>
        {HEALTH.map((h) => (
          <Item key={h.name} size="sm" className="ck-health-row">
            <Dot tone={h.tone} ring />
            <ItemContent>
              <ItemTitle>{h.name}</ItemTitle>
            </ItemContent>
            <ItemActions>
              <Badge variant={TONE_BADGE[h.tone] ?? "outline"} glow={h.tone === "error"}>
                {h.value}
              </Badge>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </DashCard>
  )
}

/* Every fifth tick the next canned event arrives at the top with a sweep. */
const INJECT_EVERY = 5

export function EventsCard({ max = 7 }) {
  const tick = useTicker(TICK_MS)
  const injected = Math.min(INCOMING_EVENTS.length, Math.floor(tick / INJECT_EVERY))
  const rows = [
    ...INCOMING_EVENTS.slice(0, injected)
      .map((e, i) => ({
        ...e,
        fresh: i === injected - 1,
        time: i === injected - 1 ? "just now" : `${(injected - 1 - i) * INJECT_EVERY * (TICK_MS / 1000)} s ago`,
      }))
      .reverse(),
    ...EVENTS,
  ].slice(0, max)
  return (
    <DashCard title="Recent events" live>
      <ItemGroup>
        {rows.map((e) => (
          <Item key={e.text + e.target} size="sm" className="ck-event-row" data-fresh={e.fresh || undefined}>
            <Dot tone={e.tone} size="sm" />
            <ItemContent>
              <ItemTitle className="ck-event-text">
                <code>{e.text}</code> {e.target}
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              <span className="ck-event-time">{e.time}</span>
            </ItemActions>
          </Item>
        ))}
      </ItemGroup>
    </DashCard>
  )
}

export function Dashboard() {
  return (
    <div className="ck-dash">
      <StatCards />
      <div className="ck-dash-grid">
        <UtilizationCard />
        <HealthCard />
      </div>
      <EventsCard />
    </div>
  )
}

export function CardPage({ title, count, children }) {
  return (
    <div className="ck-view">
      <div className="ck-page-head">
        <h4 className="ck-page-title">{title}</h4>
        {count && <span className="ck-page-count">{count}</span>}
      </div>
      {children}
    </div>
  )
}
