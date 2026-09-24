import { useState } from "react"
import { cn } from "../../../lib/cn.js"
import { Alert, AlertDescription, AlertTitle } from "../../../ui/alert/alert.jsx"
import { Button } from "../../../ui/button/button.jsx"
import { Card, CardContent } from "../../../ui/card/card.jsx"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "../../../ui/empty/empty.jsx"
import { Field, FieldDescription, FieldLabel } from "../../../ui/field/field.jsx"
import { Input } from "../../../ui/input/input.jsx"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "../../../ui/input-group/input-group.jsx"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "../../../ui/item/item.jsx"
import { Label } from "../../../ui/label/label.jsx"
import { Marker, MarkerContent, MarkerIcon } from "../../../ui/marker/marker.jsx"
import { NativeSelect, NativeSelectOption } from "../../../ui/native-select/native-select.jsx"
import { RadioGroup, RadioGroupItem } from "../../../ui/radio-group/radio-group.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select/select.jsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs/tabs.jsx"
import { Textarea } from "../../../ui/textarea/textarea.jsx"
import { ToggleGroup, ToggleGroupItem } from "../../../ui/toggle-group/toggle-group.jsx"
import { ACCESS_METHODS, BACKUP_RETENTION, BCDR_COPY, BILLING_TERMS, COMPUTE_PRESETS, NETWORKS, NETWORK_ADDONS, ORDER_COPY, ORDER_PATHS, ORDER_RATES, ORDER_SITES, POOLS, PROTECTION_TIERS, SITE_FACTS, SOFTWARE, SOFTWARE_TABS, STORAGE_TIERS, UPLINKS, USER_REGIONS, WORKLOADS } from "../console-data.js"
import { AlertCircleIcon, ArchiveIcon, BoxIcon, CameraIcon, CheckIcon, ChevronRightIcon, ClockIcon, CodeIcon, DatabaseIcon, GlobeIcon, GpuIcon, GridIcon, SiteIcon, SparkleIcon } from "../icons.jsx"
import { CheckRow, Delta, Disclosure, InlineError, OptionRow, OrderSection, PriceLine, Recommended, SliderRow, SpecCard, StepFooter, SwitchRow } from "./form.jsx"
import { STEPS, addonBlock, money, moneyHr, otherSite, protectionBlock, regionOf, siteName, siteOf, softwareOf, stepOfField, vdcCost, workloadOf } from "./pricing.js"
import "../../../ui/alert/alert.css"
import "../../../ui/button/button.css"
import "../../../ui/card/card.css"
import "../../../ui/empty/empty.css"
import "../../../ui/field/field.css"
import "../../../ui/input/input.css"
import "../../../ui/input-group/input-group.css"
import "../../../ui/item/item.css"
import "../../../ui/label/label.css"
import "../../../ui/marker/marker.css"
import "../../../ui/native-select/native-select.css"
import "../../../ui/radio-group/radio-group.css"
import "../../../ui/select/select.css"
import "../../../ui/tabs/tabs.css"
import "../../../ui/textarea/textarea.css"
import "../../../ui/toggle/toggle.css"
import "../../../ui/toggle-group/toggle-group.css"

const WORKLOAD_ICONS = { general: BoxIcon, website: GlobeIcon, development: CodeIcon, database: DatabaseIcon, gpu: GpuIcon, windows: GridIcon }

/* ── 1 · Location: path, workload, users → site, billing and name ─────── */

export function LocationStep({ draft, patch, errors, touch, onPath, onWorkload, onSkip, onNext, next }) {
  const region = regionOf(draft.users)
  const recommended = region.site
  const site = siteOf(draft.site)
  const billing = BILLING_TERMS.find((t) => t.id === draft.billing)
  const path = ORDER_PATHS.find((p) => p.id === draft.path) ?? ORDER_PATHS[1]
  const setSite = (id) => patch({ site: id, drSite: draft.drSite === id ? otherSite(id) : draft.drSite })
  return (
    <>
      <OrderSection
        id="path"
        title="How do you want to build?"
        hint="Quick Deploy fills the rest from the workload and lands on the review; Custom walks every step. Your choice is remembered."
      >
        <ToggleGroup type="single" variant="outline" value={draft.path} onValueChange={(id) => id && onPath(id)} className="ck-presets ck-path" aria-label="Path">
          {ORDER_PATHS.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id} className="ck-preset">
              <span className="ck-preset-name">{p.name}</span>
              <span className="ck-preset-meta">{p.id === "quick" ? "three decisions" : "every step"}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="ck-option-desc">{path.description}</p>
      </OrderSection>

      <OrderSection
        id="workload"
        title="What will it run?"
        hint="Sets the recommended plan, image and storage mix; everything stays editable."
        aside={
          <Button variant="link" size="sm" className="ck-order-skip" onClick={onSkip}>
            I know the specs
            <ChevronRightIcon />
          </Button>
        }
      >
        <RadioGroup value={draft.workload} onValueChange={onWorkload} className="ck-workloads" aria-label="Workload">
          {WORKLOADS.map((w) => {
            const Icon = WORKLOAD_ICONS[w.id]
            const preset = COMPUTE_PRESETS.find((p) => p.id === w.preset)
            return (
              <Card key={w.id} className="ck-workload" data-state={draft.workload === w.id ? "checked" : "unchecked"} onClick={() => onWorkload(w.id)}>
                <CardContent className="ck-workload-body">
                  <span className="ck-workload-icon"><Icon /></span>
                  <div className="ck-workload-text">
                    <div className="ck-workload-name">
                      {w.name}
                      <RadioGroupItem value={w.id} aria-label={w.name} />
                    </div>
                    <p className="ck-option-desc">{w.description}</p>
                    <span className="ck-workload-plan">
                      Plan {preset.name} · {preset.cpu} GHz · {preset.ram} GB{w.id === "windows" ? " · licensed" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </RadioGroup>
      </OrderSection>

      <OrderSection id="site" title="Where are most of your users?" hint="Latency follows the users, so we recommend one site and keep the others a click away.">
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={draft.users}
          onValueChange={(id) => id && patch({ users: id })}
          className="ck-segments ck-users"
          aria-label="Where your users are"
        >
          {USER_REGIONS.map((r) => (
            <ToggleGroupItem key={r.id} value={r.id}>{r.name}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="ck-recommendation" data-followed={draft.site === recommended || undefined}>
          <SparkleIcon />
          <div className="ck-recommendation-text">
            <span className="ck-recommendation-title">
              We recommend <strong>{siteName(recommended)}</strong>
            </span>
            <span className="ck-option-desc">{region.rationale}</span>
          </div>
          {draft.site !== recommended && (
            <Button size="sm" variant="outline" className="ck-recommendation-use" onClick={() => setSite(recommended)}>
              Use it
            </Button>
          )}
        </div>
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
                <RadioGroupItem value={s.id} aria-label={s.name} />
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
        <Disclosure id="compare-sites" label="Compare sites" hint="latency to each region, new capacity, seismic risk and tax">
          <div className="ck-compare-wrap">
            <table className="ck-compare">
              <thead>
                <tr>
                  <th>Site</th>
                  {USER_REGIONS.filter((r) => r.id !== "everywhere").map((r) => (
                    <th key={r.id}>{r.name}</th>
                  ))}
                  <th>New capacity</th>
                  <th>Seismic risk</th>
                  <th>Sales tax</th>
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
                      <td>{f.queue}</td>
                      <td>{f.seismic}</td>
                      <td className="ck-num">{f.taxLabel}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Disclosure>
      </OrderSection>

      <OrderSection id="billing" title="Billing and name">
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
            <p className="ck-option-desc">Shown in the rail and on invoices; lower-case letters, digits and dashes.</p>
            <InlineError field="name">{errors.get("name")}</InlineError>
          </div>
        </div>
      </OrderSection>
      <StepFooter next={next} onNext={onNext} />
    </>
  )
}

/* ── 2 · Infrastructure: software, size, network, access ─────────────── */

const popularFirst = (a, b) => Number(Boolean(b.recent)) - Number(Boolean(a.recent)) || Number(Boolean(b.popular)) - Number(Boolean(a.popular))

export function InfrastructureStep({ draft, cost, patch, patchAccess, patchGroup, errors, touch, onNext, next }) {
  const [softwareTab, setSoftwareTab] = useState(() => softwareOf(draft.image)?.tab ?? "os")
  const workload = workloadOf(draft.workload)
  const [cpuPool, ramPool, ipPool] = POOLS
  const preset = COMPUTE_PRESETS.find((p) => p.cpu === draft.cpu && p.ram === draft.ram)?.id ?? "custom"
  const applyPreset = (id) => {
    const p = COMPUTE_PRESETS.find((x) => x.id === id)
    if (p) patch({ cpu: p.cpu, ram: p.ram })
  }
  const planMonthly = (p) => p.cpu * cpuPool.rate + p.ram * ramPool.rate
  const fits = (p) => Math.floor(Math.min(p.cpu / 2, p.ram / 4))
  const uplink = UPLINKS.find((u) => u.id === draft.uplink)
  const access = draft.access
  return (
    <>
      <OrderSection id="software" title="Software" hint="What new machines in this vDC boot from; any single machine can differ in the table below.">
        <Tabs value={softwareTab} onValueChange={setSoftwareTab} className="ck-software">
          <TabsList>
            {SOFTWARE_TABS.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.name}
                <span className="ck-software-count">{SOFTWARE.filter((s) => s.tab === t.id).length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
          {SOFTWARE_TABS.map((t) => {
            const items = SOFTWARE.filter((s) => s.tab === t.id).sort(popularFirst)
            return (
              <TabsContent key={t.id} value={t.id} className="ck-software-panel">
                {items.length === 0 ? (
                  <Empty className="ck-software-empty">
                    <EmptyHeader>
                      <EmptyMedia variant="icon"><CameraIcon /></EmptyMedia>
                      <EmptyTitle>No snapshots yet</EmptyTitle>
                      <EmptyDescription>Snapshots of your running machines appear here once you have some; start from an operating system or an application.</EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                ) : (
                  <RadioGroup value={draft.image} onValueChange={(image) => patch({ image })} className="ck-options ck-software-list" aria-label={t.name}>
                    {items.map((s) => (
                      <OptionRow
                        key={s.name}
                        value={s.name}
                        name={s.name}
                        meta={s.licence ? `${money(ORDER_RATES.windowsLicence)} per machine` : undefined}
                        badge={
                          <>
                            {s.recent && <span className="ck-chip ck-chip--recent">Recent</span>}
                            {s.popular && <span className="ck-chip">Popular</span>}
                          </>
                        }
                        description={s.description}
                      />
                    ))}
                  </RadioGroup>
                )}
              </TabsContent>
            )
          })}
        </Tabs>
        <InlineError field="image">{errors.get("image")}</InlineError>
      </OrderSection>

      <OrderSection id="size" title="Size" hint="Pick a plan or set the pools yourself; every machine in the vDC draws from them. Hourly is the monthly rate over 730 hours.">
        <RadioGroup value={preset} onValueChange={applyPreset} className="ck-plans" aria-label="Plan">
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
                  <RadioGroupItem value={p.id} aria-label={`Plan ${p.name}`} />
                </div>
                <span className="ck-plan-spec">{p.cpu} GHz · {p.ram} GB</span>
                <span className="ck-plan-price"><strong>{moneyHr(planMonthly(p))}</strong>/hr</span>
                <span className="ck-plan-monthly">{money(planMonthly(p))}/mo estimate</span>
                <span className="ck-option-desc">{p.description}</span>
                {p.id === workload.preset && <Recommended reason={workload.reason} />}
              </CardContent>
            </Card>
          ))}
          <Card className="ck-plan ck-plan--custom" data-state={preset === "custom" ? "checked" : "unchecked"}>
            <CardContent className="ck-plan-body">
              <div className="ck-plan-head">
                <span className="ck-plan-name">Custom</span>
                <RadioGroupItem value="custom" aria-label="Custom plan" />
              </div>
              <span className="ck-plan-spec">{draft.cpu} GHz · {draft.ram} GB</span>
              <span className="ck-plan-price"><strong>{moneyHr(cost.cpu + cost.ram)}</strong>/hr</span>
              <span className="ck-plan-monthly">{money(cost.cpu + cost.ram)}/mo estimate</span>
              <span className="ck-option-desc">Set the pools below; the plan reads Custom when they match no card.</span>
            </CardContent>
          </Card>
        </RadioGroup>
        <Disclosure id="compare-plans" label="Compare all plans" hint="pools, machines that fit, hourly and monthly">
          <div className="ck-compare-wrap">
            <table className="ck-compare">
              <thead>
                <tr>
                  <th>Plan</th>
                  <th>CPU pool</th>
                  <th>RAM pool</th>
                  <th>Fits</th>
                  <th>Per hour</th>
                  <th>Per month</th>
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
                    <td className="ck-num">{moneyHr(planMonthly(p))}</td>
                    <td className="ck-num">{money(planMonthly(p))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Disclosure>
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
              onChange={(v) => {
                patch({ [p.id]: v })
                touch(p.id)
              }}
              price={draft[p.id] * p.rate}
              rate={`${money(p.rate)} per ${p.unit}`}
              description={p.description}
              error={errors.get(p.id)}
            />
          ))}
        </div>
        <p className="ck-order-draw" data-over={cost.draw.ghz > draft.cpu || cost.draw.gb > draft.ram || undefined}>
          The machines in this vDC draw <strong>{cost.draw.ghz} GHz</strong> of {draft.cpu} and <strong>{cost.draw.gb} GB</strong> of {draft.ram}.
        </p>
        <SwitchRow
          id="ck-order-headroom"
          title="Reserve headroom"
          meta="not billed"
          description={ORDER_COPY.headroom}
          checked={draft.headroom}
          onCheckedChange={(headroom) => patch({ headroom })}
        />
      </OrderSection>

      <OrderSection id="network" title="Network" hint="Safe defaults: a private network, an IPv6 /64 and the edge firewall, all included. Public IPv4 is the one thing here that costs.">
        <div className="ck-slider-grid">
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
            description={`${ipPool.description} IPv6 is included, so a machine that only needs to be reached over IPv6 costs nothing here.`}
          />
          <div className="ck-network-facts">
            <PriceLine name="IPv6 /64" meta="included" price={0} description="Every machine gets a global IPv6 address; nothing to configure." />
            <PriceLine name="Edge firewall" meta="included" price={0} description={NETWORK_ADDONS[0].description} />
          </div>
        </div>
        <Disclosure id="advanced-network" label="Advanced networking" hint="uplink tier, default network, placement">
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
          <div className="ck-order-two">
            <Field className="ck-order-field">
              <FieldLabel htmlFor="ck-order-network">Default network</FieldLabel>
              <NativeSelect id="ck-order-network" value={draft.vmGroup.network} onChange={(e) => patchGroup({ network: e.target.value })}>
                {NETWORKS.filter((n) => n.type === "Private").map((n) => (
                  <NativeSelectOption key={n.name} value={n.name}>{n.name} · {n.subnet}</NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>New machines attach here first; add more interfaces after launch.</FieldDescription>
            </Field>
            <SwitchRow
              id="ck-order-affinity"
              title="Anti-affinity"
              meta="not billed"
              description="Spread the machines across hosts, so one host failure takes one machine."
              checked={draft.vmGroup.antiAffinity}
              onCheckedChange={(antiAffinity) => patchGroup({ antiAffinity })}
            />
          </div>
        </Disclosure>
      </OrderSection>

      <OrderSection id="access" title="Access" hint="An SSH key is the default; a password or a startup script on request.">
        <ToggleGroup type="single" variant="outline" value={access.method} onValueChange={(method) => method && patchAccess({ method })} className="ck-segments" aria-label="Access method">
          {ACCESS_METHODS.map((m) => (
            <ToggleGroupItem key={m.id} value={m.id}>{m.name}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        {access.method === "ssh" ? (
          <Field className="ck-order-field ck-order-field--wide">
            <FieldLabel htmlFor="ck-order-ssh">Public key</FieldLabel>
            <Textarea
              id="ck-order-ssh"
              className="ck-order-key"
              rows={3}
              spellCheck={false}
              placeholder="ssh-ed25519 AAAAC3… you@laptop"
              value={access.sshKey}
              aria-invalid={errors.has("access") || undefined}
              onChange={(e) => patchAccess({ sshKey: e.target.value })}
              onBlur={() => touch("access")}
            />
            <FieldDescription>{ACCESS_METHODS[0].description}</FieldDescription>
            <InlineError field="access">{errors.get("access")}</InlineError>
          </Field>
        ) : (
          <Field className="ck-order-field">
            <FieldLabel htmlFor="ck-order-password">Root password</FieldLabel>
            <Input
              id="ck-order-password"
              type="password"
              autoComplete="new-password"
              value={access.password}
              aria-invalid={errors.has("access") || undefined}
              onChange={(e) => patchAccess({ password: e.target.value })}
              onBlur={() => touch("access")}
            />
            <FieldDescription>{ACCESS_METHODS[1].description}</FieldDescription>
            <InlineError field="access">{errors.get("access")}</InlineError>
          </Field>
        )}
        <Disclosure id="startup-script" label="Add a startup script" hint="cloud-init or a shell script, run once on first boot">
          <Field className="ck-order-field ck-order-field--wide">
            <FieldLabel htmlFor="ck-order-script">Startup script</FieldLabel>
            <Textarea
              id="ck-order-script"
              className="ck-order-script"
              rows={5}
              spellCheck={false}
              placeholder={"#!/bin/sh\napt-get update && apt-get install -y nginx"}
              value={access.script}
              onChange={(e) => patchAccess({ script: e.target.value })}
            />
            <FieldDescription>Runs as root on every machine in the vDC the first time it boots; not billed.</FieldDescription>
          </Field>
        </Disclosure>
      </OrderSection>

      <OrderSection id="included" title="Included" hint={ORDER_COPY.included}>
        <div className="ck-markers">
          {["Hypervisor high availability", "Live migration between hosts", "Management plane and API", "Edge firewall"].map((m) => (
            <Marker key={m} className="ck-marker">
              <MarkerIcon><CheckIcon /></MarkerIcon>
              <MarkerContent>{m}</MarkerContent>
            </Marker>
          ))}
        </div>
      </OrderSection>
      <StepFooter next={next} onNext={onNext} />
    </>
  )
}

/* ── 3 · Storage: the pane kept whole ─────────────────────────────────── */

export function StorageStep({ draft, cost, patch, errors, onNext, next }) {
  return (
    <>
      <OrderSection id="tiers" title="Tiers" hint="GB per tier; leave a tier at zero to skip it. Hover a tier's name for its figures.">
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
      </OrderSection>
      <StepFooter next={next} onNext={onNext} />
    </>
  )
}

/* ── 4 · Add-ons: protection, backups, edge services, licences ─────────── */

const BCDR_ICONS = { replica: SiteIcon, objectives: ClockIcon, backups: ArchiveIcon }

export function AddonsStep({ draft, vms, cost, patch, errors, baseIssues, onGo, onNext, next }) {
  const gated = baseIssues.size > 0
  const protectedOn = cost.tier.share > 0
  const delta = (changes) => vdcCost({ ...draft, ...changes }, vms).total - cost.total
  const toggleAddon = (id, on) =>
    patch({ addons: on ? [...new Set([...draft.addons, id])] : draft.addons.filter((a) => a !== id) })
  return (
    <>
      {gated && (
        <Alert variant="destructive" className="ck-order-gate" data-issues={baseIssues.size}>
          <AlertCircleIcon />
          <AlertTitle>Finish the base first</AlertTitle>
          <AlertDescription>
            Add-ons price against a valid vDC, so they wait until these are fixed:
            <ul className="ck-order-gate-list">
              {[...baseIssues].map(([field, message]) => (
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
      )}
      <fieldset className="ck-order-fieldset" disabled={gated} aria-disabled={gated || undefined}>
        <OrderSection
          id="bcdr"
          title="Business continuity and disaster recovery"
          hint="Continuity keeps the service running through a site failure; recovery is how it gets back afterwards. Both are options here, not defaults."
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
        </OrderSection>
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
      </fieldset>
      <StepFooter next={next} onNext={onNext} />
    </>
  )
}
