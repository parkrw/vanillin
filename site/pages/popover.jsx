import { useState } from "react"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "../../ui/popover/popover.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/popover/popover.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function PopoverPage() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <h2>Popover</h2>
      <p>A non-modal panel anchored to a trigger — focus is not trapped, and clicking outside or pressing Escape dismisses it.</p>

      <InstallSnippet slug="popover" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from "./ui/popover/popover"
import "./ui/popover/popover.css"

<Popover>
  <PopoverTrigger as={Button} variant="outline">
    Open popover
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Popover title</PopoverTitle>
      <PopoverDescription>Popover description text.</PopoverDescription>
    </PopoverHeader>
    <p>Some popover body content.</p>
  </PopoverContent>
</Popover>`}>
          <Popover>
            <PopoverTrigger as={Button} variant="outline" data-pg="popover-trigger">
              Open popover
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Popover title</PopoverTitle>
                <PopoverDescription>Popover description text.</PopoverDescription>
              </PopoverHeader>
              <p>Some popover body content.</p>
            </PopoverContent>
          </Popover>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Side: right, Align: start</h3>
        <ComponentPreview code={`<Popover>
  <PopoverTrigger as={Button} variant="outline">Right-start</PopoverTrigger>
  <PopoverContent side="right" align="start">
    <PopoverHeader>
      <PopoverTitle>Right popover</PopoverTitle>
      <PopoverDescription>Aligned to start.</PopoverDescription>
    </PopoverHeader>
  </PopoverContent>
</Popover>`}>
          <Popover>
            <PopoverTrigger as={Button} variant="outline" data-pg="right-trigger">
              Right-start
            </PopoverTrigger>
            <PopoverContent side="right" align="start">
              <PopoverHeader>
                <PopoverTitle>Right popover</PopoverTitle>
                <PopoverDescription>Aligned to start.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [open, setOpen] = useState(false)

<Popover open={open} onOpenChange={setOpen}>
  <PopoverTrigger as={Button} variant="outline">
    Open controlled
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Controlled popover</PopoverTitle>
      <PopoverDescription>Open state lives in the page.</PopoverDescription>
    </PopoverHeader>
  </PopoverContent>
</Popover>`}>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger as={Button} variant="outline">
              Open controlled
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Controlled popover</PopoverTitle>
                <PopoverDescription>Open state lives in the page.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
          <p className="pg-desc">
            state: <span data-pg="controlled-popover-state">{open ? "open" : "closed"}</span>
          </p>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
        { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: "Preferred side relative to the trigger" },
        { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "Alignment along the side axis" },
        { name: "sideOffset", type: "number", default: "4", description: "Pixel gap between the trigger and popover" },
        { name: "as", type: "ElementType", default: '"button"', description: "On PopoverTrigger — render as a different element" },
      ]} />
    </>
  )
}
