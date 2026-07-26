import { createContext, useContext } from "react"
import { cn } from "../../lib/cn.js"
import { useSwipe } from "../../lib/use-swipe.js"
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

const VELOCITY_THRESHOLD = 1.0 // px/ms — a deliberate flick (~1000 px/s)

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
  const { axis, sign } = SWIPE[swipeDirection]

  const swipeHandlers = useSwipe({
    axis,
    shouldStart: (event) =>
      !event.target.closest("button, a, input, select, textarea, [contenteditable]"),
    onMove: (delta, event) => {
      const el = event.currentTarget
      const offset = Math.max(0, delta * sign)
      el.setAttribute("data-swiping", "")
      el.style.transform =
        axis === "x"
          ? `translateX(${offset * sign}px)`
          : `translateY(${offset * sign}px)`
    },
    onEnd: ({ delta, velocity }, event) => {
      const el = event.currentTarget
      el.removeAttribute("data-swiping")
      const offset = Math.max(0, delta * sign)
      const rect = el.getBoundingClientRect()
      const size = axis === "x" ? rect.width : rect.height
      const velocityDismiss = velocity * sign > VELOCITY_THRESHOLD

      if (offset > size * 0.25 || velocityDismiss) {
        if (velocityDismiss) {
          const scale = Math.max(0.3, VELOCITY_THRESHOLD / Math.abs(velocity))
          el.style.setProperty("--exit-scale", scale.toFixed(2))
        }
        // Keep the inline transform: the exit keyframe has no `from`, so
        // the close animation starts from the dragged position.
        setOpen(false)
      } else {
        el.style.transform = ""
      }
    },
    onCancel: (event) => {
      const el = event.currentTarget
      el.removeAttribute("data-swiping")
      el.style.transform = ""
    },
  })

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
        swipeHandlers.onPointerDown(event)
      }}
      onPointerMove={swipeHandlers.onPointerMove}
      onPointerUp={swipeHandlers.onPointerUp}
      onPointerCancel={swipeHandlers.onPointerCancel}
      {...props}
    >
      {showSwipeHandle && <DrawerSwipeHandle />}
      {children}
    </DialogContent>
  )
}
