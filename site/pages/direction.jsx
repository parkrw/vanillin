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
import { CodeBlock } from "../code-example.jsx"
import "../code-example.css"

export default function DirectionPage() {
  return (
    <>
      <h2>Direction</h2>
      <p>
        <code>DirectionProvider</code> sets <code>dir="rtl"</code> on a subtree so every component inside it mirrors its layout, keyboard navigation, and pointer mapping. No per-component prop — wrap once, everything responds.
      </p>

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

      <section className="pg-section">
        <h3>How it works</h3>
        <p>
          Import <code>DirectionProvider</code> from <code>lib/direction.jsx</code> and wrap the subtree that needs mirroring. Components that read direction (slider, tabs, dropdown-menu, combobox, sidebar) pick it up from context.
        </p>
        <CodeBlock code={`import { DirectionProvider } from "./lib/direction"

<DirectionProvider dir="rtl">
  <Slider defaultValue={30} aria-label="Volume" />
</DirectionProvider>`} />
      </section>

      <section className="pg-section">
        <h3>What mirrors</h3>
        <ul>
          <li><strong>Arrow keys</strong> — Left increments and Right decrements in RTL.</li>
          <li><strong>Pointer mapping</strong> — clicking near the left edge of an RTL slider produces a high value.</li>
          <li><strong>CSS logical properties</strong> — components use <code>inset-inline-start</code>, <code>padding-inline</code>, etc., so layout flips automatically when the wrapper sets <code>dir</code>.</li>
          <li><strong>Field layout</strong> — labels and controls swap sides.</li>
        </ul>
      </section>
    </>
  )
}
