import { cn } from "../../lib/cn.js"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../dialog/dialog.jsx"

/** A dialog anchored to a viewport edge. side: top | right | bottom | left. */
export const Sheet = Dialog
export const SheetTrigger = DialogTrigger
export const SheetClose = DialogClose
export const SheetHeader = DialogHeader
export const SheetFooter = DialogFooter
export const SheetTitle = DialogTitle
export const SheetDescription = DialogDescription

export function SheetContent({ side = "right", className, ...props }) {
  return <DialogContent className={cn("sheet", `sheet--${side}`, className)} {...props} />
}
