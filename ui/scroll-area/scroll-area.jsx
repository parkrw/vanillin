import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { useDirection } from "../../lib/direction.jsx"

/** Quiet period after the last scroll before `data-scrolling` drops. */
const SCROLL_TIMEOUT = 500
const MIN_THUMB_SIZE = 16

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
const EDGES = ["y-start", "y-end", "x-start", "x-end"]

export function ScrollArea({ className, children, overflowEdgeThreshold = 0, ...props }) {
  const rootRef = useRef(null)
  const viewportRef = useRef(null)
  const contentRef = useRef(null)
  const barRefs = useRef({ vertical: null, horizontal: null })
  const thumbRefs = useRef({ vertical: null, horizontal: null })
  const timersRef = useRef({ x: 0, y: 0 })
  const dragRef = useRef(null)
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
  }, [direction])

  const markScrolling = useCallback((axis) => {
    setScrolling((prev) => (prev[axis] ? prev : { ...prev, [axis]: true }))
    clearTimeout(timersRef.current[axis])
    timersRef.current[axis] = setTimeout(
      () => setScrolling((prev) => (prev[axis] ? { ...prev, [axis]: false } : prev)),
      SCROLL_TIMEOUT
    )
  }, [])

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

    // Edge overflow detection via IntersectionObserver on zero-size sentinels
    const edgeState = { "y-start": false, "y-end": false, "x-start": false, "x-end": false }
    const edgeMap = new Map()
    const edgeObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const edge = edgeMap.get(entry.target)
          if (edge) edgeState[edge] = !entry.isIntersecting
        }
        if (root) {
          root.toggleAttribute("data-overflow-y-start", edgeState["y-start"])
          root.toggleAttribute("data-overflow-y-end", edgeState["y-end"])
          root.toggleAttribute("data-overflow-x-start", edgeState["x-start"])
          root.toggleAttribute("data-overflow-x-end", edgeState["x-end"])
          root.toggleAttribute("data-overflow-start", edgeState["y-start"] || edgeState["x-start"])
          root.toggleAttribute("data-overflow-end", edgeState["y-end"] || edgeState["x-end"])
        }
      },
      { root: viewport, rootMargin: `${overflowEdgeThreshold}px` }
    )
    const content = contentRef.current
    if (content) {
      for (const el of content.querySelectorAll(".scroll-area-sentinel")) {
        const edge = el.dataset.edge
        if (edge) {
          edgeMap.set(el, edge)
          edgeObserver.observe(el)
        }
      }
    }

    return () => {
      viewport.removeEventListener("scroll", onScroll)
      resizes.disconnect()
      edgeObserver.disconnect()
      clearTimeout(timers.x)
      clearTimeout(timers.y)
    }
  }, [markScrolling, sync, overflowEdgeThreshold])

  const startDrag = useCallback((event, orientation) => {
    const viewport = viewportRef.current
    const thumb = thumbRefs.current[orientation]
    if (event.button !== 0 || !viewport || !thumb) return
    dragRef.current = {
      orientation,
      pointer: orientation === "vertical" ? event.clientY : event.clientX,
      scroll: orientation === "vertical" ? viewport.scrollTop : viewport.scrollLeft,
    }
    thumb.setPointerCapture(event.pointerId)
  }, [])

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
  }, [])

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
    [direction, markScrolling]
  )

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
            <div className="scroll-area-sentinel-track">
              <div data-edge="x-start" className="scroll-area-sentinel" />
              <div data-edge="x-end" className="scroll-area-sentinel" />
            </div>
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
