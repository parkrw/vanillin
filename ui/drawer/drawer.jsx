import { createContext, useContext, useRef } from "react"
import { cn } from "../../lib/cn.js"
import {
  useDialog,
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../dialog/dialog.jsx"

const DrawerContext = createContext({ swipeDirection: "down", showSwipeHandle: true })

/** A touch-first sheet with swipe-to-dismiss. swipeDirection names the
 * dismiss gesture, so it is also the anchored edge: down = bottom drawer. */
export function Drawer({ swipeDirection = "down", showSwipeHandle = true, ...props }) {
  return (
    <DrawerContext.Provider value={{ swipeDirection, showSwipeHandle }}>
      <Dialog {...props} />
    </DrawerContext.Provider>
  )
}

export const DrawerTrigger = DialogTrigger
export const DrawerPortal = DialogPortal
export const DrawerOverlay = DialogOverlay
export const DrawerHeader = DialogHeader
export const DrawerFooter = DialogFooter
export const DrawerTitle = DialogTitle
export const DrawerDescription = DialogDescription
export const DrawerClose = DialogClose

export function DrawerSwipeHandle({ className, ...props }) {
  return <div aria-hidden="true" className={cn("drawer-handle", className)} {...props} />
}

// Positive swipe offset = toward the dismiss edge; the opposite way clamps
// to zero so the drawer can't be dragged into the viewport.
const SWIPE = {
  up: { axis: "y", sign: -1 },
  right: { axis: "x", sign: 1 },
  down: { axis: "y", sign: 1 },
  left: { axis: "x", sign: -1 },
}

export function DrawerContent({ className, children, ...props }) {
  const { swipeDirection, showSwipeHandle } = useContext(DrawerContext)
  const { setOpen } = useDialog()
  const drag = useRef(null)
  const { axis, sign } = SWIPE[swipeDirection]
  const pointerPosition = (event) => (axis === "x" ? event.clientX : event.clientY)

  return (
    <DialogContent
      className={cn("drawer", `drawer--${swipeDirection}`, className)}
      data-swipe-direction={swipeDirection}
      showCloseButton={false}
      // Passing onPointerDown replaces DialogContent's backdrop-click
      // handler, so the outside-coordinate check is repeated here.
      onPointerDown={(event) => {
        const el = event.currentTarget
        const rect = el.getBoundingClientRect()
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        if (outside) {
          setOpen(false)
          return
        }
        if (event.target.closest("button, a, input, select, textarea, [contenteditable]")) return
        drag.current = {
          start: pointerPosition(event),
          offset: 0,
          size: axis === "x" ? rect.width : rect.height,
        }
        el.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!drag.current) return
        const el = event.currentTarget
        const offset = Math.max(0, (pointerPosition(event) - drag.current.start) * sign)
        drag.current.offset = offset
        el.setAttribute("data-swiping", "")
        el.style.transform = axis === "x" ? `translateX(${offset * sign}px)` : `translateY(${offset * sign}px)`
      }}
      onPointerUp={(event) => {
        if (!drag.current) return
        const el = event.currentTarget
        const { offset, size } = drag.current
        drag.current = null
        el.removeAttribute("data-swiping")
        if (offset > size * 0.25) {
          // Keep the inline transform: the exit keyframe has no `from`, so
          // the close animation starts from the dragged position.
          setOpen(false)
        } else {
          el.style.transform = ""
        }
      }}
      onPointerCancel={(event) => {
        if (!drag.current) return
        drag.current = null
        event.currentTarget.removeAttribute("data-swiping")
        event.currentTarget.style.transform = ""
      }}
      {...props}
    >
      {showSwipeHandle && <DrawerSwipeHandle />}
      {children}
    </DialogContent>
  )
}
