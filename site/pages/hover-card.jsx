import { useState } from "react"
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "../../ui/hover-card/hover-card.jsx"
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import { Badge } from "../../ui/badge/badge.jsx"
import "../../ui/hover-card/hover-card.css"
import "../../ui/avatar/avatar.css"
import "../../ui/badge/badge.css"
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
          The React Framework, created and maintained by @vercel.
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
      <p>A non-modal popover that previews content behind a link on hover or focus. Touch pointers are ignored, since there is no hover to speak of.</p>

      <InstallSnippet slug="hover-card" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<HoverCard>
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
        <p className="pg-desc">
          Keyboard focus opens the card too, so a reader tabbing through a paragraph of links gets the same preview a mouse user does.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { HoverCard, HoverCardTrigger, HoverCardContent } from "./ui/hover-card/hover-card"
import "./ui/hover-card/hover-card.css"

<HoverCard>
  <HoverCardTrigger href="/team/ada">@ada</HoverCardTrigger>
  <HoverCardContent>
    <p>Ada Lovelace, first programmer.</p>
  </HoverCardContent>
</HoverCard>`}>
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger href="#hover-card">@ada</HoverCardTrigger>
            <HoverCardContent>
              <p style={{ fontSize: "0.875rem" }}>Ada Lovelace, first programmer.</p>
            </HoverCardContent>
          </HoverCard>
        </ComponentPreview>
        <p className="pg-desc">
          The trigger renders an anchor by default, because the pattern exists to preview whatever is behind a link.
        </p>
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
        <p className="pg-desc">
          The card flips to the opposite side when the preferred one would run off the viewport, and records the side it settled on in <code>data-side</code>.
        </p>
      </section>

      <section className="pg-section">
        <h3>Delays</h3>
        <ComponentPreview code={`{/* Slow to appear, quick to leave. */}
<HoverCard openDelay={600} closeDelay={0}>
  <HoverCardTrigger href="#hover-card">Patient link</HoverCardTrigger>
  <HoverCardContent>…</HoverCardContent>
</HoverCard>`}>
          <div className="pg-row">
            <HoverCard openDelay={600} closeDelay={0}>
              <HoverCardTrigger href="#hover-card">Patient link</HoverCardTrigger>
              <HoverCardContent>
                <p style={{ fontSize: "0.875rem" }}>Waited 600ms before opening.</p>
              </HoverCardContent>
            </HoverCard>
            <HoverCard openDelay={0} closeDelay={400}>
              <HoverCardTrigger href="#hover-card">Eager link</HoverCardTrigger>
              <HoverCardContent>
                <p style={{ fontSize: "0.875rem" }}>Opened instantly, lingers on leave.</p>
              </HoverCardContent>
            </HoverCard>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>closeDelay</code> is the grace period that lets the pointer cross the gap from trigger to card without the card vanishing underneath it. Set it to zero only when the two touch.
        </p>
      </section>

      <section className="pg-section">
        <h3>Rich content</h3>
        <ComponentPreview code={`<HoverCardContent>
  <Avatar>
    <AvatarImage src="…" alt="@vanillin" />
    <AvatarFallback>VN</AvatarFallback>
  </Avatar>
  <Badge variant="secondary">MIT</Badge>
</HoverCardContent>`}>
          <HoverCard openDelay={100} closeDelay={100}>
            <HoverCardTrigger href="#hover-card">vanillin/ui</HoverCardTrigger>
            <HoverCardContent>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Avatar>
                    <AvatarFallback>VN</AvatarFallback>
                  </Avatar>
                  <strong style={{ fontSize: "0.875rem" }}>vanillin/ui</strong>
                </div>
                <p style={{ fontSize: "0.875rem" }}>
                  Copy-in components with no runtime dependencies.
                </p>
                <div className="pg-row">
                  <Badge variant="secondary">MIT</Badge>
                  <Badge variant="outline">75 components</Badge>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </ComponentPreview>
        <p className="pg-desc">
          The card is a plain container, so anything renders inside it. Keep it to a preview: nothing in there is reachable by keyboard while the card is open on hover alone.
        </p>
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
        <p className="pg-desc">
          A controlled card still respects the delays: the component calls <code>onOpenChange</code> when the timer fires, not when the pointer arrives.
        </p>
      </section>

      <ApiReference props={[
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
        { name: "openDelay", type: "number", default: "200", description: "Milliseconds before the card opens on hover" },
        { name: "closeDelay", type: "number", default: "150", description: "Milliseconds grace period before closing on leave" },
        { name: "side", type: '"top" | "right" | "bottom" | "left"', default: '"bottom"', description: "Preferred side relative to the trigger" },
        { name: "align", type: '"start" | "center" | "end"', default: '"center"', description: "Alignment along the side axis" },
        { name: "as", type: "ElementType", default: '"a"', description: "On HoverCardTrigger, render as a different element" },
      ]} />
    </>
  )
}
