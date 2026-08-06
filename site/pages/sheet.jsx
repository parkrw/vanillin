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
import "../../ui/sheet/sheet.css"
import "../../ui/button/button.css"
import "../../ui/field/field.css"
import "../../ui/input/input.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function SheetPage() {
  return (
    <>
      <h2>Sheet</h2>
      <p>A modal panel that slides in from an edge — use it for forms, detail views, or settings that overlay the page.</p>

      <InstallSnippet slug="sheet" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription } from "./ui/sheet/sheet"
import "./ui/sheet/sheet.css"

<Sheet>
  <SheetTrigger as={Button} variant="outline">
    Open sheet
  </SheetTrigger>
  <SheetContent>
    <SheetHeader>
      <SheetTitle>Edit profile</SheetTitle>
      <SheetDescription>Make changes to your profile here.</SheetDescription>
    </SheetHeader>
    <SheetFooter>
      <SheetClose as={Button} variant="outline">Close</SheetClose>
      <Button>Save changes</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>`}>
          <Sheet>
            <SheetTrigger as={Button} variant="outline">
              Open right
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>Make changes to your profile here.</SheetDescription>
              </SheetHeader>
              <Field>
                <FieldLabel htmlFor="sheet-name-right">Name</FieldLabel>
                <Input id="sheet-name-right" defaultValue="Pedro Duarte" />
              </Field>
              <SheetFooter>
                <SheetClose as={Button} variant="outline">
                  Close
                </SheetClose>
                <Button>Save changes</Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Sides</h3>
        <ComponentPreview code={`<Sheet>
  <SheetTrigger as={Button} variant="outline">Open left</SheetTrigger>
  <SheetContent side="left">…</SheetContent>
</Sheet>
<Sheet>
  <SheetTrigger as={Button} variant="outline">Open top</SheetTrigger>
  <SheetContent side="top">…</SheetContent>
</Sheet>
<Sheet>
  <SheetTrigger as={Button} variant="outline">Open bottom</SheetTrigger>
  <SheetContent side="bottom">…</SheetContent>
</Sheet>`}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["left", "top", "bottom"].map((side) => (
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

      <ApiReference props={[
        { name: "side", type: '"right" | "left" | "top" | "bottom"', default: '"right"', description: "Edge the sheet slides in from" },
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "defaultOpen", type: "boolean", default: "false", description: "Uncontrolled initial open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
      ]} />
    </>
  )
}
