import { DirectionProvider } from "../../lib/direction.jsx"
import { Slider } from "../../ui/slider/slider.jsx"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldTitle,
} from "../../ui/field/field.jsx"
import { Switch } from "../../ui/switch/switch.jsx"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu/dropdown-menu.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/slider/slider.css"
import "../../ui/field/field.css"
import "../../ui/label/label.css"
import "../../ui/switch/switch.css"
import "../../ui/dropdown-menu/dropdown-menu.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import "../code-example.css"

export default function DirectionPage() {
  return (
    <>
      <h2>Direction</h2>
      <p>
        <code>DirectionProvider</code> sets <code>dir="rtl"</code> on a subtree so every component inside it mirrors its layout, keyboard navigation, and pointer mapping. There is no per-component prop: wrap once, and everything inside responds.
      </p>

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<DirectionProvider dir="rtl">
  <Slider defaultValue={30} aria-label="Volume" />
</DirectionProvider>`}>
          <div style={{ maxWidth: "24rem", width: "100%" }}>
            <DirectionProvider dir="rtl">
              <Slider defaultValue={30} aria-label="Volume" />
            </DirectionProvider>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <p>
          Import <code>DirectionProvider</code> from <code>lib/direction.jsx</code> and wrap the subtree that needs mirroring. Components that read direction (slider, tabs, dropdown-menu, combobox, sidebar) pick it up from context.
        </p>
        <ComponentPreview defaultTab="code" code={`import { DirectionProvider } from "./lib/direction"

<DirectionProvider dir="rtl">
  <Slider defaultValue={30} aria-label="Volume" />
</DirectionProvider>`}>
          <div style={{ maxWidth: "24rem", width: "100%" }}>
            <DirectionProvider dir="rtl">
              <Slider defaultValue={30} aria-label="Volume" />
            </DirectionProvider>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>RTL slider (arrows and pointer invert)</h3>
        <ComponentPreview code={`<DirectionProvider dir="rtl">
  <Slider defaultValue={30} aria-label="RTL" />
</DirectionProvider>`}>
          <div style={{ maxWidth: "24rem", width: "100%" }}>
            <DirectionProvider dir="rtl">
              <Slider defaultValue={30} aria-label="RTL" />
            </DirectionProvider>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Focus the thumb and press Left: the value goes up. The track fills from the inline start, which is the right edge.
        </p>
      </section>

      <section className="pg-section">
        <h3>LTR comparison</h3>
        <ComponentPreview code={`<Slider defaultValue={30} aria-label="LTR" />`}>
          <div style={{ maxWidth: "24rem", width: "100%" }}>
            <Slider defaultValue={30} aria-label="LTR" />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Same value, same component, no provider. The two demos differ only in which edge the fill grows from.
        </p>
      </section>

      <section className="pg-section">
        <h3>RTL horizontal field</h3>
        <ComponentPreview code={`<DirectionProvider dir="rtl">
  <Field orientation="horizontal">
    <FieldContent>
      <FieldTitle>الإشعارات</FieldTitle>
      <FieldDescription>أرسل لي بريدًا عن نشاط الحساب.</FieldDescription>
    </FieldContent>
    <Switch aria-label="الإشعارات" defaultChecked />
  </Field>
</DirectionProvider>`}>
          <div style={{ maxWidth: "24rem", width: "100%" }}>
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
        </ComponentPreview>
        <p className="pg-desc">
          The label block and the control swap sides. Nothing on <code>Field</code> changed: the layout is written in logical properties, so the flip is free.
        </p>
      </section>

      <section className="pg-section">
        <h3>RTL menu alignment</h3>
        <ComponentPreview code={`<DirectionProvider dir="rtl">
  <DropdownMenu>
    <DropdownMenuTrigger as={Button} variant="outline">
      خيارات
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
      <DropdownMenuItem>الإعدادات</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem>تسجيل الخروج</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</DirectionProvider>`}>
          <DirectionProvider dir="rtl">
            <DropdownMenu>
              <DropdownMenuTrigger as={Button} variant="outline">
                خيارات
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>الملف الشخصي</DropdownMenuItem>
                <DropdownMenuItem>الإعدادات</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>تسجيل الخروج</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </DirectionProvider>
        </ComponentPreview>
        <p className="pg-desc">
          Menus anchor to the trigger's inline start, so an RTL menu grows leftward from the right edge. Submenus open toward the inline start for the same reason.
        </p>
      </section>

      <section className="pg-section">
        <h3>Nested override</h3>
        <ComponentPreview code={`{/* A provider inside a provider wins for its own subtree. */}
<DirectionProvider dir="rtl">
  <Slider defaultValue={30} aria-label="Outer RTL panel" />
  <DirectionProvider dir="ltr">
    <Slider defaultValue={30} aria-label="Inner LTR panel" />
  </DirectionProvider>
</DirectionProvider>`}>
          <div style={{ maxWidth: "24rem", width: "100%", display: "grid", gap: "1.25rem" }}>
            <DirectionProvider dir="rtl">
              <Slider defaultValue={30} aria-label="Outer RTL panel" />
              <DirectionProvider dir="ltr">
                <Slider defaultValue={30} aria-label="Inner LTR panel" />
              </DirectionProvider>
            </DirectionProvider>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Direction is plain React context, so the nearest provider wins. An LTR code sample embedded in an RTL page reads correctly without any escape hatch.
        </p>
      </section>

      <section className="pg-section">
        <h3>What mirrors</h3>
        <ul>
          <li><strong>Arrow keys.</strong> Left increments and Right decrements in RTL.</li>
          <li><strong>Pointer mapping.</strong> Clicking near the left edge of an RTL slider produces a high value.</li>
          <li><strong>CSS logical properties.</strong> Components use <code>inset-inline-start</code>, <code>padding-inline</code>, and friends, so layout flips automatically when the wrapper sets <code>dir</code>.</li>
          <li><strong>Field layout.</strong> Labels and controls swap sides.</li>
          <li><strong>Anchored surfaces.</strong> Menus, submenus, and popovers align and grow from the inline start.</li>
        </ul>
      </section>
    </>
  )
}
