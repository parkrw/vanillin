import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import { useDirection } from "../../lib/direction.jsx"

const CarouselContext = createContext(null)
function useCarousel() { return useContext(CarouselContext) }

/** Minimum pointer-drag distance (px) to count as a swipe. */
const DRAG_THRESHOLD = 50

/* -------------------------------------------------------------------------- */
/*  Carousel (root)                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Scroll-snap carousel with pointer swipe and keyboard nav.
 *
 * API surface mirrors shadcn/embla: `opts`, `setApi`, `plugins`.
 * `plugins` is accepted but stubbed (no plugin system).
 * `opts.loop` is accepted but not implemented.
 * The api object exposes: scrollPrev, scrollNext, canScrollPrev,
 * canScrollNext, selectedScrollSnap, scrollSnapList, on, off.
 * Smooth-scroll timing is native (not routed through --motion-* tokens).
 */
export function Carousel({
  orientation = "horizontal",
  opts = {},
  setApi,
  plugins,
  className,
  children,
  ...props
}) {
  const direction = useDirection()
  const contentRef = useRef(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listenersRef = useRef(new Map())
  const vertical = orientation === "vertical"

  const emit = useCallback((event) => {
    const cbs = listenersRef.current.get(event)
    if (cbs) for (const fn of cbs) fn()
  }, [])

  /** Direct children with the `.carousel-item` class. */
  const getItems = useCallback(() => {
    const el = contentRef.current
    return el ? Array.from(el.querySelectorAll(":scope > .carousel-item")) : []
  }, [])

  /** Index of the item whose snap edge is closest to the container's snap edge. */
  const snapIndex = useCallback(() => {
    const el = contentRef.current
    if (!el) return 0
    const items = getItems()
    if (!items.length) return 0
    const cr = el.getBoundingClientRect()
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < items.length; i++) {
      const ir = items[i].getBoundingClientRect()
      const dist = vertical
        ? Math.abs(ir.top - cr.top)
        : direction === "rtl"
          ? Math.abs(ir.right - cr.right)
          : Math.abs(ir.left - cr.left)
      if (dist < bestDist) { bestDist = dist; best = i }
    }
    return best
  }, [direction, getItems, vertical])

  /** Update boundary flags + selected index from the current scroll position. */
  const syncState = useCallback(() => {
    const el = contentRef.current
    if (!el) return
    const max = vertical
      ? el.scrollHeight - el.clientHeight
      : el.scrollWidth - el.clientWidth

    let prev, next
    if (vertical) {
      prev = el.scrollTop > 1
      next = el.scrollTop < max - 1
    } else if (direction === "rtl") {
      // Chrome RTL: scrollLeft 0 (start) → -(scrollWidth-clientWidth) (end)
      prev = el.scrollLeft < -1
      next = el.scrollLeft > -(max - 1)
    } else {
      prev = el.scrollLeft > 1
      next = el.scrollLeft < max - 1
    }

    setCanScrollPrev((p) => (p === prev ? p : prev))
    setCanScrollNext((p) => (p === next ? p : next))

    const idx = snapIndex()
    setSelectedIndex((p) => {
      if (p !== idx) { queueMicrotask(() => emit("select")); return idx }
      return p
    })
  }, [direction, emit, snapIndex, vertical])

  /** Programmatic scroll to align `index` with the container's snap edge. */
  const scrollToItem = useCallback(
    (index) => {
      const el = contentRef.current
      if (!el) return
      const item = getItems()[index]
      if (!item) return
      const cr = el.getBoundingClientRect()
      const ir = item.getBoundingClientRect()
      if (vertical) {
        el.scrollTo({ top: el.scrollTop + (ir.top - cr.top), behavior: "smooth" })
      } else if (direction === "rtl") {
        el.scrollTo({ left: el.scrollLeft + (ir.right - cr.right), behavior: "smooth" })
      } else {
        el.scrollTo({ left: el.scrollLeft + (ir.left - cr.left), behavior: "smooth" })
      }
    },
    [direction, getItems, vertical]
  )

  const scrollPrev = useCallback(() => {
    const i = snapIndex()
    if (i > 0) scrollToItem(i - 1)
  }, [snapIndex, scrollToItem])

  const scrollNext = useCallback(() => {
    const i = snapIndex()
    if (i < getItems().length - 1) scrollToItem(i + 1)
  }, [getItems, snapIndex, scrollToItem])

  /* ---- stable embla-compatible API ---- */

  const stateRef = useRef({})
  stateRef.current = { canScrollPrev, canScrollNext, selectedIndex }
  const fnRef = useRef({})
  fnRef.current = { scrollPrev, scrollNext, getItems }

  const apiRef = useRef(null)
  if (!apiRef.current) {
    apiRef.current = Object.freeze({
      scrollPrev() { fnRef.current.scrollPrev() },
      scrollNext() { fnRef.current.scrollNext() },
      canScrollPrev() { return stateRef.current.canScrollPrev },
      canScrollNext() { return stateRef.current.canScrollNext },
      selectedScrollSnap() { return stateRef.current.selectedIndex },
      scrollSnapList() { return fnRef.current.getItems().map((_, i) => i) },
      on(event, cb) {
        if (!listenersRef.current.has(event)) listenersRef.current.set(event, new Set())
        listenersRef.current.get(event).add(cb)
      },
      off(event, cb) { listenersRef.current.get(event)?.delete(cb) },
    })
  }

  useEffect(() => { setApi?.(apiRef.current) }, [setApi])

  /* ---- keyboard ---- */

  const onKeyDown = useCallback(
    (e) => {
      let action
      if (vertical) {
        if (e.key === "ArrowUp") action = "prev"
        else if (e.key === "ArrowDown") action = "next"
      } else {
        if (e.key === "ArrowLeft") action = direction === "rtl" ? "next" : "prev"
        else if (e.key === "ArrowRight") action = direction === "rtl" ? "prev" : "next"
      }
      if (action) {
        e.preventDefault()
        action === "prev" ? scrollPrev() : scrollNext()
      }
    },
    [direction, scrollPrev, scrollNext, vertical]
  )

  /* ---- context ---- */

  const ctx = useMemo(
    () => ({
      orientation, vertical, direction, contentRef,
      canScrollPrev, canScrollNext, scrollPrev, scrollNext,
      syncState, getItems, snapIndex, scrollToItem,
    }),
    [orientation, vertical, direction, canScrollPrev, canScrollNext,
     scrollPrev, scrollNext, syncState, getItems, snapIndex, scrollToItem]
  )

  return (
    <CarouselContext.Provider value={ctx}>
      <div
        role="region"
        aria-roledescription="carousel"
        tabIndex={0}
        data-orientation={orientation}
        className={cn("carousel", className)}
        onKeyDown={onKeyDown}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  )
}

/* -------------------------------------------------------------------------- */
/*  CarouselContent (scroll container)                                        */
/* -------------------------------------------------------------------------- */

export function CarouselContent({ className, ...props }) {
  const { vertical, direction, contentRef, syncState, snapIndex, scrollToItem, getItems } = useCarousel()
  const dragRef = useRef(null)

  /* scroll + resize sync */
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    el.addEventListener("scroll", syncState, { passive: true })
    const ro = new ResizeObserver(syncState)
    ro.observe(el)
    syncState()
    return () => { el.removeEventListener("scroll", syncState); ro.disconnect() }
  }, [contentRef, syncState])

  /* ---- pointer swipe (mouse only; touch uses native scroll) ---- */
  /* Capture is deferred to pointermove so clicks on interactive children
   * (buttons, links) fire normally — only a real drag activates capture. */

  const onPointerDown = useCallback(
    (e) => {
      if (e.pointerType === "touch" || e.button !== 0) return
      const el = contentRef.current
      if (!el) return
      dragRef.current = {
        x: e.clientX, y: e.clientY,
        scroll: vertical ? el.scrollTop : el.scrollLeft,
        startIndex: snapIndex(),
        pointerId: e.pointerId,
        active: false,
      }
    },
    [contentRef, snapIndex, vertical]
  )

  const onPointerMove = useCallback(
    (e) => {
      const d = dragRef.current
      if (!d) return
      // Button released outside the element before capture engaged — the
      // pointerup never reached us, so drop the stale drag or a later
      // hover move would start scrolling with no button held.
      if (e.buttons === 0) {
        if (d.active) delete contentRef.current?.dataset.dragging
        dragRef.current = null
        return
      }
      const el = contentRef.current
      if (!el) return

      const delta = vertical ? e.clientY - d.y : e.clientX - d.x

      if (!d.active) {
        if (Math.abs(delta) < 5) return
        d.active = true
        el.setPointerCapture(d.pointerId)
        el.style.scrollSnapType = "none"
        el.dataset.dragging = ""
      }

      if (vertical) el.scrollTop = d.scroll - (e.clientY - d.y)
      else el.scrollLeft = d.scroll - (e.clientX - d.x)
    },
    [contentRef, vertical]
  )

  const onPointerUp = useCallback(
    (e) => {
      const drag = dragRef.current
      if (!drag) return
      dragRef.current = null
      const el = contentRef.current
      if (!el) return

      if (!drag.active) return // plain click — let it through

      delete el.dataset.dragging
      el.style.scrollSnapType = ""
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)

      const delta = vertical ? e.clientY - drag.y : e.clientX - drag.x

      if (Math.abs(delta) > DRAG_THRESHOLD) {
        const goNext = vertical ? delta < 0 : direction === "rtl" ? delta > 0 : delta < 0
        const target = goNext ? drag.startIndex + 1 : drag.startIndex - 1
        const items = getItems()
        if (target >= 0 && target < items.length) scrollToItem(target)
        else scrollToItem(drag.startIndex)
      } else {
        scrollToItem(drag.startIndex)
      }
    },
    [contentRef, direction, getItems, scrollToItem, vertical]
  )

  return (
    <div
      ref={contentRef}
      className={cn("carousel-content", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  CarouselItem                                                              */
/* -------------------------------------------------------------------------- */

export function CarouselItem({ className, ...props }) {
  return (
    <div
      role="group"
      aria-roledescription="slide"
      className={cn("carousel-item", className)}
      {...props}
    />
  )
}

/* -------------------------------------------------------------------------- */
/*  CarouselPrevious / CarouselNext                                           */
/* -------------------------------------------------------------------------- */

export function CarouselPrevious({ className, as: Comp = "button", ...props }) {
  const { scrollPrev, canScrollPrev, orientation } = useCarousel()
  return (
    <Comp
      className={cn("btn btn--outline btn--icon carousel-nav carousel-previous", className)}
      disabled={!canScrollPrev}
      aria-label="Previous slide"
      onClick={scrollPrev}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        {orientation === "vertical"
          ? <path d="m18 15-6-6-6 6" />
          : <path d="m15 18-6-6 6-6" />}
      </svg>
    </Comp>
  )
}

export function CarouselNext({ className, as: Comp = "button", ...props }) {
  const { scrollNext, canScrollNext, orientation } = useCarousel()
  return (
    <Comp
      className={cn("btn btn--outline btn--icon carousel-nav carousel-next", className)}
      disabled={!canScrollNext}
      aria-label="Next slide"
      onClick={scrollNext}
      {...props}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round">
        {orientation === "vertical"
          ? <path d="m6 9 6 6 6-6" />
          : <path d="m9 18 6-6-6-6" />}
      </svg>
    </Comp>
  )
}
