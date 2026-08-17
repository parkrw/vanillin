import { useState } from "react"
import {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "../../ui/sheet/sheet.jsx"
import { Button } from "../../ui/button/button.jsx"
import { Field, FieldLabel } from "../../ui/field/field.jsx"
import { Input } from "../../ui/input/input.jsx"
import { Switch } from "../../ui/switch/switch.jsx"
import { Label } from "../../ui/label/label.jsx"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../../ui/sheet/sheet.css"
import "../../ui/button/button.css"
import "../../ui/field/field.css"
import "../../ui/input/input.css"
import "../../ui/switch/switch.css"
import "../../ui/label/label.css"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function SheetPage() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <h2>Sheet</h2>
      <p>A modal panel that slides in from an edge for forms, detail views, or settings.</p>

      <InstallSnippet slug="sheet" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Sheet>
  <SheetTrigger as={Button} variant="outline">Open sheet</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Edit profile</SheetTitle>
      <SheetDescription>Make changes to your profile here.</SheetDescription>
    </SheetHeader>
    <Field>
      <FieldLabel htmlFor="name">Name</FieldLabel>
      <Input id="name" defaultValue="Pedro Duarte" />
    </Field>
    <SheetFooter>
      <SheetClose as={Button} variant="outline">Close</SheetClose>
      <Button>Save changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`}>
          <Sheet>
            <SheetTrigger as={Button} variant="outline">Open sheet</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>Make changes to your profile here.</SheetDescription>
              </SheetHeader>
              <Field>
                <FieldLabel htmlFor="sheet-default-name">Name</FieldLabel>
                <Input id="sheet-default-name" defaultValue="Pedro Duarte" />
              </Field>
              <SheetFooter>
                <SheetClose as={Button} variant="outline">Close</SheetClose>
                <Button>Save changes</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Sheet, SheetTrigger, SheetClose, SheetContent,
  SheetHeader, SheetFooter, SheetTitle, SheetDescription }
  from "./ui/sheet/sheet"
import "./ui/sheet/sheet.css"

<Sheet>
  <SheetTrigger as={Button} variant="outline">View session</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Session details</SheetTitle>
      <SheetDescription>Signed in from Chrome on macOS.</SheetDescription>
    </SheetHeader>
    <p>Last active 2 minutes ago.</p>
    <SheetFooter>
      <Button variant="destructive">Sign out</Button>
      <SheetClose as={Button} variant="outline">Done</SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`}>
          <Sheet>
            <SheetTrigger as={Button} variant="outline">View session</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Session details</SheetTitle>
                <SheetDescription>Signed in from Chrome on macOS.</SheetDescription>
              </SheetHeader>
              <p>Last active 2 minutes ago.</p>
              <SheetFooter>
                <Button variant="destructive">Sign out</Button>
                <SheetClose as={Button} variant="outline">Done</SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Sides</h3>
        <p>
          <code>side</code> on <code>SheetContent</code> picks the edge the
          panel anchors to. Right is the default.
        </p>
        <ComponentPreview code={`<Sheet>
  <SheetTrigger as={Button} variant="outline">Open left</SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Edit profile</SheetTitle>
      <SheetDescription>Make changes to your profile here.</SheetDescription>
    </SheetHeader>
    <Field>
      <FieldLabel htmlFor="sheet-name">Name</FieldLabel>
      <Input id="sheet-name" defaultValue="Pedro Duarte" />
    </Field>
    <SheetFooter>
      <SheetClose as={Button} variant="outline">Close</SheetClose>
      <Button>Save changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["right", "left", "top", "bottom"].map((side) => (
              <Sheet key={side}>
                <SheetTrigger as={Button} variant="outline">
                  Open {side}
                </SheetTrigger>
                <SheetContent side={side}>
                  <SheetHeader>
                    <SheetTitle>Edit profile</SheetTitle>
                    <SheetDescription>Make changes to your profile here.</SheetDescription>
                  </SheetHeader>
                  <Field>
                    <FieldLabel htmlFor={`sheet-name-${side}`}>Name</FieldLabel>
                    <Input id={`sheet-name-${side}`} defaultValue="Pedro Duarte" />
                  </Field>
                  <SheetFooter>
                    <SheetClose as={Button} variant="outline">
                      Close
                    </SheetClose>
                    <Button>Save changes</Button>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
            ))}
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [open, setOpen] = useState(false)

<Sheet open={open} onOpenChange={setOpen}>
  <SheetTrigger as={Button} variant="outline">Toggle sheet</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Controlled sheet</SheetTitle>
      <SheetDescription>Open state lives in the page.</SheetDescription>
    </SheetHeader>
  </SheetContent>
</Sheet>`}>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger as={Button} variant="outline">Toggle sheet</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Controlled sheet</SheetTitle>
                <SheetDescription>Open state lives in the page.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <p className="pg-desc">
            state: {open ? "open" : "closed"}
          </p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Form in a sheet</h3>
        <p>
          The sheet is a native <code>&lt;dialog&gt;</code>, so a form inside it
          gets focus trapping and Escape handling for free.
        </p>
        <ComponentPreview code={`<Sheet>
  <SheetTrigger as={Button}>Edit settings</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Workspace settings</SheetTitle>
      <SheetDescription>Changes apply to every member.</SheetDescription>
    </SheetHeader>
    <form onSubmit={handleSubmit}>
      <Field>
        <FieldLabel htmlFor="ws-name">Workspace name</FieldLabel>
        <Input id="ws-name" required defaultValue="Acme Inc" />
      </Field>
      <Field>
        <FieldLabel htmlFor="ws-domain">Domain</FieldLabel>
        <Input id="ws-domain" placeholder="acme.com" />
      </Field>
      <SheetFooter>
        <SheetClose as={Button} variant="outline">Discard</SheetClose>
        <Button type="submit">Save settings</Button>
      </SheetFooter>
    </form>
  </SheetContent>
</Sheet>`}>
          <Sheet>
            <SheetTrigger as={Button}>Edit settings</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Workspace settings</SheetTitle>
                <SheetDescription>Changes apply to every member.</SheetDescription>
              </SheetHeader>
              <form onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Field>
                  <FieldLabel htmlFor="ws-name">Workspace name</FieldLabel>
                  <Input id="ws-name" required defaultValue="Acme Inc" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ws-domain">Domain</FieldLabel>
                  <Input id="ws-domain" placeholder="acme.com" />
                </Field>
                <SheetFooter>
                  <SheetClose as={Button} variant="outline">Discard</SheetClose>
                  <Button type="submit">Save settings</Button>
                </SheetFooter>
              </form>
            </SheetContent>
          </Sheet>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Non-dismissible</h3>
        <p>
          <code>dismissible={"{false}"}</code> disables backdrop click, and{" "}
          <code>showCloseButton={"{false}"}</code> removes the X, so the sheet
          closes only through its own controls. Escape still closes it; the
          native <code>&lt;dialog&gt;</code> owns that key.
        </p>
        <ComponentPreview code={`<Sheet>
  <SheetTrigger as={Button} variant="outline">Review changes</SheetTrigger>
  <SheetContent dismissible={false} showCloseButton={false}>
    <SheetHeader>
      <SheetTitle>Unsaved changes</SheetTitle>
      <SheetDescription>Pick an action to continue.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <SheetClose as={Button} variant="outline">Keep editing</SheetClose>
      <SheetClose as={Button}>Save and exit</SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`}>
          <Sheet>
            <SheetTrigger as={Button} variant="outline">Review changes</SheetTrigger>
            <SheetContent dismissible={false} showCloseButton={false}>
              <SheetHeader>
                <SheetTitle>Unsaved changes</SheetTitle>
                <SheetDescription>Pick an action to continue.</SheetDescription>
              </SheetHeader>
              <SheetFooter>
                <SheetClose as={Button} variant="outline">Keep editing</SheetClose>
                <SheetClose as={Button}>Save and exit</SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Scrollable content</h3>
        <ComponentPreview code={`<Sheet>
  <SheetTrigger as={Button} variant="outline">View activity</SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Recent activity</SheetTitle>
      <SheetDescription>Everything from the last 30 days.</SheetDescription>
    </SheetHeader>
    <div style={{ overflowY: "auto" }}>
      {events.map((e) => <p key={e.id}>{e.summary}</p>)}
    </div>
    <SheetFooter>
      <SheetClose as={Button} variant="outline">Dismiss</SheetClose>
    </SheetFooter>
  </SheetContent>
</Sheet>`}>
          <Sheet>
            <SheetTrigger as={Button} variant="outline">View activity</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Recent activity</SheetTitle>
                <SheetDescription>Everything from the last 30 days.</SheetDescription>
              </SheetHeader>
              <div style={{ overflowY: "auto", maxHeight: "16rem" }}>
                <Field>
                  <FieldLabel htmlFor="sheet-activity-filter">Filter</FieldLabel>
                  <Input id="sheet-activity-filter" placeholder="Search events" />
                </Field>
                <p>Renamed the workspace to Acme Inc.</p>
                <p>Invited two members to the billing group.</p>
                <p>Rotated the deploy key for production.</p>
                <p>Enabled two-factor enforcement.</p>
                <p>Archived the legacy import project.</p>
                <p>Updated the default branch protection rules.</p>
                <p>Exported the June audit log.</p>
                <p>Changed the plan from Team to Business.</p>
              </div>
              <SheetFooter>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginInlineEnd: "auto" }}>
                  <Switch id="sheet-live-updates" defaultChecked />
                  <Label htmlFor="sheet-live-updates">Live updates</Label>
                </div>
                <SheetClose as={Button} variant="outline">Dismiss</SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </ComponentPreview>
      </section>

      <ApiReference title="Sheet" props={[
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state (uncontrolled)" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
      ]} />
      <ApiReference title="SheetContent" props={[
        { name: "side", type: '"right" | "left" | "top" | "bottom"', default: '"right"', description: "Edge the sheet slides in from" },
        { name: "dismissible", type: "boolean", default: "true", description: "Allow backdrop click to close" },
        { name: "showCloseButton", type: "boolean", default: "true", description: "Render the X close button" },
      ]} />
    </>
  )
}
