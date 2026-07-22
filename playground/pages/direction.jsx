import { DirectionProvider } from "../../lib/direction.jsx"
import { Slider } from "../../ui/slider/slider.jsx"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "../../ui/field/field.jsx"
import { Switch } from "../../ui/switch/switch.jsx"
import "../../ui/slider/slider.css"
import "../../ui/field/field.css"
import "../../ui/label/label.css"
import "../../ui/switch/switch.css"

export default function DirectionPage() {
  return (
    <>
      <h2>Direction</h2>

      <section className="pg-section">
        <h3>RTL slider (arrows and pointer invert)</h3>
        <div style={{ maxWidth: "24rem" }}>
          <DirectionProvider dir="rtl">
            <Slider defaultValue={30} aria-label="RTL" />
          </DirectionProvider>
        </div>
      </section>

      <section className="pg-section">
        <h3>LTR comparison</h3>
        <div style={{ maxWidth: "24rem" }}>
          <Slider defaultValue={30} aria-label="LTR" />
        </div>
      </section>

      <section className="pg-section">
        <h3>RTL horizontal field</h3>
        <div style={{ maxWidth: "24rem" }}>
          <DirectionProvider dir="rtl">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>الإشعارات</FieldTitle>
                <FieldDescription>أرسل لي بريدًا عن نشاط الحساب.</FieldDescription>
              </FieldContent>
              <Switch aria-label="الإشعارات" defaultChecked />
            </Field>
          </DirectionProvider>
        </div>
      </section>
    </>
  )
}
