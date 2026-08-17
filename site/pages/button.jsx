// Docs page layout: description → install snippet → usage → examples → API reference.
// Each page composes ComponentPreview, InstallSnippet, ApiReference in this order.
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "../../ui/card/card.jsx"
import "../../ui/card/card.css"
import { Badge } from "../../ui/badge/badge.jsx"
import "../../ui/badge/badge.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function ButtonPage() {
  return (
    <>
      <h2>Button</h2>
      <p>Triggers an action or event: submit a form, open a dialog, cancel an operation.</p>

      <InstallSnippet slug="button" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Button>Click me</Button>`}>
          <Button>Click me</Button>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Button } from "./ui/button/button"
import "./ui/button/button.css"

<Button>Click me</Button>`}>
          <Button>Click me</Button>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Variants</h3>
        <ComponentPreview code={`<Button>Default</Button>
<Button variant="destructive">Destructive</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>`}>
          <div className="pg-row">
            <Button>Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <ComponentPreview code={`<Button size="sm">Small</Button>
<Button>Default</Button>
<Button size="lg">Large</Button>
<Button size="icon" aria-label="Settings">
  <SettingsIcon />
</Button>`}>
          <div className="pg-row">
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Settings">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v4m0 14v4M4.2 4.2l2.8 2.8m10 10 2.8 2.8M1 12h4m14 0h4M4.2 19.8l2.8-2.8m10-10 2.8-2.8" />
              </svg>
            </Button>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <ComponentPreview code={`<Button disabled>Disabled</Button>
<Button as="a" href="#button">As link</Button>`}>
          <div className="pg-row">
            <Button disabled>Disabled</Button>
            <Button as="a" href="#button">
              As link
            </Button>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Density</h3>
        <ComponentPreview code={`{/* Padding and gap scale with --density-scale */}
<div style={{ "--density-scale": "0.8" }}>
  <Button>Compact</Button>
</div>
<Button>Default</Button>
<div style={{ "--density-scale": "1.2" }}>
  <Button>Spacious</Button>
</div>`}>
          <div className="pg-row">
            <div style={{ "--density-scale": "0.8" }}>
              <Button>Compact</Button>
            </div>
            <Button>Default</Button>
            <div style={{ "--density-scale": "1.2" }}>
              <Button>Spacious</Button>
            </div>
          </div>
        </ComponentPreview>
        <p>
          Padding and gap scale with <code>--density-scale</code> via the{" "}
          <code>--space-*</code> ramp. Hover backgrounds use opaque derived
          tokens (<code>--primary-hover</code>, <code>--destructive-hover</code>,{" "}
          <code>--secondary-hover</code>) instead of transparent color-mix.
        </p>
      </section>

      <section className="pg-section">
        <h3>Button in Card</h3>
        <ComponentPreview code={`<Card>
  <CardHeader>
    <CardTitle>Account settings</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Manage your account preferences and billing.</p>
  </CardContent>
  <CardFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Save changes</Button>
  </CardFooter>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "24rem" }}>
            <CardHeader>
              <CardTitle>Account settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Manage your account preferences and billing.</p>
            </CardContent>
            <CardFooter>
              <Button variant="outline">Cancel</Button>
              <Button>Save changes</Button>
            </CardFooter>
          </Card>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Button Group with Badge</h3>
        <ComponentPreview code={`<Button>
  Inbox <Badge variant="secondary">12</Badge>
</Button>
<Button variant="outline">
  Drafts <Badge variant="secondary">3</Badge>
</Button>
<Button variant="ghost">Archive</Button>`}>
          <div className="pg-row">
            <Button>Inbox <Badge variant="secondary">12</Badge></Button>
            <Button variant="outline">Drafts <Badge variant="secondary">3</Badge></Button>
            <Button variant="ghost">Archive</Button>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "variant", type: '"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"', default: '"default"', description: "Visual style of the button" },
        { name: "size", type: '"default" | "sm" | "lg" | "icon"', default: '"default"', description: "Size of the button" },
        { name: "as", type: "ElementType", default: '"button"', description: "Render as a different element or component" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
