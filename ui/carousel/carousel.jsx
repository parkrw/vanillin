import { Children, cloneElement, createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
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
 * `opts.align`: "start" | "center" | "end" — sets scroll-snap-align on slides.
 * `opts.loop`: wrap around at both ends via clone-and-recentre.
 * `plugins`: array of `{ name, init(api, opts), destroy() }` objects.
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
  const rootRef = useRef(null)
  const contentRef = useRef(null)
  const [canScrollPrev, setCanScrollPrev] = useState(false)
  const [canScrollNext, setCanScrollNext] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listenersRef = useRef(new Map())
  const vertical = orientation === "vertical"
  const align = opts.align || "start"
  const loop = !!opts.loop

  const emit = useCallback((event) => {
    const cbs = listenersRef.current.get(event)
    if (cbs) for (const fn of cbs) fn()
  }, [])

  /** Direct children with the `.carousel-item` class. */
  const getItems = useCallback(() => {
    const el = contentRef.current
    return el ? Array.from(el.querySelectorAll(":scope > .carousel-item")) : []
  }, [])

  /** Measure distance between an item rect and the container rect at the given alignment. */
  const alignDist = useCallback(
    (cr, ir) => {
      if (vertical) {
        if (align === "center") return Math.abs((ir.top + ir.height / 2) - (cr.top + cr.height / 2))
        if (align === "end") return Math.abs(ir.bottom - cr.bottom)
        return Math.abs(ir.top - cr.top)
      }
      if (direction === "rtl") {
        if (align === "center") return Math.abs((ir.left + ir.width / 2) - (cr.left + cr.width / 2))
        if (align === "end") return Math.abs(ir.left - cr.left)
        return Math.abs(ir.right - cr.right) // start in RTL = right edge
      }
      if (align === "center") return Math.abs((ir.left + ir.width / 2) - (cr.left + cr.width / 2))
      if (align === "end") return Math.abs(ir.right - cr.right)
      return Math.abs(ir.left - cr.left)
    },
    [align, direction, vertical]
  )

  /** Index of the real item whose snap edge is closest to the container's snap edge. */
  const snapIndex = useCallback(() => {
    const el = contentRef.current
    if (!el) return 0
    const items = getItems()
    if (!items.length) return 0
    const cr = el.getBoundingClientRect()

    // Under loop, also check clone elements to map back to real indices
    const allSnappable = loop
      ? Array.from(el.querySelectorAll(":scope > .carousel-item"))
      : items

    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < allSnappable.length; i++) {
      const dist = alignDist(cr, allSnappable[i].getBoundingClientRect())
      if (dist < bestDist) {
        bestDist = dist
        const node = allSnappable[i]
        best = node.hasAttribute("data-carousel-clone")
          ? Number(node.dataset.cloneIndex)
          : items.indexOf(node)
      }
    }
    return best
  }, [alignDist, getItems, loop])

  /** Update boundary flags + selected index from the current scroll position. */
  const syncState = useCallback(() => {
    const el = contentRef.current
    if (!el) return

    let prev, next
    if (loop) {
      prev = true
      next = true
    } else {
      const max = vertical
        ? el.scrollHeight - el.clientHeight
        : el.scrollWidth - el.clientWidth
      if (vertical) {
        prev = el.scrollTop > 1
        next = el.scrollTop < max - 1
      } else if (direction === "rtl") {
        prev = el.scrollLeft < -1
        next = el.scrollLeft > -(max - 1)
      } else {
        prev = el.scrollLeft > 1
        next = el.scrollLeft < max - 1
      }
    }

    setCanScrollPrev((p) => (p === prev ? p : prev))
    setCanScrollNext((p) => (p === next ? p : next))

    const idx = snapIndex()
    setSelectedIndex((p) => {
      if (p !== idx) { queueMicrotask(() => emit("select")); return idx }
      return p
    })
  }, [direction, emit, loop, snapIndex, vertical])

  /** Compute the scroll offset delta to align a given element to the current snap alignment. */
  const alignOffset = useCallback(
    (el, item) => {
      const cr = el.getBoundingClientRect()
      const ir = item.getBoundingClientRect()
      if (vertical) {
        if (align === "center") return (ir.top + ir.height / 2) - (cr.top + cr.height / 2)
        if (align === "end") return ir.bottom - cr.bottom
        return ir.top - cr.top
      }
      if (direction === "rtl") {
        if (align === "center") return (ir.left + ir.width / 2) - (cr.left + cr.width / 2)
        if (align === "end") return ir.left - cr.left
        return ir.right - cr.right
      }
      if (align === "center") return (ir.left + ir.width / 2) - (cr.left + cr.width / 2)
      if (align === "end") return ir.right - cr.right
      return ir.left - cr.left
    },
    [align, direction, vertical]
  )

  /** Scroll a DOM element into the container's snap-aligned position. */
  const scrollToElement = useCallback(
    (item, behavior = "smooth") => {
      const el = contentRef.current
      if (!el || !item) return
      const delta = alignOffset(el, item)
      if (vertical) {
        el.scrollTo({ top: el.scrollTop + delta, behavior })
      } else {
        el.scrollTo({ left: el.scrollLeft + delta, behavior })
      }
    },
    [alignOffset, vertical]
  )

  /** Programmatic scroll to align `index` with the container's snap edge. */
  const scrollToItem = useCallback(
    (index) => {
      const item = getItems()[index]
      if (item) scrollToElement(item)
    },
    [getItems, scrollToElement]
  )

  const scrollPrev = useCallback(() => {
    const i = snapIndex()
    const items = getItems()
    if (loop && i === 0) {
      // Scroll to the leading clone of the last item, recentre will follow
      const el = contentRef.current
      if (!el) return
      const clones = el.querySelectorAll(`:scope > [data-carousel-clone][data-clone-index="${items.length - 1}"]`)
      // Leading clone is the first match
      if (clones[0]) scrollToElement(clones[0])
    } else if (i > 0) {
      scrollToItem(i - 1)
    }
  }, [getItems, loop, snapIndex, scrollToElement, scrollToItem])

  const scrollNext = useCallback(() => {
    const i = snapIndex()
    const items = getItems()
    if (loop && i === items.length - 1) {
      // Scroll to the trailing clone of the first item, recentre will follow
      const el = contentRef.current
      if (!el) return
      const clones = el.querySelectorAll(`:scope > [data-carousel-clone][data-clone-index="0"]`)
      // Trailing clone is the last match
      if (clones.length) scrollToElement(clones[clones.length - 1])
    } else if (i < items.length - 1) {
      scrollToItem(i + 1)
    }
  }, [getItems, loop, snapIndex, scrollToElement, scrollToItem])

  /* ---- stable embla-compatible API ---- */

  const stateRef = useRef({})
  stateRef.current = { canScrollPrev, canScrollNext, selectedIndex }
  const fnRef = useRef({})
  fnRef.current = { scrollPrev, scrollNext, getItems, scrollToElement }

  const apiRef = useRef(null)
  if (!apiRef.current) {
    apiRef.current = Object.freeze({
      scrollPrev() { fnRef.current.scrollPrev() },
      scrollNext() { fnRef.current.scrollNext() },
      canScrollPrev() { return stateRef.current.canScrollPrev },
      canScrollNext() { return stateRef.current.canScrollNext },
      selectedScrollSnap() { return stateRef.current.selectedIndex },
      scrollSnapList() { return fnRef.current.getItems().map((_, i) => i) },
      rootNode() { return rootRef.current },
      on(event, cb) {
        if (!listenersRef.current.has(event)) listenersRef.current.set(event, new Set())
        listenersRef.current.get(event).add(cb)
      },
      off(event, cb) { listenersRef.current.get(event)?.delete(cb) },
    })
  }

  useEffect(() => { setApi?.(apiRef.current) }, [setApi])

  /* ---- plugins ---- */

  useEffect(() => {
    if (!plugins?.length) return
    const api = apiRef.current
    const active = plugins.map((p) => { p.init(api, opts); return p })
    return () => { for (const p of active) p.destroy() }
  }, [plugins, opts])

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
      syncState, getItems, snapIndex, scrollToItem, scrollToElement,
      align, loop,
    }),
    [orientation, vertical, direction, canScrollPrev, canScrollNext,
     scrollPrev, scrollNext, syncState, getItems, snapIndex, scrollToItem,
     scrollToElement, align, loop]
  )

  return (
    <CarouselContext.Provider value={ctx}>
      <div
        ref={rootRef}
        role="region"
        aria-roledescription="carousel"
        tabIndex={0}
        data-orientation={orientation}
        data-align={align !== "start" ? align : undefined}
        data-loop={loop || undefined}
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

export function CarouselContent({ className, children, ...props }) {
  const {
    vertical, direction, contentRef, syncState, snapIndex, scrollToItem,
    scrollToElement, getItems, loop, align,
  } = useCarousel()
  const dragRef = useRef(null)
  const recentringRef = useRef(false)

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

  /* ---- loop: set initial scroll to first real item ---- */
  useLayoutEffect(() => {
    if (!loop) return
    const el = contentRef.current
    if (!el) return
    const firstReal = el.querySelector(":scope > .carousel-item:not([data-carousel-clone])")
    if (!firstReal) return
    // Instant scroll so first real item is at the snap-aligned edge
    const cr = el.getBoundingClientRect()
    const ir = firstReal.getBoundingClientRect()
    if (vertical) {
      el.scrollTop = el.scrollTop + (ir.top - cr.top)
    } else {
      el.scrollLeft = el.scrollLeft + (ir.left - cr.left)
    }
  }, [contentRef, loop, vertical])

  /* ---- loop: recentre when scroll settles on a clone ---- */
  useLayoutEffect(() => {
    if (!loop) return
    const el = contentRef.current
    if (!el) return

    const recentre = () => {
      if (recentringRef.current) return
      const allItems = el.querySelectorAll(":scope > .carousel-item")
      const cr = el.getBoundingClientRect()
      let closest = null
      let closestDist = Infinity
      for (const item of allItems) {
        const ir = item.getBoundingClientRect()
        let dist
        if (vertical) {
          dist = Math.abs(ir.top - cr.top)
        } else if (direction === "rtl") {
          dist = Math.abs(ir.right - cr.right)
        } else {
          dist = Math.abs(ir.left - cr.left)
        }
        if (dist < closestDist) { closestDist = dist; closest = item }
      }
      if (!closest || !closest.hasAttribute("data-carousel-clone")) return

      // Find the corresponding real item
      const idx = Number(closest.dataset.cloneIndex)
      const realItems = el.querySelectorAll(":scope > .carousel-item:not([data-carousel-clone])")
      const realItem = realItems[idx]
      if (!realItem) return

      recentringRef.current = true
      const cir = closest.getBoundingClientRect()
      const rir = realItem.getBoundingClientRect()
      // Disable snap and jump instantly
      el.style.scrollSnapType = "none"
      if (vertical) {
        el.scrollTop += rir.top - cir.top
      } else {
        el.scrollLeft += rir.left - cir.left
      }
      // Re-enable snap on next frame
      requestAnimationFrame(() => {
        el.style.scrollSnapType = ""
        recentringRef.current = false
        syncState()
      })
    }

    // scrollend with debounce fallback
    let settleTimer
    const onScrollSettle = () => { recentre() }
    const onScrollFallback = () => {
      clearTimeout(settleTimer)
      settleTimer = setTimeout(recentre, 120)
    }

    const supportsScrollEnd = "onscrollend" in el
    if (supportsScrollEnd) {
      el.addEventListener("scrollend", onScrollSettle)
    }
    el.addEventListener("scroll", onScrollFallback, { passive: true })

    return () => {
      clearTimeout(settleTimer)
      if (supportsScrollEnd) el.removeEventListener("scrollend", onScrollSettle)
      el.removeEventListener("scroll", onScrollFallback)
    }
  }, [contentRef, direction, loop, syncState, vertical])

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
        if (loop) {
          // Under loop, wrap the target index
          const wrapped = ((target % items.length) + items.length) % items.length
          scrollToItem(wrapped)
        } else if (target >= 0 && target < items.length) {
          scrollToItem(target)
        } else {
          scrollToItem(drag.startIndex)
        }
      } else {
        scrollToItem(drag.startIndex)
      }
    },
    [contentRef, direction, getItems, loop, scrollToItem, vertical]
  )

  /* ---- render clones for loop ---- */
  let content = children
  if (loop) {
    const childArray = Children.toArray(children)
    const leadingClones = childArray.map((child, i) =>
      cloneElement(child, {
        key: `clone-lead-${i}`,
        "data-carousel-clone": "",
        "data-clone-index": i,
        "aria-hidden": "true",
        inert: true,
      })
    )
    const trailingClones = childArray.map((child, i) =>
      cloneElement(child, {
        key: `clone-trail-${i}`,
        "data-carousel-clone": "",
        "data-clone-index": i,
        "aria-hidden": "true",
        inert: true,
      })
    )
    content = [...leadingClones, ...childArray, ...trailingClones]
  }

  return (
    <div
      ref={contentRef}
      className={cn("carousel-content", className)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      {...props}
    >
      {content}
    </div>
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
