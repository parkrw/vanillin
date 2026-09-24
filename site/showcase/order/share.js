import { money, moneyHr, orderTotals, sanitizeOrder, siteName, vdcCost, vmMonthly } from "./pricing.js"

/* Save and share without a server: a JSON file that re-opens here, a CSV for
   the spreadsheet, a mailto: with the summary, and the whole order folded
   into the page's own hash. Everything that comes back in goes through
   `sanitizeOrder`; nothing is trusted because it was ours once. */

export const ORDER_FORMAT = 1
const ORDER_KEY = "vanillin.order.draft"
const PATH_KEY = "vanillin.order.path"

const envelope = (order) => ({
  format: ORDER_FORMAT,
  order: { vdcs: order.vdcs, vms: order.vms, draft: order.draft, seq: order.seq, vmSeq: order.vmSeq },
})

export function serializeOrder(order) {
  return JSON.stringify({ ...envelope(order), savedAt: new Date().toISOString() }, null, 2)
}

export function parseOrder(text) {
  let raw
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error("That file is not JSON.")
  }
  if (raw?.format !== undefined && raw.format !== ORDER_FORMAT) throw new Error(`Unknown order format ${String(raw.format).slice(0, 20)}.`)
  const order = sanitizeOrder(raw)
  if (!order) throw new Error("That file does not hold an order.")
  return order
}

/* A cell that a spreadsheet would run as a formula is quoted first. */
const csvCell = (value) => {
  let s = String(value ?? "")
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function orderCsv(order) {
  const rows = [["kind", "vdc", "name", "site", "cpu_ghz", "ram_gb", "storage_gb", "protection", "image", "size", "count", "monthly_usd", "hourly_usd"]]
  for (const v of [...order.vdcs, order.draft]) {
    const c = vdcCost(v, order.vms)
    rows.push(["vdc", v.name, v.name, siteName(v.site), v.cpu, v.ram, c.storageGb, c.tier.name, v.image, "", c.vmCount, c.total.toFixed(2), c.hourly.toFixed(4)])
    for (const vm of order.vms.filter((m) => m.vdc === v.id)) {
      const monthly = vmMonthly(vm.size) * vm.count
      rows.push(["vm", v.name, vm.name, siteName(v.site), "", "", "", "", vm.image, vm.size, vm.count, monthly.toFixed(2), (monthly / 730).toFixed(4)])
    }
  }
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n"
}

export function download(filename, mime, text) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function orderSummaryText(order) {
  const all = [...order.vdcs, order.draft]
  const lines = all.map((v) => {
    const c = vdcCost(v, order.vms)
    return `${v.name} · ${siteName(v.site)} · ${v.cpu} GHz · ${v.ram} GB · ${c.storageGb} GB · ${c.tier.name} — ${money(c.total)}/mo (${moneyHr(c.total)}/hr)`
  })
  const t = orderTotals(order)
  return [...lines, "", `Total ${money(t.total)}/mo before tax, ${money(t.totalWithTax)}/mo with estimated tax (730-hour estimate).`].join("\n")
}

export function mailtoHref(order) {
  const t = orderTotals(order)
  const subject = `Acme Cloud order: ${t.vdcs} vDC${t.vdcs === 1 ? "" : "s"}, ${money(t.total)}/mo`
  const body = `${orderSummaryText(order)}\n\nOpen it here: ${shareUrlFor(order)}`.slice(0, 1800)
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/* base64url over UTF-8; `btoa` alone throws on anything outside Latin-1. */
function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text)
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function fromBase64Url(text) {
  const b64 = text.replace(/-/g, "+").replace(/_/g, "/")
  const bin = atob(b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "="))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

export const encodeOrder = (order) => toBase64Url(JSON.stringify(envelope(order)))

export function decodeOrder(param) {
  try {
    return sanitizeOrder(JSON.parse(fromBase64Url(param)))
  } catch {
    return null
  }
}

/* `#order?o=…` inside the docs SPA, `#o=…` on the standalone page. */
export function orderFromLocation() {
  const hash = window.location.hash
  const query = hash.includes("?") ? hash.slice(hash.indexOf("?") + 1) : hash.slice(1)
  const param = new URLSearchParams(query).get("o")
  return param ? decodeOrder(param) : null
}

export function shareUrlFor(order) {
  const base = window.location.href.split("#")[0]
  const standalone = /order\.html$/.test(window.location.pathname)
  return `${base}#${standalone ? "" : "order?"}o=${encodeOrder(order)}`
}

export function loadSavedOrder() {
  try {
    const text = localStorage.getItem(ORDER_KEY)
    return text ? sanitizeOrder(JSON.parse(text)) : null
  } catch {
    return null
  }
}

export function saveOrder(order) {
  try {
    localStorage.setItem(ORDER_KEY, JSON.stringify(envelope(order)))
  } catch {
    /* private mode or full: the order lives in memory for this visit */
  }
}

export function clearSavedOrder() {
  try {
    localStorage.removeItem(ORDER_KEY)
  } catch {
    /* nothing to clear */
  }
}

export function loadPath() {
  try {
    const path = localStorage.getItem(PATH_KEY)
    return path === "quick" || path === "custom" ? path : null
  } catch {
    return null
  }
}

export function savePath(path) {
  try {
    localStorage.setItem(PATH_KEY, path)
  } catch {
    /* remembered for this visit only */
  }
}

/* Clipboard with the same fallback ui/copy-field uses; false when refused. */
export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    /* fall through to the textarea */
  }
  const area = document.createElement("textarea")
  area.value = text
  area.setAttribute("readonly", "")
  area.style.position = "fixed"
  area.style.insetInlineStart = "-9999px"
  document.body.appendChild(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand("copy")
  } catch {
    ok = false
  } finally {
    area.remove()
  }
  return ok
}
