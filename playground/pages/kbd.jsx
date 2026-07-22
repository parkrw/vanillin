import { Kbd, KbdGroup } from "../../ui/kbd/kbd.jsx"
import "../../ui/kbd/kbd.css"

export default function KbdPage() {
  return (
    <>
      <h2>Kbd</h2>

      <section className="pg-section">
        <h3>Single key</h3>
        <div className="pg-row">
          <Kbd>K</Kbd>
          <Kbd>Enter</Kbd>
          <Kbd>Shift</Kbd>
        </div>
      </section>

      <section className="pg-section">
        <h3>Key group</h3>
        <div className="pg-row">
          <KbdGroup>
            <Kbd>Ctrl</Kbd>
            <Kbd>B</Kbd>
          </KbdGroup>
          <KbdGroup>
            <Kbd>Cmd</Kbd>
            <Kbd>Shift</Kbd>
            <Kbd>P</Kbd>
          </KbdGroup>
        </div>
      </section>
    </>
  )
}
