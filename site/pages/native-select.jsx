import { NativeSelect, NativeSelectOption, NativeSelectOptGroup } from "../../ui/native-select/native-select.jsx"
import "../../ui/native-select/native-select.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function NativeSelectPage() {
  return (
    <>
      <h2>Native Select</h2>
      <p>A styled <code>&lt;select&gt;</code>. No JavaScript, no portal, and full browser and assistive-tech support out of the box.</p>

      <InstallSnippet slug="native-select" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<NativeSelect>
  <NativeSelectOption value="apple">Apple</NativeSelectOption>
  <NativeSelectOption value="banana">Banana</NativeSelectOption>
  <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
</NativeSelect>`}>
          <div className="pg-row">
            <NativeSelect defaultValue="" style={{ maxWidth: "16rem" }}>
              <NativeSelectOption value="" disabled>Select a fruit</NativeSelectOption>
              <NativeSelectOption value="apple">Apple</NativeSelectOption>
              <NativeSelectOption value="banana">Banana</NativeSelectOption>
              <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
            </NativeSelect>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { NativeSelect, NativeSelectOption } from "./ui/native-select/native-select"
import "./ui/native-select/native-select.css"

<NativeSelect>
  <NativeSelectOption value="apple">Apple</NativeSelectOption>
  <NativeSelectOption value="banana">Banana</NativeSelectOption>
  <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
</NativeSelect>`}>
          <div className="pg-row">
            <NativeSelect defaultValue="" style={{ maxWidth: "16rem" }}>
              <NativeSelectOption value="" disabled>Select a fruit</NativeSelectOption>
              <NativeSelectOption value="apple">Apple</NativeSelectOption>
              <NativeSelectOption value="banana">Banana</NativeSelectOption>
              <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
            </NativeSelect>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With Groups</h3>
        <ComponentPreview code={`<NativeSelect>
  <NativeSelectOptGroup label="Fruits">
    <NativeSelectOption value="apple">Apple</NativeSelectOption>
    <NativeSelectOption value="banana">Banana</NativeSelectOption>
  </NativeSelectOptGroup>
  <NativeSelectOptGroup label="Vegetables">
    <NativeSelectOption value="carrot">Carrot</NativeSelectOption>
    <NativeSelectOption value="lettuce">Lettuce</NativeSelectOption>
  </NativeSelectOptGroup>
</NativeSelect>`}>
          <div className="pg-row">
            <NativeSelect style={{ maxWidth: "16rem" }}>
              <NativeSelectOptGroup label="Fruits">
                <NativeSelectOption value="apple">Apple</NativeSelectOption>
                <NativeSelectOption value="banana">Banana</NativeSelectOption>
              </NativeSelectOptGroup>
              <NativeSelectOptGroup label="Vegetables">
                <NativeSelectOption value="carrot">Carrot</NativeSelectOption>
                <NativeSelectOption value="lettuce">Lettuce</NativeSelectOption>
              </NativeSelectOptGroup>
            </NativeSelect>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <ComponentPreview code={`<NativeSelect disabled>
  <NativeSelectOption>Disabled</NativeSelectOption>
</NativeSelect>

<NativeSelect aria-invalid="true">
  <NativeSelectOption>Invalid</NativeSelectOption>
</NativeSelect>`}>
          <div className="pg-row">
            <NativeSelect disabled style={{ maxWidth: "16rem" }}>
              <NativeSelectOption>Disabled</NativeSelectOption>
            </NativeSelect>
            <NativeSelect aria-invalid="true" style={{ maxWidth: "16rem" }}>
              <NativeSelectOption>Invalid</NativeSelectOption>
            </NativeSelect>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
