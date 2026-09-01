import { BACKUP_RETENTION, MACHINE_IMAGES, NETWORK_ADDONS, ORDER_DEFAULTS, ORDER_RATES, ORDER_SITES, POOLS, PROTECTION_TIERS, SIZES, STORAGE_TIERS, UPLINKS, VM_DEFAULTS, VM_GROUP_DEFAULTS } from "../console-data.js"

export const ORDER_STEPS = [
  { id: "location", label: "Location" },
  { id: "compute", label: "Compute" },
  { id: "network", label: "Network" },
  { id: "storage", label: "Storage" },
  { id: "bcdr", label: "BCDR" },
  { id: "vms", label: "VMs" },
  { id: "summary", label: "Summary" },
]

export const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" })
export const siteName = (id) => ORDER_SITES.find((s) => s.id === id)?.name ?? id
export const siteOf = (id) => ORDER_SITES.find((s) => s.id === id)
export const otherSite = (id) => ORDER_SITES.find((s) => s.id !== id).id
const pad2 = (n) => String(n).padStart(2, "0")
/* Tick labels: thousands fold to "k" once the figure has five digits. */
export const compact = (n) => (n >= 10000 ? `${n / 1000}k` : n.toLocaleString("en-US"))

/* A vDC draft, and the first VM every new vDC starts with. The `seq`
   counters keep ids unique after removals. */
export function newDraft(seq) {
  return {
    ...ORDER_DEFAULTS,
    storage: { ...ORDER_DEFAULTS.storage },
    addons: [],
    vmGroup: { ...VM_GROUP_DEFAULTS },
    id: `vdc-${seq}`,
    name: `vdc-${pad2(seq)}`,
  }
}

export function newVm(vdcId, seq) {
  return { ...VM_DEFAULTS, id: `vm-${seq}`, vdc: vdcId, name: `vm-${pad2(seq)}`, size: "standard-2", image: MACHINE_IMAGES[0].name, count: 1 }
}

export function newOrder(seq = 1, vmSeq = 1) {
  return { vdcs: [], vms: [newVm(`vdc-${seq}`, vmSeq)], draft: newDraft(seq), editing: null, seq, vmSeq }
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
  const tier = PROTECTION_TIERS.find((t) => t.id === vdc.protection)
  const vmCount = vms.filter((v) => v.vdc === vdc.id).reduce((n, v) => n + v.count, 0)
  const drStorageGb = Math.round((storageGb * vdc.drStoragePct) / 100)
  const dr = tier.share
    ? {
        compute: (cpu + ram) * tier.share,
        storage: drStorageGb * ORDER_RATES.drStorageGb,
        licences: vmCount * ORDER_RATES.replicationLicence,
      }
    : null
  const drTotal = dr ? dr.compute + dr.storage + dr.licences : 0
  return { cpu, ram, ips, uplink, addons, storage, storageGb, backups, drStorageGb, pools, tier, vmCount, dr, drTotal, total: pools + drTotal }
}
