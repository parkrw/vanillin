import { ACCESS_METHODS, BACKUP_RETENTION, COMPUTE_PRESETS, MACHINE_IMAGES, NETWORKS, NETWORK_ADDONS, ORDER_DEFAULTS, ORDER_PATHS, ORDER_RATES, ORDER_SITES, POOLS, PROTECTION_TIERS, SITE_FACTS, SIZES, SOFTWARE, STORAGE_TIERS, UPLINKS, USER_REGIONS, VM_DEFAULTS, VM_GROUP_DEFAULTS, WORKLOADS } from "../console-data.js"

/* The five-step spine (location → infrastructure → storage → add-ons →
   review). Every tab is always clickable; a step with a problem carries the
   count, and `firstBadStep` names the earliest one. */
export const STEPS = [
  { id: "location", label: "Location", title: "Choose a location", lede: "How you want to build, what it runs, and where its users are." },
  { id: "infrastructure", label: "Infrastructure", title: "Size the infrastructure", lede: "The image, the pools every machine draws from, the network edge and how you get in." },
  { id: "storage", label: "Storage", title: "Storage", lede: "GB per performance tier; machines take their volumes from these pools." },
  { id: "addons", label: "Add-ons", title: "Protection and add-ons", lede: "A second site, backups and edge services, each with its exact price." },
  { id: "review", label: "Review", title: "Review and deploy", lede: "Every line itemised, hourly and monthly; save it, share it, deploy it." },
]
export const stepIndex = (id) => STEPS.findIndex((s) => s.id === id)
export const nextStepOf = (id) => STEPS[stepIndex(id) + 1] ?? null

// Which step owns each validated field, so an error can point at its tab.
const FIELD_STEP = {
  name: "location", site: "location", workload: "location",
  image: "infrastructure", cpu: "infrastructure", ram: "infrastructure", access: "infrastructure", ips: "infrastructure",
  storage: "storage",
  protection: "addons", drSite: "addons", addons: "addons",
}
export const stepOfField = (field) => FIELD_STEP[field] ?? "review"

export const HOURS_PER_MONTH = 730
export const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })
export const hourly = (monthly) => monthly / HOURS_PER_MONTH
export const moneyHr = (monthly) =>
  hourly(monthly).toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 3 })
export const siteName = (id) => ORDER_SITES.find((s) => s.id === id)?.name ?? id
export const siteOf = (id) => ORDER_SITES.find((s) => s.id === id)
export const otherSite = (id) => ORDER_SITES.find((s) => s.id !== id).id
export const workloadOf = (id) => WORKLOADS.find((w) => w.id === id) ?? WORKLOADS[0]
export const regionOf = (id) => USER_REGIONS.find((r) => r.id === id) ?? USER_REGIONS.at(-1)
export const softwareOf = (name) => SOFTWARE.find((s) => s.name === name)
export const sizeOf = (name) => SIZES.find((s) => s.name === name) ?? SIZES[1]
const pad2 = (n) => String(n).padStart(2, "0")
/* Tick labels: thousands fold to "k" once the figure has five digits. */
export const compact = (n) => (n >= 10000 ? `${n / 1000}k` : n.toLocaleString("en-US"))
export const NAME_RE = /^[a-z][a-z0-9-]{0,39}$/

/* A vDC draft, and the first VM every new vDC starts with. The `seq`
   counters keep ids unique after removals. */
export function newDraft(seq, base = {}) {
  return {
    ...ORDER_DEFAULTS,
    ...base,
    storage: { ...(base.storage ?? ORDER_DEFAULTS.storage) },
    addons: [...(base.addons ?? [])],
    access: { ...ORDER_DEFAULTS.access, ...(base.access ?? {}) },
    vmGroup: { ...VM_GROUP_DEFAULTS, ...(base.vmGroup ?? {}) },
    id: `vdc-${seq}`,
    name: `vdc-${pad2(seq)}`,
  }
}

export function newVm(vdc, seq, image) {
  const w = workloadOf(vdc.workload)
  return { ...VM_DEFAULTS, id: `vm-${seq}`, vdc: vdc.id, name: `vm-${pad2(seq)}`, size: w.size, image: image ?? vdc.image, count: 1 }
}

export function newOrder(seq = 1, vmSeq = 1, base = {}) {
  const draft = newDraft(seq, base)
  return { vdcs: [], vms: [newVm(draft, vmSeq)], draft, editing: null, seq, vmSeq }
}

/* Applying a workload rewrites the size, image and storage mix of the draft
   and re-images its machines; the name, site and network settings stay. */
export function applyWorkload(draft, vms, workloadId) {
  const w = workloadOf(workloadId)
  const preset = COMPUTE_PRESETS.find((p) => p.id === w.preset)
  const nextDraft = { ...draft, workload: w.id, image: w.image, cpu: preset.cpu, ram: preset.ram, storage: { ...w.storage } }
  const nextVms = vms.map((vm) => (vm.vdc === draft.id ? { ...vm, image: w.image, size: w.size } : vm))
  return { draft: nextDraft, vms: nextVms }
}

/* What a VM draws from the pools, priced at the pool rates: "8 + 1 GPU" and
   "32 GB" parse to their leading numbers, so the size catalogue is the only
   price list. */
const leadingNumber = (s) => parseFloat(s) || 0
export function vmMonthly(sizeName) {
  const size = SIZES.find((s) => s.name === sizeName)
  if (!size) return 0
  const [cpu, ram] = POOLS
  return leadingNumber(size.vcpus) * cpu.rate + leadingNumber(size.ram) * ram.rate
}

export const isLicensed = (image) => Boolean(softwareOf(image)?.licence) || /^Windows/.test(image ?? "")

/* Everything the machines of one vDC take from it: GHz and GB from the
   pools, GB of boot volumes from the tiers, licences by image. */
export function vmDraw(vdcId, vms) {
  return vms
    .filter((v) => v.vdc === vdcId)
    .reduce(
      (d, v) => {
        const size = sizeOf(v.size)
        return {
          count: d.count + v.count,
          ghz: d.ghz + leadingNumber(size.vcpus) * v.count,
          gb: d.gb + leadingNumber(size.ram) * v.count,
          disk: d.disk + leadingNumber(size.disk) * v.count,
          licensed: d.licensed + (isLicensed(v.image) ? v.count : 0),
        }
      },
      { count: 0, ghz: 0, gb: 0, disk: 0, licensed: 0 }
    )
}

export function vdcCost(vdc, vms) {
  const [cpuPool, ramPool, ipPool] = POOLS
  const cpu = vdc.cpu * cpuPool.rate
  const ram = vdc.ram * ramPool.rate
  const ips = vdc.ips * ipPool.rate
  const uplink = (UPLINKS.find((u) => u.id === vdc.uplink) ?? UPLINKS[0]).rate
  const addons = NETWORK_ADDONS.filter((a) => vdc.addons.includes(a.id)).reduce((sum, a) => sum + a.rate, 0)
  const storageGb = STORAGE_TIERS.reduce((gb, t) => gb + vdc.storage[t.id], 0)
  const storage = STORAGE_TIERS.reduce((sum, t) => sum + vdc.storage[t.id] * t.rate, 0)
  const retention = BACKUP_RETENTION.find((r) => r.id === vdc.retention) ?? BACKUP_RETENTION[0]
  const backups = vdc.backups ? storageGb * ORDER_RATES.backupGb * retention.factor : 0
  const pools = cpu + ram + ips + uplink + addons + storage + backups
  const tier = PROTECTION_TIERS.find((t) => t.id === vdc.protection) ?? PROTECTION_TIERS[0]
  const draw = vmDraw(vdc.id, vms)
  const vmCount = draw.count
  const drStorageGb = Math.round((storageGb * vdc.drStoragePct) / 100)
  const dr = tier.share
    ? {
        compute: (cpu + ram) * tier.share,
        storage: drStorageGb * ORDER_RATES.drStorageGb,
        licences: vmCount * ORDER_RATES.replicationLicence,
      }
    : null
  const drTotal = dr ? dr.compute + dr.storage + dr.licences : 0
  const licences = draw.licensed * ORDER_RATES.windowsLicence
  const total = pools + drTotal + licences
  const taxRate = SITE_FACTS[vdc.site]?.tax ?? 0
  const tax = total * taxRate
  return {
    cpu, ram, ips, uplink, addons, storage, storageGb, backups, retention, drStorageGb, pools, tier, vmCount, draw, dr, drTotal,
    licences, total, taxRate, tax, totalWithTax: total + tax, hourly: hourly(total),
  }
}

/* The itemised receipt: one line per billed thing, each naming the step
   that changes it. `amount` is monthly. */
export function receiptOf(vdc, vms, cost = vdcCost(vdc, vms)) {
  const [cpuPool, ramPool, ipPool] = POOLS
  const uplink = UPLINKS.find((u) => u.id === vdc.uplink) ?? UPLINKS[0]
  const lines = [
    { id: "cpu", group: "Compute", label: "CPU pool", meta: `${vdc.cpu} GHz × ${money(cpuPool.rate)}`, amount: cost.cpu, step: "infrastructure", field: "cpu" },
    { id: "ram", group: "Compute", label: "RAM pool", meta: `${vdc.ram} GB × ${money(ramPool.rate)}`, amount: cost.ram, step: "infrastructure", field: "ram" },
    { id: "ips", group: "Network", label: "Public IPv4", meta: vdc.ips ? `${vdc.ips} × ${money(ipPool.rate)}` : "none", amount: cost.ips, step: "infrastructure", field: "ips" },
    { id: "ipv6", group: "Network", label: "IPv6 /64", meta: "included", amount: 0, step: "infrastructure", field: "ips" },
    { id: "uplink", group: "Network", label: `Uplink ${uplink.name}`, meta: vdc.uplink === UPLINKS[0].id ? "base tier" : "", amount: cost.uplink, step: "infrastructure", field: "uplink" },
    ...NETWORK_ADDONS.filter((a) => vdc.addons.includes(a.id)).map((a) => ({
      id: `addon-${a.id}`, group: "Network", label: a.name, meta: "", amount: a.rate, step: "addons", field: "addons",
    })),
    ...STORAGE_TIERS.filter((t) => vdc.storage[t.id] > 0).map((t) => ({
      id: `storage-${t.id}`, group: "Storage", label: `${t.name} · ${t.media}`, meta: `${vdc.storage[t.id].toLocaleString("en-US")} GB × ${money(t.rate)}`,
      amount: vdc.storage[t.id] * t.rate, step: "storage", field: "storage",
    })),
  ]
  if (cost.dr) {
    lines.push(
      { id: "dr-compute", group: "Protection", label: `${cost.tier.name} replica`, meta: `${cost.tier.share * 100}% of CPU and RAM at ${siteName(vdc.drSite)}`, amount: cost.dr.compute, step: "addons", field: "protection" },
      { id: "dr-storage", group: "Protection", label: "Replicated storage", meta: `${cost.drStorageGb.toLocaleString("en-US")} GB × ${money(ORDER_RATES.drStorageGb)}`, amount: cost.dr.storage, step: "addons", field: "protection" },
      { id: "dr-licences", group: "Protection", label: "Replication licences", meta: `${cost.vmCount} × ${money(ORDER_RATES.replicationLicence)}`, amount: cost.dr.licences, step: "addons", field: "protection" },
    )
  }
  if (vdc.backups) {
    lines.push({ id: "backups", group: "Protection", label: "Nightly backups", meta: `${cost.storageGb.toLocaleString("en-US")} GB · ${cost.retention.name}`, amount: cost.backups, step: "addons", field: "backups" })
  }
  if (cost.draw.licensed > 0) {
    lines.push({ id: "licences", group: "Licences", label: "Windows Server", meta: `${cost.draw.licensed} × ${money(ORDER_RATES.windowsLicence)}`, amount: cost.licences, step: "infrastructure", field: "image" })
  }
  lines.push({ id: "tax", group: "Tax", label: "Estimated sales tax", meta: SITE_FACTS[vdc.site]?.taxLabel ?? "", amount: cost.tax, step: "location", field: "site", tax: true })
  return lines
}

/* Problems with a draft, keyed by field. Empty means the vDC can deploy.
   `vdcs` lets the name check see its siblings. */
export function issuesOf(draft, vms, vdcs = []) {
  const issues = new Map()
  const name = (draft.name ?? "").trim()
  if (!name) issues.set("name", "Give the vDC a name.")
  else if (!NAME_RE.test(name)) issues.set("name", "Lower-case letters, digits and dashes only, starting with a letter.")
  else if (vdcs.some((v) => v.id !== draft.id && v.name === name)) issues.set("name", `Another vDC in this order is already called ${name}.`)
  if (!siteOf(draft.site)) issues.set("site", "Pick a site.")
  if (!softwareOf(draft.image) && !MACHINE_IMAGES.some((i) => i.name === draft.image)) issues.set("image", "Pick an image for new machines.")
  const draw = vmDraw(draft.id, vms)
  if (draw.ghz > draft.cpu) issues.set("cpu", `The machines draw ${draw.ghz} GHz; the CPU pool holds ${draft.cpu}. Grow the pool or shrink a machine.`)
  if (draw.gb > draft.ram) issues.set("ram", `The machines draw ${draw.gb} GB; the RAM pool holds ${draft.ram}. Grow the pool or shrink a machine.`)
  const storageGb = STORAGE_TIERS.reduce((gb, t) => gb + draft.storage[t.id], 0)
  if (storageGb === 0) issues.set("storage", "Machines need a boot volume: put storage on at least one tier.")
  else if (draw.disk > storageGb) issues.set("storage", `Boot volumes need ${draw.disk.toLocaleString("en-US")} GB; ${storageGb.toLocaleString("en-US")} GB is provisioned.`)
  const access = draft.access ?? ORDER_DEFAULTS.access
  if (access.method === "ssh" && !access.sshKey.trim()) issues.set("access", "Paste a public key, or switch to a password.")
  else if (access.method === "ssh" && !/^(ssh-(rsa|ed25519|dss)|ecdsa-sha2-nistp\d+)\s+\S+/.test(access.sshKey.trim())) issues.set("access", "That does not look like an OpenSSH public key (ssh-ed25519 AAAA…).")
  if (access.method === "password" && access.password.length < 12) issues.set("access", "Twelve characters at least.")
  if (draft.protection !== "none" && draft.drSite === draft.site) issues.set("drSite", "The replica must live at a different site from the primary.")
  if (draft.ips === 0 && draft.addons.some((a) => a === "vpn" || a === "ddos")) issues.set("addons", "The VPN gateway and the DDoS shield need a public address.")
  return issues
}

export function issuesByStep(issues) {
  const counts = Object.fromEntries(STEPS.map((s) => [s.id, 0]))
  for (const field of issues.keys()) counts[stepOfField(field)] += 1
  return counts
}

export function firstBadStep(issues) {
  let best = null
  for (const field of issues.keys()) {
    const i = stepIndex(stepOfField(field))
    if (best === null || i < best) best = i
  }
  return best === null ? null : STEPS[best].id
}

/* Why an add-on cannot be chosen right now, or null. Disabled combinations
   explain themselves inline instead of greying out. */
export function addonBlock(draft, addonId) {
  if ((addonId === "vpn" || addonId === "ddos") && draft.ips === 0) return "Needs at least one public IPv4 address (Infrastructure › Network)."
  return null
}

export function protectionBlock(draft, tierId) {
  if (tierId === "none") return null
  const storageGb = STORAGE_TIERS.reduce((gb, t) => gb + draft.storage[t.id], 0)
  if (storageGb === 0) return "Nothing to replicate yet: add storage first."
  return null
}

/* Totals across the whole order: committed vDCs plus the draft. */
export function orderTotals(order) {
  const all = [...order.vdcs, order.draft]
  return all.reduce(
    (sum, v) => {
      const c = vdcCost(v, order.vms)
      return { total: sum.total + c.total, tax: sum.tax + c.tax, totalWithTax: sum.totalWithTax + c.totalWithTax, vdcs: all.length }
    },
    { total: 0, tax: 0, totalWithTax: 0, vdcs: 0 }
  )
}

/* ── Untrusted input: imports and share links ──────────────────────── */

const clampStep = (raw, { min, max, step }, fallback = min) => {
  const n = Number(raw)
  if (raw == null || raw === "" || !Number.isFinite(n)) return fallback
  const stepped = min + Math.round((n - min) / step) * step
  return Math.min(max, Math.max(min, stepped))
}
const oneOf = (value, list, fallback) => (list.includes(value) ? value : fallback)
const str = (value, max, fallback = "") => (typeof value === "string" ? value.slice(0, max) : fallback)

export function sanitizeVdc(raw, seq) {
  const base = newDraft(seq)
  if (!raw || typeof raw !== "object") return base
  const [cpuPool, ramPool, ipPool] = POOLS
  const site = oneOf(raw.site, ORDER_SITES.map((s) => s.id), base.site)
  const storage = {}
  for (const t of STORAGE_TIERS) storage[t.id] = clampStep(raw.storage?.[t.id], { min: 0, max: 10000, step: 50 }, base.storage[t.id])
  const access = raw.access && typeof raw.access === "object" ? raw.access : {}
  return {
    ...base,
    id: typeof raw.id === "string" && /^vdc-\d+$/.test(raw.id) ? raw.id : base.id,
    name: str(raw.name, 40, base.name),
    path: oneOf(raw.path, ORDER_PATHS.map((p) => p.id), base.path),
    workload: oneOf(raw.workload, WORKLOADS.map((w) => w.id), base.workload),
    users: oneOf(raw.users, USER_REGIONS.map((r) => r.id), base.users),
    site,
    billing: oneOf(raw.billing, ["monthly", "annual"], base.billing),
    image: str(raw.image, 80, base.image),
    cpu: clampStep(raw.cpu, cpuPool, base.cpu),
    ram: clampStep(raw.ram, ramPool, base.ram),
    headroom: raw.headroom === true,
    ips: clampStep(raw.ips, ipPool, base.ips),
    ipv6: raw.ipv6 !== false,
    uplink: oneOf(raw.uplink, UPLINKS.map((u) => u.id), base.uplink),
    addons: Array.isArray(raw.addons) ? [...new Set(raw.addons.filter((a) => NETWORK_ADDONS.some((n) => n.id === a && !n.included)))] : [],
    access: {
      method: oneOf(access.method, ACCESS_METHODS.map((m) => m.id), "ssh"),
      sshKey: str(access.sshKey, 4000),
      password: str(access.password, 200),
      script: str(access.script, 20000),
    },
    storage,
    protection: oneOf(raw.protection, PROTECTION_TIERS.map((t) => t.id), base.protection),
    drSite: oneOf(raw.drSite, ORDER_SITES.map((s) => s.id), otherSite(site)),
    drStoragePct: clampStep(raw.drStoragePct, { min: 100, max: 200, step: 5 }, base.drStoragePct),
    backups: raw.backups === true,
    retention: oneOf(raw.retention, BACKUP_RETENTION.map((r) => r.id), base.retention),
    vmGroup: {
      antiAffinity: raw.vmGroup?.antiAffinity === true,
      network: oneOf(raw.vmGroup?.network, NETWORKS.filter((n) => n.type === "Private").map((n) => n.name), VM_GROUP_DEFAULTS.network),
    },
  }
}

export function sanitizeVm(raw, seq, vdcIds) {
  if (!raw || typeof raw !== "object" || !vdcIds.includes(raw.vdc)) return null
  const count = Number(raw.count)
  return {
    ...VM_DEFAULTS,
    id: typeof raw.id === "string" && /^vm-\d+$/.test(raw.id) ? raw.id : `vm-${seq}`,
    vdc: raw.vdc,
    name: str(raw.name, 40, `vm-${pad2(seq)}`),
    size: oneOf(raw.size, SIZES.map((s) => s.name), SIZES[1].name),
    image: str(raw.image, 80, MACHINE_IMAGES[0].name),
    count: Number.isFinite(count) ? Math.min(99, Math.max(1, Math.round(count))) : 1,
    publicIp: raw.publicIp === true,
    backup: raw.backup !== false,
    bootTier: oneOf(raw.bootTier, STORAGE_TIERS.map((t) => t.id), VM_DEFAULTS.bootTier),
    startOnCreate: raw.startOnCreate !== false,
  }
}

const MAX_VDCS = 50
const MAX_VMS = 500

/* Rebuilds an order from anything: unknown fields drop, enumerations fall
   back, numbers clamp to their sliders, ids are re-sequenced so nothing
   collides. A file that is not an order at all yields null. */
export function sanitizeOrder(raw) {
  const src = raw?.order ?? raw
  if (!src || typeof src !== "object" || (!Array.isArray(src.vdcs) && !src.draft)) return null
  const vdcs = (Array.isArray(src.vdcs) ? src.vdcs : []).slice(0, MAX_VDCS).map((v, i) => sanitizeVdc(v, i + 1))
  const draft = sanitizeVdc(src.draft, vdcs.length + 1)
  const ids = [...vdcs.map((v) => v.id), draft.id]
  const seen = new Set()
  const vms = (Array.isArray(src.vms) ? src.vms : [])
    .slice(0, MAX_VMS)
    .map((vm, i) => sanitizeVm(vm, i + 1, ids))
    .filter((vm) => vm && !seen.has(vm.id) && seen.add(vm.id))
  const seq = Math.max(vdcs.length + 1, ...ids.map((id) => Number(id.slice(4)) || 0))
  const vmSeq = Math.max(vms.length, ...vms.map((vm) => Number(vm.id.slice(3)) || 0))
  return { vdcs, draft, vms, editing: null, seq, vmSeq }
}
