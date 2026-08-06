import { useState } from "react"
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "../../ui/hover-card/hover-card.jsx"
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import "../../ui/hover-card/hover-card.css"
import "../../ui/avatar/avatar.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

function PreviewCard() {
  return (
    <div style={{ display: "flex", gap: "1rem" }}>
      <Avatar>
        <AvatarImage src="https://github.com/vercel.png" alt="@nextjs" />
        <AvatarFallback>VC</AvatarFallback>
      </Avatar>
      <div style={{ display: "grid", gap: "0.25rem" }}>
        <h4 style={{ fontSize: "0.875rem", fontWeight: 600 }}>@nextjs</h4>
        <p style={{ fontSize: "0.875rem" }}>
          The React Framework — created and maintained by @vercel.
        </p>
        <div style={{ fontSize: "0.75rem", color: "var(--muted-foreground)" }}>
          Joined December 2021
        </div>
      </div>
    </div>
  )
}

export default function HoverCardPage() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <h2>Hover Card</h2>
      <p>A non-modal popover that previews content behind a link on hover or focus — touch pointers are ignored.</p>

      <InstallSnippet slug="hover-card" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { HoverCard, HoverCardTrigger, HoverCardContent } from "./ui/hover-card/hover-card"
import "./ui/hover-card/hover-card.css"

<HoverCard>
  <HoverCardTrigger href="#hover-card">@nextjs</HoverCardTrigger>
  <HoverCardContent>
    <div>Profile preview content here</div>
  </HoverCardContent>
</HoverCard>`}>
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger href="#hover-card" data-pg="hover-card-trigger">
              @nextjs
            </HoverCardTrigger>
            <HoverCardContent>
              <PreviewCard />
            </HoverCardContent>
          </HoverCard>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Side: right</h3>
        <ComponentPreview code={`<HoverCard>
  <HoverCardTrigger href="#hover-card">@nextjs (right)</HoverCardTrigger>
  <HoverCardContent side="right">
    <div>Content anchored to the right</div>
  </HoverCardContent>
</HoverCard>`}>
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger href="#hover-card">@nextjs (right)</HoverCardTrigger>
            <HoverCardContent side="right">
              <PreviewCard />
            </HoverCardContent>
          </HoverCard>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [open, setOpen] = useState(false)

<HoverCard open={open} onOpenChange={setOpen}>
  <HoverCardTrigger href="#hover-card">Controlled preview</HoverCardTrigger>
  <HoverCardContent>
    <div>Content</div>
  </HoverCardContent>
</HoverCard>`}>
          <HoverCard
            open={open}
            onOpenChange={setOpen}
            openDelay={100}
            closeDelay={100}
          >
            <HoverCardTrigger href="#hover-card" data-pg="controlled-hover-trigger">
              Controlled preview
            </HoverCardTrigger>
            <HoverCardContent>
              <PreviewCard />
            </HoverCardContent>
          </HoverCard>
          <p className="pg-desc">
            state: <span data-pg="controlled-hover-card-state">{open ? "open" : "closed"}</span>
          </p>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
        { name: "openDelay", type: "number", default: "200", description: "Milliseconds before the card opens on hover" },
        { name: "closeDelay", type: "number", default: "150", description: "Milliseconds grace period before closing on leave" },
        { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: "Preferred side relative to the trigger" },
        { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "Alignment along the side axis" },
      ]} />
    </>
  )
}
