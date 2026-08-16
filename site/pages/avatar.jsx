import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import "../../ui/avatar/avatar.css"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "../../ui/tooltip/tooltip.jsx"
import "../../ui/tooltip/tooltip.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const PORTRAIT =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
       <rect width="40" height="40" fill="#c7d2fe"/>
       <circle cx="20" cy="15" r="7" fill="#4338ca"/>
       <path d="M6 40c0-8 6-13 14-13s14 5 14 13z" fill="#4338ca"/>
     </svg>`
  )

export default function AvatarPage() {
  return (
    <>
      <h2>Avatar</h2>
      <p>A circular image with fallback initials for user profiles.</p>

      <InstallSnippet slug="avatar" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar/avatar"
import "./ui/avatar/avatar.css"

<Avatar>
  <AvatarImage src="/avatar.jpg" alt="Casey Nolan" />
  <AvatarFallback>CN</AvatarFallback>
</Avatar>`}>
          <div className="pg-row">
            <Avatar>
              <AvatarImage src={PORTRAIT} alt="Casey Nolan" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Fallback</h3>
        <ComponentPreview code={`{/* Broken image falls back to initials */}
<Avatar>
  <AvatarImage src="/broken.png" alt="Broken" />
  <AvatarFallback>AB</AvatarFallback>
</Avatar>

{/* No image at all */}
<Avatar>
  <AvatarFallback>JD</AvatarFallback>
</Avatar>`}>
          <div className="pg-row">
            <Avatar>
              <AvatarImage src="/broken-image.png" alt="Broken" />
              <AvatarFallback>AB</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Avatar + Name</h3>
        <ComponentPreview code={`<div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
  <Avatar>
    <AvatarFallback>PW</AvatarFallback>
  </Avatar>
  <div>
    <div style={{ fontWeight: 500 }}>Parker Williams</div>
    <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
      parker@example.com
    </div>
  </div>
</div>`}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Avatar>
              <AvatarFallback>PW</AvatarFallback>
            </Avatar>
            <div>
              <div style={{ fontWeight: 500 }}>Parker Williams</div>
              <div style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>parker@example.com</div>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Avatar Group</h3>
        <ComponentPreview code={`<div style={{ display: "flex" }}>
  {["PW", "MK", "RS", "JD"].map((initials, i) => (
    <Avatar key={initials} style={{ marginInlineStart: i ? "-0.5rem" : 0, border: "2px solid var(--background)" }}>
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  ))}
</div>`}>
          <div style={{ display: "flex" }}>
            {["PW", "MK", "RS", "JD"].map((initials, i) => (
              <Avatar key={initials} style={{ marginInlineStart: i ? "-0.5rem" : 0, border: "2px solid var(--background)" }}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <ComponentPreview code={`<Avatar style={{ width: "2rem", height: "2rem" }}>
  <AvatarFallback>SM</AvatarFallback>
</Avatar>
<Avatar>
  <AvatarFallback>MD</AvatarFallback>
</Avatar>
<Avatar style={{ width: "3.5rem", height: "3.5rem" }}>
  <AvatarFallback>LG</AvatarFallback>
</Avatar>`}>
          <div className="pg-row" style={{ alignItems: "center" }}>
            <Avatar style={{ width: "2rem", height: "2rem" }}>
              <AvatarFallback>SM</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>MD</AvatarFallback>
            </Avatar>
            <Avatar style={{ width: "3.5rem", height: "3.5rem" }}>
              <AvatarFallback>LG</AvatarFallback>
            </Avatar>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Status Indicator</h3>
        <ComponentPreview code={`<div style={{ position: "relative", display: "inline-block" }}>
  <Avatar>
    <AvatarImage src="/avatar.jpg" alt="Casey Nolan" />
    <AvatarFallback>CN</AvatarFallback>
  </Avatar>
  <span style={{
    position: "absolute", bottom: 0, right: 0,
    width: "0.75rem", height: "0.75rem",
    borderRadius: "9999px",
    backgroundColor: "var(--success, #22c55e)",
    border: "2px solid var(--background)",
  }} />
</div>
<div style={{ position: "relative", display: "inline-block" }}>
  <Avatar>
    <AvatarFallback>AW</AvatarFallback>
  </Avatar>
  <span style={{
    position: "absolute", bottom: 0, right: 0,
    width: "0.75rem", height: "0.75rem",
    borderRadius: "9999px",
    backgroundColor: "var(--muted-foreground)",
    border: "2px solid var(--background)",
  }} />
</div>`}>
          <div className="pg-row">
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar>
                <AvatarImage src={PORTRAIT} alt="Casey Nolan" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <span style={{
                position: "absolute", bottom: 0, right: 0,
                width: "0.75rem", height: "0.75rem",
                borderRadius: "9999px",
                backgroundColor: "var(--success, #22c55e)",
                border: "2px solid var(--background)",
              }} />
            </div>
            <div style={{ position: "relative", display: "inline-block" }}>
              <Avatar>
                <AvatarFallback>AW</AvatarFallback>
              </Avatar>
              <span style={{
                position: "absolute", bottom: 0, right: 0,
                width: "0.75rem", height: "0.75rem",
                borderRadius: "9999px",
                backgroundColor: "var(--muted-foreground)",
                border: "2px solid var(--background)",
              }} />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Avatar in Tooltip</h3>
        <ComponentPreview code={`<TooltipProvider>
  <Tooltip>
    <TooltipTrigger as="span" style={{ cursor: "default" }}>
      <Avatar>
        <AvatarFallback>PW</AvatarFallback>
      </Avatar>
    </TooltipTrigger>
    <TooltipContent>Parker Williams</TooltipContent>
  </Tooltip>
</TooltipProvider>`}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger as="span" style={{ cursor: "default" }}>
                <Avatar>
                  <AvatarFallback>PW</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent>Parker Williams</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </ComponentPreview>
      </section>

      <ApiReference title="Avatar" props={[
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="AvatarImage" props={[
        { name: "src", type: "string", description: "Image URL" },
        { name: "alt", type: "string", description: "Alt text for the image" },
        { name: "onError", type: "(e: Event) => void", description: "Called when the image fails to load" },
      ]} />

      <ApiReference title="AvatarFallback" props={[
        { name: "children", type: "ReactNode", description: "Fallback content (typically initials)" },
      ]} />
    </>
  )
}
