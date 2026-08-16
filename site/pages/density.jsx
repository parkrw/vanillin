// System page layout: description → demos → reference.
import { useState } from "react"
import { Density } from "../../ui/density/density.jsx"
import { Button } from "../../ui/button/button.jsx"
import { Input } from "../../ui/input/input.jsx"
import { Badge } from "../../ui/badge/badge.jsx"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../ui/card/card.jsx"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../../ui/table/table.jsx"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/button/button.css"
import "../../ui/input/input.css"
import "../../ui/badge/badge.css"
import "../../ui/card/card.css"
import "../../ui/table/table.css"
import "../../ui/label/label.css"
import { ComponentPreview } from "../code-example.jsx"
import "../code-example.css"

const MODES = ["compact", "comfortable", "spacious"]

const sampleData = [
  { id: 1, name: "Alice", role: "Engineer", status: "Active" },
  { id: 2, name: "Bob", role: "Designer", status: "Away" },
  { id: 3, name: "Carol", role: "PM", status: "Active" },
]

function DemoCard({ mode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode}</CardTitle>
        <CardDescription>
          --density-scale: {mode === "compact" ? "0.875" : mode === "spacious" ? "1.25" : "1"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <Button size="sm">Save</Button>
            <Button variant="outline" size="sm">Cancel</Button>
            <Badge>Default</Badge>
            <Badge variant="secondary">Draft</Badge>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            <Label>Email</Label>
            <Input placeholder="name@example.com" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DemoTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sampleData.map((row) => (
          <TableRow key={row.id}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.role}</TableCell>
            <TableCell>
              <Badge variant={row.status === "Active" ? "default" : "secondary"}>
                {row.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function DensityPage() {
  const [nestedOuter, setNestedOuter] = useState("spacious")
  const [nestedInner, setNestedInner] = useState("compact")

  return (
    <>
      <h2>Density</h2>

      <p>
        Three named density modes — <code>compact</code>,{" "}
        <code>comfortable</code>, and <code>spacious</code> — scale
        all spacing that flows through the <code>--space-*</code> token ramp.
        Wrap any subtree in <code>&lt;Density mode="..."&gt;</code> or set
        the <code>data-density</code> attribute directly.
      </p>

      <section className="pg-section">
        <h3>Side by side</h3>
        <ComponentPreview code={`import { Density } from "./ui/density/density"

<Density mode="compact">
  <Card>...</Card>
</Density>
<Density mode="comfortable">
  <Card>...</Card>
</Density>
<Density mode="spacious">
  <Card>...</Card>
</Density>`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            {MODES.map((mode) => (
              <Density key={mode} mode={mode}>
                <DemoCard mode={mode} />
              </Density>
            ))}
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Table density</h3>
        <p>
          Data-dense tables are the main use case for compact mode. The table
          below is shown at all three densities.
        </p>
        <ComponentPreview code={`<Density mode="compact">
  <Table>
    <TableHeader>...</TableHeader>
    <TableBody>...</TableBody>
  </Table>
</Density>`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {MODES.map((mode) => (
              <div key={mode}>
                <p style={{ margin: "0 0 0.5rem", fontWeight: 500 }}>{mode}</p>
                <Density mode={mode}>
                  <DemoTable />
                </Density>
              </div>
            ))}
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Nested scopes</h3>
        <p>
          A <code>data-density</code> inside another one wins. The outer
          wrapper sets one mode; the inner card overrides it.
        </p>
        <ComponentPreview code={`<Density mode="spacious">
  <Card>
    <CardContent>
      <Density mode="compact">
        <Card>
          {/* compact spacing inside spacious */}
        </Card>
      </Density>
    </CardContent>
  </Card>
</Density>`}>
          <div>
            <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              <label style={{ display: "flex", gap: "var(--space-1)", alignItems: "center" }}>
                Outer:
                <select value={nestedOuter} onChange={(e) => setNestedOuter(e.target.value)}>
                  {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <label style={{ display: "flex", gap: "var(--space-1)", alignItems: "center" }}>
                Inner:
                <select value={nestedInner} onChange={(e) => setNestedInner(e.target.value)}>
                  {MODES.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
            </div>
            <Density mode={nestedOuter} data-testid="density-outer">
              <Card>
                <CardHeader>
                  <CardTitle>Outer: {nestedOuter}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
                    <Button>Outer button</Button>
                    <Input placeholder="Outer input" style={{ maxWidth: "200px" }} />
                  </div>
                  <Density mode={nestedInner} data-testid="density-inner">
                    <Card>
                      <CardHeader>
                        <CardTitle>Inner: {nestedInner}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div style={{ display: "flex", gap: "var(--space-2)" }}>
                          <Button>Inner button</Button>
                          <Input placeholder="Inner input" style={{ maxWidth: "200px" }} />
                        </div>
                      </CardContent>
                    </Card>
                  </Density>
                </CardContent>
              </Card>
            </Density>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>What scales</h3>
        <p>
          Components that use <code>--space-*</code> tokens for padding, gap,
          and margins respond to density automatically. These include: button,
          badge, card, dialog, field, input, native-select, popover, radio-group,
          table, tabs, textarea, toast, and tooltip.
        </p>

        <h3>What does not scale</h3>
        <ul>
          <li>
            <strong>Font size.</strong> Density is spacing, not typography.
            Shrinking text below 14px fails accessibility and is the main
            reason compact modes look broken.
          </li>
          <li>
            <strong>Touch targets.</strong> Interactive elements are clamped
            to a 24px minimum (WCAG 2.5.8) so compact mode stays usable on
            touch devices.
          </li>
          <li>
            <strong>Hard-coded spacing.</strong> Components that still use
            literal rem/px values (accordion, breadcrumb, calendar, combobox,
            command, data-table, dropdown-menu, form, hover-card, select,
            sidebar, toggle, and others) are not yet wired to the ramp and
            will not respond.
          </li>
        </ul>
      </section>

      <section className="pg-section">
        <h3>Custom scale</h3>
        <p>
          The three named modes are the API, but you can set{" "}
          <code>--density-scale</code> to any number directly.
          The touch-target floor still applies — interactive elements
          will not shrink below 24px regardless of the scale value.
        </p>
        <ComponentPreview code={`<div style={{ "--density-scale": "0.75" }}>
  <Button>75% spacing</Button>
  <Input placeholder="Tighter input" />
</div>`}>
          <div style={{ "--density-scale": "0.75", display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <Button>75% spacing</Button>
            <Input placeholder="Tighter input" style={{ maxWidth: "200px" }} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Reference</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Token / Attribute</TableHead>
              <TableHead>Values</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell><code>--density-scale</code></TableCell>
              <TableCell><code>&lt;number&gt;</code>, default <code>1</code></TableCell>
              <TableCell>Multiplier applied to the <code>--space-*</code> ramp. <code>compact</code> = 0.875, <code>comfortable</code> = 1, <code>spacious</code> = 1.25.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>data-density</code></TableCell>
              <TableCell><code>"compact" | "comfortable" | "spacious"</code></TableCell>
              <TableCell>Attribute set by <code>&lt;Density&gt;</code>. Scopes the scale to a subtree; inner values override outer.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>--space-1</code> through <code>--space-8</code></TableCell>
              <TableCell><code>calc(N * var(--density-scale))</code></TableCell>
              <TableCell>Spacing ramp: 0.25rem, 0.375rem, 0.5rem, 0.625rem, 0.75rem, 1rem, 1.5rem, 2rem (at scale 1).</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </>
  )
}
