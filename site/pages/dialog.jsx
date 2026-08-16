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
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../../ui/alert-dialog/alert-dialog.jsx"
import { Button } from "../../ui/button/button.jsx"
import { Field, FieldLabel } from "../../ui/field/field.jsx"
import { Input } from "../../ui/input/input.jsx"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/dialog/dialog.css"
import "../../ui/alert-dialog/alert-dialog.css"
import "../../ui/button/button.css"
import "../../ui/field/field.css"
import "../../ui/input/input.css"
import "../../ui/label/label.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function DialogPage() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <h2>Dialog</h2>
      <p>A modal window that overlays the page, built on the native <code>&lt;dialog&gt;</code> element.</p>

      <InstallSnippet slug="dialog" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Dialog>
  <DialogTrigger as={Button} variant="outline">Open dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>
        Make changes to your profile here. Click save when you're done.
      </DialogDescription>
    </DialogHeader>
    <p>Update your display name below.</p>
    <Field>
      <FieldLabel htmlFor="name">Name</FieldLabel>
      <Input id="name" defaultValue="Pedro Duarte" />
    </Field>
    <DialogFooter>
      <DialogClose as={Button} variant="outline">Cancel</DialogClose>
      <Button>Save changes</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}>
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
        </ComponentPreview>
        <p className="pg-desc">
          The panel is a native <code>&lt;dialog&gt;</code> opened with <code>showModal()</code>, so focus trapping, the top layer, and inertness of the page behind it come from the browser rather than from JavaScript.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Dialog, DialogTrigger, DialogContent, DialogHeader,
  DialogFooter, DialogTitle, DialogDescription, DialogClose }
  from "./ui/dialog/dialog"
import "./ui/dialog/dialog.css"

<Dialog>
  <DialogTrigger as={Button}>Share link</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Share this page</DialogTitle>
      <DialogDescription>Anyone with the link can view it.</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose as={Button} variant="outline">Done</DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`}>
          <Dialog>
            <DialogTrigger as={Button}>Share link</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Share this page</DialogTitle>
                <DialogDescription>Anyone with the link can view it.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose as={Button} variant="outline">Done</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
        <p className="pg-desc">
          <code>DialogTitle</code> and <code>DialogDescription</code> generate the ids that label and describe the panel. Leave them out and the dialog opens unnamed.
        </p>
      </section>

      <section className="pg-section">
        <h3>Not dismissible</h3>
        <ComponentPreview code={`<DialogContent dismissible={false} showCloseButton={false}>
  <DialogHeader>
    <DialogTitle>Migration in progress</DialogTitle>
    <DialogDescription>Do not close this tab.</DialogDescription>
  </DialogHeader>
  <DialogFooter>
    <DialogClose as={Button}>Stop migration</DialogClose>
  </DialogFooter>
</DialogContent>`}>
          <Dialog>
            <DialogTrigger as={Button} variant="outline">
              Start migration
            </DialogTrigger>
            <DialogContent dismissible={false} showCloseButton={false}>
              <DialogHeader>
                <DialogTitle>Migration in progress</DialogTitle>
                <DialogDescription>Do not close this tab.</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose as={Button}>Stop migration</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
        <p className="pg-desc">
          <code>dismissible={"{false}"}</code> blocks the backdrop click and Escape, and <code>showCloseButton={"{false}"}</code> removes the X. Together they leave the footer as the only way out, which is what <code>alert-dialog</code> ships preconfigured.
        </p>
      </section>

      <section className="pg-section">
        <h3>Scrolling content</h3>
        <ComponentPreview code={`<DialogContent>
  <DialogHeader>
    <DialogTitle>Terms of service</DialogTitle>
  </DialogHeader>
  <div style={{ maxBlockSize: "14rem", overflowY: "auto" }}>
    {/* long content */}
  </div>
  <DialogFooter>
    <DialogClose as={Button}>I agree</DialogClose>
  </DialogFooter>
</DialogContent>`}>
          <Dialog>
            <DialogTrigger as={Button} variant="outline">
              Read terms
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Terms of service</DialogTitle>
                <DialogDescription>Last updated 3 March 2026.</DialogDescription>
              </DialogHeader>
              <div style={{ maxBlockSize: "14rem", overflowY: "auto", display: "grid", gap: "0.75rem" }}>
                {Array.from({ length: 8 }, (_, index) => (
                  <p key={index} style={{ fontSize: "0.875rem" }}>
                    Clause {index + 1}. The software is provided as is, without warranty of
                    any kind, express or implied, including but not limited to the
                    warranties of merchantability and fitness for a particular purpose.
                  </p>
                ))}
              </div>
              <DialogFooter>
                <DialogClose as={Button}>I agree</DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
        <p className="pg-desc">
          Scroll the body, not the panel. Keeping the header and footer outside the scrolling region leaves the title and the exit visible at every scroll position.
        </p>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [open, setOpen] = useState(false)

<Dialog open={open} onOpenChange={setOpen}>
  <DialogTrigger as={Button} variant="outline">Open controlled</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Controlled dialog</DialogTitle>
      <DialogDescription>Open state lives in the page.</DialogDescription>
    </DialogHeader>
  </DialogContent>
</Dialog>`}>
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
          <p className="pg-desc">
            state: <span data-pg="controlled-state">{open ? "open" : "closed"}</span>
          </p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Alert Dialog</h3>
        <p>
          <code>alert-dialog</code> is a thin re-export of <code>dialog</code> with{" "}
          <code>dismissible=false</code>, so clicking the backdrop or pressing Escape
          does not close it. Use it for destructive confirmations.
        </p>
        <ComponentPreview code={`<AlertDialog>
  <AlertDialogTrigger as={Button} variant="destructive">
    Delete account
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}>
          <AlertDialog>
            <AlertDialogTrigger as={Button} variant="destructive">
              Delete account
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Dialog with Form Validation</h3>
        <ComponentPreview code={`<Dialog>
  <DialogTrigger as={Button}>New event</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Create event</DialogTitle>
      <DialogDescription>Fill in the event details.</DialogDescription>
    </DialogHeader>
    <form onSubmit={handleSubmit}>
      <Label htmlFor="event-name">Event name</Label>
      <Input id="event-name" required placeholder="Standup" />
      <Label htmlFor="event-date">Date</Label>
      <Input id="event-date" type="date" required />
      <DialogFooter>
        <DialogClose as={Button} variant="outline">Cancel</DialogClose>
        <Button type="submit">Create</Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>`}>
          <Dialog>
            <DialogTrigger as={Button}>New event</DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create event</DialogTitle>
                <DialogDescription>Fill in the event details.</DialogDescription>
              </DialogHeader>
              <form onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <Label htmlFor="event-name">Event name</Label>
                  <Input id="event-name" required placeholder="Standup" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <Label htmlFor="event-date">Date</Label>
                  <Input id="event-date" type="date" required />
                </div>
                <DialogFooter>
                  <DialogClose as={Button} variant="outline">Cancel</DialogClose>
                  <Button type="submit">Create</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </ComponentPreview>
      </section>

      <ApiReference title="Dialog" props={[
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state (uncontrolled)" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
      ]} />

      <ApiReference title="DialogContent" props={[
        { name: "showCloseButton", type: "boolean", default: "true", description: "Show the X close button" },
        { name: "dismissible", type: "boolean", default: "true", description: "Allow closing via backdrop click or Escape" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
