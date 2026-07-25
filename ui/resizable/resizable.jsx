import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { cn } from "../../lib/cn.js"
import { useDirection } from "../../lib/direction.jsx"

/** Keyboard resize step in percentage points. */
const STEP = 5

const GroupContext = createContext(null)

// ——— Layout helpers ———

/**
 * Clamp a panel size to its constraints. If collapsible, the valid range is
 * {collapsedSize} ∪ [minSize, maxSize]; a size in the dead zone snaps toward
 * the direction of the move (shrinking → collapsed, growing → min).
 */
function clampSize(size, c, prev) {
  const min = c.minSize ?? 0
  const max = c.maxSize ?? 100
  const col = c.collapsedSize ?? 0
  if (size > max) return max
  if (c.collapsible) {
    if (size <= col) return col
    if (size < min) return size < prev ? col : min
  } else if (size < min) {
    return min
  }
  return size
}

/**
 * Compute the effective delta for a resize at `handleIndex`. Two-pass clamp:
 * clamp A, then B, then re-clamp A so both panels stay valid.
 */
function resolveDelta(idx, raw, sizes, cs) {
  const a = sizes[idx]
  const b = sizes[idx + 1]
  if (cs[idx] == null || cs[idx + 1] == null) return 0
  let nA = clampSize(a + raw, cs[idx], a)
  let d = nA - a
  const nB = clampSize(b - d, cs[idx + 1], b)
  d = b - nB
  nA = clampSize(a + d, cs[idx], a)
  return nA - a
}

// ——— ResizablePanelGroup ———

/**
 * Flex container that distributes space among child `ResizablePanel` elements
 * via proportional flex-grow. Handles between panels drive the resize.
 *
 * Panels register in their layout effects (children-first); the group's own
 * layout effect sorts by DOM position and computes the initial layout from
 * `defaultSize` props before the browser paints.
 */
export function ResizablePanelGroup({
  direction = "horizontal",
  onLayout,
  className,
  children,
  ...props
}) {
  /** el → { id, defaultSize, minSize, maxSize, collapsible, collapsedSize } */
  const panelsRef = useRef(new Map())
  const groupRef = useRef(null)
  /** Percentage per panel in DOM order. */
  const sizesRef = useRef(null)
  /** Panel elements in DOM order. */
  const orderRef = useRef([])
  const onLayoutRef = useRef(onLayout)
  onLayoutRef.current = onLayout
  /** panelId → last non-collapsed size (for Enter toggle). */
  const expandedRef = useRef({})
  const dir = useDirection()
  /** Bumped on every committed layout change; forces children to re-read. */
  const [version, setVersion] = useState(0)

  // Sort registered panels by DOM position.
  const reorder = useCallback(() => {
    const entries = [...panelsRef.current.entries()]
    entries.sort((a, b) =>
      a[0].compareDocumentPosition(b[0]) & Node.DOCUMENT_POSITION_FOLLOWING
        ? -1
        : 1
    )
    orderRef.current = entries.map(([el]) => el)
    return entries
  }, [])

  // Constraints array in DOM order.
  const getConstraints = useCallback(
    () => orderRef.current.map((el) => panelsRef.current.get(el) || {}),
    []
  )

  // Which panels does this handle separate? Returns the index of the primary
  // (preceding) panel.
  const getHandleIndex = useCallback((handleEl) => {
    if (!handleEl) return 0
    const order = orderRef.current
    let idx = 0
    for (let i = 0; i < order.length; i++) {
      // DOCUMENT_POSITION_PRECEDING (2): order[i] is before handleEl
      if (handleEl.compareDocumentPosition(order[i]) & 2) idx = i
    }
    return idx
  }, [])

  // Write flex-grow values directly to panel DOM elements (no React commit).
  const writeSizes = useCallback((sizes) => {
    const order = orderRef.current
    for (let i = 0; i < order.length; i++) {
      if (order[i] && sizes[i] != null) order[i].style.flexGrow = sizes[i]
    }
  }, [])

  // Commit sizes to React state and fire callbacks.
  const commitSizes = useCallback((sizes) => {
    sizesRef.current = sizes
    setVersion((v) => v + 1)
    onLayoutRef.current?.(sizes)
  }, [])

  // Keyboard / committed resize.
  const adjustLayout = useCallback(
    (handleIndex, rawDelta) => {
      const sizes = sizesRef.current
      if (!sizes) return
      const d = resolveDelta(handleIndex, rawDelta, sizes, getConstraints())
      if (Math.abs(d) < 0.01) return
      const next = [...sizes]
      next[handleIndex] += d
      next[handleIndex + 1] -= d
      commitSizes(next)
    },
    [getConstraints, commitSizes]
  )

  // Imperative resize for pointer drag — writes to DOM, skips React commit.
  const adjustImperative = useCallback(
    (handleIndex, rawDelta) => {
      const sizes = sizesRef.current
      if (!sizes) return
      const d = resolveDelta(handleIndex, rawDelta, sizes, getConstraints())
      if (Math.abs(d) < 0.01) return
      const next = [...sizes]
      next[handleIndex] += d
      next[handleIndex + 1] -= d
      writeSizes(next)
      sizesRef.current = next
    },
    [getConstraints, writeSizes]
  )

  const registerPanel = useCallback((el, info) => {
    const existing = panelsRef.current.get(el)
    if (existing) Object.assign(existing, info)
    else panelsRef.current.set(el, { ...info })
    return () => panelsRef.current.delete(el)
  }, [])

  // Runs after children's layout effects (React fires children-first).
  // On the first mount it sorts panels and computes initial sizes.
  useLayoutEffect(() => {
    if (sizesRef.current) return
    if (panelsRef.current.size === 0) return
    const entries = reorder()
    let total = 0
    let unset = 0
    entries.forEach(([, c]) => {
      if (c.defaultSize != null) total += c.defaultSize
      else unset++
    })
    const share = unset > 0 ? Math.max(0, 100 - total) / unset : 0
    const sizes = entries.map(([, c]) => c.defaultSize ?? share)
    sizesRef.current = sizes
    setVersion((v) => v + 1)
    onLayoutRef.current?.(sizes)
  })

  const ctx = useMemo(
    () => ({
      direction,
      dir,
      groupRef,
      sizesRef,
      orderRef,
      panelsRef,
      expandedRef,
      registerPanel,
      getHandleIndex,
      getConstraints,
      adjustLayout,
      adjustImperative,
      commitSizes,
      version,
    }),
    [
      direction,
      dir,
      registerPanel,
      getHandleIndex,
      getConstraints,
      adjustLayout,
      adjustImperative,
      commitSizes,
      version,
    ]
  )

  return (
    <GroupContext.Provider value={ctx}>
      <div
        ref={groupRef}
        data-panel-group=""
        data-direction={direction}
        className={cn("resizable-group", className)}
        {...props}
      >
        {children}
      </div>
    </GroupContext.Provider>
  )
}

// ——— ResizablePanel ———

export function ResizablePanel({
  as: Comp = "div",
  defaultSize,
  minSize,
  maxSize,
  collapsible,
  collapsedSize = 0,
  id: idProp,
  onResize,
  onCollapse,
  onExpand,
  className,
  children,
  style,
  ...props
}) {
  const autoId = useId()
  const id = idProp || autoId
  const elRef = useRef(null)
  const ctx = useContext(GroupContext)

  useLayoutEffect(() => {
    if (!elRef.current || !ctx) return
    return ctx.registerPanel(elRef.current, {
      id,
      defaultSize,
      minSize,
      maxSize,
      collapsible,
      collapsedSize,
    })
  }, [ctx, id, defaultSize, minSize, maxSize, collapsible, collapsedSize])

  // Read current size — recalculated on every committed layout change.
  let size
  if (ctx?.sizesRef.current && elRef.current) {
    const idx = ctx.orderRef.current.indexOf(elRef.current)
    if (idx >= 0) size = ctx.sizesRef.current[idx]
  }
  void ctx?.version // subscribe to layout commits

  const isCollapsed =
    collapsible && size != null && size <= collapsedSize + 0.01

  return (
    <Comp
      ref={elRef}
      id={id}
      data-panel=""
      data-panel-id={id}
      data-state={
        collapsible ? (isCollapsed ? "collapsed" : "expanded") : undefined
      }
      className={cn("resizable-panel", className)}
      style={{
        flexGrow: size ?? defaultSize ?? 1,
        flexShrink: 1,
        flexBasis: 0,
        overflow: "hidden",
        ...style,
      }}
      {...props}
    >
      {children}
    </Comp>
  )
}

// ——— ResizableHandle ———

export function ResizableHandle({
  withHandle,
  disabled,
  className,
  children,
  ...props
}) {
  const elRef = useRef(null)
  const ctx = useContext(GroupContext)
  const [dragState, setDragState] = useState("inactive")
  const [focused, setFocused] = useState(false)
  const dragRef = useRef(null)

  void ctx?.version // re-derive ARIA on layout commits

  // ARIA values: compute from current sizes + constraints.
  let handleIdx = 0
  let ariaValueNow, ariaValueMin, ariaValueMax, primaryPanelId
  if (ctx && elRef.current && ctx.sizesRef.current) {
    handleIdx = ctx.getHandleIndex(elRef.current)
    const sizes = ctx.sizesRef.current
    const cs = ctx.getConstraints()
    if (sizes[handleIdx] != null && cs[handleIdx + 1]) {
      ariaValueNow = Math.round(sizes[handleIdx])
      const dMin = resolveDelta(handleIdx, -100, sizes, cs)
      ariaValueMin = Math.round(sizes[handleIdx] + dMin)
      const dMax = resolveDelta(handleIdx, 100, sizes, cs)
      ariaValueMax = Math.round(sizes[handleIdx] + dMax)
      primaryPanelId = cs[handleIdx]?.id
    }
  }

  // Separator orientation is the *opposite* of the group direction.
  const ariaOrientation =
    ctx?.direction === "horizontal" ? "vertical" : "horizontal"

  let separatorState = "inactive"
  if (disabled) separatorState = "disabled"
  else if (dragState === "active") separatorState = "active"
  else if (focused) separatorState = "focus"
  else if (dragState === "hover") separatorState = "hover"

  // ——— Pointer drag ———

  const onPointerDown = useCallback(
    (event) => {
      if (event.button !== 0 || disabled || !ctx) return
      const el = elRef.current
      if (!el) return
      el.setPointerCapture(event.pointerId)

      const vert = ctx.direction === "vertical"
      const groupEl = ctx.groupRef.current
      const groupDim = vert ? groupEl.offsetHeight : groupEl.offsetWidth

      // Subtract handle sizes so the percentage maps to the distributable space.
      let handleTotal = 0
      for (const h of groupEl.querySelectorAll(":scope > .resizable-handle")) {
        handleTotal += vert ? h.offsetHeight : h.offsetWidth
      }

      dragRef.current = {
        startPos: vert ? event.clientY : event.clientX,
        distributable: groupDim - handleTotal,
        handleIndex: ctx.getHandleIndex(el),
        startSizes: [...ctx.sizesRef.current],
      }

      setDragState("active")
      document.body.style.cursor = vert ? "row-resize" : "col-resize"
      document.body.style.userSelect = "none"
    },
    [ctx, disabled]
  )

  const onPointerMove = useCallback(
    (event) => {
      const drag = dragRef.current
      if (!drag || !ctx) return
      event.preventDefault()

      const vert = ctx.direction === "vertical"
      const px = (vert ? event.clientY : event.clientX) - drag.startPos
      const rtl = !vert && ctx.dir === "rtl" ? -1 : 1
      const pct = (px / drag.distributable) * 100 * rtl

      // Reset to the drag-start snapshot, then apply the total delta.
      ctx.sizesRef.current = [...drag.startSizes]
      ctx.adjustImperative(drag.handleIndex, pct)
    },
    [ctx]
  )

  const endDrag = useCallback(
    (event) => {
      const drag = dragRef.current
      if (!drag) return
      dragRef.current = null

      const el = elRef.current
      if (el?.hasPointerCapture(event.pointerId))
        el.releasePointerCapture(event.pointerId)

      if (ctx?.sizesRef.current) ctx.commitSizes([...ctx.sizesRef.current])

      setDragState("inactive")
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    },
    [ctx]
  )

  // ——— Keyboard ———

  const onKeyDown = useCallback(
    (event) => {
      if (disabled || !ctx) return
      const idx = ctx.getHandleIndex(elRef.current)

      switch (event.key) {
        case "ArrowLeft":
          if (ctx.direction === "horizontal") {
            event.preventDefault()
            ctx.adjustLayout(idx, -STEP)
          }
          break
        case "ArrowRight":
          if (ctx.direction === "horizontal") {
            event.preventDefault()
            ctx.adjustLayout(idx, STEP)
          }
          break
        case "ArrowUp":
          if (ctx.direction === "vertical") {
            event.preventDefault()
            ctx.adjustLayout(idx, -STEP)
          }
          break
        case "ArrowDown":
          if (ctx.direction === "vertical") {
            event.preventDefault()
            ctx.adjustLayout(idx, STEP)
          }
          break
        case "Home":
          event.preventDefault()
          ctx.adjustLayout(idx, -100)
          break
        case "End":
          event.preventDefault()
          ctx.adjustLayout(idx, 100)
          break
        case "Enter": {
          event.preventDefault()
          const sizes = ctx.sizesRef.current
          if (!sizes) break
          const cs = ctx.getConstraints()
          const c = cs[idx]
          if (!c?.collapsible) break
          const cur = sizes[idx]
          const col = c.collapsedSize ?? 0
          let target
          if (Math.abs(cur - col) < 0.01) {
            target = ctx.expandedRef.current[c.id] ?? c.minSize ?? STEP
          } else {
            ctx.expandedRef.current[c.id] = cur
            target = col
          }
          ctx.adjustLayout(idx, target - cur)
          break
        }
        default:
          return // don't stop propagation for unhandled keys
      }
    },
    [ctx, disabled]
  )

  return (
    <div
      ref={elRef}
      role="separator"
      aria-orientation={ariaOrientation}
      aria-valuenow={ariaValueNow}
      aria-valuemin={ariaValueMin}
      aria-valuemax={ariaValueMax}
      aria-controls={primaryPanelId}
      aria-disabled={disabled || undefined}
      tabIndex={disabled ? undefined : 0}
      data-separator={separatorState}
      className={cn("resizable-handle", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerEnter={() => {
        if (!dragRef.current) setDragState("hover")
      }}
      onPointerLeave={() => {
        if (!dragRef.current) setDragState("inactive")
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={onKeyDown}
      {...props}
    >
      {withHandle && (
        <div className="resizable-handle-icon" aria-hidden="true">
          <GripIcon />
        </div>
      )}
      {children}
    </div>
  )
}

function GripIcon() {
  return (
    <svg
      width="8"
      height="14"
      viewBox="0 0 8 14"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="2" cy="2" r="1" />
      <circle cx="6" cy="2" r="1" />
      <circle cx="2" cy="7" r="1" />
      <circle cx="6" cy="7" r="1" />
      <circle cx="2" cy="12" r="1" />
      <circle cx="6" cy="12" r="1" />
    </svg>
  )
}
