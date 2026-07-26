import { useRef, useState } from "react"
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

const languages = [
  { value: "js", label: "JavaScript" },
  { value: "ts", label: "TypeScript" },
  { value: "py", label: "Python" },
  { value: "go", label: "Go" },
  { value: "rs", label: "Rust" },
  { value: "rb", label: "Ruby" },
]

export default function ComboboxPage() {
  const [tz, setTz] = useState("")
  const [multiVal, setMultiVal] = useState([])
  const [submitted, setSubmitted] = useState(null)
  const comboRef = useRef(null)

  return (
    <>
      <h2>Combobox</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <p className="pg-prose">
          Single-select combobox with type-to-filter. Arrow keys highlight
          options via <code>aria-activedescendant</code>; Enter selects and
          closes. Escape reverts typed text to the selected label.
        </p>
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
        <h3>Multiple selection</h3>
        <p className="pg-prose">
          Pass <code>multiple</code> to switch the value type
          to <code>string[]</code>. Selected items appear as chips inside
          the trigger. The popup stays open after each selection so you
          can pick several in a row. Backspace on an empty input removes
          the last chip. The listbox carries{" "}
          <code>aria-multiselectable</code>.
        </p>
        <Combobox multiple value={multiVal} onValueChange={setMultiVal} showClear>
          <ComboboxInput placeholder="Pick languages" data-pg="cbx-multi-input" />
          <ComboboxContent data-pg="cbx-multi-content">
            <ComboboxEmpty>No match.</ComboboxEmpty>
            <ComboboxList>
              {languages.map((l) => (
                <ComboboxItem key={l.value} value={l.value} data-pg={`cbx-item-${l.value}`}>
                  {l.label}
                </ComboboxItem>
              ))}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <p>
          Selected: <span data-pg="cbx-multi-state">{multiVal.length === 0 ? "none" : multiVal.join(", ")}</span>
        </p>
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
        <h3>showClear (single)</h3>
        <p className="pg-prose">
          <code>showClear</code> renders a clear button when the control
          holds a value. Works in both single and multiple modes.
        </p>
        <Combobox showClear>
          <ComboboxInput placeholder="Framework" data-pg="cbx-clear-input" />
          <ComboboxContent data-pg="cbx-clear-content">
            <ComboboxEmpty>No match.</ComboboxEmpty>
            <ComboboxList>
              {frameworks.map((fw) => (
                <ComboboxItem key={fw.value} value={fw.value} data-pg={`cbx-clear-item-${fw.value}`}>
                  {fw.label}
                </ComboboxItem>
              ))}
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
        <h3>Required + validation</h3>
        <p className="pg-prose">
          A hidden native <code>&lt;select&gt;</code> mirrors the value for
          constraint validation. <code>required</code> blocks submission
          when empty; <code>ref.setCustomValidity</code> surfaces custom
          messages.
        </p>
        <form
          data-pg="cbx-req-form"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.target)
            setSubmitted(fd.getAll("langs"))
          }}
        >
          <Combobox multiple name="langs" required ref={comboRef}>
            <ComboboxInput placeholder="Pick at least one" data-pg="cbx-req-input" />
            <ComboboxContent data-pg="cbx-req-content">
              <ComboboxEmpty>No match.</ComboboxEmpty>
              <ComboboxList>
                {languages.map((l) => (
                  <ComboboxItem key={l.value} value={l.value} data-pg={`cbx-req-item-${l.value}`}>
                    {l.label}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          <button type="submit" data-pg="cbx-req-submit" style={{ marginInlineStart: "0.5rem" }}>
            Submit
          </button>
          <button
            type="button"
            data-pg="cbx-req-custom"
            style={{ marginInlineStart: "0.5rem" }}
            onClick={() => comboRef.current?.setCustomValidity("Custom error")}
          >
            Set custom error
          </button>
        </form>
        {submitted && (
          <p data-pg="cbx-req-result">
            Submitted: {submitted.join(", ")}
          </p>
        )}
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
