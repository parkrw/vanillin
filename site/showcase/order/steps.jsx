import { useState } from "react"
import { cn } from "../../../lib/cn.js"
import { Avatar, AvatarFallback } from "../../../ui/avatar/avatar.jsx"
import { Card, CardContent } from "../../../ui/card/card.jsx"
import { Field, FieldDescription, FieldLabel } from "../../../ui/field/field.jsx"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "../../../ui/item/item.jsx"
import { Label } from "../../../ui/label/label.jsx"
import { Marker, MarkerContent, MarkerIcon } from "../../../ui/marker/marker.jsx"
import { NativeSelect, NativeSelectOption } from "../../../ui/native-select/native-select.jsx"
import { RadioGroup, RadioGroupItem } from "../../../ui/radio-group/radio-group.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select/select.jsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs/tabs.jsx"
import { ToggleGroup, ToggleGroupItem } from "../../../ui/toggle-group/toggle-group.jsx"
import { BACKUP_RETENTION, BCDR_COPY, COMPUTE_PRESETS, NETWORKS, NETWORK_ADDONS, ORDER_COPY, ORDER_RATES, ORDER_SITES, POOLS, PROTECTION_TIERS, SITE_FACTS, STORAGE_TIERS, UPLINKS, USER_REGIONS } from "../console-data.js"
import { ArchiveIcon, CheckIcon, ClockIcon, InfoIcon, SiteIcon } from "../icons.jsx"
import { CheckLine, CheckRow, Delta, Disclosure, InlineError, IssueGate, OptionRow, OrderSection, PriceLine, Recommended, SliderRow, SpecCard, SwitchRow } from "./form.jsx"
import { addonBlock, money, otherSite, protectionBlock, regionOf, vdcCost, workloadOf } from "./pricing.js"
import "../../../ui/avatar/avatar.css"
import "../../../ui/card/card.css"
import "../../../ui/field/field.css"
import "../../../ui/item/item.css"
import "../../../ui/label/label.css"
import "../../../ui/marker/marker.css"
import "../../../ui/native-select/native-select.css"
import "../../../ui/radio-group/radio-group.css"
import "../../../ui/select/select.css"
import "../../../ui/tabs/tabs.css"
import "../../../ui/toggle/toggle.css"
import "../../../ui/toggle-group/toggle-group.css"

/* ── 1 · Location: the site ──────────────────────────────────────────── */

export function LocationStep({ draft, patch, errors }) {
  const recommended = regionOf(draft.users).site
  const setSite = (id) => patch({ site: id, drSite: draft.drSite === id ? otherSite(id) : draft.drSite })
  return (
    <OrderSection id="site" title="Site" hint="Where the vDC lives. Latency follows your users, so the recommended site is marked; the others are a click away.">
      <RadioGroup value={draft.site} onValueChange={setSite} className="ck-sites" aria-label="Site">
        {ORDER_SITES.map((s) => (
          <Card
            key={s.id}
            className="ck-site"
            data-state={draft.site === s.id ? "checked" : "unchecked"}
            data-recommended={s.id === recommended || undefined}
            onClick={() => setSite(s.id)}
          >
            <CardContent className="ck-site-body">
              <div className="ck-site-head">
                <Avatar className="ck-site-mark" aria-hidden="true">
                  <AvatarFallback>{s.code}</AvatarFallback>
                </Avatar>
                <RadioGroupItem value={s.id} aria-label={s.name} />
              </div>
              <div className="ck-site-text">
                <div className="ck-site-name">
                  {s.name}
                  {s.id === recommended && <Recommended />}
                </div>
                <div className="ck-site-city">{s.city} · sales tax {SITE_FACTS[s.id].taxLabel}</div>
                <p className="ck-option-desc">{s.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </RadioGroup>
      <InlineError field="site">{errors.get("site")}</InlineError>
      {/* Always open: the one fact the cards cannot hold is the round trip
          from each user region. Tax is on the card; nothing else moved. */}
      <div className="ck-compare-block" data-compare="sites">
        <div className="ck-compare-head">
          <span className="ck-compare-title">Compare sites</span>
          <span className="ck-compare-hint">median round trip from where your users are</span>
        </div>
        <div className="ck-compare-wrap">
          <table className="ck-compare">
            <thead>
              <tr>
                <th>Site</th>
                {USER_REGIONS.filter((r) => r.id !== "everywhere").map((r) => (
                  <th key={r.id} className="ck-num">{r.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ORDER_SITES.map((s) => {
                const f = SITE_FACTS[s.id]
                return (
                  <tr key={s.id} data-state={draft.site === s.id ? "checked" : undefined}>
                    <th scope="row">
                      {s.name}
                      {s.id === recommended && <span className="ck-chip">recommended</span>}
                    </th>
                    {["south", "midwest", "west"].map((r) => (
                      <td key={r} className="ck-num">{f.latency[r]} ms</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </OrderSection>
  )
}

/* ── 2 · Infrastructure: size, network, included ─────────────────────── */

export function InfrastructureStep({ draft, cost, patch, patchGroup, errors }) {
  const [cpuPool, ramPool, ipPool] = POOLS
  const workload = workloadOf(draft.workload)
  const preset = COMPUTE_PRESETS.find((p) => p.cpu === draft.cpu && p.ram === draft.ram)?.id ?? "custom"
  // Pools that match no plan open on Custom, where the sliders that set them are.
  const [sizeTab, setSizeTab] = useState(preset === "custom" ? "custom" : "plans")
  const applyPreset = (id) => {
    const p = COMPUTE_PRESETS.find((x) => x.id === id)
    if (p) patch({ cpu: p.cpu, ram: p.ram })
  }
  const planMonthly = (p) => p.cpu * cpuPool.rate + p.ram * ramPool.rate
  const fits = (p) => Math.floor(Math.min(p.cpu / 2, p.ram / 4))
  const uplink = UPLINKS.find((u) => u.id === draft.uplink)
  return (
    <>
      <Tabs value={sizeTab} onValueChange={setSizeTab} className="ck-size-tabs">
        <OrderSection
          id="size"
          title="Size"
          className="ck-order-section--tabbed"
          aside={
            <>
              {/* The live draw stands in for a static hint: what the plan
                  or the custom pools hold, and what the machines take. */}
              <p className="ck-order-draw" data-over={cost.draw.ghz > draft.cpu || cost.draw.gb > draft.ram || undefined}>
                {preset === "custom" ? "Custom pools" : `Plan ${COMPUTE_PRESETS.find((p) => p.id === preset).name}`}: the machines in this vDC draw{" "}
                <strong>{cost.draw.ghz} GHz</strong> of {draft.cpu} and <strong>{cost.draw.gb} GB</strong> of {draft.ram}.
              </p>
              <TabsList className="ck-size-tablist" aria-label="Size">
                <TabsTrigger value="plans" className="ck-size-tab">Plans</TabsTrigger>
                <TabsTrigger value="custom" className="ck-size-tab">Custom</TabsTrigger>
              </TabsList>
            </>
          }
        >
          <TabsContent value="plans" className="ck-size-panel" data-size="plans">
            <RadioGroup value={preset === "custom" ? "" : preset} onValueChange={applyPreset} className="ck-plans" aria-label="Plan">
              {COMPUTE_PRESETS.map((p) => (
                <Card
                  key={p.id}
                  className="ck-plan"
                  data-state={preset === p.id ? "checked" : "unchecked"}
                  data-recommended={p.id === workload.preset || undefined}
                  onClick={() => applyPreset(p.id)}
                >
                  <CardContent className="ck-plan-body">
                    <div className="ck-plan-head">
                      <span className="ck-plan-name">{p.name}</span>
                      {p.id === workload.preset && <Recommended />}
                      <RadioGroupItem value={p.id} aria-label={`Plan ${p.name}`} />
                    </div>
                    <span className="ck-plan-spec">{p.cpu} GHz · {p.ram} GB</span>
                    <span className="ck-plan-price"><strong>{money(planMonthly(p))}</strong>/mo</span>
                    <span className="ck-option-desc">{p.description}</span>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
            <Disclosure id="compare-plans" label="Compare all plans" hint="pools, machines that fit, monthly">
              <div className="ck-compare-wrap">
                <table className="ck-compare">
                  <thead>
                    <tr>
                      <th>Plan</th>
                      <th className="ck-num">CPU pool</th>
                      <th className="ck-num">RAM pool</th>
                      <th>Fits</th>
                      <th className="ck-num">Per month</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPUTE_PRESETS.map((p) => (
                      <tr key={p.id} data-state={preset === p.id ? "checked" : undefined}>
                        <th scope="row">
                          {p.name}
                          {p.id === workload.preset && <span className="ck-chip">recommended</span>}
                        </th>
                        <td className="ck-num">{p.cpu} GHz</td>
                        <td className="ck-num">{p.ram} GB</td>
                        <td>≈ {fits(p)} standard-2 machines</td>
                        <td className="ck-num">{money(planMonthly(p))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Disclosure>
          </TabsContent>
          <TabsContent value="custom" className="ck-size-panel" data-size="custom">
            <div className="ck-slider-grid">
              {[cpuPool, ramPool].map((p) => (
                <SliderRow
                  key={p.id}
                  field={p.id}
                  name={p.name}
                  unit={p.unit}
                  value={draft[p.id]}
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  tick={p.tick}
                  onChange={(v) => patch({ [p.id]: v })}
                  price={draft[p.id] * p.rate}
                  rate={`${money(p.rate)} per ${p.unit}`}
                  description={p.description}
                  error={errors.get(p.id)}
                />
              ))}
            </div>
            <CheckLine id="ck-order-headroom" title="Reserve headroom" note={ORDER_COPY.headroom} checked={draft.headroom} onCheckedChange={(headroom) => patch({ headroom })} />
          </TabsContent>
          {sizeTab === "plans" && <InlineError field="cpu">{errors.get("cpu")}</InlineError>}
          {sizeTab === "plans" && <InlineError field="ram">{errors.get("ram")}</InlineError>}
        </OrderSection>
      </Tabs>

      <div className="ck-order-two ck-infra-pair">
        <OrderSection id="network" title="Network" hint="Public addresses and the uplink: the two things here that cost.">
          <SliderRow
            field="ips"
            name={ipPool.name}
            label="Public IPv4"
            unit={ipPool.unit}
            value={draft.ips}
            min={ipPool.min}
            max={ipPool.max}
            step={ipPool.step}
            tick={ipPool.tick}
            onChange={(ips) => patch({ ips })}
            price={cost.ips}
            rate={`${money(ipPool.rate)} per address a month`}
            description="Routable addresses for anything the internet must reach directly."
          />
          <div className="ck-order-field ck-order-field--wide">
            <Label>Uplink</Label>
            <ToggleGroup type="single" variant="outline" value={draft.uplink} onValueChange={(id) => id && patch({ uplink: id })} className="ck-presets" aria-label="Uplink">
              {UPLINKS.map((u) => (
                <ToggleGroupItem key={u.id} value={u.id} className="ck-preset" aria-label={`${u.name}, ${money(u.rate)} a month`}>
                  <span className="ck-preset-name">{u.name}</span>
                  <span className="ck-preset-meta">{u.id === UPLINKS[0].id ? "base tier" : <Delta amount={u.rate - UPLINKS[0].rate} />}</span>
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="ck-option-desc">{uplink.description}</p>
          </div>
        </OrderSection>

        <OrderSection id="advanced" title="Advanced networking" hint="The network new machines join first, and how they are placed; neither is billed.">
          <Field className="ck-order-field">
            <FieldLabel htmlFor="ck-order-network">Default network</FieldLabel>
            <NativeSelect id="ck-order-network" value={draft.vmGroup.network} onChange={(e) => patchGroup({ network: e.target.value })}>
              {NETWORKS.filter((n) => n.type === "Private").map((n) => (
                <NativeSelectOption key={n.name} value={n.name}>{n.name} · {n.subnet}</NativeSelectOption>
              ))}
            </NativeSelect>
            <FieldDescription>New machines attach here first; add more interfaces after launch.</FieldDescription>
          </Field>
          <CheckLine
            id="ck-order-affinity"
            title="Anti-affinity"
            note="spread the machines across hosts, so one host failure takes one machine"
            checked={draft.vmGroup.antiAffinity}
            onCheckedChange={(antiAffinity) => patchGroup({ antiAffinity })}
          />
        </OrderSection>
      </div>
    </>
  )
}

/* ── 3 · Storage: the pane kept whole ─────────────────────────────────── */

export function StorageStep({ draft, cost, patch, errors }) {
  return (
    <>
      <OrderSection id="tiers" title="Tiers" hint="GB per performance tier, the pools the machines' volumes come from. Leave a tier at zero to skip it; hover a tier's name for its figures.">
        <div className="ck-slider-grid">
          {STORAGE_TIERS.map((t) => (
            <SliderRow
              key={t.id}
              field={`storage-${t.id}`}
              name={t.name}
              label={
                <SpecCard
                  title={`${t.name} · ${t.media}`}
                  rows={[["IOPS per volume", t.iops], ["Latency", t.latency], ["Rate", `${money(t.rate)} per GB`]]}
                >
                  {t.name}
                </SpecCard>
              }
              unit="GB"
              value={draft.storage[t.id]}
              min={0}
              max={10000}
              step={50}
              tick={2500}
              onChange={(v) => patch({ storage: { ...draft.storage, [t.id]: v } })}
              price={draft.storage[t.id] * t.rate}
              rate={`${money(t.rate)} per GB`}
              description={t.description}
            />
          ))}
        </div>
        <div className="ck-storage-mix" aria-label={`${cost.storageGb.toLocaleString("en-US")} GB across ${STORAGE_TIERS.length} tiers`}>
          <div className="ck-storage-mix-bar">
            {STORAGE_TIERS.filter((t) => draft.storage[t.id] > 0).map((t) => (
              <span
                key={t.id}
                className="ck-storage-mix-seg"
                data-tier={t.id}
                style={{ flexGrow: draft.storage[t.id] }}
                title={`${t.name}: ${draft.storage[t.id].toLocaleString("en-US")} GB`}
              />
            ))}
          </div>
          <div className="ck-storage-mix-legend">
            {STORAGE_TIERS.map((t) => (
              <Marker key={t.id} className="ck-marker">
                <MarkerIcon><span className="ck-storage-mix-swatch" data-tier={t.id} /></MarkerIcon>
                <MarkerContent>{t.name} · {draft.storage[t.id].toLocaleString("en-US")} GB</MarkerContent>
              </Marker>
            ))}
            <span className="ck-storage-mix-total">{cost.storageGb.toLocaleString("en-US")} GB · {money(cost.storage)}/mo</span>
          </div>
        </div>
        <p className="ck-order-draw" data-over={cost.draw.disk > cost.storageGb || undefined}>
          Boot volumes for the machines below take <strong>{cost.draw.disk.toLocaleString("en-US")} GB</strong> of the {cost.storageGb.toLocaleString("en-US")} GB provisioned.
        </p>
        <InlineError field="storage">{errors.get("storage")}</InlineError>
        <p className="ck-order-note" data-note="media">
          <InfoIcon />
          <span>{ORDER_COPY.media}</span>
        </p>
      </OrderSection>
    </>
  )
}

/* ── 4 · Backup & DR: what it is, protection, backups ─────────────────── */

const BCDR_ICONS = { replica: SiteIcon, objectives: ClockIcon, backups: ArchiveIcon }

/* Protection and the add-ons price against a valid base, so each of these
   two steps waits behind one gate until the base steps' problems are fixed. */
function BaseGate({ issues, what, onGo }) {
  return <IssueGate title="Finish the base first" lede={`${what} against a valid vDC, so it waits until these are fixed:`} issues={issues} onGo={onGo} />
}

export function BcdrStep({ draft, vms, cost, patch, errors, baseIssues, onGo }) {
  const gated = baseIssues.size > 0
  const protectedOn = cost.tier.share > 0
  const delta = (changes) => vdcCost({ ...draft, ...changes }, vms).total - cost.total
  return (
    <>
      <BaseGate issues={baseIssues} what="Protection prices" onGo={onGo} />
      <fieldset className="ck-order-fieldset" disabled={gated} aria-disabled={gated || undefined}>
        <OrderSection
          id="bcdr"
          title="Business continuity and disaster recovery"
          hint="A second site that takes over through a site failure, and nightly copies to get back from afterwards. Both are options here with an exact price, not defaults."
        >
          <ItemGroup className="ck-bcdr">
            {BCDR_COPY.map((c) => {
              const Icon = BCDR_ICONS[c.id]
              return (
                <Item key={c.id} variant="outline" className="ck-bcdr-item">
                  <ItemMedia variant="icon"><Icon /></ItemMedia>
                  <ItemContent>
                    <ItemTitle>{c.title}</ItemTitle>
                    <ItemDescription className="ck-bcdr-body">{c.body}</ItemDescription>
                  </ItemContent>
                </Item>
              )
            })}
          </ItemGroup>
        </OrderSection>
        <OrderSection id="protection" title="Protection" hint="How much of the vDC is waiting at a second site, and the objectives that buys. Each tier shows what it adds to this vDC's bill.">
          <RadioGroup value={draft.protection} onValueChange={(protection) => patch({ protection })} className="ck-options" aria-label="Protection">
            {PROTECTION_TIERS.map((t) => {
              const block = protectionBlock(draft, t.id)
              return (
                <OptionRow
                  key={t.id}
                  value={t.id}
                  name={t.name}
                  meta={t.share ? `RPO ${t.rpo} · RTO ${t.rto} · ${t.share * 100}% of CPU and RAM` : "No replica"}
                  description={t.description}
                  disabled={Boolean(block)}
                  reason={block}
                  delta={<Delta amount={delta({ protection: t.id })} />}
                />
              )
            })}
          </RadioGroup>
          <div className={cn("ck-order-two", !protectedOn && "ck-order-muted")}>
            <div className="ck-order-field">
              <Label htmlFor="ck-order-dr-site">DR target site</Label>
              <Select value={draft.drSite} onValueChange={(drSite) => patch({ drSite })} disabled={!protectedOn}>
                <SelectTrigger id="ck-order-dr-site" className="ck-order-select" aria-invalid={errors.has("drSite") || undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORDER_SITES.filter((s) => s.id !== draft.site).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} · {s.city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="ck-option-desc">{ORDER_COPY.drSite}</p>
              <InlineError field="drSite">{errors.get("drSite")}</InlineError>
            </div>
            <SliderRow
              field="drStoragePct"
              name="Replicated storage"
              unit="%"
              value={draft.drStoragePct}
              min={100}
              max={200}
              step={5}
              tick={25}
              disabled={!protectedOn}
              onChange={(v) => patch({ drStoragePct: v })}
              price={protectedOn ? cost.dr.storage : 0}
              rate={`${cost.drStorageGb.toLocaleString("en-US")} GB at ${money(ORDER_RATES.drStorageGb)} per GB`}
              description={ORDER_COPY.drStorage}
            />
          </div>
          <PriceLine
            name="Replication licences"
            meta={`${cost.vmCount} × ${money(ORDER_RATES.replicationLicence)}`}
            price={protectedOn ? cost.dr.licences : 0}
            description={ORDER_COPY.licences}
          />
        </OrderSection>
        <OrderSection id="backups" title="Backups">
          <div className="ck-order-two ck-backups-pair">
            <SwitchRow
              id="ck-order-backups"
              title="Nightly backups"
              meta={`${money(ORDER_RATES.backupGb)} per GB`}
              delta={!draft.backups && <Delta amount={delta({ backups: true })} />}
              description={ORDER_COPY.backups}
              checked={draft.backups}
              disabled={cost.storageGb === 0}
              reason="Nothing to back up yet: add storage first."
              onCheckedChange={(backups) => patch({ backups })}
            />
            <div className="ck-backups-terms">
              <div className="ck-order-field" data-disabled={!draft.backups || undefined}>
                <Label>Retention</Label>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  value={draft.retention}
                  onValueChange={(id) => id && patch({ retention: id })}
                  disabled={!draft.backups}
                  className="ck-segments"
                  aria-label="Backup retention"
                >
                  {BACKUP_RETENTION.map((r) => (
                    <ToggleGroupItem key={r.id} value={r.id}>{r.name}</ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
              <PriceLine
                name="Backup storage"
                meta={`${cost.storageGb.toLocaleString("en-US")} GB · ${cost.retention.name}`}
                price={cost.backups}
              />
            </div>
          </div>
        </OrderSection>
      </fieldset>
    </>
  )
}

/* ── 5 · Add-ons: edge services, licences, what is included ───────────── */

const INCLUDED = ["IPv6 /64 for every machine", "Edge firewall", "Private network", "Hypervisor high availability", "Live migration between hosts", "Management plane and API"]

export function AddonsStep({ draft, cost, patch, errors, baseIssues, onGo }) {
  const gated = baseIssues.size > 0
  const toggleAddon = (id, on) =>
    patch({ addons: on ? [...new Set([...draft.addons, id])] : draft.addons.filter((a) => a !== id) })
  return (
    <>
      <BaseGate issues={baseIssues} what="Add-ons price" onGo={onGo} />
      <fieldset className="ck-order-fieldset" disabled={gated} aria-disabled={gated || undefined}>
        <OrderSection id="edge" title="Edge services" hint="Provisioned with the vDC; each one is a line on the invoice, and a combination that cannot work says why.">
          <div className="ck-check-list">
            {NETWORK_ADDONS.map((a) => {
              const block = addonBlock(draft, a.id)
              const on = a.included || draft.addons.includes(a.id)
              return (
                <CheckRow
                  key={a.id}
                  id={`ck-addon-${a.id}`}
                  title={a.name}
                  meta={a.included ? "included" : `${money(a.rate)}/mo`}
                  delta={!a.included && !on ? <Delta amount={a.rate} /> : undefined}
                  description={a.description}
                  checked={on}
                  disabled={a.included || Boolean(block)}
                  reason={block}
                  onCheckedChange={(next) => toggleAddon(a.id, next === true)}
                />
              )
            })}
          </div>
          <InlineError field="addons">{errors.get("addons")}</InlineError>
        </OrderSection>
        <div className="ck-order-two ck-addons-pair">
          <OrderSection id="licences" title="Licences" hint="Licensed software bills per machine, on top of the pools it draws from.">
            {cost.draw.licensed > 0 ? (
              <PriceLine
                name="Windows Server"
                meta={`${cost.draw.licensed} × ${money(ORDER_RATES.windowsLicence)}`}
                price={cost.licences}
                description="One licence per Windows machine, counted from the table below; change an image and the line follows."
              />
            ) : (
              <p className="ck-option-desc">No licensed software in this vDC; Linux images carry no licence fee.</p>
            )}
          </OrderSection>
          <OrderSection id="included" title="Included" hint="In every vDC, never billed.">
            <div className="ck-markers">
              {INCLUDED.map((m) => (
                <Marker key={m} className="ck-marker">
                  <MarkerIcon><CheckIcon /></MarkerIcon>
                  <MarkerContent>{m}</MarkerContent>
                </Marker>
              ))}
            </div>
          </OrderSection>
        </div>
      </fieldset>
    </>
  )
}
