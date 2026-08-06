import { Avatar, AvatarImage, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import "../../ui/avatar/avatar.css"
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
        <ComponentPreview code={`import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar/avatar"
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
  {["PW", "MK", "RS"].map((initials, i) => (
    <Avatar key={initials} style={{ marginInlineStart: i ? "-0.5rem" : 0 }}>
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
