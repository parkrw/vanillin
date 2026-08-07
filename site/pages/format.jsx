import { useState } from "react"
import { RelativeTime, Bytes, Duration, Cost } from "../../ui/format/format.jsx"
import { DirectionProvider } from "../../lib/direction.jsx"
import "../../ui/format/format.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const FIVE_MIN = 5 * 60 * 1000
const ONE_HOUR = 60 * 60 * 1000
const ONE_DAY = 24 * ONE_HOUR

export default function FormatPage() {
  const [locale, setLocale] = useState("")
  const now = Date.now()

  const wrap = (children) =>
    locale ? (
      <DirectionProvider locale={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
        {children}
      </DirectionProvider>
    ) : (
      children
    )

  return (
    <>
      <h2>Format</h2>
      <p>Four display components for relative timestamps, byte counts, durations, and costs — thin wrappers over pure functions in <code>lib/format.js</code>.</p>

      <section className="pg-section">
        <h3>Locale override</h3>
        <div className="pg-row">
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            style={{ padding: "0.25rem 0.5rem" }}
            data-pg="locale-select"
          >
            <option value="">Runtime default</option>
            <option value="en-US">en-US</option>
            <option value="de-DE">de-DE</option>
            <option value="ar">ar (RTL)</option>
            <option value="ja">ja</option>
          </select>
        </div>
      </section>

      {wrap(
        <>
          <section className="pg-section" data-pg="rt">
            <h3>RelativeTime</h3>
            <div className="pg-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
              <span>5 min ago: <RelativeTime date={now - FIVE_MIN} data-pg="rt-5m" /></span>
              <span>1 hour ago: <RelativeTime date={now - ONE_HOUR} data-pg="rt-1h" /></span>
              <span>Yesterday: <RelativeTime date={now - ONE_DAY} data-pg="rt-1d" /></span>
              <span>Live (30 s ago): <RelativeTime date={now - 30_000} live data-pg="rt-live" /></span>
            </div>
          </section>

          <section className="pg-section" data-pg="bytes">
            <h3>Bytes</h3>
            <div className="pg-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
              <span>0 B: <Bytes value={0} data-pg="b-zero" /></span>
              <span>1024 (iec): <Bytes value={1024} data-pg="b-1k-iec" /></span>
              <span>1000 (si): <Bytes value={1000} base="si" data-pg="b-1k-si" /></span>
              <span>1.5 GiB: <Bytes value={1024 * 1024 * 1024 * 1.5} data-pg="b-gib" /></span>
              <span>5 TB (si): <Bytes value={5e12} base="si" data-pg="b-5tb" /></span>
            </div>
          </section>

          <section className="pg-section" data-pg="dur">
            <h3>Duration</h3>
            <div className="pg-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
              <span>0 ms: <Duration value={0} data-pg="d-zero" /></span>
              <span>90 s (narrow): <Duration value={90_000} data-pg="d-90s" /></span>
              <span>2 h 14 m (long): <Duration value={(2 * 3600 + 14 * 60) * 1000} style="long" data-pg="d-long" /></span>
              <span>Negative (-45 s): <Duration value={-45_000} data-pg="d-neg" /></span>
            </div>
          </section>

          <section className="pg-section" data-pg="cost">
            <h3>Cost</h3>
            <div className="pg-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
              <span>$12.40: <Cost value={12.40} data-pg="c-normal" /></span>
              <span>$0.0035/call: <Cost value={0.0035} data-pg="c-milli" /></span>
              <span>$0.0000012/req: <Cost value={0.0000012} data-pg="c-micro" /></span>
              <span>EUR 99.99: <Cost value={99.99} currency="EUR" data-pg="c-eur" /></span>
            </div>
          </section>
        </>
      )}

      <InstallSnippet slug="format" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { RelativeTime, Bytes, Duration, Cost } from "./ui/format/format"
import "./ui/format/format.css"

<RelativeTime date={Date.now() - 300_000} />
<Bytes value={1024} />
<Duration value={90_000} />
<Cost value={12.40} />`}>
          <div className="pg-row" style={{ gap: "1.5rem" }}>
            <span><RelativeTime date={now - FIVE_MIN} /></span>
            <span><Bytes value={1024} /></span>
            <span><Duration value={90_000} /></span>
            <span><Cost value={12.40} /></span>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "RelativeTime: date", type: "number | Date", description: "Timestamp to format relative to now" },
        { name: "RelativeTime: live", type: "boolean", default: "false", description: "Auto-update on a shared interval" },
        { name: "Bytes: value", type: "number", description: "Byte count to format" },
        { name: "Bytes: base", type: '"iec" | "si"', default: '"iec"', description: "Binary (1024, KiB) or decimal (1000, kB) units" },
        { name: "Duration: value", type: "number", description: "Duration in milliseconds" },
        { name: "Duration: style", type: '"narrow" | "short" | "long"', default: '"narrow"', description: "Label width — 1m vs 1 min vs 1 minute" },
        { name: "Cost: value", type: "number", description: "Amount to format" },
        { name: "Cost: currency", type: "string", default: '"USD"', description: "ISO 4217 currency code" },
      ]} />
    </>
  )
}
