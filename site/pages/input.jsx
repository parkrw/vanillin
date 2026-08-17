import { Input } from "../../ui/input/input.jsx"
import "../../ui/input/input.css"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/label/label.css"
import { Density } from "../../ui/density/density.jsx"
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card/card.jsx"
import "../../ui/card/card.css"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function InputPage() {
  return (
    <>
      <h2>Input</h2>
      <p>A styled text field built on the native <code>&lt;input&gt;</code> element.</p>

      <InstallSnippet slug="input" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Input placeholder="Type something..." />`}>
          <div style={{ maxWidth: "20rem" }}>
            <Input placeholder="Type something..." />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Input } from "./ui/input/input"
import "./ui/input/input.css"

<Input placeholder="Type something..." />`}>
          <div style={{ maxWidth: "20rem" }}>
            <Input placeholder="Type something..." />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With Label</h3>
        <ComponentPreview code={`<Label htmlFor="email">Email</Label>
<Input id="email" type="email" placeholder="you@example.com" />`}>
          <div style={{ maxWidth: "20rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Label htmlFor="input-email">Email</Label>
            <Input id="input-email" type="email" placeholder="you@example.com" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>File Input</h3>
        <ComponentPreview code={`<Input type="file" />`}>
          <div style={{ maxWidth: "20rem" }}>
            <Input type="file" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <ComponentPreview code={`<Input placeholder="Disabled" disabled />
<Input placeholder="Invalid" aria-invalid="true" />`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "20rem" }}>
            <Input placeholder="Disabled" disabled />
            <Input placeholder="Invalid" aria-invalid="true" />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Density</h3>
        <ComponentPreview code={`<Density mode="compact">
  <Input placeholder="Compact" />
</Density>
<Input placeholder="Comfortable (default)" />
<Density mode="spacious">
  <Input placeholder="Spacious" />
</Density>`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "20rem" }}>
            <Density mode="compact">
              <Input placeholder="Compact" />
            </Density>
            <Input placeholder="Comfortable (default)" />
            <Density mode="spacious">
              <Input placeholder="Spacious" />
            </Density>
          </div>
        </ComponentPreview>
        <p>
          Padding scales with <code>--density-scale</code> via the{" "}
          <code>--space-*</code> ramp.
        </p>
      </section>

      <section className="pg-section">
        <h3>Input in Card</h3>
        <ComponentPreview code={`<Card>
  <CardHeader>
    <CardTitle>Contact info</CardTitle>
  </CardHeader>
  <CardContent>
    <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div>
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="Jane Doe" />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="jane@example.com" />
      </div>
      <Button type="submit">Submit</Button>
    </form>
  </CardContent>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "24rem" }}>
            <CardHeader>
              <CardTitle>Contact info</CardTitle>
            </CardHeader>
            <CardContent>
              <form style={{ display: "flex", flexDirection: "column", gap: "1rem" }} onSubmit={e => e.preventDefault()}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Label htmlFor="card-name">Name</Label>
                  <Input id="card-name" placeholder="Jane Doe" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <Label htmlFor="card-email">Email</Label>
                  <Input id="card-email" type="email" placeholder="jane@example.com" />
                </div>
                <Button type="submit">Submit</Button>
              </form>
            </CardContent>
          </Card>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "className", type: "string", description: "Additional CSS classes" },
        { name: "type", type: "string", default: '"text"', description: "HTML input type" },
        { name: "...props", type: "InputHTMLAttributes", description: "All native input attributes are forwarded" },
      ]} />
    </>
  )
}
