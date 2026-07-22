import { useState } from "react"
import { Slider } from "../../ui/slider/slider.jsx"
import "../../ui/slider/slider.css"

export default function SliderPage() {
  const [volume, setVolume] = useState([50])
  return (
    <>
      <h2>Slider</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-row" style={{ width: "60%" }}>
          <Slider defaultValue={[33]} aria-label="Default" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Range (two thumbs)</h3>
        <div className="pg-row" style={{ width: "60%" }}>
          <Slider defaultValue={[25, 75]} aria-label="Range" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <div className="pg-row" style={{ width: "60%" }}>
          <Slider value={volume} onValueChange={setVolume} aria-label="Volume" />
          <span style={{ minWidth: "3ch" }}>{volume[0]}</span>
        </div>
      </section>

      <section className="pg-section">
        <h3>Step + disabled</h3>
        <div className="pg-row" style={{ width: "60%", flexDirection: "column", alignItems: "stretch", gap: "1.5rem" }}>
          <Slider defaultValue={[40]} step={10} aria-label="Step 10" />
          <Slider defaultValue={[60]} disabled aria-label="Disabled" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Vertical</h3>
        <div className="pg-row" style={{ height: "12rem" }}>
          <Slider defaultValue={[30]} orientation="vertical" aria-label="Vertical" />
        </div>
      </section>
    </>
  )
}
