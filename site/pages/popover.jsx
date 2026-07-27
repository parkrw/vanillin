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

export default function PopoverPage() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <h2>Popover</h2>

      <section className="pg-section">
        <h3>Default (bottom center)</h3>
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
      </section>

      <section className="pg-section">
        <h3>Side: right, Align: start</h3>
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
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          state: <span data-pg="controlled-popover-state">{open ? "open" : "closed"}</span>
        </p>
      </section>
    </>
  )
}
