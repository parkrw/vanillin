import { useState } from "react"
import { DirectionProvider } from "../../lib/direction.jsx"
import { Switch } from "../../ui/switch/switch.jsx"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/switch/switch.css"
import "../../ui/label/label.css"

export default function SwitchPage() {
  const [checked, setChecked] = useState(true)
  return (
    <>
      <h2>Switch</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-row">
          <Switch id="airplane-mode" />
          <Label htmlFor="airplane-mode">Airplane Mode</Label>
        </div>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <div className="pg-row">
          <Switch data-pg="sw-ltr" defaultChecked aria-label="Checked by default" />
          <Switch disabled aria-label="Disabled" />
          <Switch disabled defaultChecked aria-label="Disabled checked" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <div className="pg-row">
          <Switch id="notifications" checked={checked} onCheckedChange={setChecked} />
          <Label htmlFor="notifications">Notifications: {checked ? "on" : "off"}</Label>
        </div>
      </section>

      <section className="pg-section">
        <h3>RTL</h3>
        <DirectionProvider dir="rtl">
          <div className="pg-row">
            <Switch data-pg="sw-rtl" defaultChecked aria-label="الإشعارات" />
            <Switch data-pg="sw-rtl-off" aria-label="الطيران" />
          </div>
        </DirectionProvider>
      </section>
    </>
  )
}
