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
      <p>A brief label that appears on hover or focus. Touch pointers are ignored, which keeps mobile UIs clean.</p>

      <InstallSnippet slug="tooltip" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<TooltipProvider>
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
        <p className="pg-desc">
          Keyboard focus opens the tooltip and Escape closes it, so the label is reachable without a pointer.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip/tooltip"
import "./ui/tooltip/tooltip.css"

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger as={Button} variant="outline">
      Save
    </TooltipTrigger>
    <TooltipContent>Saves without leaving the page</TooltipContent>
  </Tooltip>
</TooltipProvider>`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as={Button} variant="outline">
                Save
              </TooltipTrigger>
              <TooltipContent>Saves without leaving the page</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ComponentPreview>
        <p className="pg-desc">
          <code>TooltipProvider</code> owns the shared delay timer. Wrap it once high in the tree and every tooltip below shares the same open and close cadence.
        </p>
      </section>

      <section className="pg-section">
        <h3>Icon-only button</h3>
        <ComponentPreview code={`{/* The one case a tooltip is not optional: a control with no visible text. */}
<Tooltip>
  <TooltipTrigger as={Button} variant="ghost" size="icon" aria-label="Copy">
    <CopyIcon />
  </TooltipTrigger>
  <TooltipContent>Copy to clipboard</TooltipContent>
</Tooltip>`}>
          <TooltipProvider>
            <div className="pg-row">
              <Tooltip>
                <TooltipTrigger as={Button} variant="ghost" size="icon" aria-label="Copy">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </TooltipTrigger>
                <TooltipContent>Copy to clipboard</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as={Button} variant="ghost" size="icon" aria-label="Delete">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </TooltipTrigger>
                <TooltipContent>Move to trash</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </ComponentPreview>
        <p className="pg-desc">
          The tooltip is not the accessible name. Keep <code>aria-label</code> on the button as well, or the control is unnamed for anyone who never hovers it.
        </p>
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
        <p className="pg-desc">
          A delay of zero is right for a toolbar the reader is already scanning. Raise it when tooltips sit in the middle of prose, where a passing pointer should not trigger them.
        </p>
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
        <p className="pg-desc">
          The default side is <code>top</code>. A tooltip that would overflow the viewport flips to the opposite side and records where it landed on <code>data-side</code>.
        </p>
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
        <p className="pg-desc">
          A controlled tooltip is how you show one from somewhere else, such as a first-run hint that opens itself once and then hands control back to hover.
        </p>
      </section>

      <section className="pg-section">
        <h3>Offset</h3>
        <ComponentPreview code={`<TooltipContent sideOffset={16}>Further from the trigger</TooltipContent>`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as={Button} variant="outline">
                Wide gap
              </TooltipTrigger>
              <TooltipContent sideOffset={16}>Further from the trigger</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ComponentPreview>
        <p className="pg-desc">
          <code>sideOffset</code> is measured from the trigger's edge, so it stays constant whichever side the tooltip flips to.
        </p>
      </section>

      <ApiReference props={[
        { name: "delayDuration", type: "number", default: "0", description: "On TooltipProvider, milliseconds before opening on hover" },
        { name: "open", type: "boolean", description: "On Tooltip, controlled open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "On Tooltip, called when open state changes" },
        { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"top"', description: "On TooltipContent, preferred side relative to the trigger" },
        { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "On TooltipContent, alignment along the side axis" },
        { name: "sideOffset", type: "number", default: "6", description: "On TooltipContent, pixel gap between trigger and tooltip" },
      ]} />
    </>
  )
}
