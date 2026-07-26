import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { useDirection } from "../../lib/direction.jsx"

/** Quiet period after the last scroll before `data-scrolling` drops. */
const SCROLL_TIMEOUT = 500
const MIN_THUMB_SIZE = 16
/** Safety ceiling for the scrollend-based snap restore. */
const SNAP_SETTLE_TIMEOUT = 1000
/** Fallback delay when scrollend is not available. */
const SNAP_FALLBACK_DELAY = 150
const HAS_SCROLL_END = typeof window !== "undefined" && "onscrollend" in window
const SQUISH_DAMPING = 0.3
const SQUISH_MAX = 50
/** Minimum per-frame move in px before engaging squish (avoids jitter). */
const SQUISH_MOVE_THRESHOLD = 2

const ScrollAreaContext = createContext(null)

/** Physical start/end padding of `el` on one axis. */
function paddings(el, vertical) {
  const styles = getComputedStyle(el)
  return vertical
    ? [parseFloat(styles.paddingTop), parseFloat(styles.paddingBottom)]
    : [parseFloat(styles.paddingLeft), parseFloat(styles.paddingRight)]
}

const trackSize = (bar, vertical) => {
  const [start, end] = paddings(bar, vertical)
  return (vertical ? bar.offsetHeight : bar.offsetWidth) - start - end
}

/**
 * Native scroller with overlay scrollbars. The viewport hides the UA
 * scrollbars and every bar/thumb is measured from it, so the content never
 * shifts. Thumb geometry is written to the DOM directly (CSS vars + a
 * transform) — scrolling re-renders nothing.
 */
export function ScrollArea({ className, children, overflowEdgeThreshold = 0, ...props }) {
  const rootRef = useRef(null)
  const viewportRef = useRef(null)
  const contentRef = useRef(null)
  const edgeRef = useRef({ "y-start": false, "y-end": false, "x-start": false, "x-end": false })
  const barRefs = useRef({ vertical: null, horizontal: null })
  const thumbRefs = useRef({ vertical: null, horizontal: null })
  const timersRef = useRef({ x: 0, y: 0 })
  const dragRef = useRef(null)
  const snapRef = useRef({ original: null, suspended: false, timer: 0, handler: null })
  const direction = useDirection()

  const [overflow, setOverflow] = useState({ x: false, y: false })
  const [scrolling, setScrolling] = useState({ x: false, y: false })
  const [hovering, setHovering] = useState(false)

  const sync = useCallback(() => {
    const viewport = viewportRef.current
    const root = rootRef.current
    if (!viewport || !root) return

    const { scrollHeight, scrollWidth, clientHeight, clientWidth, scrollTop } = viewport
    // Chrome runs rtl `scrollLeft` from 0 down to -maxScroll.
    const scrollLeft = direction === "rtl" ? -viewport.scrollLeft : viewport.scrollLeft
    const hasY = scrollHeight - clientHeight > 1
    const hasX = scrollWidth - clientWidth > 1
    setOverflow((prev) => (prev.x === hasX && prev.y === hasY ? prev : { x: hasX, y: hasY }))

    // X-axis overflow edges from scroll position (sentinels cannot work here
    // because IntersectionObserver is 2D — a sentinel track at the top of the
    // content goes out of view vertically when scrolled down).
    const maxScrollX = scrollWidth - clientWidth
    const e = edgeRef.current
    e["x-start"] = hasX && scrollLeft > overflowEdgeThreshold
    e["x-end"] = hasX && scrollLeft < maxScrollX - overflowEdgeThreshold
    if (root) {
      root.toggleAttribute("data-overflow-x-start", e["x-start"])
      root.toggleAttribute("data-overflow-x-end", e["x-end"])
      root.toggleAttribute("data-overflow-start", e["y-start"] || e["x-start"])
      root.toggleAttribute("data-overflow-end", e["y-end"] || e["x-end"])
    }

    const barY = barRefs.current.vertical
    const barX = barRefs.current.horizontal
    root.style.setProperty("--scroll-area-corner-width", `${hasX && hasY && barY ? barY.offsetWidth : 0}px`)
    root.style.setProperty("--scroll-area-corner-height", `${hasX && hasY && barX ? barX.offsetHeight : 0}px`)

    for (const orientation of ["vertical", "horizontal"]) {
      const vertical = orientation === "vertical"
      const bar = barRefs.current[orientation]
      const thumb = thumbRefs.current[orientation]
      if (!bar || !thumb) continue

      const viewportSize = vertical ? clientHeight : clientWidth
      const contentSize = vertical ? scrollHeight : scrollWidth
      if (contentSize === 0) continue

      const track = trackSize(bar, vertical)
      const size = Math.min(track, Math.max(MIN_THUMB_SIZE, track * (viewportSize / contentSize)))
      bar.style.setProperty(
        vertical ? "--scroll-area-thumb-height" : "--scroll-area-thumb-width",
        `${size}px`
      )

      const maxScroll = contentSize - viewportSize
      const scrolled = vertical ? scrollTop : scrollLeft
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, scrolled / maxScroll)) : 0
      const offset = progress * (track - size)
      // Horizontal flex start is the right edge under rtl, so the thumb walks
      // the other way.
      thumb.style.transform = vertical
        ? `translate3d(0, ${offset}px, 0)`
        : `translate3d(${direction === "rtl" ? -offset : offset}px, 0, 0)`
    }
  }, [direction, overflowEdgeThreshold])

  const markScrolling = useCallback((axis) => {
    setScrolling((prev) => (prev[axis] ? prev : { ...prev, [axis]: true }))
    clearTimeout(timersRef.current[axis])
    timersRef.current[axis] = setTimeout(
      () => setScrolling((prev) => (prev[axis] ? { ...prev, [axis]: false } : prev)),
      SCROLL_TIMEOUT
    )
  }, [])

  /** Disable scroll-snap-type so thumb drags and track clicks don't re-snap. */
  const suspendSnap = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const snap = snapRef.current
    // Cancel any pending settle from a previous interaction
    clearTimeout(snap.timer)
    if (snap.handler) {
      viewport.removeEventListener("scrollend", snap.handler)
      snap.handler = null
    }
    if (!snap.suspended) {
      snap.original = viewport.style.scrollSnapType || ""
      snap.suspended = true
      viewport.style.scrollSnapType = "none"
    }
  }, [])

  const restoreSnap = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport || !snapRef.current.suspended) return
    const snap = snapRef.current
    snap.suspended = false
    viewport.style.scrollSnapType = snap.original
    snap.original = null
    clearTimeout(snap.timer)
    if (snap.handler) {
      viewport.removeEventListener("scrollend", snap.handler)
      snap.handler = null
    }
  }, [])

  /** Restore snap after scrolling settles (scrollend or timeout fallback). */
  const settleSnap = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport || !snapRef.current.suspended) return
    const snap = snapRef.current
    if (HAS_SCROLL_END) {
      snap.timer = setTimeout(restoreSnap, SNAP_SETTLE_TIMEOUT)
      snap.handler = () => {
        clearTimeout(snap.timer)
        restoreSnap()
      }
      viewport.addEventListener("scrollend", snap.handler, { once: true })
    } else {
      snap.timer = setTimeout(restoreSnap, SNAP_FALLBACK_DELAY)
    }
  }, [restoreSnap])

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const root = rootRef.current
    const timers = timersRef.current
    let lastTop = viewport.scrollTop
    let lastLeft = viewport.scrollLeft

    const onScroll = () => {
      if (viewport.scrollTop !== lastTop) markScrolling("y")
      if (viewport.scrollLeft !== lastLeft) markScrolling("x")
      lastTop = viewport.scrollTop
      lastLeft = viewport.scrollLeft
      sync()
    }

    viewport.addEventListener("scroll", onScroll, { passive: true })
    const resizes = new ResizeObserver(sync)
    resizes.observe(viewport)
    if (contentRef.current) resizes.observe(contentRef.current)
    sync()

    // Y-axis overflow detection via IntersectionObserver on zero-size sentinels.
    // X-axis is computed from scroll position in sync() — sentinel-based
    // detection fails for x because IntersectionObserver is 2D.
    const yEdgeMap = new Map()
    const edgeObserver = new IntersectionObserver(
      (entries) => {
        const e = edgeRef.current
        for (const entry of entries) {
          const edge = yEdgeMap.get(entry.target)
          if (edge) e[edge] = !entry.isIntersecting
        }
        if (root) {
          root.toggleAttribute("data-overflow-y-start", e["y-start"])
          root.toggleAttribute("data-overflow-y-end", e["y-end"])
          root.toggleAttribute("data-overflow-start", e["y-start"] || e["x-start"])
          root.toggleAttribute("data-overflow-end", e["y-end"] || e["x-end"])
        }
      },
      { root: viewport, rootMargin: `${overflowEdgeThreshold}px` }
    )
    const content = contentRef.current
    if (content) {
      for (const el of content.querySelectorAll(".scroll-area-sentinel[data-edge^='y']")) {
        yEdgeMap.set(el, el.dataset.edge)
        edgeObserver.observe(el)
      }
    }

    return () => {
      viewport.removeEventListener("scroll", onScroll)
      resizes.disconnect()
      edgeObserver.disconnect()
      clearTimeout(timers.x)
      clearTimeout(timers.y)
      // Clean up any pending snap restoration
      const snap = snapRef.current
      clearTimeout(snap.timer)
      if (snap.handler) viewport.removeEventListener("scrollend", snap.handler)
    }
  }, [markScrolling, sync, overflowEdgeThreshold])

  const startDrag = useCallback((event, orientation) => {
    const viewport = viewportRef.current
    const thumb = thumbRefs.current[orientation]
    if (event.button !== 0 || !viewport || !thumb) return
    suspendSnap()
    dragRef.current = {
      orientation,
      pointer: orientation === "vertical" ? event.clientY : event.clientX,
      scroll: orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft,
    }
    thumb.setPointerCapture(event.pointerId)
  }, [suspendSnap])

  const moveDrag = useCallback(
    (event) => {
      const drag = dragRef.current
      const viewport = viewportRef.current
      if (!drag || !viewport) return
      const vertical = drag.orientation === "vertical"
      const bar = barRefs.current[drag.orientation]
      const thumb = thumbRefs.current[drag.orientation]
      if (!bar || !thumb) return

      const size = vertical ? thumb.offsetHeight : thumb.offsetWidth
      const maxThumbOffset = trackSize(bar, vertical) - size
      // A short or heavily padded track can floor the thumb at MIN_THUMB_SIZE
      // and leave nothing to travel; dividing by that inverts the scroll.
      if (maxThumbOffset <= 0) return

      const delta = (vertical ? event.clientY : event.clientX) - drag.pointer
      const maxScroll = vertical
        ? viewport.scrollHeight - viewport.clientHeight
        : viewport.scrollWidth - viewport.clientWidth
      // rtl needs no branch: pointer delta and the negative `scrollLeft`
      // range move in the same direction.
      const next = drag.scroll + (delta / maxThumbOffset) * maxScroll
      if (vertical) viewport.scrollTop = next
      else viewport.scrollLeft = next

      event.preventDefault()
      markScrolling(vertical ? "y" : "x")
    },
    [markScrolling]
  )

  const endDrag = useCallback((event) => {
    const drag = dragRef.current
    if (!drag) return
    dragRef.current = null
    const thumb = thumbRefs.current[drag.orientation]
    // pointercancel releases capture implicitly — releasing twice throws.
    if (thumb?.hasPointerCapture(event.pointerId)) thumb.releasePointerCapture(event.pointerId)
    settleSnap()
  }, [settleSnap])

  /** Track click: centre the thumb on the pointer. */
  const jumpTo = useCallback(
    (event, orientation) => {
      const viewport = viewportRef.current
      const bar = barRefs.current[orientation]
      const thumb = thumbRefs.current[orientation]
      if (!viewport || !bar || !thumb) return
      const vertical = orientation === "vertical"

      const size = vertical ? thumb.offsetHeight : thumb.offsetWidth
      const maxThumbOffset = trackSize(bar, vertical) - size
      if (maxThumbOffset <= 0) return

      suspendSnap()

      const rect = bar.getBoundingClientRect()
      const [padStart] = paddings(bar, vertical)
      const position =
        (vertical ? event.clientY - rect.top : event.clientX - rect.left) - padStart - size / 2
      const progress = Math.min(1, Math.max(0, position / maxThumbOffset))

      if (vertical) {
        viewport.scrollTop = progress * (viewport.scrollHeight - viewport.clientHeight)
      } else {
        const maxScroll = viewport.scrollWidth - viewport.clientWidth
        // The track's physical start is the content's end under rtl.
        viewport.scrollLeft = direction === "rtl" ? -(1 - progress) * maxScroll : progress * maxScroll
      }
      markScrolling(vertical ? "y" : "x")
    },
    [direction, markScrolling, suspendSnap]
  )

  // Overscroll squish — touch/pen only, reduced-motion guarded.
  // useSwipe now defers capture until axis-aligned movement exceeds a
  // threshold, but squish still needs direction-sensitive activation at
  // scroll boundaries — a migration is tracked as a follow-up.
  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")

    let touchId = null
    let lastY = 0
    let lastX = 0
    let active = false
    let originY = 0
    let originX = 0
    // 'min' = scroll at minimum → finger moving positive, 'max' = opposite
    let edgeY = null
    let edgeX = null

    function findTouch(touches, id) {
      for (let i = 0; i < touches.length; i++) if (touches[i].identifier === id) return touches[i]
      return null
    }

    function onTouchStart(e) {
      if (mql.matches || e.touches.length !== 1) return
      const t = e.touches[0]
      touchId = t.identifier
      lastY = t.clientY
      lastX = t.clientX
      active = false
      edgeY = null
      edgeX = null
    }

    function onTouchMove(e) {
      if (mql.matches || touchId === null) return
      const t = findTouch(e.touches, touchId)
      if (!t) return

      const moveY = t.clientY - lastY
      const moveX = t.clientX - lastX
      lastY = t.clientY
      lastX = t.clientX

      if (active) {
        let sy = 0
        let sx = 0

        if (edgeY) {
          const d = t.clientY - originY
          const ok = edgeY === "min" ? d > 0 : d < 0
          if (ok) sy = Math.sign(d) * Math.min(Math.abs(d) * SQUISH_DAMPING, SQUISH_MAX)
          else edgeY = null
        }

        if (edgeX) {
          const d = t.clientX - originX
          const ok = edgeX === "min" ? d > 0 : d < 0
          if (ok) sx = Math.sign(d) * Math.min(Math.abs(d) * SQUISH_DAMPING, SQUISH_MAX)
          else edgeX = null
        }

        if (edgeY || edgeX) {
          content.style.transform = `translate3d(${sx}px, ${sy}px, 0)`
        } else {
          content.style.transform = ""
          active = false
        }
        return
      }

      // Detect boundaries and start squish
      const maxY = viewport.scrollHeight - viewport.clientHeight
      const maxX = viewport.scrollWidth - viewport.clientWidth

      if (maxY > 1) {
        const atTop = viewport.scrollTop <= 0
        const atBottom = viewport.scrollTop >= maxY - 1
        if (atTop && moveY > SQUISH_MOVE_THRESHOLD) {
          edgeY = "min"
          originY = t.clientY
          active = true
        } else if (atBottom && moveY < -SQUISH_MOVE_THRESHOLD) {
          edgeY = "max"
          originY = t.clientY
          active = true
        }
      }

      if (maxX > 1) {
        const sl = viewport.scrollLeft
        const rtl = getComputedStyle(viewport).direction === "rtl"
        const atSlMin = sl <= (rtl ? -(maxX - 1) : 0) + 1
        const atSlMax = sl >= (rtl ? 0 : maxX - 1) - 1
        if (atSlMin && moveX > SQUISH_MOVE_THRESHOLD) {
          edgeX = "min"
          originX = t.clientX
          active = true
        } else if (atSlMax && moveX < -SQUISH_MOVE_THRESHOLD) {
          edgeX = "max"
          originX = t.clientX
          active = true
        }
      }
    }

    function springBack() {
      if (!active) {
        touchId = null
        return
      }
      content.style.transition = "transform var(--motion-medium) var(--motion-ease)"
      content.style.transform = ""
      const cleanup = () => {
        content.style.transition = ""
      }
      content.addEventListener("transitionend", cleanup, { once: true })
      // Safety: clear transition even if transitionend doesn't fire
      setTimeout(cleanup, 300)
      active = false
      touchId = null
      edgeY = null
      edgeX = null
    }

    viewport.addEventListener("touchstart", onTouchStart, { passive: true })
    viewport.addEventListener("touchmove", onTouchMove, { passive: true })
    viewport.addEventListener("touchend", springBack, { passive: true })
    viewport.addEventListener("touchcancel", springBack, { passive: true })

    return () => {
      viewport.removeEventListener("touchstart", onTouchStart)
      viewport.removeEventListener("touchmove", onTouchMove)
      viewport.removeEventListener("touchend", springBack)
      viewport.removeEventListener("touchcancel", springBack)
    }
  }, [])

  const context = useMemo(
    () => ({
      viewportRef,
      barRefs,
      thumbRefs,
      overflow,
      scrolling,
      hovering,
      sync,
      markScrolling,
      startDrag,
      moveDrag,
      endDrag,
      jumpTo,
    }),
    [endDrag, hovering, jumpTo, markScrolling, moveDrag, overflow, scrolling, startDrag, sync]
  )

  const scrollable = overflow.x || overflow.y

  return (
    <ScrollAreaContext.Provider value={context}>
      <div
        ref={rootRef}
        role="presentation"
        data-scrolling={scrolling.x || scrolling.y ? "" : undefined}
        data-has-overflow-x={overflow.x ? "" : undefined}
        data-has-overflow-y={overflow.y ? "" : undefined}
        className={cn("scroll-area", className)}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setHovering(true)
        }}
        onPointerLeave={() => setHovering(false)}
        {...props}
      >
        <div
          ref={viewportRef}
          role="presentation"
          tabIndex={scrollable ? 0 : -1}
          className="scroll-area-viewport"
        >
          <div ref={contentRef} role="presentation" className="scroll-area-content">
            <div data-edge="y-start" className="scroll-area-sentinel" />
            {children}
            <div data-edge="y-end" className="scroll-area-sentinel" />
          </div>
        </div>
        <ScrollBar />
        {overflow.x && overflow.y ? <div role="presentation" className="scroll-area-corner" /> : null}
      </div>
    </ScrollAreaContext.Provider>
  )
}

export function ScrollBar({ className, orientation = "vertical", keepMounted = false, ...props }) {
  const {
    viewportRef,
    barRefs,
    thumbRefs,
    overflow,
    scrolling,
    hovering,
    sync,
    markScrolling,
    startDrag,
    moveDrag,
    endDrag,
    jumpTo,
  } = useContext(ScrollAreaContext)

  const vertical = orientation === "vertical"
  const axis = vertical ? "y" : "x"
  const [barEl, setBarEl] = useState(null)
  const [thumbEl, setThumbEl] = useState(null)

  useLayoutEffect(() => {
    barRefs.current[orientation] = barEl
    thumbRefs.current[orientation] = thumbEl
    sync()
    return () => {
      barRefs.current[orientation] = null
      thumbRefs.current[orientation] = null
    }
  }, [barEl, barRefs, orientation, sync, thumbEl, thumbRefs])

  // React attaches `onWheel` passively at the root, so preventDefault needs a
  // native listener: without it the wheel over an overlay bar scrolls the page.
  useEffect(() => {
    const viewport = viewportRef.current
    if (!barEl || !viewport) return

    const onWheel = (event) => {
      if (event.ctrlKey) return
      const delta = vertical ? event.deltaY : event.deltaX
      if (delta === 0) return

      const maxScroll = vertical
        ? viewport.scrollHeight - viewport.clientHeight
        : viewport.scrollWidth - viewport.clientWidth
      const min = !vertical && getComputedStyle(viewport).direction === "rtl" ? -maxScroll : 0
      const max = min === 0 ? maxScroll : 0
      const current = vertical ? viewport.scrollTop : viewport.scrollLeft
      // At an edge, let the wheel chain to the page instead of swallowing it.
      if ((current <= min && delta < 0) || (current >= max && delta > 0)) return

      event.preventDefault()
      const next = Math.min(max, Math.max(min, current + delta))
      if (vertical) viewport.scrollTop = next
      else viewport.scrollLeft = next
      markScrolling(axis)
    }

    barEl.addEventListener("wheel", onWheel, { passive: false })
    return () => barEl.removeEventListener("wheel", onWheel)
  }, [axis, barEl, markScrolling, vertical, viewportRef])

  if (!keepMounted && !overflow[axis]) return null

  return (
    <div
      ref={setBarEl}
      data-orientation={orientation}
      data-scrolling={scrolling[axis] ? "" : undefined}
      data-hovering={hovering ? "" : undefined}
      className={cn("scroll-area-scrollbar", className)}
      onPointerDown={(event) => {
        if (event.button !== 0 || thumbEl?.contains(event.target)) return
        jumpTo(event, orientation)
        startDrag(event, orientation)
      }}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      {...props}
    >
      <div
        ref={setThumbEl}
        data-orientation={orientation}
        data-scrolling={scrolling[axis] ? "" : undefined}
        className="scroll-area-thumb"
        onPointerDown={(event) => startDrag(event, orientation)}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      />
    </div>
  )
}
