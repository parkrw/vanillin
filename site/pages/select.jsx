import { useRef, useState } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../ui/select/select.jsx"
import "../../ui/select/select.css"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/label/label.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function SelectPage() {
  const [pet, setPet] = useState("")

  return (
    <>
      <h2>Select</h2>
      <p>A dropdown menu for picking a value, built on popover and roving focus.</p>

      <InstallSnippet slug="select" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Select, SelectTrigger, SelectValue,
  SelectContent, SelectItem } from "./ui/select/select"
import "./ui/select/select.css"

<Select>
  <SelectTrigger style={{ width: "180px" }}>
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
    <SelectItem value="banana">Banana</SelectItem>
  </SelectContent>
</Select>`}>
          <Select>
            <SelectTrigger style={{ width: "180px" }} data-pg="sel-trigger">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent data-pg="sel-content">
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple" data-pg="sel-item-apple">Apple</SelectItem>
                <SelectItem value="banana" data-pg="sel-item-banana">Banana</SelectItem>
                <SelectItem value="blueberry" disabled data-pg="sel-item-blueberry">
                  Blueberry (out of season)
                </SelectItem>
                <SelectItem value="cherry" data-pg="sel-item-cherry">Cherry</SelectItem>
              </SelectGroup>
              <SelectSeparator />
              <SelectGroup>
                <SelectLabel>Vegetables</SelectLabel>
                <SelectItem value="carrot" data-pg="sel-item-carrot">Carrot</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Item-Aligned Positioning</h3>
        <p>
          Pass <code>alignItemWithTrigger</code> to position the popup so
          the selected item sits directly over the trigger, like a native{" "}
          <code>&lt;select&gt;</code>. Scroll buttons appear at overflow boundaries.
        </p>
        <ComponentPreview code={`<Select defaultValue="n-15">
  <SelectTrigger style={{ width: "220px" }}>
    <SelectValue placeholder="Pick a number" />
  </SelectTrigger>
  <SelectContent alignItemWithTrigger>
    <SelectScrollUpButton />
    {items.map(item => (
      <SelectItem key={item} value={item}>{item}</SelectItem>
    ))}
    <SelectScrollDownButton />
  </SelectContent>
</Select>`}>
          <Select defaultValue="n-15">
            <SelectTrigger style={{ width: "220px" }} data-pg="sel-aligned-trigger">
              <SelectValue placeholder="Pick a number" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger data-pg="sel-aligned-content">
              <SelectScrollUpButton data-pg="sel-scroll-up" />
              {Array.from({ length: 40 }, (_, i) => (
                <SelectItem
                  key={i}
                  value={`n-${i + 1}`}
                  data-pg={`sel-aligned-item-${i + 1}`}
                >
                  Number {i + 1}
                </SelectItem>
              ))}
              <SelectScrollDownButton data-pg="sel-scroll-down" />
            </SelectContent>
          </Select>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Long List</h3>
        <ComponentPreview code={`<Select>
  <SelectTrigger style={{ width: "220px" }}>
    <SelectValue placeholder="Pick a number" />
  </SelectTrigger>
  <SelectContent style={{ maxBlockSize: "12rem" }}>
    {numbers.map(n => (
      <SelectItem key={n} value={n}>{n}</SelectItem>
    ))}
  </SelectContent>
</Select>`}>
          <Select>
            <SelectTrigger style={{ width: "220px" }} data-pg="sel-long-trigger">
              <SelectValue placeholder="Pick a number" />
            </SelectTrigger>
            <SelectContent style={{ maxBlockSize: "12rem" }} data-pg="sel-long-content">
              {Array.from({ length: 40 }, (_, i) => (
                <SelectItem key={i} value={`n-${i + 1}`}>
                  Number {i + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Scroll Buttons</h3>
        <p>
          <code>SelectScrollUpButton</code> and <code>SelectScrollDownButton</code>{" "}
          are decorative affordances for mouse users. They are{" "}
          <code>aria-hidden</code> — keyboard users scroll via arrow keys.
        </p>
        <ComponentPreview code={`<SelectContent style={{ maxBlockSize: "12rem" }}>
  <SelectScrollUpButton />
  {items.map(item => (
    <SelectItem key={item} value={item}>{item}</SelectItem>
  ))}
  <SelectScrollDownButton />
</SelectContent>`}>
          <Select>
            <SelectTrigger style={{ width: "220px" }} data-pg="sel-scroll-trigger">
              <SelectValue placeholder="Pick a number" />
            </SelectTrigger>
            <SelectContent style={{ maxBlockSize: "12rem" }} data-pg="sel-scroll-content">
              <SelectScrollUpButton data-pg="sel-scroll-up-popper" />
              {Array.from({ length: 30 }, (_, i) => (
                <SelectItem key={i} value={`s-${i + 1}`}>
                  Item {i + 1}
                </SelectItem>
              ))}
              <SelectScrollDownButton data-pg="sel-scroll-down-popper" />
            </SelectContent>
          </Select>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Controlled + Form Validation</h3>
        <p>
          A mirrored visually-hidden native <code>&lt;select&gt;</code> makes{" "}
          <code>required</code>, <code>:invalid</code>, and form submission work.
          The value posts under <code>name</code> like any form control.
        </p>
        <ComponentPreview code={`const [pet, setPet] = useState("")

<form onSubmit={handleSubmit}>
  <Select
    ref={selectRef}
    value={pet}
    onValueChange={setPet}
    name="pet"
    required
  >
    <SelectTrigger style={{ width: "180px" }}>
      <SelectValue placeholder="Select a pet" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="cat">Cat</SelectItem>
      <SelectItem value="dog">Dog</SelectItem>
    </SelectContent>
  </Select>
  <Button type="submit">Submit</Button>
</form>`}>
          <FormDemo pet={pet} setPet={setPet} />
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <ComponentPreview code={`<Select disabled defaultValue="apple" items={[{ value: "apple", label: "Apple" }]}>
  <SelectTrigger style={{ width: "180px" }}>
    <SelectValue placeholder="Select a fruit" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="apple">Apple</SelectItem>
  </SelectContent>
</Select>`}>
          <Select disabled defaultValue="apple" items={[{ value: "apple", label: "Apple" }]}>
            <SelectTrigger style={{ width: "180px" }} data-pg="sel-disabled-trigger">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="apple">Apple</SelectItem>
            </SelectContent>
          </Select>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Select in Form Field</h3>
        <ComponentPreview code={`<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
  <Label htmlFor="role">Role</Label>
  <Select name="role">
    <SelectTrigger id="role" style={{ width: "220px" }}>
      <SelectValue placeholder="Choose a role" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="admin">Admin</SelectItem>
      <SelectItem value="editor">Editor</SelectItem>
      <SelectItem value="viewer">Viewer</SelectItem>
    </SelectContent>
  </Select>
</div>`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Label htmlFor="sel-role">Role</Label>
            <Select name="role">
              <SelectTrigger id="sel-role" style={{ width: "220px" }}>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="editor">Editor</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference title="Select" props={[
        { name: "value", type: "string", description: "Controlled value" },
        { name: "defaultValue", type: "string", default: '""', description: "Initial value (uncontrolled)" },
        { name: "onValueChange", type: "(value: string) => void", description: "Called when the value changes" },
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
        { name: "name", type: "string", description: "Form field name for the hidden native select" },
        { name: "required", type: "boolean", description: "Marks the hidden native select as required" },
        { name: "disabled", type: "boolean", default: "false", description: "Disable the select" },
        { name: "ref", type: "Ref", description: "Ref to the hidden native select (for setCustomValidity)" },
      ]} />

      <ApiReference title="SelectContent" props={[
        { name: "alignItemWithTrigger", type: "boolean", description: "Position so selected item overlays the trigger" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}

function FormDemo({ pet, setPet }) {
  const selectRef = useRef(null)
  const [formResult, setFormResult] = useState(null)

  const handleSubmit = (event) => {
    event.preventDefault()
    const data = new FormData(event.target)
    setFormResult(Object.fromEntries(data))
  }

  const handleCustomError = () => {
    selectRef.current?.setCustomValidity("Server says: invalid pet")
    const form = document.querySelector('[data-pg="sel-form"]')
    form?.reportValidity()
  }

  const clearCustomError = () => {
    selectRef.current?.setCustomValidity("")
  }

  return (
    <>
      <form data-pg="sel-form" onSubmit={handleSubmit}>
        <Select
          ref={selectRef}
          value={pet}
          onValueChange={(v) => {
            setPet(v)
            clearCustomError()
          }}
          name="pet"
          required
        >
          <SelectTrigger size="sm" style={{ width: "180px" }} data-pg="sel-ctrl-trigger">
            <SelectValue placeholder="Select a pet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cat" data-pg="sel-item-cat">Cat</SelectItem>
            <SelectItem value="dog" data-pg="sel-item-dog">Dog</SelectItem>
            <SelectItem value="hamster">Hamster</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" data-pg="sel-submit" style={{ marginInlineStart: "0.5rem" }}>
          Submit
        </Button>
        <Button
          type="button"
          variant="outline"
          data-pg="sel-custom-error"
          onClick={handleCustomError}
          style={{ marginInlineStart: "0.5rem" }}
        >
          Set custom error
        </Button>
      </form>
      <p>
        Value: <span data-pg="sel-ctrl-state">{pet === "" ? "none" : pet}</span>
      </p>
      {formResult && (
        <p data-pg="sel-form-result">
          Submitted: {JSON.stringify(formResult)}
        </p>
      )}
    </>
  )
}
