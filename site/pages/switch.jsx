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
        <h3>Default</h3>
        <ComponentPreview code={`<Switch id="airplane-mode" />
<Label htmlFor="airplane-mode">Airplane Mode</Label>`}>
          <div className="pg-row">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Airplane Mode</Label>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          A switch takes effect the moment it moves. If the change only lands on submit, use a checkbox instead: the reader should not have to guess which of the two they are looking at.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Switch } from "./ui/switch/switch"
import "./ui/switch/switch.css"

<Switch id="airplane-mode" />
<Label htmlFor="airplane-mode">Airplane Mode</Label>`}>
          <div className="pg-row">
            <Switch id="usage-dark-mode" />
            <Label htmlFor="usage-dark-mode">Dark mode</Label>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          The control renders a <code>button</code> with <code>role="switch"</code>, so it reports on and off through <code>aria-checked</code> and needs a <code>Label</code> tied to its id.
        </p>
      </section>

      <section className="pg-section">
        <h3>With a description</h3>
        <ComponentPreview code={`<div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
  <div>
    <Label htmlFor="two-factor">Two-factor authentication</Label>
    <p>Require a code from your authenticator app at every sign-in.</p>
  </div>
  <Switch id="two-factor" defaultChecked />
</div>`}>
          <div
            style={{
              maxWidth: "24rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "1rem",
            }}
          >
            <div style={{ display: "grid", gap: "0.25rem" }}>
              <Label htmlFor="two-factor">Two-factor authentication</Label>
              <p className="pg-desc" style={{ fontSize: "0.8125rem" }}>
                Require a code from your authenticator app at every sign-in.
              </p>
            </div>
            <Switch id="two-factor" defaultChecked />
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Put the explanation next to the label, not inside it. A long accessible name is read out in full every time the control gets focus.
        </p>
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
        <p className="pg-desc">
          A disabled switch keeps its on or off appearance so the reader can still read the setting, it just cannot be changed.
        </p>
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
        <p className="pg-desc">
          Controlled is the right mode when flipping the switch fires a request: hold the switch in its old position until the write comes back, and it never lies about server state.
        </p>
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
        <p className="pg-desc">
          The thumb travels toward the inline end, so under RTL "on" sits on the left. Nothing on the component changes; the track is written in logical properties.
        </p>
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
        <p className="pg-desc">
          Aligning the switches to the inline end gives the column a single edge to scan, which is what makes a settings list readable at a glance.
        </p>
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
