/**
 * Position a floating element (position: fixed) relative to an anchor,
 * flipping to the opposite side when it would overflow the viewport and
 * clamping the cross axis. Replaces Floating UI for our needs.
 *
 * Sets left/top styles and data-side/data-align on the floating element
 * (used by CSS for placement-aware animations/arrows).
 *
 * @param {HTMLElement} anchor
 * @param {HTMLElement} floating
 * @param {object} options
 * @param {"top"|"bottom"|"left"|"right"} [options.side]
 * @param {"start"|"center"|"end"} [options.align]
 * @param {number} [options.sideOffset] - gap between anchor and floating
 * @param {number} [options.alignOffset]
 * @param {number} [options.padding] - min distance from viewport edges
 * @returns {{ left: number, top: number, side: string }}
 */
export function positionAnchored(anchor, floating, options = {}) {
  const { side = "bottom", align = "center", sideOffset = 4, alignOffset = 0, padding = 8 } = options

  const a = anchor.getBoundingClientRect()
  const w = floating.offsetWidth
  const h = floating.offsetHeight
  const vw = document.documentElement.clientWidth
  const vh = document.documentElement.clientHeight

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

  // Main axis with flip when there is more room on the opposite side.
  function main(s) {
    switch (s) {
      case "bottom": return a.bottom + sideOffset
      case "top": return a.top - sideOffset - h
      case "right": return a.right + sideOffset
      case "left": return a.left - sideOffset - w
    }
  }

  const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" }
  let actualSide = side
  {
    const size = side === "top" || side === "bottom" ? h : w
    const limit = side === "top" || side === "bottom" ? vh : vw
    const pos = main(side)
    const overflows = pos < padding || pos + size > limit - padding
    if (overflows) {
      const flipped = main(opposite[side])
      const flippedOverflows = flipped < padding || flipped + size > limit - padding
      if (!flippedOverflows) actualSide = opposite[side]
    }
  }

  // Cross axis: align, then clamp inside the viewport.
  function cross() {
    if (actualSide === "top" || actualSide === "bottom") {
      let left
      if (align === "start") left = a.left + alignOffset
      else if (align === "end") left = a.right - w - alignOffset
      else left = a.left + a.width / 2 - w / 2 + alignOffset
      return clamp(left, padding, Math.max(padding, vw - w - padding))
    }
    let top
    if (align === "start") top = a.top + alignOffset
    else if (align === "end") top = a.bottom - h - alignOffset
    else top = a.top + a.height / 2 - h / 2 + alignOffset
    return clamp(top, padding, Math.max(padding, vh - h - padding))
  }

  let left, top
  if (actualSide === "top" || actualSide === "bottom") {
    top = main(actualSide)
    left = cross()
  } else {
    left = main(actualSide)
    top = cross()
  }

  floating.style.position = "fixed"
  floating.style.left = `${left}px`
  floating.style.top = `${top}px`
  floating.dataset.side = actualSide
  floating.dataset.align = align

  return { left, top, side: actualSide }
}
