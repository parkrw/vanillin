import { useState } from "react"
import { DirectionProvider } from "../../lib/direction.jsx"
import { Switch } from "../../ui/switch/switch.jsx"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/switch/switch.css"
import "../../ui/label/label.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function SwitchPage() {
  const [checked, setChecked] = useState(true)
  return (
    <>
      <h2>Switch</h2>
      <p>A toggle between on and off states, like a light switch.</p>

      <InstallSnippet slug="switch" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Switch } from "./ui/switch/switch"
import "./ui/switch/switch.css"

<Switch id="airplane-mode" />
<Label htmlFor="airplane-mode">Airplane Mode</Label>`}>
          <div className="pg-row">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Airplane Mode</Label>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <ComponentPreview code={`<Switch defaultChecked aria-label="Checked" />
<Switch disabled aria-label="Disabled" />
<Switch disabled defaultChecked aria-label="Disabled checked" />`}>
          <div className="pg-row">
            <Switch data-pg="sw-ltr" defaultChecked aria-label="Checked by default" />
            <Switch disabled aria-label="Disabled" />
            <Switch disabled defaultChecked aria-label="Disabled checked" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [checked, setChecked] = useState(true)

<Switch id="notifications" checked={checked} onCheckedChange={setChecked} />
<Label htmlFor="notifications">
  Notifications: {checked ? "on" : "off"}
</Label>`}>
          <div className="pg-row">
            <Switch id="notifications" checked={checked} onCheckedChange={setChecked} />
            <Label htmlFor="notifications">Notifications: {checked ? "on" : "off"}</Label>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>RTL</h3>
        <ComponentPreview code={`<DirectionProvider dir="rtl">
  <Switch defaultChecked aria-label="الإشعارات" />
  <Switch aria-label="الطيران" />
</DirectionProvider>`}>
          <DirectionProvider dir="rtl">
            <div className="pg-row">
              <Switch data-pg="sw-rtl" defaultChecked aria-label="الإشعارات" />
              <Switch data-pg="sw-rtl-off" aria-label="الطيران" />
            </div>
          </DirectionProvider>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Settings List</h3>
        <ComponentPreview code={`{settings.map(({ id, label, defaultChecked }) => (
  <div key={id} style={{ display: "flex", justifyContent: "space-between" }}>
    <Label htmlFor={id}>{label}</Label>
    <Switch id={id} defaultChecked={defaultChecked} />
  </div>
))}`}>
          <div style={{ maxWidth: "22rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            {[
              { id: "sw-wifi", label: "Wi-Fi", on: true },
              { id: "sw-bluetooth", label: "Bluetooth", on: false },
              { id: "sw-location", label: "Location services", on: true },
            ].map(({ id, label, on }) => (
              <div key={id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Label htmlFor={id}>{label}</Label>
                <Switch id={id} defaultChecked={on} />
              </div>
            ))}
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "checked", type: "boolean", description: "Controlled checked state" },
        { name: "defaultChecked", type: "boolean", default: "false", description: "Initial checked state (uncontrolled)" },
        { name: "onCheckedChange", type: "(checked: boolean) => void", description: "Called when the checked state changes" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
