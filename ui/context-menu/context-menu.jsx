import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  useDropdownMenu,
} from "../dropdown-menu/dropdown-menu.jsx"

const ContextMenuContext = createContext(null)

/**
 * Root — the task-12 menu opened at pointer coordinates. Renders DropdownMenu
 * internally so every menu part works unchanged; adds a virtual anchor
 * (a zero-size rect at the last right-click point) that ContextMenuContent
 * positions against.
 */
export function ContextMenu({ open, defaultOpen = false, onOpenChange, children }) {
  const [point, setXY] = useState({ x: 0, y: 0 })

  // A fresh ref object per click (even at the same coords) — the position
  // effect keys on anchor-ref identity, so a right-click while already open
  // still repositions the menu.
  const anchorRef = useMemo(
    () => ({ current: { getBoundingClientRect: () => new DOMRect(point.x, point.y, 0, 0) } }),
    [point]
  )
  const setPoint = (x, y) => setXY({ x, y })

  return (
    <ContextMenuContext.Provider value={{ anchorRef, setPoint }}>
      <DropdownMenu open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
        {children}
      </DropdownMenu>
    </ContextMenuContext.Provider>
  )
}

/**
 * Right-click surface — a plain span, not a button (no aria-haspopup/expanded;
 * Radix stance). `disabled` lets the native context menu through untouched.
 */
export function ContextMenuTrigger({
  as: Comp = "span",
  disabled = false,
  onContextMenu,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  className,
  ...props
}) {
  const { open, setOpen, triggerRef, contentRef } = useDropdownMenu()
  const { setPoint } = useContext(ContextMenuContext)
  const longPressTimer = useRef(null)

  useEffect(() => () => clearTimeout(longPressTimer.current), [])

  const openAt = (x, y) => {
    setPoint(x, y)
    // Chrome hides all auto popovers while processing the contextmenu event
    // (even when it's prevented) — opening synchronously there gets undone
    // immediately. Open in a later task, after the gesture completes.
    setTimeout(() => {
      setOpen(true)
      // Right-click while already open: state never left "open" (the native
      // hide's toggle event is queued, not yet synced), so the setOpen above
      // is a no-op — re-show the natively hidden popover directly. The
      // hide+show toggle events coalesce to open→open, which the state sync
      // ignores.
      const el = contentRef.current
      if (el && !el.matches(":popover-open")) {
        try {
          el.showPopover()
        } catch {
          /* mid-transition edge; state sync will settle it */
        }
      }
    }, 0)
  }

  const handleContextMenu = (event) => {
    onContextMenu?.(event)
    if (disabled || event.defaultPrevented) return
    event.preventDefault()
    clearTimeout(longPressTimer.current)
    openAt(event.clientX, event.clientY)
  }

  // Touch/pen long-press (700ms) — iOS fires no contextmenu event. Where the
  // platform fires one anyway (Android), it lands in openAt's reopen path.
  const handlePointerDown = (event) => {
    onPointerDown?.(event)
    if (disabled || event.defaultPrevented || event.pointerType === "mouse") return
    const { clientX: x, clientY: y } = event
    clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => openAt(x, y), 700)
  }

  const clearLongPress = (handler) => (event) => {
    handler?.(event)
    if (event.pointerType !== "mouse") clearTimeout(longPressTimer.current)
  }

  return (
    <Comp
      ref={triggerRef}
      data-state={open ? "open" : "closed"}
      className={className}
      onContextMenu={handleContextMenu}
      onPointerDown={handlePointerDown}
      onPointerMove={clearLongPress(onPointerMove)}
      onPointerUp={clearLongPress(onPointerUp)}
      onPointerCancel={clearLongPress(onPointerCancel)}
      {...(disabled ? { "data-disabled": "" } : {})}
      {...props}
    />
  )
}

export function ContextMenuContent({ className, ...props }) {
  const { anchorRef } = useContext(ContextMenuContext)

  // Bottom-right of the pointer, with the cursor 2px INSIDE the menu corner
  // (Windows-style). Inside matters: popover light dismiss fires on the
  // pointerup that ends the right-click, and only spares the popover when
  // that pointerup lands within it. positionAnchored flips near viewport
  // edges since the anchor rect is a point (the cursor stays inside the
  // flipped corner too — negative offsets mirror with the side).
  return (
    <DropdownMenuContent
      anchorRef={anchorRef}
      side="right"
      align="start"
      sideOffset={-2}
      alignOffset={-2}
      className={cn("context-menu", className)}
      {...props}
    />
  )
}

export {
  DropdownMenuItem as ContextMenuItem,
  DropdownMenuCheckboxItem as ContextMenuCheckboxItem,
  DropdownMenuRadioGroup as ContextMenuRadioGroup,
  DropdownMenuRadioItem as ContextMenuRadioItem,
  DropdownMenuSub as ContextMenuSub,
  DropdownMenuSubTrigger as ContextMenuSubTrigger,
  DropdownMenuSubContent as ContextMenuSubContent,
  DropdownMenuGroup as ContextMenuGroup,
  DropdownMenuLabel as ContextMenuLabel,
  DropdownMenuSeparator as ContextMenuSeparator,
  DropdownMenuShortcut as ContextMenuShortcut,
}
