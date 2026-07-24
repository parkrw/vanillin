import { useState } from "react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "../../ui/select/select.jsx"
import "../../ui/select/select.css"

export default function SelectPage() {
  const [pet, setPet] = useState("")

  return (
    <>
      <h2>Select</h2>

      <section className="pg-section">
        <h3>Default</h3>
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
        <h3>Controlled + form</h3>
        <form data-pg="sel-form">
          <Select value={pet} onValueChange={setPet} name="pet">
            <SelectTrigger size="sm" style={{ width: "180px" }} data-pg="sel-ctrl-trigger">
              <SelectValue placeholder="Select a pet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cat" data-pg="sel-item-cat">Cat</SelectItem>
              <SelectItem value="dog" data-pg="sel-item-dog">Dog</SelectItem>
              <SelectItem value="hamster">Hamster</SelectItem>
            </SelectContent>
          </Select>
        </form>
        <p>
          Value: <span data-pg="sel-ctrl-state">{pet === "" ? "none" : pet}</span>
        </p>
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
