import { useState } from "react"
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "../../ui/tooltip/tooltip.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/tooltip/tooltip.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function TooltipPage() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <h2>Tooltip</h2>
      <p>A brief label that appears on hover or focus — touch pointers are ignored, keeping mobile UIs clean.</p>

      <InstallSnippet slug="tooltip" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip/tooltip"
import "./ui/tooltip/tooltip.css"

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger as={Button} variant="outline">
      Hover me
    </TooltipTrigger>
    <TooltipContent>Default tooltip text</TooltipContent>
  </Tooltip>
</TooltipProvider>`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as={Button} variant="outline" data-pg="tooltip-trigger">
                Hover me
              </TooltipTrigger>
              <TooltipContent>Default tooltip text</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With delay (100ms)</h3>
        <ComponentPreview code={`<TooltipProvider delayDuration={100}>
  <Tooltip>
    <TooltipTrigger as={Button} variant="outline">
      Delayed tooltip
    </TooltipTrigger>
    <TooltipContent>Delayed tooltip text</TooltipContent>
  </Tooltip>
</TooltipProvider>`}>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger as={Button} variant="outline" data-pg="delayed-trigger">
                Delayed tooltip
              </TooltipTrigger>
              <TooltipContent>Delayed tooltip text</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Side: right</h3>
        <ComponentPreview code={`<TooltipProvider>
  <Tooltip>
    <TooltipTrigger as={Button} variant="outline">
      Right tooltip
    </TooltipTrigger>
    <TooltipContent side="right">Tooltip on the right</TooltipContent>
  </Tooltip>
</TooltipProvider>`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as={Button} variant="outline">
                Right tooltip
              </TooltipTrigger>
              <TooltipContent side="right">Tooltip on the right</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [open, setOpen] = useState(false)

<TooltipProvider>
  <Tooltip open={open} onOpenChange={setOpen}>
    <TooltipTrigger as={Button} variant="outline">
      Controlled tooltip
    </TooltipTrigger>
    <TooltipContent>Controlled tooltip text</TooltipContent>
  </Tooltip>
</TooltipProvider>`}>
          <TooltipProvider>
            <Tooltip open={open} onOpenChange={setOpen}>
              <TooltipTrigger as={Button} variant="outline" data-pg="controlled-trigger">
                Controlled tooltip
              </TooltipTrigger>
              <TooltipContent>Controlled tooltip text</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="pg-desc">
            state: <span data-pg="controlled-tooltip-state">{open ? "open" : "closed"}</span>
          </p>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "delayDuration", type: "number", default: "0", description: "On TooltipProvider — milliseconds before opening on hover" },
        { name: "open", type: "boolean", description: "On Tooltip — controlled open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "On Tooltip — called when open state changes" },
        { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: "On TooltipContent — preferred side relative to the trigger" },
        { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "On TooltipContent — alignment along the side axis" },
        { name: "sideOffset", type: "number", default: "6", description: "On TooltipContent — pixel gap between trigger and tooltip" },
      ]} />
    </>
  )
}
