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
import { Input } from "../../ui/input/input.jsx"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/popover/popover.css"
import "../../ui/button/button.css"
import "../../ui/input/input.css"
import "../../ui/label/label.css"
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
      <p>A non-modal panel anchored to a trigger. Focus is not trapped, and clicking outside or pressing Escape dismisses it.</p>

      <InstallSnippet slug="popover" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Popover>
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
        <p className="pg-desc">
          <code>PopoverTitle</code> and <code>PopoverDescription</code> are wired to the panel through <code>aria-labelledby</code> and <code>aria-describedby</code>, so the panel announces itself when focus moves in.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Popover, PopoverTrigger, PopoverContent, PopoverHeader, PopoverTitle, PopoverDescription } from "./ui/popover/popover"
import "./ui/popover/popover.css"

<Popover>
  <PopoverTrigger as={Button} variant="outline">
    Show details
  </PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Build 4128</PopoverTitle>
      <PopoverDescription>Finished 4 minutes ago.</PopoverDescription>
    </PopoverHeader>
  </PopoverContent>
</Popover>`}>
          <Popover>
            <PopoverTrigger as={Button} variant="outline">
              Show details
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Build 4128</PopoverTitle>
                <PopoverDescription>Finished 4 minutes ago.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </ComponentPreview>
        <p className="pg-desc">
          The trigger is a button by default. Pass <code>as</code> to render a link, an icon button, or any component that forwards its props.
        </p>
      </section>

      <section className="pg-section">
        <h3>Side and align</h3>
        <ComponentPreview code={`<PopoverContent side="right" align="start">…</PopoverContent>`}>
          <div className="pg-row">
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
            <Popover>
              <PopoverTrigger as={Button} variant="outline">
                Above
              </PopoverTrigger>
              <PopoverContent side="top">
                <PopoverHeader>
                  <PopoverTitle>Top popover</PopoverTitle>
                  <PopoverDescription>Opens above the trigger.</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger as={Button} variant="outline">
                Aligned end
              </PopoverTrigger>
              <PopoverContent align="end">
                <PopoverHeader>
                  <PopoverTitle>End aligned</PopoverTitle>
                  <PopoverDescription>Right edges line up.</PopoverDescription>
                </PopoverHeader>
              </PopoverContent>
            </Popover>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>side</code> is a preference, not a guarantee: a panel that would overflow the viewport flips to the opposite side and reports where it landed on <code>data-side</code>.
        </p>
      </section>

      <section className="pg-section">
        <h3>Offset</h3>
        <ComponentPreview code={`<PopoverContent sideOffset={16}>…</PopoverContent>`}>
          <Popover>
            <PopoverTrigger as={Button} variant="outline">
              Wide gap
            </PopoverTrigger>
            <PopoverContent sideOffset={16}>
              <PopoverHeader>
                <PopoverTitle>Sixteen pixels away</PopoverTitle>
                <PopoverDescription>The default gap is four.</PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </ComponentPreview>
        <p className="pg-desc">
          Increase <code>sideOffset</code> when the panel carries a shadow heavy enough to blur into the trigger.
        </p>
      </section>

      <section className="pg-section">
        <h3>With a form</h3>
        <ComponentPreview code={`<Popover>
  <PopoverTrigger as={Button} variant="outline">Edit dimensions</PopoverTrigger>
  <PopoverContent>
    <PopoverHeader>
      <PopoverTitle>Dimensions</PopoverTitle>
      <PopoverDescription>Set the size of the layer.</PopoverDescription>
    </PopoverHeader>
    <Label htmlFor="popover-width">Width</Label>
    <Input id="popover-width" defaultValue="320" />
  </PopoverContent>
</Popover>`}>
          <Popover>
            <PopoverTrigger as={Button} variant="outline">
              Edit dimensions
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Dimensions</PopoverTitle>
                <PopoverDescription>Set the size of the layer.</PopoverDescription>
              </PopoverHeader>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <Label htmlFor="popover-width">Width</Label>
                <Input id="popover-width" defaultValue="320" />
                <Label htmlFor="popover-height">Height</Label>
                <Input id="popover-height" defaultValue="180" />
              </div>
            </PopoverContent>
          </Popover>
        </ComponentPreview>
        <p className="pg-desc">
          Focus is not trapped, so Tab walks out of the panel and into the page. That is the right behaviour for an inline editor and the wrong one for a confirmation, which is what <code>Dialog</code> is for.
        </p>
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
        <p className="pg-desc">
          <code>onOpenChange</code> fires for outside clicks and Escape as well as trigger clicks, so the readout tracks every dismissal path.
        </p>
      </section>

      <ApiReference props={[
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
        { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: "Preferred side relative to the trigger" },
        { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "Alignment along the side axis" },
        { name: "sideOffset", type: "number", default: "4", description: "Pixel gap between the trigger and popover" },
        { name: "as", type: "ElementType", default: '"button"', description: "On PopoverTrigger, render as a different element" },
      ]} />
    </>
  )
}
