import { Kbd, KbdGroup } from "../../ui/kbd/kbd.jsx"
import "../../ui/kbd/kbd.css"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../ui/tooltip/tooltip.jsx"
import "../../ui/tooltip/tooltip.css"
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
        <h3>Default</h3>
        <ComponentPreview code={`<Kbd>K</Kbd>`}>
          <Kbd>K</Kbd>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Kbd } from "./ui/kbd/kbd"
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

      <section className="pg-section">
        <h3>Platform Modifiers</h3>
        <ComponentPreview code={`{/* macOS */}
<div style={{ display: "flex", gap: "1rem" }}>
  <KbdGroup><Kbd>⌘</Kbd><Kbd>C</Kbd></KbdGroup>
  <KbdGroup><Kbd>⌘</Kbd><Kbd>V</Kbd></KbdGroup>
  <KbdGroup><Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>P</Kbd></KbdGroup>
</div>

{/* Windows / Linux */}
<div style={{ display: "flex", gap: "1rem" }}>
  <KbdGroup><Kbd>Ctrl</Kbd><Kbd>C</Kbd></KbdGroup>
  <KbdGroup><Kbd>Ctrl</Kbd><Kbd>V</Kbd></KbdGroup>
  <KbdGroup><Kbd>Ctrl</Kbd><Kbd>Shift</Kbd><Kbd>P</Kbd></KbdGroup>
</div>`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", display: "block", marginBlockEnd: "0.25rem" }}>macOS</span>
              <div style={{ display: "flex", gap: "1rem" }}>
                <KbdGroup><Kbd>⌘</Kbd><Kbd>C</Kbd></KbdGroup>
                <KbdGroup><Kbd>⌘</Kbd><Kbd>V</Kbd></KbdGroup>
                <KbdGroup><Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>P</Kbd></KbdGroup>
              </div>
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", display: "block", marginBlockEnd: "0.25rem" }}>Windows / Linux</span>
              <div style={{ display: "flex", gap: "1rem" }}>
                <KbdGroup><Kbd>Ctrl</Kbd><Kbd>C</Kbd></KbdGroup>
                <KbdGroup><Kbd>Ctrl</Kbd><Kbd>V</Kbd></KbdGroup>
                <KbdGroup><Kbd>Ctrl</Kbd><Kbd>Shift</Kbd><Kbd>P</Kbd></KbdGroup>
              </div>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Kbd in Button</h3>
        <ComponentPreview code={`<Button variant="outline">
  Search <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
</Button>
<Button variant="outline">
  Save <KbdGroup><Kbd>⌘</Kbd><Kbd>S</Kbd></KbdGroup>
</Button>`}>
          <div className="pg-row">
            <Button variant="outline">
              Search <KbdGroup><Kbd>⌘</Kbd><Kbd>K</Kbd></KbdGroup>
            </Button>
            <Button variant="outline">
              Save <KbdGroup><Kbd>⌘</Kbd><Kbd>S</Kbd></KbdGroup>
            </Button>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Kbd in Tooltip</h3>
        <ComponentPreview code={`<TooltipProvider>
  <Tooltip>
    <TooltipTrigger as={Button} variant="outline">
      Bold
    </TooltipTrigger>
    <TooltipContent>
      Toggle bold <KbdGroup><Kbd>⌘</Kbd><Kbd>B</Kbd></KbdGroup>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as={Button} variant="outline">
                Bold
              </TooltipTrigger>
              <TooltipContent>
                Toggle bold <KbdGroup><Kbd>⌘</Kbd><Kbd>B</Kbd></KbdGroup>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "className", type: "string", description: "Additional CSS classes" },
        { name: "children", type: "ReactNode", description: "Key label text" },
      ]} />
    </>
  )
}
