import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../../ui/accordion/accordion.jsx"
import "../../ui/accordion/accordion.css"

export default function AccordionPage() {
  return (
    <>
      <h2>Accordion</h2>

      <section className="pg-section">
        <h3>Default (single, collapsible)</h3>
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
      </section>

      <section className="pg-section">
        <h3>Multiple</h3>
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
      </section>

      <section className="pg-section">
        <h3>Disabled item</h3>
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
      </section>
    </>
  )
}
