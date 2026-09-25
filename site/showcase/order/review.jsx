import { useEffect, useRef, useState } from "react"
import { Button } from "../../../ui/button/button.jsx"
import { CopyField } from "../../../ui/copy-field/copy-field.jsx"
import { Progress } from "../../../ui/progress/progress.jsx"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "../../../ui/input-group/input-group.jsx"
import { Label } from "../../../ui/label/label.jsx"
import { StatusDot } from "../../../ui/status-dot/status-dot.jsx"
import { toast } from "../../../ui/toast/toast.jsx"
import { ToggleGroup, ToggleGroupItem } from "../../../ui/toggle-group/toggle-group.jsx"
import { BILLING_TERMS } from "../console-data.js"
import { CheckCircleIcon, DownloadIcon, LinkIcon, MailIcon, RocketIcon, SiteIcon, TerminalIcon, UploadIcon } from "../icons.jsx"
import { Disclosure, InlineError, IssueGate, OrderSection } from "./form.jsx"
import { money, siteName, siteOf, vdcCost } from "./pricing.js"
import { copyText, download, mailtoHref, orderCsv, parseOrder, serializeOrder, shareUrlFor } from "./share.js"
import "../../../ui/button/button.css"
import "../../../ui/copy-field/copy-field.css"
import "../../../ui/input-group/input-group.css"
import "../../../ui/label/label.css"
import "../../../ui/progress/progress.css"
import "../../../ui/status-dot/status-dot.css"
import "../../../ui/toggle/toggle.css"
import "../../../ui/toggle-group/toggle-group.css"

/* ── 6 · Checkout: billing and name, save and share; the table sits on
   this step, and the deploy button is the foot under it ──────────────── */

const stamp = () => new Date().toISOString().slice(0, 10)

export function ReviewStep({ order, patch, touch, errors, issues, onGo, onImport }) {
  const [link, setLink] = useState(null)
  const fileRef = useRef(null)
  const { draft } = order
  const billing = BILLING_TERMS.find((t) => t.id === draft.billing)
  const site = siteOf(draft.site)
  const exportJson = () => download(`acme-order-${stamp()}.json`, "application/json", serializeOrder(order))
  const exportCsv = () => download(`acme-order-${stamp()}.csv`, "text/csv", orderCsv(order))
  const copyLink = async () => {
    const url = shareUrlFor(order)
    window.location.hash = url.slice(url.indexOf("#") + 1)
    setLink(url)
    const ok = await copyText(url)
    toast(ok ? "Link copied" : "Link ready", { description: ok ? "The whole order is in the URL; anyone with it opens the same prices." : "Copy it from the field below." })
  }
  const importFile = (file) => {
    if (!file) return
    file.text().then(
      (text) => {
        try {
          onImport(parseOrder(text))
          toast.success("Order imported", { description: `${file.name} replaced the order on this page.` })
        } catch (err) {
          toast.error("Import failed", { description: err.message })
        }
      },
      () => toast.error("Import failed", { description: "The file could not be read." })
    )
  }
  return (
    <>
      <OrderSection id="billing" title="Billing and name" hint="Name the vDC and pick its billing term; the machines are under these, and Deploy closes the page below them.">
        <div className="ck-order-two">
          <div className="ck-order-field">
            <Label>Billing term</Label>
            <ToggleGroup
              type="single"
              variant="outline"
              value={draft.billing}
              onValueChange={(id) => id && patch({ billing: id })}
              className="ck-segments"
              aria-label="Billing term"
            >
              {BILLING_TERMS.map((t) => (
                <ToggleGroupItem key={t.id} value={t.id}>{t.name}</ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="ck-option-desc">{billing.description}</p>
          </div>
          <div className="ck-order-field">
            <Label htmlFor="ck-order-name">vDC name</Label>
            <InputGroup className="ck-order-name" data-invalid={errors.has("name") || undefined}>
              <InputGroupAddon><SiteIcon /></InputGroupAddon>
              <InputGroupInput
                id="ck-order-name"
                value={draft.name}
                aria-invalid={errors.has("name") || undefined}
                onChange={(e) => patch({ name: e.target.value })}
                onBlur={() => touch("name")}
                spellCheck={false}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>{site.code.toLowerCase()}.acme.cloud</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <p className="ck-option-desc">Shown on the total and on invoices; lower-case letters, digits and dashes.</p>
            <InlineError field="name">{errors.get("name")}</InlineError>
          </div>
        </div>
      </OrderSection>
      <IssueGate title="Not ready to deploy" issues={issues} onGo={onGo} />
      <OrderSection id="share" title="Save and share" hint="Prices travel with the file or the link: anyone can open them here without an account.">
        <div className="ck-order-share">
          <Button variant="outline" size="sm" className="ck-order-export-json" onClick={exportJson}>
            <DownloadIcon />
            Download JSON
          </Button>
          <Button variant="outline" size="sm" className="ck-order-export-csv" onClick={exportCsv}>
            <DownloadIcon />
            Download CSV
          </Button>
          <Button as="a" variant="outline" size="sm" className="ck-order-email" href={mailtoHref(order)}>
            <MailIcon />
            Email the summary
          </Button>
          <Button variant="outline" size="sm" className="ck-order-copy-link" onClick={copyLink}>
            <LinkIcon />
            Copy link
          </Button>
          <Button variant="outline" size="sm" className="ck-order-import" onClick={() => fileRef.current?.click()}>
            <UploadIcon />
            Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="ck-order-import-input"
            aria-label="Import an order file"
            onChange={(e) => {
              importFile(e.target.files?.[0])
              e.target.value = ""
            }}
          />
        </div>
        {link && <CopyField value={link} label="Share link" truncate="end" className="ck-order-link" />}
      </OrderSection>
    </>
  )
}

/* ── After deploy: live provisioning, then the ways in ───────────────── */

const STAGES = ["Reserving capacity", "Carving the pools", "Attaching the network edge", "Writing images", "Booting machines"]
const STAGE_MS = 700

export function ProvisioningPanel({ deployed, consoleHref, onReset }) {
  const [stage, setStage] = useState(0)
  useEffect(() => {
    if (stage >= STAGES.length) return
    const t = setTimeout(() => setStage((s) => s + 1), STAGE_MS)
    return () => clearTimeout(t)
  }, [stage])
  const done = stage >= STAGES.length
  const percent = Math.round((stage / STAGES.length) * 100)
  const payload = JSON.stringify(
    {
      vdcs: deployed.vdcs.map((v) => ({
        name: v.name, site: v.site, billing: v.billing, cpu_ghz: v.cpu, ram_gb: v.ram, public_ipv4: v.ips, uplink_mbps: Number(v.uplink),
        storage_gb: v.storage, protection: v.protection, backups: v.backups ? v.retention : null, addons: v.addons, image: v.image,
        machines: deployed.vms.filter((m) => m.vdc === v.id).map((m) => ({ name: m.name, size: m.size, image: m.image, count: m.count })),
      })),
    },
    null,
    2
  )
  return (
    <section className="ck-order-provision" data-state={done ? "done" : "running"} aria-live="polite">
      <div className="ck-order-provision-head">
        <span className="ck-order-provision-title">
          {done ? <CheckCircleIcon /> : <RocketIcon />}
          {done ? "Deployed" : "Deploying"} {deployed.vdcs.length} vDC{deployed.vdcs.length === 1 ? "" : "s"} · {money(deployed.total)}/mo
        </span>
        <span className="ck-option-desc">{done ? "Everything below is live; the first invoice covers the rest of this month." : `${STAGES[stage]}…`}</span>
      </div>
      <Progress value={percent} glow={!done} className="ck-order-provision-bar" aria-label="Provisioning progress" />
      <ol className="ck-order-stages">
        {STAGES.map((s, i) => (
          <li key={s} data-state={i < stage ? "done" : i === stage ? "running" : "pending"}>
            <StatusDot status={i < stage ? "success" : i === stage ? "pending" : "neutral"} label={null} ring={i === stage} />
            {s}
          </li>
        ))}
      </ol>
      {done && (
        <div className="ck-order-outputs">
          {deployed.vdcs.map((v, i) => {
            const ip = `203.0.113.${10 + i}`
            const user = /^Windows/.test(v.image) ? "Administrator" : "ubuntu"
            return (
              <div key={v.id} className="ck-order-output" data-vdc={v.name}>
                <div className="ck-order-output-head">
                  <code className="ck-mono">{v.name}</code>
                  <span className="ck-option-desc">{siteName(v.site)} · {siteOf(v.site).city}</span>
                </div>
                <CopyField value={`ssh ${user}@${ip}`} label="SSH" truncate="end" className="ck-order-copy" />
                <CopyField value={ip} label="Public IPv4" truncate={false} className="ck-order-copy" />
                <CopyField value={`${consoleHref}#vdc/${v.name}`} label="Console" truncate="end" className="ck-order-copy" />
              </div>
            )
          })}
          <Disclosure id="api-payload" label="CLI and API payload" hint="the same order as the API takes it" defaultOpen={false}>
            <CopyField value={`curl -X POST https://api.acme.cloud/v1/orders -H "Authorization: Bearer $ACME_TOKEN" -d @order.json`} label="CLI" truncate="end" className="ck-order-copy" />
            <div className="ck-order-payload">
              <div className="ck-order-payload-head">
                <TerminalIcon />
                <span>order.json</span>
                <Button variant="ghost" size="sm" onClick={() => copyText(payload).then((ok) => toast(ok ? "Payload copied" : "Copy refused"))}>
                  Copy
                </Button>
              </div>
              <pre className="ck-order-payload-body">{payload}</pre>
            </div>
          </Disclosure>
          <div className="ck-order-footer">
            <Button variant="outline" onClick={onReset}>Start another order</Button>
          </div>
        </div>
      )}
    </section>
  )
}

export const deployLabelFor = (cost) => `Deploy — up to ${money(cost.totalWithTax)}/mo`
export const orderCostOf = (vdcs, vms) => vdcs.reduce((sum, v) => sum + vdcCost(v, vms).total, 0)
