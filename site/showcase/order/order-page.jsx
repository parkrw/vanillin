import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "../../../ui/button/button.jsx"
import { ModeToggle } from "../../../ui/mode-toggle/mode-toggle.jsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs/tabs.jsx"
import { toast } from "../../../ui/toast/toast.jsx"
import { setSiteDark, useSiteDark } from "../../color-scheme.js"
import { ORDER_PAGE } from "../console-data.js"
import { ArrowLeftIcon, CartIcon } from "../icons.jsx"
import { OrderTable } from "./order-table.jsx"
import { STEPS, applyWorkload, firstBadStep, issuesByStep, issuesOf, money, newDraft, newOrder, newVm, nextStepOf, orderTotals, receiptOf, stepOfField, vdcCost } from "./pricing.js"
import { PriceRail } from "./rail.jsx"
import { ProvisioningPanel, ReviewStep, deployLabelFor } from "./review.jsx"
import { clearSavedOrder, loadPath, loadSavedOrder, orderFromLocation, saveOrder, savePath } from "./share.js"
import { AddonsStep, InfrastructureStep, LocationStep, StorageStep } from "./steps.jsx"
import "../../../ui/button/button.css"
import "../../../ui/mode-toggle/mode-toggle.css"
import "../../../ui/tabs/tabs.css"

/* Fields a step validates, so Continue can surface that step's errors. */
const STEP_FIELDS = {
  location: ["name", "site", "workload"],
  infrastructure: ["image", "cpu", "ram", "access", "ips"],
  storage: ["storage"],
  addons: ["protection", "drSite", "addons"],
  review: [],
}
// Typing a name or a key is not yet a decision; those two wait for blur.
const TOUCH_ON_BLUR = new Set(["name", "access"])

const firstOrder = () => orderFromLocation() ?? loadSavedOrder() ?? newOrder(1, 1, { path: loadPath() ?? "custom" })

export function OrderPage({ consoleHref = "#console" }) {
  const [order, setOrder] = useState(firstOrder)
  const [step, setStep] = useState("location")
  const [touched, setTouched] = useState(() => new Set())
  const [reviewed, setReviewed] = useState(false)
  const [deployed, setDeployed] = useState(null)
  const dark = useSiteDark()
  const { draft, vdcs, vms, editing } = order

  useEffect(() => {
    saveOrder(order)
  }, [order])

  const cost = useMemo(() => vdcCost(draft, vms), [draft, vms])
  const receipt = useMemo(() => receiptOf(draft, vms, cost), [draft, vms, cost])
  const issues = useMemo(() => issuesOf(draft, vms, vdcs), [draft, vms, vdcs])
  const visibleIssues = useMemo(
    () => (reviewed ? issues : new Map([...issues].filter(([field]) => touched.has(field)))),
    [issues, reviewed, touched]
  )
  const stepCounts = useMemo(() => issuesByStep(visibleIssues), [visibleIssues])
  const totals = useMemo(() => orderTotals(order), [order])

  const touch = useCallback((...fields) => {
    setTouched((prev) => {
      if (fields.every((f) => prev.has(f))) return prev
      const next = new Set(prev)
      for (const f of fields) next.add(f)
      return next
    })
  }, [])

  const patch = useCallback(
    (changes) => {
      setOrder((o) => ({ ...o, draft: { ...o.draft, ...changes } }))
      touch(...Object.keys(changes).filter((f) => !TOUCH_ON_BLUR.has(f)))
    },
    [touch]
  )
  const patchAccess = useCallback((changes) => {
    setOrder((o) => ({ ...o, draft: { ...o.draft, access: { ...o.draft.access, ...changes } } }))
  }, [])
  const patchGroup = useCallback((changes) => {
    setOrder((o) => ({ ...o, draft: { ...o.draft, vmGroup: { ...o.draft.vmGroup, ...changes } } }))
  }, [])

  /* Every tab is a link; arriving on a field scrolls it into view and lets
     its error show. */
  const goTo = useCallback(
    (target, field) => {
      setStep(target)
      if (target === "review") setReviewed(true)
      if (field) {
        touch(field)
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            const el = document.querySelector(`.ck-order [data-field="${field}"], .ck-order [data-section="${field}"]`)
            el?.scrollIntoView({ block: "center" })
          })
        )
      }
    },
    [touch]
  )

  const nextStep = step === "location" && draft.path === "quick" ? STEPS.at(-1) : nextStepOf(step)
  const onNext = () => {
    touch(...STEP_FIELDS[step])
    if (nextStep) goTo(nextStep.id)
  }

  const setPath = (path) => {
    savePath(path)
    patch({ path })
  }
  const onWorkload = (workload) => {
    setOrder((o) => ({ ...o, ...applyWorkload(o.draft, o.vms, workload) }))
    touch("workload")
  }

  /* Only a valid draft joins the order, so committed vDCs never carry an
     error; an invalid one shows every error and lands on the first. */
  const blockOnIssues = (verb) => {
    if (issues.size === 0) return false
    setReviewed(true)
    toast.error(`Fix ${issues.size} problem${issues.size === 1 ? "" : "s"} before you ${verb}`, { description: [...issues.values()][0] })
    goTo(firstBadStep(issues), [...issues.keys()][0])
    return true
  }

  const addVdc = () => {
    if (blockOnIssues("add it to the order")) return
    setOrder((o) => {
      const seq = o.seq + 1
      const vmSeq = o.vmSeq + 1
      const next = newDraft(seq, { path: o.draft.path, users: o.draft.users, site: o.draft.site, workload: o.draft.workload, image: o.draft.image, access: o.draft.access })
      return { ...o, vdcs: [...o.vdcs, o.draft], draft: next, vms: [...o.vms, newVm(next, vmSeq)], editing: null, seq, vmSeq }
    })
    setTouched(new Set())
    setReviewed(false)
    toast.success(`${draft.name} added to the order`, { description: `${money(cost.total)}/mo · the form holds a new draft.` })
  }
  const editVdc = useCallback((id) => {
    setOrder((o) => {
      const target = o.vdcs.find((v) => v.id === id)
      if (!target) return o
      return { ...o, vdcs: [...o.vdcs.filter((v) => v.id !== id), o.draft], draft: target, editing: id }
    })
    setStep("location")
  }, [])
  const removeVdc = useCallback((id) => {
    setOrder((o) => ({ ...o, vdcs: o.vdcs.filter((v) => v.id !== id), vms: o.vms.filter((v) => v.vdc !== id) }))
  }, [])
  const duplicateVdc = useCallback((id) => {
    setOrder((o) => {
      const source = [...o.vdcs, o.draft].find((v) => v.id === id)
      if (!source) return o
      const seq = o.seq + 1
      const copy = { ...newDraft(seq, source), storage: { ...source.storage }, addons: [...source.addons], access: { ...source.access }, vmGroup: { ...source.vmGroup } }
      let vmSeq = o.vmSeq
      const copies = o.vms.filter((v) => v.vdc === id).map((v) => ({ ...v, id: `vm-${++vmSeq}`, vdc: copy.id, name: `vm-${String(vmSeq).padStart(2, "0")}` }))
      return { ...o, vdcs: [...o.vdcs, copy], vms: [...o.vms, ...copies], seq, vmSeq }
    })
  }, [])
  const addVm = useCallback((vdcId) => {
    setOrder((o) => {
      const vdc = [...o.vdcs, o.draft].find((v) => v.id === vdcId) ?? o.draft
      return { ...o, vms: [...o.vms, newVm(vdc, o.vmSeq + 1)], vmSeq: o.vmSeq + 1 }
    })
    touch("cpu", "ram", "storage")
  }, [touch])
  const patchVm = useCallback((id, changes) => {
    setOrder((o) => ({ ...o, vms: o.vms.map((v) => (v.id === id ? { ...v, ...changes } : v)) }))
    if ("size" in changes || "count" in changes || "image" in changes) touch("cpu", "ram", "storage")
  }, [touch])
  const removeVm = useCallback((id) => {
    setOrder((o) => ({ ...o, vms: o.vms.filter((v) => v.id !== id) }))
  }, [])
  const duplicateVm = useCallback((id) => {
    setOrder((o) => {
      const source = o.vms.find((v) => v.id === id)
      if (!source) return o
      const vmSeq = o.vmSeq + 1
      return { ...o, vms: [...o.vms, { ...source, id: `vm-${vmSeq}`, name: `vm-${String(vmSeq).padStart(2, "0")}` }], vmSeq }
    })
  }, [])

  const importOrder = (next) => {
    setOrder(next)
    setDeployed(null)
    setTouched(new Set())
    setReviewed(false)
  }
  const resetOrder = () => {
    clearSavedOrder()
    setOrder(newOrder(1, 1, { path: draft.path }))
    setDeployed(null)
    setTouched(new Set())
    setReviewed(false)
    setStep("location")
  }

  const deployReason = editing
    ? `${draft.name} is out of the order while you edit it; add it back first.`
    : issues.size > 0
      ? `${issues.size} problem${issues.size === 1 ? "" : "s"} to fix first.`
      : null
  const canDeploy = !deployReason && !deployed
  const deployLabel = deployLabelFor(totals)
  const deploy = () => {
    if (editing || blockOnIssues("deploy")) return
    const all = [...vdcs, draft]
    setDeployed({ vdcs: all, vms, total: totals.total })
    toast.success("Deploying", { description: `${all.length} vDC${all.length === 1 ? "" : "s"} · ${money(totals.total)}/mo` })
  }

  const current = STEPS.find((s) => s.id === step)
  const committedCount = vdcs.length
  return (
    <div className="ck-view ck-order" data-step={step} data-path={draft.path}>
      <header className="ck-order-head">
        <Button as="a" variant="ghost" size="sm" className="ck-order-back" href={consoleHref}>
          <ArrowLeftIcon />
          Console
        </Button>
        <div className="ck-order-heading">
          <h4 className="ck-page-title">{ORDER_PAGE}</h4>
          <p className="ck-order-lede">Configure before you sign in; the price is itemised on every step and nothing is charged until the first vDC runs.</p>
        </div>
        <div className="ck-order-head-actions">
          <ModeToggle
            className="ck-order-theme"
            isDark={dark}
            onIsDarkChange={setSiteDark}
            labels={{ toDark: "Switch to dark theme", toLight: "Switch to light theme" }}
          />
          <button
            type="button"
            className="ck-order-cart"
            onClick={() => goTo("review")}
            aria-label={`Order: ${totals.vdcs} vDC${totals.vdcs === 1 ? "" : "s"}, ${money(totals.total)} a month. Open the review`}
          >
            <CartIcon />
            <span className="ck-order-cart-count">
              {totals.vdcs} {totals.vdcs === 1 ? "vDC" : "vDCs"}
              {committedCount > 0 && <span className="ck-order-cart-sub">{committedCount} in order</span>}
            </span>
            <span className="ck-order-cart-total">{money(totals.total)}/mo</span>
          </button>
        </div>
      </header>

      <Tabs value={step} onValueChange={(id) => goTo(id)} className="ck-order-tabs">
        <TabsList>
          {STEPS.map((s, i) => (
            <TabsTrigger key={s.id} value={s.id} data-issues={stepCounts[s.id] || undefined}>
              <span className="ck-order-step-num">{i + 1}</span>
              {s.label}
              {stepCounts[s.id] > 0 && (
                <span className="ck-order-step-flag" aria-label={`${stepCounts[s.id]} problem${stepCounts[s.id] === 1 ? "" : "s"}`}>
                  {stepCounts[s.id]}
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="ck-order-body">
          <div className="ck-order-main">
            <div className="ck-order-step-head">
              <h5 className="ck-order-step-title">{current.title}</h5>
              <p className="ck-order-hint">{current.lede}</p>
            </div>
            <TabsContent value="location" className="ck-order-panel" data-step="location">
              <LocationStep
                draft={draft}
                patch={patch}
                errors={visibleIssues}
                touch={touch}
                onPath={setPath}
                onWorkload={onWorkload}
                onSkip={() => goTo("infrastructure", "size")}
                onNext={onNext}
                next={nextStep}
              />
            </TabsContent>
            <TabsContent value="infrastructure" className="ck-order-panel" data-step="infrastructure">
              <InfrastructureStep
                draft={draft}
                cost={cost}
                patch={patch}
                patchAccess={patchAccess}
                patchGroup={patchGroup}
                errors={visibleIssues}
                touch={touch}
                onNext={onNext}
                next={nextStep}
              />
            </TabsContent>
            <TabsContent value="storage" className="ck-order-panel" data-step="storage">
              <StorageStep draft={draft} cost={cost} patch={patch} errors={visibleIssues} onNext={onNext} next={nextStep} />
            </TabsContent>
            <TabsContent value="addons" className="ck-order-panel" data-step="addons">
              <AddonsStep
                draft={draft}
                vms={vms}
                cost={cost}
                patch={patch}
                errors={visibleIssues}
                baseIssues={new Map([...issues].filter(([f]) => stepOfField(f) !== "addons"))}
                onGo={goTo}
                onNext={onNext}
                next={nextStep}
              />
            </TabsContent>
            <TabsContent value="review" className="ck-order-panel" data-step="review">
              {deployed ? (
                <ProvisioningPanel deployed={deployed} consoleHref={consoleHref} onReset={resetOrder} />
              ) : (
                <ReviewStep
                  order={order}
                  cost={cost}
                  receipt={receipt}
                  issues={issues}
                  onGo={goTo}
                  onImport={importOrder}
                  onDeploy={deploy}
                  deployLabel={deployLabel}
                  canDeploy={canDeploy}
                  deployReason={deployReason}
                />
              )}
            </TabsContent>
          </div>
          <PriceRail
            draft={draft}
            cost={cost}
            receipt={receipt}
            step={step}
            next={nextStep}
            issues={visibleIssues}
            onGo={goTo}
            onNext={onNext}
            totals={totals}
            onDeploy={deploy}
            deployLabel={deployLabel}
            canDeploy={canDeploy}
            deployReason={deployReason}
          />
        </div>
      </Tabs>

      <OrderTable
        order={order}
        onAddVdc={addVdc}
        onAddVm={addVm}
        onPatchVm={patchVm}
        onRemoveVm={removeVm}
        onDuplicateVm={duplicateVm}
        onEditVdc={editVdc}
        onRemoveVdc={removeVdc}
        onDuplicateVdc={duplicateVdc}
      />
    </div>
  )
}
