import { useCallback, useState } from "react"
import { Button } from "../../../ui/button/button.jsx"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../ui/tabs/tabs.jsx"
import { ORDER_PAGE } from "../console-data.js"
import { ArrowLeftIcon, CartIcon } from "../icons.jsx"
import { ORDER_STEPS, money, newDraft, newOrder, newVm, vdcCost } from "./pricing.js"
import { BcdrStep, ComputeStep, LocationStep, NetworkStep, StorageStep } from "./steps.jsx"
import { SummaryStep } from "./summary.jsx"
import { VmsStep } from "./vm-table.jsx"
import { fakeTask } from "../shared.jsx"
import "../../../ui/button/button.css"
import "../../../ui/tabs/tabs.css"

export function OrderPage({ consoleHref = "#console" }) {
  const [order, setOrder] = useState(newOrder)
  const [step, setStep] = useState("location")
  const { draft, vdcs, vms } = order
  const cost = vdcCost(draft, vms)
  const committed = vdcs.reduce((sum, v) => sum + vdcCost(v, vms).total, 0)

  const patch = (changes) => setOrder((o) => ({ ...o, draft: { ...o.draft, ...changes } }))
  const addVdc = () =>
    setOrder((o) => {
      const seq = o.seq + 1
      const vmSeq = o.vmSeq + 1
      return {
        ...o,
        vdcs: [...o.vdcs, o.draft],
        draft: newDraft(seq),
        vms: [...o.vms, newVm(`vdc-${seq}`, vmSeq)],
        editing: null,
        seq,
        vmSeq,
      }
    })
  const editVdc = useCallback((id) => {
    setOrder((o) => {
      const target = o.vdcs.find((v) => v.id === id)
      if (!target) return o
      return {
        ...o,
        vdcs: [...o.vdcs.filter((v) => v.id !== id), o.draft],
        draft: target,
        editing: id,
      }
    })
    setStep("location")
  }, [setOrder])
  const removeVdc = useCallback((id) => {
    setOrder((o) => ({ ...o, vdcs: o.vdcs.filter((v) => v.id !== id), vms: o.vms.filter((v) => v.vdc !== id) }))
  }, [setOrder])
  const addVm = useCallback((vdcId) => {
    setOrder((o) => ({ ...o, vms: [...o.vms, newVm(vdcId, o.vmSeq + 1)], vmSeq: o.vmSeq + 1 }))
  }, [setOrder])
  const patchVm = useCallback((id, changes) => {
    setOrder((o) => ({ ...o, vms: o.vms.map((v) => (v.id === id ? { ...v, ...changes } : v)) }))
  }, [setOrder])
  const removeVm = useCallback((id) => {
    setOrder((o) => ({ ...o, vms: o.vms.filter((v) => v.id !== id) }))
  }, [setOrder])
  const patchGroup = useCallback((vdcId, changes) => {
    setOrder((o) =>
      o.draft.id === vdcId
        ? { ...o, draft: { ...o.draft, vmGroup: { ...o.draft.vmGroup, ...changes } } }
        : { ...o, vdcs: o.vdcs.map((v) => (v.id === vdcId ? { ...v, vmGroup: { ...v.vmGroup, ...changes } } : v)) }
    )
  }, [setOrder])
  const placeOrder = () => {
    fakeTask("Place order", `${vdcs.length} vDC${vdcs.length === 1 ? "" : "s"}, ${money(committed)} a month`)
    setOrder((o) => newOrder(o.seq + 1, o.vmSeq + 1))
  }

  const count = vdcs.length
  return (
    <div className="ck-view ck-order">
      <div className="ck-order-head">
        <Button as="a" variant="ghost" size="sm" className="ck-order-back" href={consoleHref}>
          <ArrowLeftIcon />
          Console
        </Button>
        <div className="ck-order-heading">
          <h4 className="ck-page-title">{ORDER_PAGE}</h4>
          <p className="ck-order-lede">Pick a site, size the pools and the network, decide how much of it survives a bad day, then review the order.</p>
        </div>
        <button
          type="button"
          className="ck-order-cart"
          onClick={() => setStep("summary")}
          aria-label={`Order: ${count} vDC${count === 1 ? "" : "s"}, ${money(committed)} a month. Open the summary`}
        >
          <CartIcon />
          <span className="ck-order-cart-count">{count} {count === 1 ? "vDC" : "vDCs"}</span>
          <span className="ck-order-cart-total">{money(committed)}/mo</span>
        </button>
      </div>
      <Tabs value={step} onValueChange={setStep} className="ck-order-tabs">
        <TabsList>
          {ORDER_STEPS.map((s, i) => (
            <TabsTrigger key={s.id} value={s.id}>
              <span className="ck-order-step-num">{i + 1}</span>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="location" className="ck-order-panel" data-step="location">
          <LocationStep draft={draft} patch={patch} cost={cost} onNext={() => setStep("compute")} />
        </TabsContent>
        <TabsContent value="compute" className="ck-order-panel" data-step="compute">
          <ComputeStep draft={draft} patch={patch} cost={cost} onNext={() => setStep("network")} />
        </TabsContent>
        <TabsContent value="network" className="ck-order-panel" data-step="network">
          <NetworkStep draft={draft} patch={patch} cost={cost} onNext={() => setStep("storage")} />
        </TabsContent>
        <TabsContent value="storage" className="ck-order-panel" data-step="storage">
          <StorageStep draft={draft} patch={patch} cost={cost} onNext={() => setStep("bcdr")} />
        </TabsContent>
        <TabsContent value="bcdr" className="ck-order-panel" data-step="bcdr">
          <BcdrStep draft={draft} patch={patch} cost={cost} onNext={() => setStep("vms")} />
        </TabsContent>
        <TabsContent value="vms" className="ck-order-panel" data-step="vms">
          <VmsStep
            draft={draft}
            cost={cost}
            vdcs={vdcs}
            vms={vms}
            onAddVm={addVm}
            onPatchVm={patchVm}
            onRemoveVm={removeVm}
            onPatchGroup={patchGroup}
            onNext={() => setStep("summary")}
          />
        </TabsContent>
        <TabsContent value="summary" className="ck-order-panel" data-step="summary">
          <SummaryStep order={order} cost={cost} onAdd={addVdc} onEdit={editVdc} onRemove={removeVdc} onPlace={placeOrder} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
