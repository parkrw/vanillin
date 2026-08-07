import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../../ui/accordion/accordion.jsx"
import "../../ui/accordion/accordion.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function AccordionPage() {
  return (
    <>
      <h2>Accordion</h2>
      <p>Vertically stacked disclosure panels with animated expand/collapse.</p>

      <InstallSnippet slug="accordion" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Accordion, AccordionItem, AccordionTrigger,
  AccordionContent } from "./ui/accordion/accordion"
import "./ui/accordion/accordion.css"

<Accordion type="single" collapsible>
  <AccordionItem value="item-1">
    <AccordionTrigger>Section title</AccordionTrigger>
    <AccordionContent>Panel content.</AccordionContent>
  </AccordionItem>
</Accordion>`}>
          <Accordion type="single" collapsible defaultValue="item-1" style={{ maxWidth: "24rem" }}>
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that match the other components&apos; aesthetic.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Is it animated?</AccordionTrigger>
              <AccordionContent>
                Yes. It&apos;s animated by default, but you can disable it if you prefer.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Multiple</h3>
        <ComponentPreview code={`<Accordion type="multiple" defaultValue={["a", "b"]}>
  <AccordionItem value="a">
    <AccordionTrigger>Can I open several at once?</AccordionTrigger>
    <AccordionContent>Yes, with type="multiple".</AccordionContent>
  </AccordionItem>
  <AccordionItem value="b">
    <AccordionTrigger>Do they stay open?</AccordionTrigger>
    <AccordionContent>Each item toggles independently.</AccordionContent>
  </AccordionItem>
</Accordion>`}>
          <Accordion type="multiple" defaultValue={["a", "b"]} style={{ maxWidth: "24rem" }}>
            <AccordionItem value="a">
              <AccordionTrigger>Can I open several at once?</AccordionTrigger>
              <AccordionContent>Yes, with type=&quot;multiple&quot;.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="b">
              <AccordionTrigger>Do they stay open?</AccordionTrigger>
              <AccordionContent>Each item toggles independently.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="c">
              <AccordionTrigger>Keyboard navigation?</AccordionTrigger>
              <AccordionContent>Arrow keys, Home, and End move between triggers.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Disabled Item</h3>
        <ComponentPreview code={`<AccordionItem value="two" disabled>
  <AccordionTrigger>Disabled</AccordionTrigger>
  <AccordionContent>Unreachable.</AccordionContent>
</AccordionItem>`}>
          <Accordion type="single" collapsible style={{ maxWidth: "24rem" }}>
            <AccordionItem value="one">
              <AccordionTrigger>Enabled</AccordionTrigger>
              <AccordionContent>This one works.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="two" disabled>
              <AccordionTrigger>Disabled</AccordionTrigger>
              <AccordionContent>Unreachable.</AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>FAQ</h3>
        <ComponentPreview code={`<Accordion type="single" collapsible>
  <AccordionItem value="faq-1">
    <AccordionTrigger>How do I install vanillin?</AccordionTrigger>
    <AccordionContent>
      Run van init to set up, then van add to copy components.
    </AccordionContent>
  </AccordionItem>
  <AccordionItem value="faq-2">
    <AccordionTrigger>Can I customize the theme?</AccordionTrigger>
    <AccordionContent>
      Edit van.config.json and run van build to regenerate tokens.
    </AccordionContent>
  </AccordionItem>
</Accordion>`}>
          <Accordion type="single" collapsible style={{ maxWidth: "24rem" }}>
            <AccordionItem value="faq-1">
              <AccordionTrigger>How do I install vanillin?</AccordionTrigger>
              <AccordionContent>
                Run <code>van init</code> to set up your project, then <code>van add</code> to copy individual components.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-2">
              <AccordionTrigger>Can I customize the theme?</AccordionTrigger>
              <AccordionContent>
                Edit <code>van.config.json</code> and run <code>van build</code> to regenerate your design tokens.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="faq-3">
              <AccordionTrigger>Do I need any runtime dependencies?</AccordionTrigger>
              <AccordionContent>
                Only React. Everything else is built-in.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentPreview>
      </section>

      <ApiReference title="Accordion" props={[
        { name: "type", type: '"single" | "multiple"', default: '"single"', description: "Single or multiple panels open at once" },
        { name: "collapsible", type: "boolean", default: "false", description: "Allow collapsing all panels (single mode only)" },
        { name: "value", type: "string | string[]", description: "Controlled open panel(s)" },
        { name: "defaultValue", type: "string | string[]", description: "Initially open panel(s)" },
        { name: "onValueChange", type: "(value) => void", description: "Called when open panels change" },
      ]} />

      <ApiReference title="AccordionItem" props={[
        { name: "value", type: "string", description: "Unique identifier for this panel" },
        { name: "disabled", type: "boolean", default: "false", description: "Disable this item" },
      ]} />
    </>
  )
}
