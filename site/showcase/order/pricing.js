import { ACCESS_DEFAULTS, ACCESS_METHODS, BACKUP_RETENTION, MACHINE_IMAGES, NETWORKS, NETWORK_ADDONS, ORDER_DEFAULTS, ORDER_RATES, ORDER_SITES, POOLS, PROTECTION_TIERS, SITE_FACTS, SIZES, SOFTWARE, STORAGE_TIERS, UPLINKS, USER_REGIONS, VM_DEFAULTS, VM_GROUP_DEFAULTS, WORKLOADS } from "../console-data.js"

/* The six-step spine (location → infrastructure → storage → backup & DR →
   add-ons → checkout). Every step is always clickable; a step with a
   problem carries the count, and `firstBadStep` names the earliest one. */
export const STEPS = [
  { id: "location", label: "Location" },
  { id: "infrastructure", label: "Infrastructure" },
  { id: "storage", label: "Storage" },
  { id: "bcdr", label: "Backup & DR" },
  { id: "addons", label: "Add-ons" },
  { id: "checkout", label: "Checkout" },
]
/* Protection and the add-ons price against a valid base: these three. */
export const BASE_STEPS = ["location", "infrastructure", "storage"]
export const stepIndex = (id) => STEPS.findIndex((s) => s.id === id)
export const nextStepOf = (id) => STEPS[stepIndex(id) + 1] ?? null

// Which step owns each validated field, so an error can point at its step.
const FIELD_STEP = {
  site: "location",
  image: "infrastructure", cpu: "infrastructure", ram: "infrastructure", access: "infrastructure", ips: "infrastructure",
  storage: "storage",
  protection: "bcdr", drSite: "bcdr",
  addons: "addons",
  name: "checkout",
}
export const stepOfField = (field) => FIELD_STEP[field] ?? "checkout"

export const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })
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

/* A vDC draft, and a machine for one. A vDC starts empty; the `seq`
   counters keep ids unique after removals. */
export function newDraft(seq, base = {}) {
  return {
    ...ORDER_DEFAULTS,
    ...base,
    storage: { ...(base.storage ?? ORDER_DEFAULTS.storage) },
    addons: [...(base.addons ?? [])],
    vmGroup: { ...VM_GROUP_DEFAULTS, ...(base.vmGroup ?? {}) },
    id: `vdc-${seq}`,
    name: `vdc-${pad2(seq)}`,
  }
}

/* A machine that would overdraw the pools grows them to the next step that
   fits, up to the pool's ceiling, so Add VM never lands on an error. They
   never shrink: headroom a user grew into stays until the slider says so. */
export function fitPools(vdc, vms) {
  const [cpuPool, ramPool] = POOLS
  const draw = vmDraw(vdc.id, vms)
  const fit = (value, need, { max, step }) => (need <= value ? value : Math.min(max, Math.ceil(need / step) * step))
  const cpu = fit(vdc.cpu, draw.ghz, cpuPool)
  const ram = fit(vdc.ram, draw.gb, ramPool)
  return cpu === vdc.cpu && ram === vdc.ram ? vdc : { ...vdc, cpu, ram }
}

export function fitOrderPools(order, vdcId) {
  if (vdcId === order.draft.id) return { ...order, draft: fitPools(order.draft, order.vms) }
  return { ...order, vdcs: order.vdcs.map((v) => (v.id === vdcId ? fitPools(v, order.vms) : v)) }
}

export function newVm(vdc, seq, access = ACCESS_DEFAULTS) {
  const w = workloadOf(vdc.workload)
  return { ...VM_DEFAULTS, id: `vm-${seq}`, vdc: vdc.id, name: `vm-${pad2(seq)}`, size: w.size, image: vdc.image, count: 1, access: { ...ACCESS_DEFAULTS, ...access } }
}

export function newOrder(seq = 1, vmSeq = 0, base = {}) {
  return { vdcs: [], vms: [], draft: newDraft(seq, base), editing: null, seq, vmSeq }
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
    licences, total, taxRate, tax, totalWithTax: total + tax,
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
      id: `addon-${a.id}`, group: "Add-ons", label: a.name, meta: "", amount: a.rate, step: "addons", field: "addons",
    })),
    ...STORAGE_TIERS.filter((t) => vdc.storage[t.id] > 0).map((t) => ({
      id: `storage-${t.id}`, group: "Storage", label: `${t.name} · ${t.media}`, meta: `${vdc.storage[t.id].toLocaleString("en-US")} GB × ${money(t.rate)}`,
      amount: vdc.storage[t.id] * t.rate, step: "storage", field: "storage",
    })),
  ]
  if (cost.dr) {
    lines.push(
      { id: "dr-compute", group: "Backup & DR", label: `${cost.tier.name} replica`, meta: `${cost.tier.share * 100}% of CPU and RAM at ${siteName(vdc.drSite)}`, amount: cost.dr.compute, step: "bcdr", field: "protection" },
      { id: "dr-storage", group: "Backup & DR", label: "Replicated storage", meta: `${cost.drStorageGb.toLocaleString("en-US")} GB × ${money(ORDER_RATES.drStorageGb)}`, amount: cost.dr.storage, step: "bcdr", field: "protection" },
      { id: "dr-licences", group: "Backup & DR", label: "Replication licences", meta: `${cost.vmCount} × ${money(ORDER_RATES.replicationLicence)}`, amount: cost.dr.licences, step: "bcdr", field: "protection" },
    )
  }
  if (vdc.backups) {
    lines.push({ id: "backups", group: "Backup & DR", label: "Nightly backups", meta: `${cost.storageGb.toLocaleString("en-US")} GB · ${cost.retention.name}`, amount: cost.backups, step: "bcdr", field: "backups" })
  }
  if (cost.draw.licensed > 0) {
    lines.push({ id: "licences", group: "Add-ons", label: "Windows Server", meta: `${cost.draw.licensed} × ${money(ORDER_RATES.windowsLicence)}`, amount: cost.licences, step: "addons", field: "licences" })
  }
  lines.push({ id: "tax", group: "Tax", label: "Estimated sales tax", meta: SITE_FACTS[vdc.site]?.taxLabel ?? "", amount: cost.tax, step: "location", field: "site", tax: true })
  return lines
}

export const USERNAME_RE = /^[a-z_][a-z0-9_-]{0,31}$/

/* Why a machine's access cannot ship, or null. The dialog validates with
   this before it closes, so only an import can carry the problem in. */
export function accessIssue(access = ACCESS_DEFAULTS) {
  if (access.method === "ssh") {
    const key = access.sshKey.trim()
    if (!key) return "Paste a public key, or switch to a username and password."
    if (!/^(ssh-(rsa|ed25519|dss)|ecdsa-sha2-nistp\d+)\s+\S+/.test(key)) return "That does not look like an OpenSSH public key (ssh-ed25519 AAAA…)."
  }
  if (access.method === "password") {
    if (!USERNAME_RE.test(access.username)) return "A username of lower-case letters, digits, dashes and underscores, starting with a letter."
    if (access.password.length < 12) return "Twelve characters at least."
  }
  return null
}

export const vmWithoutAccess = (vdcId, vms) => vms.find((v) => v.vdc === vdcId && accessIssue(v.access))

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
  const [cpuPool, ramPool] = POOLS
  const overdraw = (need, have, pool) =>
    need > pool.max
      ? `The machines draw ${need} ${pool.unit}; the ${pool.name} tops out at ${pool.max}. Remove a machine or shrink one.`
      : `The machines draw ${need} ${pool.unit}; the ${pool.name} holds ${have}. Grow the pool or shrink a machine.`
  if (draw.ghz > draft.cpu) issues.set("cpu", overdraw(draw.ghz, draft.cpu, cpuPool))
  if (draw.gb > draft.ram) issues.set("ram", overdraw(draw.gb, draft.ram, ramPool))
  const storageGb = STORAGE_TIERS.reduce((gb, t) => gb + draft.storage[t.id], 0)
  if (storageGb === 0 && draw.count > 0) issues.set("storage", "Machines need a boot volume: put storage on at least one tier.")
  else if (draw.disk > storageGb) issues.set("storage", `Boot volumes need ${draw.disk.toLocaleString("en-US")} GB; ${storageGb.toLocaleString("en-US")} GB is provisioned.`)
  const locked = vmWithoutAccess(draft.id, vms)
  if (locked) issues.set("access", `${locked.name}: ${accessIssue(locked.access)}`)
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
  return {
    ...base,
    id: typeof raw.id === "string" && /^vdc-\d+$/.test(raw.id) ? raw.id : base.id,
    name: str(raw.name, 40, base.name),
    workload: oneOf(raw.workload, WORKLOADS.map((w) => w.id), base.workload),
    users: oneOf(raw.users, USER_REGIONS.map((r) => r.id), base.users),
    site,
    billing: oneOf(raw.billing, ["monthly", "annual"], base.billing),
    image: oneOf(raw.image, [...SOFTWARE.map((s) => s.name), ...MACHINE_IMAGES.map((i) => i.name)], base.image),
    cpu: clampStep(raw.cpu, cpuPool, base.cpu),
    ram: clampStep(raw.ram, ramPool, base.ram),
    headroom: raw.headroom === true,
    ips: clampStep(raw.ips, ipPool, base.ips),
    ipv6: raw.ipv6 !== false,
    uplink: oneOf(raw.uplink, UPLINKS.map((u) => u.id), base.uplink),
    addons: Array.isArray(raw.addons) ? [...new Set(raw.addons.filter((a) => NETWORK_ADDONS.some((n) => n.id === a && !n.included)))] : [],
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

function sanitizeAccess(raw) {
  const a = raw && typeof raw === "object" ? raw : {}
  return {
    method: oneOf(a.method, ACCESS_METHODS.map((m) => m.id), ACCESS_DEFAULTS.method),
    sshKey: str(a.sshKey, 4000),
    username: str(a.username, 32, ACCESS_DEFAULTS.username),
    password: str(a.password, 200),
    script: str(a.script, 20000),
  }
}

/* Exports from before access moved onto the machine carry it on the vDC;
   `vdcAccess` maps a vDC id to that, for a machine that has none. */
export function sanitizeVm(raw, seq, vdcIds, vdcAccess = {}) {
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
    access: sanitizeAccess(raw.access ?? vdcAccess[raw.vdc]),
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
  const rawVdcs = (Array.isArray(src.vdcs) ? src.vdcs : []).slice(0, MAX_VDCS)
  const vdcs = rawVdcs.map((v, i) => sanitizeVdc(v, i + 1))
  const draft = sanitizeVdc(src.draft, vdcs.length + 1)
  const ids = [...vdcs.map((v) => v.id), draft.id]
  const vdcAccess = Object.fromEntries([...rawVdcs, src.draft].map((v, i) => [ids[i], v?.access]))
  const seen = new Set()
  const vms = (Array.isArray(src.vms) ? src.vms : [])
    .slice(0, MAX_VMS)
    .map((vm, i) => sanitizeVm(vm, i + 1, ids, vdcAccess))
    .filter((vm) => vm && !seen.has(vm.id) && seen.add(vm.id))
  const seq = Math.max(vdcs.length + 1, ...ids.map((id) => Number(id.slice(4)) || 0))
  const vmSeq = Math.max(vms.length, ...vms.map((vm) => Number(vm.id.slice(3)) || 0))
  return { vdcs: vdcs.map((v) => fitPools(v, vms)), draft: fitPools(draft, vms), vms, editing: null, seq, vmSeq }
}
