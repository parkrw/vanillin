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
          Soft treatment — tinted background, coloured text, tinted border — so
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
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="Chip" props={[
        { name: "onRemove", type: "() => void", description: "Callback for the dismiss button; omit for a static chip" },
        { name: "removeLabel", type: "string", description: 'Accessible label for the remove button (default: "Remove <label>")' },
        { name: "disabled", type: "boolean", description: "Disable the chip and its remove button" },
      ]} />
    </>
  )
}
