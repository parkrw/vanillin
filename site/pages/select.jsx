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

export default function SelectPage() {
  const [pet, setPet] = useState("")

  return (
    <>
      <h2>Select</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          The default positioning mode is popper: the listbox opens below (or
          above if there is not enough room) the trigger, like a tooltip or
          popover.  This is the right choice when the select sits inside a
          form alongside other controls and the spatial relationship between
          trigger and list matters.
        </p>
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
      </section>

      <section className="pg-section">
        <h3>Item-aligned positioning</h3>
        <p>
          Pass <code>alignItemWithTrigger</code> to position the popup so
          that the currently selected item sits directly over the trigger,
          mimicking a native <code>&lt;select&gt;</code>.  When the list
          cannot fit in the viewport it clamps to the edges and enables
          scroll buttons at the overflow boundaries.  Use this mode when the
          select replaces a native <code>&lt;select&gt;</code> and you want
          the same spatial feedback; prefer the default popper mode in
          toolbars, settings panels, and anywhere the list should float
          below the trigger.
        </p>
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
      </section>

      <section className="pg-section">
        <h3>Long list (scrolls)</h3>
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
      </section>

      <section className="pg-section">
        <h3>Scroll buttons</h3>
        <p>
          <code>SelectScrollUpButton</code> and{" "}
          <code>SelectScrollDownButton</code> are decorative scroll
          affordances for mouse users.  They are <code>aria-hidden</code>
          and not focusable; keyboard users never need them because arrow
          keys already scroll the active option into view.  Visibility is
          driven by scroll position: the up button hides at the top, the
          down button hides at the bottom.
        </p>
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
      </section>

      <section className="pg-section">
        <h3>Controlled + form validation</h3>
        <p>
          A mirrored visually-hidden native <code>&lt;select&gt;</code> makes{" "}
          <code>required</code>, <code>:invalid</code>,{" "}
          <code>form.checkValidity()</code>, and form submission work for
          free.  The value posts under <code>name</code> like any form
          control.  Use <code>ref</code> to call{" "}
          <code>setCustomValidity</code> for server-side validation errors.
        </p>
        <FormDemo pet={pet} setPet={setPet} />
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <Select disabled defaultValue="apple" items={[{ value: "apple", label: "Apple" }]}>
          <SelectTrigger style={{ width: "180px" }} data-pg="sel-disabled-trigger">
            <SelectValue placeholder="Select a fruit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
          </SelectContent>
        </Select>
      </section>
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
