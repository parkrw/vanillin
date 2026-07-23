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

export default function SheetPage() {
  return (
    <>
      <h2>Sheet</h2>

      <section className="pg-section">
        <h3>Sides</h3>
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
      </section>
    </>
  )
}
