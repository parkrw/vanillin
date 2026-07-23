import { cn } from "../../lib/cn.js"
import { Button } from "../button/button.jsx"
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

/**
 * A dialog that must be answered: role="alertdialog", no X button, backdrop
 * clicks don't dismiss (Esc still closes, matching Radix). Keep Cancel
 * before Action so native autofocus lands on the least-destructive button.
 */
export const AlertDialog = Dialog
export const AlertDialogTrigger = DialogTrigger
export const AlertDialogPortal = DialogPortal
export const AlertDialogOverlay = DialogOverlay
export const AlertDialogHeader = DialogHeader
export const AlertDialogFooter = DialogFooter
export const AlertDialogTitle = DialogTitle
export const AlertDialogDescription = DialogDescription

export function AlertDialogContent({ className, ...props }) {
  return (
    <DialogContent
      role="alertdialog"
      dismissible={false}
      showCloseButton={false}
      className={cn("alert-dialog", className)}
      {...props}
    />
  )
}

export function AlertDialogAction(props) {
  return <DialogClose as={Button} {...props} />
}

export function AlertDialogCancel(props) {
  return <DialogClose as={Button} variant="outline" {...props} />
}
