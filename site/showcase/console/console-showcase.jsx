import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react"
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
/* The main column's floor. Rail widths are px, so without it two rails dragged
   wide squeeze the content to zero at every frame width between the rails' sum
   and the 42rem query that hides them. */
const MAIN_MIN = 320

/* Rail widths that fit `frame`: the secondary gives ground first, then the
   primary, neither past its own minimum, and a folded rail not at all. The
   dragged widths themselves are untouched, so widening the frame restores
   them. An unmeasured frame is Infinity and changes nothing. */
function fitRails(pri, sec, frame, priFolded, secFolded) {
  let over = pri + sec + MAIN_MIN - frame
  if (!(over > 0)) return [pri, sec]
  let fitSec = sec
  if (!secFolded) {
    fitSec = Math.max(SEC_W.min, sec - over)
    over -= sec - fitSec
  }
  const fitPri = priFolded || over <= 0 ? pri : Math.max(PRI_W.min, pri - over)
  return [fitPri, fitSec]
}

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
  const frameRef = useRef(null)
  const [frameW, setFrameW] = useState(Infinity)

  const navigate = useCallback((svcId, page) => {
    const svc = findService(svcId)
    setView({ svc: svcId, page: page ?? svc?.pages[0] ?? "Dashboard" })
  }, [])

  /* No ⌘K handler here on purpose, in any code path. The console mounts inside
     #home as well as on #console, so a second binding on `document` opened both
     palettes stacked (#50). On the docs site the chord belongs to site/app.jsx
     and this palette opens from the search button; a standalone host that wants
     the chord binds it itself and drives `paletteOpen`. */

  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setFrameW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      const width = dragging.startW + e.clientX - dragging.startX
      const bounds = dragging.rail === "pri" ? PRI_W : SEC_W
      const next = clamp(width, { min: bounds.min, max: dragging.max })
      if (dragging.rail === "pri") setPriW(next)
      else setSecW(next)
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
  const [priEdge, secEdge] = fitRails(
    priCollapsed ? RAIL_COLLAPSED_W : priW,
    secCollapsed ? RAIL_COLLAPSED_W : secW,
    frameW,
    priCollapsed,
    secCollapsed,
  )

  /* A drag stops where the main column's floor begins, so a rail can never be
     dragged into space the frame does not have. */
  const dragMax = (rail) => {
    const bounds = rail === "pri" ? PRI_W : SEC_W
    const other = rail === "pri" ? secEdge : priEdge
    return Math.max(bounds.min, Math.min(bounds.max, frameW - MAIN_MIN - other))
  }

  const handle = (rail, edge, startW) => (
    <div
      className="ck-resize"
      style={{ insetInlineStart: edge - 2 }}
      data-dragging={dragging?.rail === rail || undefined}
      onPointerDown={(e) => setDragging({ rail, startX: e.clientX, startW, max: dragMax(rail) })}
      role="separator"
      aria-orientation="vertical"
      aria-label={rail === "pri" ? "Resize primary sidebar" : "Resize secondary sidebar"}
    />
  )

  return (
    <TooltipProvider delayDuration={250}>
      <div
        ref={frameRef}
        className="ck-console"
        data-pg="console"
        data-pri={priCollapsed ? "collapsed" : "expanded"}
        data-sec={secCollapsed ? "collapsed" : "expanded"}
        style={{ "--pri-w": `${priEdge}px`, "--sec-w": `${secEdge}px` }}
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
          {!priCollapsed && handle("pri", priEdge, priEdge)}
          {!secCollapsed && handle("sec", priEdge + secEdge, secEdge)}
        </div>
        <ConsoleTaskbar />
        <ConsolePalette open={palette} onOpenChange={setPalette} onNavigate={navigate} orderHref={orderHref} />
        <InstanceSheet instance={detailInstance} onOpenChange={(open) => !open && setDetailInstance(null)} />
        <Toaster position="bottom-right" richColors />
      </div>
    </TooltipProvider>
  )
}
