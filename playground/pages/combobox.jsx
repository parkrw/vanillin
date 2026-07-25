import { useState } from "react"
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
} from "../../ui/combobox/combobox.jsx"
import "../../ui/combobox/combobox.css"

const frameworks = [
  { value: "next", label: "Next.js" },
  { value: "svelte", label: "SvelteKit" },
  { value: "nuxt", label: "Nuxt" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
]

export default function ComboboxPage() {
  const [tz, setTz] = useState("")

  return (
    <>
      <h2>Combobox</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <Combobox>
          <ComboboxInput placeholder="Select a framework" data-pg="cbx-input" />
          <ComboboxContent data-pg="cbx-content">
            <ComboboxEmpty data-pg="cbx-empty">No framework found.</ComboboxEmpty>
            <ComboboxList>
              {frameworks.map((fw) => (
                <ComboboxItem key={fw.value} value={fw.value} data-pg={`cbx-item-${fw.value}`}>
                  {fw.label}
                </ComboboxItem>
              ))}
              <ComboboxItem value="ember" disabled data-pg="cbx-item-ember">
                Ember (legacy)
              </ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </section>

      <section className="pg-section">
        <h3>Groups + autoHighlight</h3>
        <Combobox autoHighlight>
          <ComboboxInput placeholder="Pick a fruit or vegetable" data-pg="cbx-ah-input" />
          <ComboboxContent data-pg="cbx-ah-content">
            <ComboboxEmpty>Nothing matches.</ComboboxEmpty>
            <ComboboxList>
              <ComboboxGroup data-pg="cbx-group-fruits">
                <ComboboxLabel>Fruits</ComboboxLabel>
                <ComboboxItem value="apple" data-pg="cbx-item-apple">Apple</ComboboxItem>
                <ComboboxItem value="banana" data-pg="cbx-item-banana">Banana</ComboboxItem>
              </ComboboxGroup>
              <ComboboxGroup data-pg="cbx-group-vegetables">
                <ComboboxLabel>Vegetables</ComboboxLabel>
                <ComboboxItem value="carrot" data-pg="cbx-item-carrot">Carrot</ComboboxItem>
                <ComboboxItem value="leek">Leek</ComboboxItem>
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </section>

      <section className="pg-section">
        <h3>Controlled + form (items prop, function list)</h3>
        <form data-pg="cbx-form">
          <Combobox
            value={tz}
            onValueChange={setTz}
            name="timezone"
            items={[
              { value: "utc", label: "UTC" },
              { value: "est", label: "Eastern (EST)" },
              { value: "cst", label: "Central (CST)" },
              { value: "pst", label: "Pacific (PST)" },
            ]}
          >
            <ComboboxInput placeholder="Time zone" data-pg="cbx-ctrl-input" />
            <ComboboxContent data-pg="cbx-ctrl-content">
              <ComboboxEmpty>No match.</ComboboxEmpty>
              <ComboboxList data-pg="cbx-ctrl-list">
                {(item) => (
                  <ComboboxItem key={item.value} value={item.value} data-pg={`cbx-item-${item.value}`}>
                    {item.label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </form>
        <p>
          Value: <span data-pg="cbx-ctrl-state">{tz === "" ? "none" : tz}</span>
        </p>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <Combobox disabled defaultValue="utc" items={[{ value: "utc", label: "UTC" }]}>
          <ComboboxInput placeholder="Time zone" data-pg="cbx-disabled-input" />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxItem value="utc">UTC</ComboboxItem>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </section>
    </>
  )
}
