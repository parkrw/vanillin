import { createContext, useContext } from "react"
import { cn } from "../../lib/cn.js"
import {
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

export function DrawerContent({ className, children, ...props }) {
  const { swipeDirection, showSwipeHandle } = useContext(DrawerContext)
  return (
    <DialogContent
      className={cn("drawer", `drawer--${swipeDirection}`, className)}
      data-swipe-direction={swipeDirection}
      showCloseButton={false}
      {...props}
    >
      {showSwipeHandle && <DrawerSwipeHandle />}
      {children}
    </DialogContent>
  )
}
