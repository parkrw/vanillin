import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Button } from "../../../ui/button/button.jsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs/tabs.jsx"
import { toast } from "../../../ui/toast/toast.jsx"
import { ACCESS_DEFAULTS, ORDER_PAGE } from "../console-data.js"
import { ArrowLeftIcon, CartIcon, CpuIcon, DatabaseIcon, MapPinIcon, PuzzleIcon, ShieldCheckIcon } from "../icons.jsx"
import { AccessDialog } from "./access-dialog.jsx"
import { StepFooter, StripActions } from "./form.jsx"
import { OrderTable } from "./order-table.jsx"
import { PriceCard } from "./price-card.jsx"
import { BASE_STEPS, STEPS, firstBadStep, fitOrderPools, issuesByStep, issuesOf, money, newDraft, newOrder, newVm, nextStepOf, orderTotals, receiptOf, siteName, stepIndex, stepOfField, vdcCost, vmWithoutAccess } from "./pricing.js"
import { ProvisioningPanel, ReviewStep, deployLabelFor } from "./review.jsx"
import { clearSavedOrder, loadSavedOrder, orderFromLocation, saveOrder } from "./share.js"
import { AddonsStep, BcdrStep, InfrastructureStep, LocationStep, StorageStep } from "./steps.jsx"
import "../../../ui/button/button.css"
import "../../../ui/tabs/tabs.css"

/* Fields a step validates, so Continue can surface that step's errors. */
const STEP_FIELDS = {
  location: ["site"],
  infrastructure: ["cpu", "ram", "access", "ips"],
  storage: ["storage"],
  bcdr: ["protection", "drSite"],
  addons: ["addons"],
  checkout: ["name"],
}
const STEP_ICONS = { location: MapPinIcon, infrastructure: CpuIcon, storage: DatabaseIcon, bcdr: ShieldCheckIcon, addons: PuzzleIcon, checkout: CartIcon }
// Typing a name is not yet a decision; it waits for blur.
const TOUCH_ON_BLUR = new Set(["name"])

const firstOrder = () => orderFromLocation() ?? loadSavedOrder() ?? newOrder()

export function OrderPage({ consoleHref = "#console" }) {
  const [order, setOrder] = useState(firstOrder)
  const [step, setStep] = useState("location")
  const [touched, setTouched] = useState(() => new Set())
  const [reviewed, setReviewed] = useState(false)
  const [deployed, setDeployed] = useState(null)
  // `{ vdcId, vmId }` while the access dialog is up; no vmId adds a machine.
  const [accessRequest, setAccessRequest] = useState(null)
  const { draft, vdcs, vms, editing } = order

  /* The strip sticks to the top of the scroll and the price card sticks
     under it, so the card's offset is the strip's height, measured: the
     strip wraps its actions under the steps as the frame narrows. */
  const rootRef = useRef(null)
  const stripRef = useRef(null)
  useLayoutEffect(() => {
    const root = rootRef.current
    const strip = stripRef.current
    if (!root || !strip) return
    const measure = () => root.style.setProperty("--ck-order-strip-h", `${strip.offsetHeight}px`)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(strip)
    return () => observer.disconnect()
  }, [])

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
  const patchGroup = useCallback((changes) => {
    setOrder((o) => ({ ...o, draft: { ...o.draft, vmGroup: { ...o.draft.vmGroup, ...changes } } }))
  }, [])

  /* Every step is a link; arriving on a field scrolls it into view and lets
     its error show. Access has no place on a step: it is each machine's,
     so that link opens the dialog on the first machine without a way in. */
  const goTo = useCallback(
    (target, field) => {
      if (field === "access") {
        const vm = vmWithoutAccess(draft.id, vms)
        if (vm) setAccessRequest({ vdcId: vm.vdc, vmId: vm.id })
        return
      }
      setStep(target)
      if (target === "checkout") setReviewed(true)
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
    [touch, draft.id, vms]
  )

  const nextStep = nextStepOf(step)
  const onNext = () => {
    touch(...STEP_FIELDS[step])
    if (nextStep) goTo(nextStep.id)
  }
  /* The table waits under the options on every step but Checkout; the
     strip's Machines button is the way down to it without a scroll. */
  const tableRef = useRef(null)
  const jumpToTable = () => {
    const el = tableRef.current
    if (!el) return
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" })
    el.focus({ preventScroll: true })
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
      const next = newDraft(seq, { users: o.draft.users, site: o.draft.site, workload: o.draft.workload, image: o.draft.image })
      return { ...o, vdcs: [...o.vdcs, o.draft], draft: next, editing: null, seq }
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
      const copy = { ...newDraft(seq, source), storage: { ...source.storage }, addons: [...source.addons], vmGroup: { ...source.vmGroup } }
      let vmSeq = o.vmSeq
      const copies = o.vms.filter((v) => v.vdc === id).map((v) => ({ ...v, id: `vm-${++vmSeq}`, vdc: copy.id, name: `vm-${String(vmSeq).padStart(2, "0")}` }))
      return { ...o, vdcs: [...o.vdcs, copy], vms: [...o.vms, ...copies], seq, vmSeq }
    })
  }, [])
  /* A machine is added through the access dialog, so every machine has a
     way in; its row menu opens the same dialog to change it. The pools
     follow the machines. */
  const requestVm = useCallback((vdcId) => setAccessRequest({ vdcId, vmId: null }), [])
  const requestAccess = useCallback((vmId) => setAccessRequest({ vmId }), [])
  const confirmAccess = (access) => {
    const { vdcId, vmId } = accessRequest
    if (vmId) {
      setOrder((o) => ({ ...o, vms: o.vms.map((v) => (v.id === vmId ? { ...v, access } : v)) }))
    } else {
      setOrder((o) => {
        const vdc = [...o.vdcs, o.draft].find((v) => v.id === vdcId)
        if (!vdc) return o
        const vmSeq = o.vmSeq + 1
        return fitOrderPools({ ...o, vms: [...o.vms, newVm(vdc, vmSeq, access)], vmSeq }, vdcId)
      })
      touch("cpu", "ram", "storage")
    }
    touch("access")
    setAccessRequest(null)
  }
  /* A new machine starts from the last one's access in its vDC, else the
     order's, so a key is pasted once. */
  const accessTarget = useMemo(() => {
    if (!accessRequest) return null
    const vm = accessRequest.vmId ? vms.find((v) => v.id === accessRequest.vmId) : null
    if (accessRequest.vmId && !vm) return null
    const vdc = [...vdcs, draft].find((v) => v.id === (vm?.vdc ?? accessRequest.vdcId))
    if (!vdc) return null
    const seed = vm ?? vms.findLast((v) => v.vdc === vdc.id) ?? vms.at(-1)
    return { vdc, vm, access: seed?.access ?? ACCESS_DEFAULTS }
  }, [accessRequest, vms, vdcs, draft])
  const patchVm = useCallback((id, changes) => {
    setOrder((o) => {
      const vms = o.vms.map((v) => (v.id === id ? { ...v, ...changes } : v))
      const vm = vms.find((v) => v.id === id)
      return vm ? fitOrderPools({ ...o, vms }, vm.vdc) : o
    })
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
      return fitOrderPools({ ...o, vms: [...o.vms, { ...source, id: `vm-${vmSeq}`, name: `vm-${String(vmSeq).padStart(2, "0")}` }], vmSeq }, source.vdc)
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
    setOrder(newOrder())
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

  const deployCount = vdcs.length + (editing ? 0 : 1)
  const deploySummary =
    vdcs.length > 0
      ? `Deploys ${deployCount} vDC${deployCount === 1 ? "" : "s"}: ${[...vdcs.map((v) => v.name), ...(editing ? [] : [draft.name])].join(", ")}`
      : `Deploys ${draft.name} at ${siteName(draft.site)}`

  const currentIndex = stepIndex(step)
  const baseIssues = useMemo(() => new Map([...issues].filter(([f]) => BASE_STEPS.includes(stepOfField(f)))), [issues])
  const machineCount = vms.reduce((n, v) => n + v.count, 0)
  const panels = {
    location: <LocationStep draft={draft} patch={patch} errors={visibleIssues} />,
    infrastructure: <InfrastructureStep draft={draft} cost={cost} patch={patch} patchGroup={patchGroup} errors={visibleIssues} />,
    storage: <StorageStep draft={draft} cost={cost} patch={patch} errors={visibleIssues} />,
    bcdr: <BcdrStep draft={draft} vms={vms} cost={cost} patch={patch} errors={visibleIssues} baseIssues={baseIssues} onGo={goTo} />,
    addons: <AddonsStep draft={draft} cost={cost} patch={patch} errors={visibleIssues} baseIssues={baseIssues} onGo={goTo} />,
    checkout: deployed ? (
      <ProvisioningPanel deployed={deployed} consoleHref={consoleHref} onReset={resetOrder} />
    ) : (
      <ReviewStep order={order} patch={patch} touch={touch} errors={visibleIssues} issues={issues} onGo={goTo} onImport={importOrder} />
    ),
  }
  const foot = (
    <StepFooter
      step={step}
      issues={visibleIssues}
      onGo={goTo}
      summary={deployed ? null : deploySummary}
      onDeploy={deploy}
      deployLabel={deployLabel}
      canDeploy={canDeploy}
      deployReason={deployReason}
    />
  )
  return (
    <div ref={rootRef} className="ck-view ck-order" data-step={step}>
      <header className="ck-order-head">
        <Button as="a" variant="ghost" size="sm" className="ck-order-back" href={consoleHref}>
          <ArrowLeftIcon />
          Console
        </Button>
        <div className="ck-order-heading">
          <h4 className="ck-page-title">{ORDER_PAGE}</h4>
          <p className="ck-order-lede">Configure before you sign in; the price is itemised on every step and nothing is charged until the first vDC runs.</p>
        </div>
      </header>

      {/* The steps are the kit's tabs, one strip across the top that sticks
          there as the page scrolls: an icon in a ring for each, a rule
          between them, the steps behind the current one filled and their
          rules orange. Continue and the way down to the machines sit at the
          strip's end. The strip names the step, so the panel opens straight
          on its sections. Under it the current step's options take the left
          three quarters, the table under them in the same column, and the
          price card the right quarter, at its own height and stuck under
          the strip; on Checkout the deploy foot closes the column under the
          table. The panel is the tab's own tabpanel; the table is one
          element on every step, so its view survives a step change. */}
      <Tabs value={step} onValueChange={goTo} className="ck-order-wizard">
        <div ref={stripRef} className="ck-order-strip">
          <TabsList className="ck-order-steps" aria-label="Steps">
            {STEPS.map((s, i) => {
              const count = stepCounts[s.id]
              const Icon = STEP_ICONS[s.id]
              return (
                <Fragment key={s.id}>
                  {i > 0 && <span className="ck-order-step-rule" data-done={i <= currentIndex || undefined} aria-hidden="true" />}
                  <TabsTrigger value={s.id} className="ck-order-step" data-done={i < currentIndex || undefined} data-issues={count || undefined}>
                    <span className="ck-order-step-mark">
                      <Icon />
                      {count > 0 && (
                        <span className="ck-order-step-flag" aria-label={`${count} problem${count === 1 ? "" : "s"}`}>
                          {count}
                        </span>
                      )}
                    </span>
                    <span className="ck-order-step-label">{s.label}</span>
                  </TabsTrigger>
                </Fragment>
              )
            })}
          </TabsList>
          <StripActions next={nextStep} onNext={onNext} machines={machineCount} onJump={jumpToTable} />
        </div>
        <div className="ck-order-body">
          <div className="ck-order-main">
            {STEPS.map((s) => (
              <TabsContent key={s.id} value={s.id} className="ck-order-panel" data-step={s.id}>
                {panels[s.id]}
              </TabsContent>
            ))}
            {step !== "checkout" && foot}
          </div>
          <aside className="ck-order-aside" aria-label="Price summary">
            <PriceCard draft={draft} cost={cost} receipt={receipt} totals={totals} committed={vdcs.length} onChange={goTo} />
          </aside>
          <OrderTable
            ref={tableRef}
            order={order}
            onAddVdc={addVdc}
            onAddVm={requestVm}
            onAccessVm={requestAccess}
            onPatchVm={patchVm}
            onRemoveVm={removeVm}
            onDuplicateVm={duplicateVm}
            onEditVdc={editVdc}
            onRemoveVdc={removeVdc}
            onDuplicateVdc={duplicateVdc}
          />
          {step === "checkout" && foot}
        </div>
      </Tabs>
      <AccessDialog request={accessTarget} onCancel={() => setAccessRequest(null)} onConfirm={confirmAccess} />
    </div>
  )
}
