import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { cn } from "../../lib/cn.js"
import { useDirection } from "../../lib/direction.jsx"

/** Keyboard resize step in percentage points. */
const STEP = 5

/** Debounce interval for storage writes (ms). */
const SAVE_DEBOUNCE = 100

/** Storage format version — bump on schema change to invalidate old payloads. */
const STORAGE_VERSION = 1

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

// ——— Storage helpers ———

/**
 * Build a storage key from autoSaveId and panel metadata so that a saved layout
 * for a 3-panel group is never applied to a 2-panel group.
 */
function storageKey(autoSaveId, panelIds) {
  return `vanillin:resizable:${autoSaveId}:${panelIds.join(",")}`
}

function readStorage(storage, key) {
  try {
    const raw = storage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.v !== STORAGE_VERSION) return null
    if (!Array.isArray(parsed.sizes)) return null
    // Validate every entry is a finite number
    if (!parsed.sizes.every((s) => typeof s === "number" && isFinite(s)))
      return null
    return parsed.sizes
  } catch {
    return null
  }
}

function writeStorage(storage, key, sizes) {
  try {
    storage.setItem(key, JSON.stringify({ v: STORAGE_VERSION, sizes }))
  } catch {
    // Storage full or unavailable — silently degrade.
  }
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
  autoSaveId,
  storage: storageProp,
  onLayout,
  className,
  children,
  ref,
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
  /** Track whether this is the initial mount (suppress onResize on mount). */
  const mountedRef = useRef(false)
  /** Debounce timer for storage writes. */
  const saveTimerRef = useRef(null)

  // Resolve storage lazily — never touch localStorage at module scope.
  const getStorage = useCallback(() => {
    if (storageProp) return storageProp
    if (typeof window !== "undefined" && window.localStorage)
      return window.localStorage
    return null
  }, [storageProp])

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

  // Persist layout to storage (debounced).
  const persistLayout = useCallback(
    (sizes) => {
      if (!autoSaveId) return
      const s = getStorage()
      if (!s) return
      const ids = orderRef.current.map(
        (el) => panelsRef.current.get(el)?.id
      )
      if (ids.some((id) => id == null)) return
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        writeStorage(s, storageKey(autoSaveId, ids), sizes)
      }, SAVE_DEBOUNCE)
    },
    [autoSaveId, getStorage]
  )

  // Commit sizes to React state and fire callbacks.
  const commitSizes = useCallback(
    (sizes, { isMount = false } = {}) => {
      const prevSizes = sizesRef.current
      sizesRef.current = sizes
      setVersion((v) => v + 1)
      onLayoutRef.current?.(sizes)

      // Fire per-panel callbacks (onResize, onCollapse, onExpand) but not on mount.
      if (!isMount && prevSizes) {
        const order = orderRef.current
        const cs = order.map((el) => panelsRef.current.get(el) || {})
        for (let i = 0; i < order.length; i++) {
          const info = cs[i]
          const prev = prevSizes[i]
          const cur = sizes[i]
          if (prev == null || cur == null) continue

          // onResize: fire when size actually changed
          if (Math.abs(cur - prev) > 0.001) {
            info._onResize?.(cur)
          }

          // onCollapse / onExpand: fire on transition across the collapsed boundary
          if (info.collapsible) {
            const col = info.collapsedSize ?? 0
            const wasCollapsed = prev <= col + 0.01
            const isCollapsed = cur <= col + 0.01
            if (!wasCollapsed && isCollapsed) {
              info._onCollapse?.()
            } else if (wasCollapsed && !isCollapsed) {
              info._onExpand?.()
            }
          }
        }
      }

      if (!isMount) persistLayout(sizes)
    },
    [persistLayout]
  )

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

  // Programmatic setLayout: set all panel sizes at once.
  const setLayout = useCallback(
    (newSizes) => {
      if (!Array.isArray(newSizes)) return
      const order = orderRef.current
      if (newSizes.length !== order.length) return
      const cs = getConstraints()
      // Clamp each size individually
      const clamped = newSizes.map((s, i) => {
        const prev = sizesRef.current?.[i] ?? s
        return clampSize(s, cs[i], prev)
      })
      commitSizes(clamped)
    },
    [getConstraints, commitSizes]
  )

  const getLayout = useCallback(() => {
    return sizesRef.current ? [...sizesRef.current] : []
  }, [])

  // Expose imperative handle on group ref.
  useImperativeHandle(
    ref,
    () => ({
      setLayout,
      getLayout,
    }),
    [setLayout, getLayout]
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

    // Try to restore from storage before computing defaults.
    let sizes = null
    if (autoSaveId) {
      const s = getStorage()
      if (s) {
        const ids = entries.map(([, c]) => c.id)
        if (ids.every((id) => id != null)) {
          const saved = readStorage(s, storageKey(autoSaveId, ids))
          if (saved && saved.length === entries.length) {
            sizes = saved
          }
        }
      }
    }

    if (!sizes) {
      let total = 0
      let unset = 0
      entries.forEach(([, c]) => {
        if (c.defaultSize != null) total += c.defaultSize
        else unset++
      })
      const share = unset > 0 ? Math.max(0, 100 - total) / unset : 0
      sizes = entries.map(([, c]) => c.defaultSize ?? share)
    }

    // Mark as mount — commitSizes will skip per-panel callbacks.
    commitSizes(sizes, { isMount: true })
    mountedRef.current = true
  })

  // Clean up debounce timer on unmount.
  useEffect(() => () => clearTimeout(saveTimerRef.current), [])

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
  ref,
  ...props
}) {
  const autoId = useId()
  const id = idProp || autoId
  const elRef = useRef(null)
  const ctx = useContext(GroupContext)
  // Keep callback refs stable across renders so the registered info stays current.
  const onResizeRef = useRef(onResize)
  const onCollapseRef = useRef(onCollapse)
  const onExpandRef = useRef(onExpand)
  onResizeRef.current = onResize
  onCollapseRef.current = onCollapse
  onExpandRef.current = onExpand

  useLayoutEffect(() => {
    if (!elRef.current || !ctx) return
    return ctx.registerPanel(elRef.current, {
      id,
      defaultSize,
      minSize,
      maxSize,
      collapsible,
      collapsedSize,
      // Wrap callbacks so the group can fire them without stale closures.
      _onResize: (size) => onResizeRef.current?.(size),
      _onCollapse: () => onCollapseRef.current?.(),
      _onExpand: () => onExpandRef.current?.(),
    })
  }, [ctx, id, defaultSize, minSize, maxSize, collapsible, collapsedSize])

  // Read current size — recalculated on every committed layout change.
  let size
  let panelIndex = -1
  if (ctx?.sizesRef.current && elRef.current) {
    panelIndex = ctx.orderRef.current.indexOf(elRef.current)
    if (panelIndex >= 0) size = ctx.sizesRef.current[panelIndex]
  }
  void ctx?.version // subscribe to layout commits

  const isCollapsed =
    collapsible && size != null && size <= collapsedSize + 0.01

  // Imperative handle for panel.
  useImperativeHandle(
    ref,
    () => ({
      collapse: () => {
        if (!ctx || !collapsible) return
        const idx = ctx.orderRef.current.indexOf(elRef.current)
        if (idx < 0) return
        const sizes = ctx.sizesRef.current
        if (!sizes) return
        const cur = sizes[idx]
        const col = collapsedSize ?? 0
        if (Math.abs(cur - col) < 0.01) return // already collapsed
        // Save expanded size for restore.
        const info = ctx.panelsRef.current.get(elRef.current)
        if (info) ctx.expandedRef.current[info.id] = cur
        // Find the handle index — the panel could be on either side.
        // Collapse by adjusting the handle to the panel's side.
        const hIdx = idx > 0 ? idx - 1 : 0
        const delta = idx === hIdx ? col - cur : cur - col
        ctx.adjustLayout(hIdx, idx === hIdx ? delta : -delta)
      },
      expand: () => {
        if (!ctx || !collapsible) return
        const idx = ctx.orderRef.current.indexOf(elRef.current)
        if (idx < 0) return
        const sizes = ctx.sizesRef.current
        if (!sizes) return
        const cur = sizes[idx]
        const col = collapsedSize ?? 0
        if (cur > col + 0.01) return // already expanded
        const info = ctx.panelsRef.current.get(elRef.current)
        const target =
          (info && ctx.expandedRef.current[info.id]) ?? minSize ?? STEP
        const hIdx = idx > 0 ? idx - 1 : 0
        const delta = target - col
        ctx.adjustLayout(hIdx, idx === hIdx ? delta : -delta)
      },
      resize: (pct) => {
        if (!ctx) return
        const idx = ctx.orderRef.current.indexOf(elRef.current)
        if (idx < 0) return
        const sizes = ctx.sizesRef.current
        if (!sizes) return
        const cur = sizes[idx]
        const delta = pct - cur
        const hIdx = idx > 0 ? idx - 1 : 0
        ctx.adjustLayout(hIdx, idx === hIdx ? delta : -delta)
      },
      getSize: () => {
        if (!ctx) return 0
        const idx = ctx.orderRef.current.indexOf(elRef.current)
        if (idx < 0 || !ctx.sizesRef.current) return 0
        return ctx.sizesRef.current[idx]
      },
      isCollapsed: () => {
        if (!ctx || !collapsible) return false
        const idx = ctx.orderRef.current.indexOf(elRef.current)
        if (idx < 0 || !ctx.sizesRef.current) return false
        const col = collapsedSize ?? 0
        return ctx.sizesRef.current[idx] <= col + 0.01
      },
    }),
    [ctx, collapsible, collapsedSize, minSize]
  )

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

const DEFAULT_HIT_MARGINS = { coarse: 15, fine: 5 }

export function ResizableHandle({
  withHandle,
  disabled,
  hitAreaMargins: hitAreaMarginsProp,
  className,
  children,
  ...props
}) {
  const elRef = useRef(null)
  const ctx = useContext(GroupContext)
  const [dragState, setDragState] = useState("inactive")
  const [focused, setFocused] = useState(false)
  const dragRef = useRef(null)

  // Resolve hit area margins with defaults.
  const margins = useMemo(
    () => ({ ...DEFAULT_HIT_MARGINS, ...hitAreaMarginsProp }),
    [hitAreaMarginsProp]
  )

  // Track pointer type for hit area margin selection.
  const [isCoarse, setIsCoarse] = useState(() => {
    if (typeof window === "undefined") return false
    return window.matchMedia?.("(pointer: coarse)")?.matches ?? false
  })

  useEffect(() => {
    if (typeof window === "undefined") return
    const mql = window.matchMedia?.("(pointer: coarse)")
    if (!mql) return
    setIsCoarse(mql.matches)
    const handler = (e) => setIsCoarse(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  const hitMargin = isCoarse ? margins.coarse : margins.fine

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
        case "F6": {
          // F6 / Shift+F6: cycle focus between separators within this group.
          const groupEl = ctx.groupRef.current
          if (!groupEl) break
          event.preventDefault()
          const separators = [
            ...groupEl.querySelectorAll(":scope > .resizable-handle"),
          ].filter((h) => h.getAttribute("aria-disabled") == null)
          if (separators.length === 0) break
          const currentIdx = separators.indexOf(elRef.current)
          let nextIdx
          if (event.shiftKey) {
            nextIdx =
              currentIdx <= 0 ? separators.length - 1 : currentIdx - 1
          } else {
            nextIdx =
              currentIdx >= separators.length - 1 ? 0 : currentIdx + 1
          }
          separators[nextIdx]?.focus()
          break
        }
        default:
          return // don't stop propagation for unhandled keys
      }
    },
    [ctx, disabled]
  )

  // Build CSS custom properties for the hit area overlay.
  const hitStyle = useMemo(() => {
    if (hitMargin <= 0) return undefined
    return { "--hit-margin": `${hitMargin}px` }
  }, [hitMargin])

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
      data-hit-area={hitMargin > 0 ? "" : undefined}
      className={cn("resizable-handle", className)}
      style={hitStyle}
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
