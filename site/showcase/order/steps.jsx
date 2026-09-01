import { cn } from "../../../lib/cn.js"
import { Card, CardContent } from "../../../ui/card/card.jsx"
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "../../../ui/input-group/input-group.jsx"
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from "../../../ui/item/item.jsx"
import { Label } from "../../../ui/label/label.jsx"
import { Marker, MarkerContent, MarkerIcon } from "../../../ui/marker/marker.jsx"
import { RadioGroup, RadioGroupItem } from "../../../ui/radio-group/radio-group.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select/select.jsx"
import { ToggleGroup, ToggleGroupItem } from "../../../ui/toggle-group/toggle-group.jsx"
import { BACKUP_RETENTION, BCDR_COPY, BILLING_TERMS, COMPUTE_PRESETS, NETWORK_ADDONS, ORDER_COPY, ORDER_RATES, ORDER_SITES, POOLS, PROTECTION_TIERS, STORAGE_TIERS, UPLINKS } from "../console-data.js"
import { ArchiveIcon, CheckIcon, ClockIcon, SiteIcon } from "../icons.jsx"
import { CheckRow, DraftBar, OptionRow, OrderSection, PriceLine, SliderRow, SpecCard, SwitchRow } from "./form.jsx"
import { money, otherSite, siteOf } from "./pricing.js"
import "../../../ui/card/card.css"
import "../../../ui/input-group/input-group.css"
import "../../../ui/item/item.css"
import "../../../ui/label/label.css"
import "../../../ui/marker/marker.css"
import "../../../ui/radio-group/radio-group.css"
import "../../../ui/select/select.css"
import "../../../ui/toggle/toggle.css"
import "../../../ui/toggle-group/toggle-group.css"

export function LocationStep({ draft, patch, cost, onNext }) {
  const setSite = (site) => patch({ site, drSite: draft.drSite === site ? otherSite(site) : draft.drSite })
  const site = siteOf(draft.site)
  const billing = BILLING_TERMS.find((t) => t.id === draft.billing)
  return (
    <>
      <OrderSection title="Site" hint="Where the vDC runs; the replica, if you add one, goes to a second site.">
        <RadioGroup value={draft.site} onValueChange={setSite} className="ck-sites" aria-label="Site">
          {ORDER_SITES.map((s) => (
            <Card
              key={s.id}
              className="ck-site"
              data-state={draft.site === s.id ? "checked" : "unchecked"}
              onClick={() => setSite(s.id)}
            >
              <CardContent className="ck-site-body">
                <RadioGroupItem value={s.id} aria-label={s.name} />
                <div className="ck-site-text">
                  <div className="ck-site-name">{s.name}</div>
                  <div className="ck-site-city">{s.city}</div>
                  <p className="ck-option-desc">{s.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </RadioGroup>
      </OrderSection>
      <OrderSection title="Billing and name">
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
            <InputGroup className="ck-order-name">
              <InputGroupAddon><SiteIcon /></InputGroupAddon>
              <InputGroupInput
                id="ck-order-name"
                value={draft.name}
                onChange={(e) => patch({ name: e.target.value })}
                spellCheck={false}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>{site.code.toLowerCase()}.acme.cloud</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <p className="ck-option-desc">Shown in the rail and on invoices; lower-case letters, digits and dashes.</p>
          </div>
        </div>
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="Compute" onNext={onNext} />
    </>
  )
}

export function ComputeStep({ draft, patch, cost, onNext }) {
  const [cpuPool, ramPool] = POOLS
  const preset = COMPUTE_PRESETS.find((p) => p.cpu === draft.cpu && p.ram === draft.ram)?.id ?? "custom"
  const applyPreset = (id) => {
    const p = COMPUTE_PRESETS.find((x) => x.id === id)
    if (p) patch({ cpu: p.cpu, ram: p.ram })
  }
  return (
    <>
      <OrderSection title="Pools" hint="Pick a preset or drag the pools; either way every virtual machine in the vDC draws from them.">
        <ToggleGroup
          type="single"
          variant="outline"
          value={preset}
          onValueChange={applyPreset}
          className="ck-presets"
          aria-label="Compute preset"
        >
          {COMPUTE_PRESETS.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id} className="ck-preset" aria-label={`${p.name}: ${p.cpu} GHz, ${p.ram} GB`}>
              <span className="ck-preset-name">{p.name}</span>
              <span className="ck-preset-meta">{p.cpu} GHz · {p.ram} GB</span>
            </ToggleGroupItem>
          ))}
          <ToggleGroupItem value="custom" className="ck-preset" onClick={(e) => e.preventDefault()} aria-label="Custom">
            <span className="ck-preset-name">Custom</span>
            <span className="ck-preset-meta">drag the pools</span>
          </ToggleGroupItem>
        </ToggleGroup>
        <div className="ck-slider-grid">
          {[cpuPool, ramPool].map((p) => (
            <SliderRow
              key={p.id}
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
            />
          ))}
        </div>
        <SwitchRow
          id="ck-order-headroom"
          title="Reserve headroom"
          meta="not billed"
          description={ORDER_COPY.headroom}
          checked={draft.headroom}
          onCheckedChange={(headroom) => patch({ headroom })}
        />
      </OrderSection>
      <OrderSection title="Included" hint={ORDER_COPY.included}>
        <div className="ck-markers">
          {["Hypervisor high availability", "Live migration between hosts", "Management plane and API", "Edge firewall"].map((m) => (
            <Marker key={m} className="ck-marker">
              <MarkerIcon><CheckIcon /></MarkerIcon>
              <MarkerContent>{m}</MarkerContent>
            </Marker>
          ))}
        </div>
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="Network" onNext={onNext} />
    </>
  )
}

export function NetworkStep({ draft, patch, cost, onNext }) {
  const ipPool = POOLS[2]
  const uplink = UPLINKS.find((u) => u.id === draft.uplink)
  const toggleAddon = (id, on) =>
    patch({ addons: on ? [...new Set([...draft.addons, id])] : draft.addons.filter((a) => a !== id) })
  return (
    <>
      <OrderSection title="Public addresses">
        <div className="ck-slider-grid">
          <SliderRow
            name={ipPool.name}
            unit={ipPool.unit}
            value={draft.ips}
            min={ipPool.min}
            max={ipPool.max}
            step={ipPool.step}
            tick={ipPool.tick}
            onChange={(ips) => patch({ ips })}
            price={cost.ips}
            rate={`${money(ipPool.rate)} per address`}
            description={ipPool.description}
          />
        </div>
      </OrderSection>
      <OrderSection title="Uplink" hint="The vDC's internet edge; the first tier is included in the base price.">
        <ToggleGroup
          type="single"
          variant="outline"
          value={draft.uplink}
          onValueChange={(id) => id && patch({ uplink: id })}
          className="ck-presets"
          aria-label="Uplink"
        >
          {UPLINKS.map((u) => (
            <ToggleGroupItem key={u.id} value={u.id} className="ck-preset" aria-label={`${u.name}, ${money(u.rate)} a month`}>
              <span className="ck-preset-name">{u.name}</span>
              <span className="ck-preset-meta">{money(u.rate)}/mo</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <p className="ck-option-desc">{uplink.description}</p>
      </OrderSection>
      <OrderSection title="Add-ons" hint="Edge services provisioned with the vDC; each one is a line on the invoice.">
        <div className="ck-check-list">
          {NETWORK_ADDONS.map((a) => (
            <CheckRow
              key={a.id}
              id={`ck-addon-${a.id}`}
              title={a.name}
              meta={a.included ? "included" : `${money(a.rate)}/mo`}
              description={a.description}
              checked={a.included || draft.addons.includes(a.id)}
              disabled={a.included}
              onCheckedChange={(on) => toggleAddon(a.id, on === true)}
            />
          ))}
        </div>
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="Storage" onNext={onNext} />
    </>
  )
}

export function StorageStep({ draft, patch, cost, onNext }) {
  return (
    <>
      <OrderSection title="Tiers" hint="GB per tier; leave a tier at zero to skip it. Hover a tier's name for its figures.">
        <div className="ck-slider-grid">
          {STORAGE_TIERS.map((t) => (
            <SliderRow
              key={t.id}
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
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="BCDR" onNext={onNext} />
    </>
  )
}

const BCDR_ICONS = { replica: SiteIcon, objectives: ClockIcon, backups: ArchiveIcon }

export function BcdrStep({ draft, patch, cost, onNext }) {
  const protectedOn = cost.tier.share > 0
  return (
    <>
      <OrderSection
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
      <OrderSection title="Protection" hint="How much of the vDC is waiting at a second site, and the objectives that buys.">
        <RadioGroup value={draft.protection} onValueChange={(protection) => patch({ protection })} className="ck-options" aria-label="Protection">
          {PROTECTION_TIERS.map((t) => (
            <OptionRow
              key={t.id}
              value={t.id}
              name={t.name}
              meta={t.share ? `RPO ${t.rpo} · RTO ${t.rto} · ${t.share * 100}% of CPU and RAM` : "No replica"}
              description={t.description}
            />
          ))}
        </RadioGroup>
      </OrderSection>
      <OrderSection title="Replica" className={cn(!protectedOn && "ck-order-muted")}>
        <div className="ck-order-two">
          <div className="ck-order-field">
            <Label htmlFor="ck-order-dr-site">DR target site</Label>
            <Select value={draft.drSite} onValueChange={(drSite) => patch({ drSite })} disabled={!protectedOn}>
              <SelectTrigger id="ck-order-dr-site" className="ck-order-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ORDER_SITES.filter((s) => s.id !== draft.site).map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="ck-option-desc">{ORDER_COPY.drSite}</p>
          </div>
          <SliderRow
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
      <OrderSection title="Backups">
        <SwitchRow
          id="ck-order-backups"
          title="Nightly backups"
          meta={`${money(ORDER_RATES.backupGb)} per GB`}
          description={ORDER_COPY.backups}
          checked={draft.backups}
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
          meta={`${cost.storageGb.toLocaleString("en-US")} GB · ${BACKUP_RETENTION.find((r) => r.id === draft.retention).name}`}
          price={cost.backups}
        />
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="VMs" onNext={onNext} />
    </>
  )
}
