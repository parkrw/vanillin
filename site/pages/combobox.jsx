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
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

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
      <p>A filterable select — type to search, arrow keys highlight via <code>aria-activedescendant</code>, Enter selects, Escape reverts. Supports single, multiple, groups, controlled value, and native form validation.</p>

      <InstallSnippet slug="combobox" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from "./ui/combobox/combobox"
import "./ui/combobox/combobox.css"

<Combobox>
  <ComboboxInput placeholder="Select a framework" />
  <ComboboxContent>
    <ComboboxEmpty>No framework found.</ComboboxEmpty>
    <ComboboxList>
      <ComboboxItem value="next">Next.js</ComboboxItem>
      <ComboboxItem value="svelte">SvelteKit</ComboboxItem>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}>
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
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Multiple selection</h3>
        <ComponentPreview code={`<Combobox multiple value={values} onValueChange={setValues} showClear>
  <ComboboxInput placeholder="Pick languages" />
  <ComboboxContent>
    <ComboboxEmpty>No match.</ComboboxEmpty>
    <ComboboxList>
      <ComboboxItem value="js">JavaScript</ComboboxItem>
      <ComboboxItem value="ts">TypeScript</ComboboxItem>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}>
          <div>
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
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Groups + autoHighlight</h3>
        <ComponentPreview code={`<Combobox autoHighlight>
  <ComboboxInput placeholder="Pick a fruit or vegetable" />
  <ComboboxContent>
    <ComboboxEmpty>Nothing matches.</ComboboxEmpty>
    <ComboboxList>
      <ComboboxGroup>
        <ComboboxLabel>Fruits</ComboboxLabel>
        <ComboboxItem value="apple">Apple</ComboboxItem>
        <ComboboxItem value="banana">Banana</ComboboxItem>
      </ComboboxGroup>
      <ComboboxGroup>
        <ComboboxLabel>Vegetables</ComboboxLabel>
        <ComboboxItem value="carrot">Carrot</ComboboxItem>
      </ComboboxGroup>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}>
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
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>showClear (single)</h3>
        <ComponentPreview code={`{/* showClear renders a clear button when the control holds a value */}
<Combobox showClear>
  <ComboboxInput placeholder="Framework" />
  <ComboboxContent>
    <ComboboxEmpty>No match.</ComboboxEmpty>
    <ComboboxList>
      <ComboboxItem value="next">Next.js</ComboboxItem>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}>
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
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Controlled + form (items prop, function list)</h3>
        <ComponentPreview code={`<Combobox value={tz} onValueChange={setTz} name="timezone"
  items={[
    { value: "utc", label: "UTC" },
    { value: "est", label: "Eastern (EST)" },
  ]}>
  <ComboboxInput placeholder="Time zone" />
  <ComboboxContent>
    <ComboboxEmpty>No match.</ComboboxEmpty>
    <ComboboxList>
      {(item) => <ComboboxItem value={item.value}>{item.label}</ComboboxItem>}
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}>
          <div>
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
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Required + validation</h3>
        <ComponentPreview code={`<Combobox multiple name="langs" required ref={comboRef}>
  <ComboboxInput placeholder="Pick at least one" />
  <ComboboxContent>
    <ComboboxList>
      <ComboboxItem value="js">JavaScript</ComboboxItem>
    </ComboboxList>
  </ComboboxContent>
</Combobox>
<button onClick={() => comboRef.current?.setCustomValidity("Custom error")}>
  Set custom error
</button>`}>
          <div>
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
              <div style={{ display: "flex", gap: "0.5rem", marginBlockStart: "0.5rem" }}>
                <Button type="submit" data-pg="cbx-req-submit">
                  Submit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  data-pg="cbx-req-custom"
                  onClick={() => comboRef.current?.setCustomValidity("Custom error")}
                >
                  Set custom error
                </Button>
              </div>
            </form>
            {submitted && (
              <p data-pg="cbx-req-result">
                Submitted: {submitted.join(", ")}
              </p>
            )}
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <ComponentPreview code={`<Combobox disabled defaultValue="utc" items={[{ value: "utc", label: "UTC" }]}>
  <ComboboxInput placeholder="Time zone" />
  <ComboboxContent>
    <ComboboxList>
      <ComboboxItem value="utc">UTC</ComboboxItem>
    </ComboboxList>
  </ComboboxContent>
</Combobox>`}>
          <Combobox disabled defaultValue="utc" items={[{ value: "utc", label: "UTC" }]}>
            <ComboboxInput placeholder="Time zone" data-pg="cbx-disabled-input" />
            <ComboboxContent>
              <ComboboxList>
                <ComboboxItem value="utc">UTC</ComboboxItem>
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </ComponentPreview>
      </section>

      <ApiReference title="Combobox" props={[
        { name: "value", type: "string | string[]", description: "Controlled selected value" },
        { name: "defaultValue", type: "string | string[]", description: "Initial value (uncontrolled)" },
        { name: "onValueChange", type: "(value) => void", description: "Called when the selection changes" },
        { name: "items", type: "Array<{ value, label }>", description: "Data source — enables function-as-child in ComboboxList" },
        { name: "multiple", type: "boolean", default: "false", description: "Allow multiple selections (chips + aria-multiselectable)" },
        { name: "autoHighlight", type: "boolean", default: "false", description: "Highlight the first match as the user types" },
        { name: "showClear", type: "boolean", default: "false", description: "Show a clear button when a value is selected" },
        { name: "name", type: "string", description: "Form field name — renders a hidden native <select> for validation" },
        { name: "required", type: "boolean", description: "Marks the hidden select as required" },
        { name: "disabled", type: "boolean", default: "false", description: "Disables the combobox" },
      ]} />
    </>
  )
}
