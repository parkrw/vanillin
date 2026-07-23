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

export default function TooltipPage() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <h2>Tooltip</h2>

      <section className="pg-section">
        <h3>Default (delay 0)</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as={Button} variant="outline" data-pg="tooltip-trigger">
              Hover me
            </TooltipTrigger>
            <TooltipContent>Default tooltip text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>

      <section className="pg-section">
        <h3>With delay (100ms)</h3>
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger as={Button} variant="outline" data-pg="delayed-trigger">
              Delayed tooltip
            </TooltipTrigger>
            <TooltipContent>Delayed tooltip text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>

      <section className="pg-section">
        <h3>Side: right</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger as={Button} variant="outline">
              Right tooltip
            </TooltipTrigger>
            <TooltipContent side="right">Tooltip on the right</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <TooltipProvider>
          <Tooltip open={open} onOpenChange={setOpen}>
            <TooltipTrigger as={Button} variant="outline" data-pg="controlled-trigger">
              Controlled tooltip
            </TooltipTrigger>
            <TooltipContent>Controlled tooltip text</TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          state: <span data-pg="controlled-tooltip-state">{open ? "open" : "closed"}</span>
        </p>
      </section>
    </>
  )
}
