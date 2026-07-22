import { NativeSelect, NativeSelectOption, NativeSelectOptGroup } from "../../ui/native-select/native-select.jsx"
import "../../ui/native-select/native-select.css"

export default function NativeSelectPage() {
  return (
    <>
      <h2>Native Select</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-row">
          <NativeSelect defaultValue="" style={{ maxWidth: "16rem" }}>
            <NativeSelectOption value="" disabled>Select a fruit</NativeSelectOption>
            <NativeSelectOption value="apple">Apple</NativeSelectOption>
            <NativeSelectOption value="banana">Banana</NativeSelectOption>
            <NativeSelectOption value="cherry">Cherry</NativeSelectOption>
          </NativeSelect>
        </div>
      </section>

      <section className="pg-section">
        <h3>With Groups</h3>
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
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <div className="pg-row">
          <NativeSelect disabled style={{ maxWidth: "16rem" }}>
            <NativeSelectOption>Disabled</NativeSelectOption>
          </NativeSelect>
          <NativeSelect aria-invalid="true" style={{ maxWidth: "16rem" }}>
            <NativeSelectOption>Invalid</NativeSelectOption>
          </NativeSelect>
        </div>
      </section>
    </>
  )
}
