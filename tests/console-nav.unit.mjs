/**
 * The console showcase's navigation carries no repeated label.
 * Named .unit.mjs so the browser test runner ignores it.
 *
 * The rails and the tab bar are three levels deep, and a level that echoes
 * the one above it spends a row of chrome saying nothing the reader has not
 * just read. The browser suite asserts today's exact rails; this asserts the
 * rule, so a service added later cannot quietly reintroduce a repeat.
 */

import assert from "node:assert/strict"
import { CATEGORIES } from "../site/showcase/console-data.js"

let passed = 0
let failed = 0

function test(name, fn) {
  try {
    fn()
    passed++
  } catch (err) {
    failed++
    console.error(`FAIL ${name}\n  ${err.message}`)
  }
}

/* Compare on letters and digits alone, so "Data Centers" and "data-centers"
   count as the same word to a reader. */
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "")

/* What the tab bar actually draws: nothing for a one-page service, and
   nothing for a site, whose open fold already lists its vDCs as rail links. */
const drawnTabs = (svc) => (svc.collapsible || svc.pages.length < 2 ? [] : svc.pages)

test("every category and service has a label", () => {
  for (const cat of CATEGORIES) {
    assert.ok(cat.label, `${cat.id}: no label`)
    for (const svc of cat.items) {
      assert.ok(svc.name, `${cat.id}/${svc.id}: no name`)
      assert.ok(svc.pages.length >= 1, `${cat.id}/${svc.id}: no pages`)
    }
  }
})

test("no service repeats its category's name", () => {
  for (const cat of CATEGORIES) {
    for (const svc of cat.items) {
      assert.notEqual(norm(svc.name), norm(cat.label), `${cat.label} → ${svc.name}`)
    }
  }
})

test("no tab repeats the service or the category above it", () => {
  for (const cat of CATEGORIES) {
    for (const svc of cat.items) {
      for (const page of drawnTabs(svc)) {
        assert.notEqual(norm(page), norm(svc.name), `${svc.name} → ${page}`)
        assert.notEqual(norm(page), norm(cat.label), `${cat.label} → ${page}`)
      }
    }
  }
})

test("a folded site draws no tab bar, so its vDCs are listed once", () => {
  const sites = CATEGORIES.flatMap((cat) => cat.items).filter((svc) => svc.collapsible)
  assert.ok(sites.length >= 3, `expected the three sites, found ${sites.length}`)
  for (const site of sites) {
    assert.deepEqual(drawnTabs(site), [], `${site.name} still draws tabs`)
  }
})

test("no two rows in one rail share a name, and a folded code is not the name", () => {
  for (const cat of CATEGORIES) {
    const names = cat.items.map((svc) => norm(svc.name))
    assert.equal(new Set(names).size, names.length, `${cat.label}: two rows share a name`)
    for (const svc of cat.items) {
      if (svc.short) assert.notEqual(norm(svc.short), norm(svc.name), `${svc.name}: the code is the name`)
    }
  }
})

console.log(`console-nav: ${passed} passed, ${failed} failed`)
if (failed) process.exit(1)
