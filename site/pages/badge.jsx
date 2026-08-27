import { useState } from "react"
import { Badge, Chip } from "../../ui/badge/badge.jsx"
import { Button } from "../../ui/button/button.jsx"
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card/card.jsx"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "../../ui/table/table.jsx"
import "../../ui/badge/badge.css"
import "../../ui/button/button.css"
import "../../ui/card/card.css"
import "../../ui/table/table.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const initialChips = ["Design", "Engineering", "Ops"]

export default function BadgePage() {
  const [chips, setChips] = useState(initialChips)

  return (
    <>
      <h2>Badge</h2>
      <p>A small label for status, counts, or categories.</p>

      <InstallSnippet slug="badge" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>`}>
          <div className="pg-row">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Badge } from "./ui/badge/badge"
import "./ui/badge/badge.css"

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>`}>
          <div className="pg-row">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Variants</h3>
        <ComponentPreview code={`<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Destructive</Badge>
<Badge variant="outline">Outline</Badge>`}>
          <div className="pg-row">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Status Variants</h3>
        <p>
          Soft treatment, with tinted background, coloured text, and tinted border, so
          they stay readable in dense table rows.
        </p>
        <ComponentPreview code={`<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="destructive-soft">Destructive soft</Badge>`}>
          <div className="pg-row" data-pg="badge-status">
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="destructive-soft">Destructive soft</Badge>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Glow</h3>
        <p>
          <code>glow</code> breathes a halo in the variant's own colour on a fixed
          2s loop, for the one badge on a page that means "live". Under{" "}
          <code>prefers-reduced-motion</code> the halo holds still.{" "}
          <code>--glow-duration</code> and <code>--glow-strength</code> retime
          and dim it — the same two properties <code>StatusDot</code>'s{" "}
          <code>ring</code> and <code>Progress</code>'s <code>glow</code> read,
          so one ancestor sets the pulse for a whole panel.
        </p>
        <ComponentPreview code={`<Badge variant="success" glow>Live</Badge>
<Badge variant="warning" glow>Degraded</Badge>
<Badge variant="info" glow>Syncing</Badge>
<Badge variant="destructive" glow>Alarm</Badge>
<Badge glow>Default</Badge>`}>
          <div className="pg-row" data-pg="badge-glow">
            <Badge variant="success" glow>Live</Badge>
            <Badge variant="warning" glow>Degraded</Badge>
            <Badge variant="info" glow>Syncing</Badge>
            <Badge variant="destructive" glow>Alarm</Badge>
            <Badge glow>Default</Badge>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Glow speed and brightness</h3>
        <p>
          Two custom properties retime and dim the glow:{" "}
          <code>--glow-duration</code> is one breath (default{" "}
          <code>2s</code>) and <code>--glow-strength</code> multiplies the halo
          alpha (default <code>1</code>). Set them on any ancestor and every
          badge, status dot and progress bar inside follows, so a whole panel
          shares one pulse.
        </p>
        <ComponentPreview code={`<div style={{ "--glow-duration": "4s", "--glow-strength": 0.5 }}>
  <Badge variant="success" glow>Live</Badge>
  <Badge variant="warning" glow>Degraded</Badge>
  <Badge glow>Default</Badge>
</div>`}>
          <div
            className="pg-row"
            data-pg="badge-glow-controls"
            style={{ "--glow-duration": "4s", "--glow-strength": 0.5 }}
          >
            <Badge variant="success" glow>Live</Badge>
            <Badge variant="warning" glow>Degraded</Badge>
            <Badge glow>Default</Badge>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>As link</h3>
        <ComponentPreview code={`<Badge as="a" href="#installation" variant="secondary">
  Installation
</Badge>`}>
          <div className="pg-row" data-pg="badge-links">
            <Badge as="a" href="#installation" variant="secondary">Installation</Badge>
            <Badge as="a" href="#button" variant="outline">Button docs</Badge>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>as="a"</code> renders a real anchor, so the badge navigates and shows up in the tab order.
        </p>
      </section>

      <section className="pg-section">
        <h3>Chip</h3>
        <p>
          <code>Chip</code> is a badge with a dismiss button. Pass{" "}
          <code>onRemove</code> for the button; omit for a static chip.
        </p>
        <ComponentPreview code={`import { Chip } from "./ui/badge/badge"

<Chip>Static</Chip>
<Chip onRemove={() => handleRemove(id)}>Removable</Chip>
<Chip onRemove={() => {}} disabled>Disabled</Chip>`}>
          <div className="pg-row" data-pg="badge-chips">
            <Chip>Static</Chip>
            {chips.map((c) => (
              <Chip key={c} onRemove={() => setChips(chips.filter((x) => x !== c))}>
                {c}
              </Chip>
            ))}
            <Chip onRemove={() => {}} disabled>
              Disabled
            </Chip>
            <Chip onRemove={() => {}}>
              A label long enough to be truncated by the chip
            </Chip>
          </div>
          <div className="pg-row">
            <Button variant="outline" size="sm" onClick={() => setChips(initialChips)}>
              Reset chips
            </Button>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Badge in Card Header</h3>
        <ComponentPreview code={`<Card>
  <CardHeader>
    <CardTitle>Deployment</CardTitle>
    <Badge variant="success">Live</Badge>
  </CardHeader>
  <CardContent>
    <p>Last deployed 2 minutes ago.</p>
  </CardContent>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "22rem" }}>
            <CardHeader>
              <CardTitle>Deployment</CardTitle>
              <Badge variant="success">Live</Badge>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0 }}>Last deployed 2 minutes ago.</p>
            </CardContent>
          </Card>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Badge in Table Cell</h3>
        <ComponentPreview code={`<Table>
  <TableBody>
    <TableRow>
      <TableCell>api-server</TableCell>
      <TableCell><Badge variant="success">Healthy</Badge></TableCell>
    </TableRow>
    <TableRow>
      <TableCell>worker</TableCell>
      <TableCell><Badge variant="warning">Degraded</Badge></TableCell>
    </TableRow>
  </TableBody>
</Table>`}>
          <Table style={{ maxWidth: "22rem" }}>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>api-server</TableCell>
                <TableCell><Badge variant="success">Healthy</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>worker</TableCell>
                <TableCell><Badge variant="warning">Degraded</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>scheduler</TableCell>
                <TableCell><Badge variant="destructive-soft">Down</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </ComponentPreview>
      </section>

      <ApiReference title="Badge" props={[
        { name: "variant", type: '"default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "destructive-soft"', default: '"default"', description: "Visual variant" },
        { name: "glow", type: "boolean", default: "false", description: "Breathing halo in the variant's own colour (static under reduced motion)" },
        { name: "as", type: "ElementType", default: '"span"', description: "Render as a different element/component (e.g. as=\"a\" for links)" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="Chip" props={[
        { name: "onRemove", type: "() => void", description: "Callback for the dismiss button; omit for a static chip" },
        { name: "removeLabel", type: "string", description: 'Accessible label for the remove button (default: "Remove <label>")' },
        { name: "disabled", type: "boolean", description: "Disable the chip and its remove button" },
      ]} />

      <ApiReference title="Custom properties" props={[
        { name: "--glow-duration", type: "<time>", default: "2s", description: "One breath of the glow. Inherited, so setting it on an ancestor retimes every badge, status dot and progress bar inside" },
        { name: "--glow-strength", type: "number", default: "1", description: "Multiplies the halo alpha; 0.5 is half as bright, 0 hides the halo. Inherited the same way" },
      ]} />
    </>
  )
}
