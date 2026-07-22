import { useState } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "../../ui/dialog/dialog.jsx"
import { Button } from "../../ui/button/button.jsx"
import { Field, FieldLabel } from "../../ui/field/field.jsx"
import { Input } from "../../ui/input/input.jsx"
import "../../ui/dialog/dialog.css"
import "../../ui/button/button.css"
import "../../ui/field/field.css"
import "../../ui/input/input.css"

export default function DialogPage() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <h2>Dialog</h2>

      <section className="pg-section">
        <h3>Edit profile</h3>
        <Dialog>
          <DialogTrigger as={Button} variant="outline">
            Open dialog
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Make changes to your profile here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <p>Update your display name below.</p>
            <Field>
              <FieldLabel htmlFor="dialog-name">Name</FieldLabel>
              <Input id="dialog-name" defaultValue="Pedro Duarte" />
            </Field>
            <DialogFooter>
              <DialogClose as={Button} variant="outline">
                Cancel
              </DialogClose>
              <Button>Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger as={Button} variant="outline">
            Open controlled
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Controlled dialog</DialogTitle>
              <DialogDescription>Open state lives in the page.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          state: <span data-pg="controlled-state">{open ? "open" : "closed"}</span>
        </p>
      </section>
    </>
  )
}
