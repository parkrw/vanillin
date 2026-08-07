import { Kbd, KbdGroup } from "../../ui/kbd/kbd.jsx"
import "../../ui/kbd/kbd.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function KbdPage() {
  return (
    <>
      <h2>Kbd</h2>
      <p>Displays a keyboard key or shortcut in a styled inline element.</p>

      <InstallSnippet slug="kbd" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Kbd } from "./ui/kbd/kbd"
import "./ui/kbd/kbd.css"

<Kbd>K</Kbd>`}>
          <Kbd>K</Kbd>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Single Keys</h3>
        <ComponentPreview code={`<Kbd>K</Kbd>
<Kbd>Enter</Kbd>
<Kbd>Shift</Kbd>`}>
          <div className="pg-row">
            <Kbd>K</Kbd>
            <Kbd>Enter</Kbd>
            <Kbd>Shift</Kbd>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Key Group</h3>
        <ComponentPreview code={`<KbdGroup>
  <Kbd>Ctrl</Kbd>
  <Kbd>B</Kbd>
</KbdGroup>

<KbdGroup>
  <Kbd>Cmd</Kbd>
  <Kbd>Shift</Kbd>
  <Kbd>P</Kbd>
</KbdGroup>`}>
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
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Inline with Text</h3>
        <ComponentPreview code={`<p>
  Press <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> to open the command palette.
</p>`}>
          <p>
            Press <Kbd>Cmd</Kbd> + <Kbd>K</Kbd> to open the command palette.
          </p>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "className", type: "string", description: "Additional CSS classes" },
        { name: "children", type: "ReactNode", description: "Key label text" },
      ]} />
    </>
  )
}
