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
      <p>
        Four display components for the values every console renders:
        relative timestamps, byte counts, durations, and costs. Each is a
        thin wrapper over a pure function in <code>lib/format.js</code>,
        which you can also call directly from a table-cell formatter or a{" "}
        <code>title</code> attribute.
      </p>

      <InstallSnippet slug="format" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { RelativeTime, Bytes, Duration, Cost } from "./ui/format/format"
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

      <section className="pg-section">
        <h3>Locale override</h3>
        <p>
          Locale is inherited from the nearest <code>DirectionProvider</code>.
          When no provider is present, <code>Intl</code> uses the
          runtime's default locale, so the components work without any
          setup. Switch below to preview non-English output across all
          demos on this page.
        </p>
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
            <ComponentPreview code={`<RelativeTime date={Date.now() - 300_000} />
<RelativeTime date={Date.now() - 3_600_000} />
<RelativeTime date={Date.now() - 86_400_000} />
<RelativeTime date={Date.now() - 30_000} live />`}>
              <div>
                <p>
                  Renders a <code>&lt;time dateTime&gt;</code> element with the
                  absolute ISO timestamp in the <code>dateTime</code> attribute
                  and a human-readable relative string as content. The absolute
                  date appears in the <code>title</code> tooltip.
                </p>
                <p>
                  The <code>live</code> prop enables automatic updates. All live
                  instances share a single interval rather than scheduling one
                  timer per component. Tick cadence backs off with magnitude: every 5 s for
                  seconds, 30 s for minutes, 5 min for hours and above.
                </p>
                <div className="pg-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
                  <span>5 min ago: <RelativeTime date={now - FIVE_MIN} data-pg="rt-5m" /></span>
                  <span>1 hour ago: <RelativeTime date={now - ONE_HOUR} data-pg="rt-1h" /></span>
                  <span>Yesterday: <RelativeTime date={now - ONE_DAY} data-pg="rt-1d" /></span>
                  <span>Live (30 s ago): <RelativeTime date={now - 30_000} live data-pg="rt-live" /></span>
                </div>
              </div>
            </ComponentPreview>
          </section>

          <section className="pg-section" data-pg="bytes">
            <h3>Bytes</h3>
            <ComponentPreview code={`<Bytes value={0} />
<Bytes value={1024} />
<Bytes value={1000} base="si" />
<Bytes value={1024 * 1024 * 1024 * 1.5} />`}>
              <div>
                <p>
                  Defaults to <code>base=&quot;iec&quot;</code> (1024, KiB/MiB)
                  because that matches how operating systems, cloud dashboards,
                  and most dev tools report storage and memory. The SI option
                  (<code>base=&quot;si&quot;</code>, 1000, kB/MB) is there for
                  network throughput and disk-manufacturer specs where decimal
                  powers are standard.
                </p>
                <div className="pg-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
                  <span>0 B: <Bytes value={0} data-pg="b-zero" /></span>
                  <span>1024 (iec): <Bytes value={1024} data-pg="b-1k-iec" /></span>
                  <span>1000 (si): <Bytes value={1000} base="si" data-pg="b-1k-si" /></span>
                  <span>1.5 GiB: <Bytes value={1024 * 1024 * 1024 * 1.5} data-pg="b-gib" /></span>
                  <span>5 TB (si): <Bytes value={5e12} base="si" data-pg="b-5tb" /></span>
                </div>
              </div>
            </ComponentPreview>
          </section>

          <section className="pg-section" data-pg="dur">
            <h3>Duration</h3>
            <ComponentPreview code={`<Duration value={0} />
<Duration value={90_000} />
<Duration value={(2 * 3600 + 14 * 60) * 1000} style="long" />
<Duration value={-45_000} />`}>
              <div>
                <p>
                  Formats milliseconds as a human-readable duration. Uses{" "}
                  <code>Intl.DurationFormat</code> where available (Chrome 129+,
                  Safari 16.4+); falls back to an <code>Intl.NumberFormat</code>{" "}
                  + <code>Intl.ListFormat</code> composition that is
                  locale-correct and works everywhere.
                </p>
                <div className="pg-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
                  <span>0 ms: <Duration value={0} data-pg="d-zero" /></span>
                  <span>90 s (narrow): <Duration value={90_000} data-pg="d-90s" /></span>
                  <span>2 h 14 m (long): <Duration value={(2 * 3600 + 14 * 60) * 1000} style="long" data-pg="d-long" /></span>
                  <span>Negative (-45 s): <Duration value={-45_000} data-pg="d-neg" /></span>
                </div>
              </div>
            </ComponentPreview>
          </section>

          <section className="pg-section" data-pg="cost">
            <h3>Cost</h3>
            <ComponentPreview code={`<Cost value={12.40} />
<Cost value={0.0035} />
<Cost value={0.0000012} />
<Cost value={99.99} currency="EUR" />`}>
              <div>
                <p>
                  Wraps <code>Intl.NumberFormat</code> currency style. The
                  default is 2 fraction digits for normal prices, scaling up
                  automatically for micro-prices so cloud per-request billing
                  like <code>$0.0000012/req</code> renders all significant
                  digits instead of rounding to <code>$0.00</code>.
                </p>
                <div className="pg-row" style={{ flexDirection: "column", alignItems: "flex-start", gap: "0.25rem" }}>
                  <span>$12.40: <Cost value={12.40} data-pg="c-normal" /></span>
                  <span>$0.0035/call: <Cost value={0.0035} data-pg="c-milli" /></span>
                  <span>$0.0000012/req: <Cost value={0.0000012} data-pg="c-micro" /></span>
                  <span>EUR 99.99: <Cost value={99.99} currency="EUR" data-pg="c-eur" /></span>
                </div>
              </div>
            </ComponentPreview>
          </section>
        </>
      )}

      <section className="pg-section">
        <h3>SSR and Hydration</h3>
        <p>
          <code>RelativeTime</code> computes its initial render from the{" "}
          <code>date</code> prop alone (no <code>Date.now()</code>), so
          server and client produce the same string. Live ticking starts
          after mount, avoiding hydration mismatches.
        </p>
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
