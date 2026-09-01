import { useCallback, useEffect, useState } from "react"
import { useControllableState } from "../../../lib/use-controllable-state.js"
import { Toaster } from "../../../ui/toast/toast.jsx"
import { TooltipProvider } from "../../../ui/tooltip/tooltip.jsx"
import { findService } from "../console-data.js"
import { ConsoleTopbar, PriRail, SecRail } from "./chrome.jsx"
import { InstanceSheet } from "./instance-sheet.jsx"
import { ConsolePalette } from "./palette.jsx"
import { PageContent } from "./router.jsx"
import { clamp } from "../shared.jsx"
import { TabBar } from "./tab-bar.jsx"
import { ConsoleTaskbar } from "./taskbar.jsx"
import "../../../ui/toast/toast.css"
import "../../../ui/tooltip/tooltip.css"
import "../console.css"

/* Rail widths in px, the CloudKey console's: a pointer drag on a handle
   writes them into the body grid's column variables. */
const PRI_W = { initial: 210, min: 120, max: 400 }
const SEC_W = { initial: 200, min: 100, max: 350 }
const RAIL_COLLAPSED_W = 56

export default function ConsoleShowcase({ orderHref = "#order", paletteOpen, onPaletteOpenChange }) {
  const [view, setView] = useState({ svc: "overview", page: "Dashboard" })
  const [project, setProject] = useState("engineering")
  const [region, setRegion] = useState("Dallas")
  const [palette, setPalette] = useControllableState({
    value: paletteOpen,
    defaultValue: false,
    onChange: onPaletteOpenChange,
  })
  const [detailInstance, setDetailInstance] = useState(null)
  const [priCollapsed, setPriCollapsed] = useState(false)
  const [secCollapsed, setSecCollapsed] = useState(false)
  const [priW, setPriW] = useState(PRI_W.initial)
  const [secW, setSecW] = useState(SEC_W.initial)
  const [dragging, setDragging] = useState(null)

  const navigate = useCallback((svcId, page) => {
    const svc = findService(svcId)
    setView({ svc: svcId, page: page ?? svc?.pages[0] ?? "Dashboard" })
  }, [])

  /* No ⌘K handler here on purpose, in any code path. The console mounts inside
     #home as well as on #console, so a second binding on `document` opened both
     palettes stacked (#50). On the docs site the chord belongs to site/app.jsx
     and this palette opens from the search button; a standalone host that wants
     the chord binds it itself and drives `paletteOpen`. */

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const width = dragging.startW + e.clientX - dragging.startX
      if (dragging.rail === "pri") setPriW(clamp(width, PRI_W))
      else setSecW(clamp(width, SEC_W))
    }
    const onUp = () => setDragging(null)
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [dragging])

  const svc = findService(view.svc)
  const category = svc.category
  const priEdge = priCollapsed ? RAIL_COLLAPSED_W : priW
  const secEdge = secCollapsed ? RAIL_COLLAPSED_W : secW

  const handle = (rail, edge, startW) => (
    <div
      className="ck-resize"
      style={{ insetInlineStart: edge - 2 }}
      data-dragging={dragging?.rail === rail || undefined}
      onPointerDown={(e) => setDragging({ rail, startX: e.clientX, startW })}
      role="separator"
      aria-orientation="vertical"
      aria-label={rail === "pri" ? "Resize primary sidebar" : "Resize secondary sidebar"}
    />
  )

  return (
    <TooltipProvider delayDuration={250}>
      <div
        className="ck-console"
        data-pg="console"
        data-pri={priCollapsed ? "collapsed" : "expanded"}
        data-sec={secCollapsed ? "collapsed" : "expanded"}
        style={{ "--pri-w": `${priW}px`, "--sec-w": `${secW}px` }}
      >
        <ConsoleTopbar
          project={project}
          setProject={setProject}
          region={region}
          setRegion={setRegion}
          orderHref={orderHref}
          onOpenPalette={() => setPalette(true)}
        />
        <div className="ck-body">
          <PriRail
            category={category}
            collapsed={priCollapsed}
            onNavigate={navigate}
            onToggleCollapse={() => setPriCollapsed((v) => !v)}
          />
          <SecRail
            category={category}
            svc={svc}
            page={view.page}
            collapsed={secCollapsed}
            onNavigate={navigate}
            onToggleCollapse={() => setSecCollapsed((v) => !v)}
          />
          <div className="ck-main">
            <TabBar svc={svc} page={view.page} onNavigate={navigate} />
            <div className="ck-scroller">
              <div className="ck-content">
                <PageContent
                  svc={view.svc}
                  page={view.page}
                  project={project}
                  orderHref={orderHref}
                  onNavigate={navigate}
                  onDetails={setDetailInstance}
                />
              </div>
            </div>
          </div>
          {!priCollapsed && handle("pri", priEdge, priW)}
          {!secCollapsed && handle("sec", priEdge + secEdge, secW)}
        </div>
        <ConsoleTaskbar />
        <ConsolePalette open={palette} onOpenChange={setPalette} onNavigate={navigate} orderHref={orderHref} />
        <InstanceSheet instance={detailInstance} onOpenChange={(open) => !open && setDetailInstance(null)} />
        <Toaster position="bottom-right" richColors />
      </div>
    </TooltipProvider>
  )
}
