import { useState } from "react"
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "../../ui/hover-card/hover-card.jsx"
import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import "../../ui/hover-card/hover-card.css"
import "../../ui/avatar/avatar.css"

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

      <section className="pg-section">
        <h3>Default (openDelay/closeDelay 100 for tests)</h3>
        <HoverCard openDelay={100} closeDelay={100}>
          <HoverCardTrigger href="#hover-card" data-pg="hover-card-trigger">
            @nextjs
          </HoverCardTrigger>
          <HoverCardContent>
            <PreviewCard />
          </HoverCardContent>
        </HoverCard>
      </section>

      <section className="pg-section">
        <h3>Side: right</h3>
        <HoverCard openDelay={100} closeDelay={100}>
          <HoverCardTrigger href="#hover-card">@nextjs (right)</HoverCardTrigger>
          <HoverCardContent side="right">
            <PreviewCard />
          </HoverCardContent>
        </HoverCard>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          state: <span data-pg="controlled-hover-card-state">{open ? "open" : "closed"}</span>
        </p>
      </section>
    </>
  )
}
