import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "../../ui/card/card.jsx"
import { Button } from "../../ui/button/button.jsx"
import { Item, ItemMedia, ItemContent, ItemTitle, ItemDescription, ItemActions } from "../../ui/item/item.jsx"
import { Field, FieldContent, FieldTitle, FieldDescription } from "../../ui/field/field.jsx"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../ui/table/table.jsx"
import "../../ui/card/card.css"
import "../../ui/button/button.css"
import "../../ui/item/item.css"
import "../../ui/field/field.css"
import "../../ui/table/table.css"

const columns = ["Name", "Region", "Status"]

const rows = [
  { name: "api-gateway", region: "eu-west-1", status: "Running" },
  { name: "worker-pool", region: "us-east-1", status: "Running" },
  { name: "batch-jobs", region: "ap-south-1", status: "Stopped" },
]

/* Every panel below renders exactly these children. Nothing is passed a width,
   a breakpoint or a prop about size — the only difference between two panels is
   how much inline space the panel gives them. */
function Panel() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Production</CardTitle>
          <CardDescription>eu-west-1</CardDescription>
          <CardAction>
            <Button variant="outline" size="sm">
              Deploy
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <p className="pg-cq-prose">
            The action sits beside the title while there is room for it, and
            drops beneath once there is not.
          </p>
        </CardContent>
        <CardFooter>
          <Button size="sm">Save</Button>
          <Button variant="outline" size="sm">
            Cancel
          </Button>
        </CardFooter>
      </Card>

      <Item variant="outline">
        <ItemMedia variant="icon" />
        <ItemContent>
          <ItemTitle>worker-pool</ItemTitle>
          <ItemDescription>4 replicas</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="outline" size="sm">
            Restart
          </Button>
        </ItemActions>
      </Item>

      <Field orientation="responsive">
        <FieldContent>
          <FieldTitle>Two-factor authentication</FieldTitle>
          <FieldDescription>Required for all console operators.</FieldDescription>
        </FieldContent>
        <Button variant="outline" size="sm">
          Enable
        </Button>
      </Field>

      <Table className="table--stack">
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c}>{c}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.name}>
              <TableCell data-label="Name">{r.name}</TableCell>
              <TableCell data-label="Region">{r.region}</TableCell>
              <TableCell data-label="Status">{r.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}

export default function ContainerQueriesPage() {
  return (
    <>
      <h2>Container Queries</h2>

      <section className="pg-section">
        <h3>Overview</h3>
        <p>
          A media query asks how wide the <em>window</em> is. That is the wrong
          question for a component: the same card belongs in a 320px side panel
          and in a 1200px main region, and the viewport cannot tell those apart.
          Components here size themselves to their <em>container</em> instead, so
          one copy is correct in both places with no breakpoint props and no
          duplicate markup.
        </p>
        <p>
          This is a capability an upstream utility-class kit cannot easily adopt,
          because its responsive prefixes are viewport-bound by default.
        </p>
      </section>

      <section className="pg-section">
        <h3>The same components, three widths, one viewport</h3>
        <p>
          The three panels below render the identical component tree — see{" "}
          <code>Panel()</code> in this page's source. Resizing your window
          changes nothing about their relationship to each other, which is the
          whole point: each panel responds to itself.
        </p>
        <div className="pg-cq-row">
          <div className="pg-cq-panel pg-cq-panel--sm">
            <div className="pg-cq-width">320px</div>
            <Panel />
          </div>
          <div className="pg-cq-panel pg-cq-panel--md">
            <div className="pg-cq-width">480px</div>
            <Panel />
          </div>
          <div className="pg-cq-panel pg-cq-panel--lg">
            <div className="pg-cq-width">840px</div>
            <Panel />
          </div>
        </div>
      </section>

      <section className="pg-section">
        <h3>Drag to resize</h3>
        <p>
          A plain <code>resize: horizontal</code> panel — no JavaScript, no
          observer. Drag the bottom-right corner across roughly 320px, 500px and
          640px to watch each threshold trip independently.
        </p>
        <div className="pg-cq-resize">
          <Panel />
        </div>
      </section>

      <section className="pg-section">
        <h3>Stacked tables</h3>
        <p>
          A table has no good narrow layout — horizontal scrolling hides the
          columns that matter. Add <code>className="table--stack"</code> and
          below 40rem of container width every row becomes a card of
          label/value pairs.
        </p>
        <p>
          The visual labels come from <code>data-label</code> on each cell, which
          you set, because <code>ui/table</code> never sees your column list.
          Assistive technology does not read those: the header row is{" "}
          <em>visually</em> hidden and stays in the accessibility tree, so every
          value keeps its real column association. That is also why{" "}
          <code>ui/table</code> now sets explicit{" "}
          <code>role="row"</code>/<code>role="cell"</code> attributes — changing{" "}
          <code>display</code> on table parts otherwise strips their table
          semantics and the values would be announced as orphaned text.
        </p>
      </section>

      <section className="pg-section">
        <h3>Which components opt in</h3>
        <p>
          Containment is never global. <code>container-type</code> makes an
          element a layout and style containment boundary, which breaks children
          that rely on percentage heights or on escaping overflow — so each
          component declares its own, and only where its layout is genuinely
          self-contained.
        </p>
        <ul>
          <li>
            <code>ui/card</code> — <code>vanillin-card</code>, below 20rem the
            header action drops under the title and footer buttons stretch.
          </li>
          <li>
            <code>ui/item</code> — <code>vanillin-item</code>, below 18rem the
            actions take their own row.
          </li>
          <li>
            <code>ui/field</code> — <code>vanillin-field</code>, from 40rem{" "}
            <code>orientation="responsive"</code> lays label and control out
            side by side.
          </li>
          <li>
            <code>ui/table</code> — <code>vanillin-table</code> on the scroll
            wrapper, driving <code>.table--stack</code> below 40rem.
          </li>
          <li>
            <code>ui/dialog</code> and <code>ui/sheet</code> —{" "}
            <code>vanillin-dialog</code>, header alignment and footer direction
            from 24rem of content width. A side sheet is ~20rem wide on the
            largest desktop, so keying this to the viewport gave it a layout it
            had no room for.
          </li>
        </ul>
        <p>
          <code>ui/sidebar</code> deliberately does not. It swaps to a Sheet
          through <code>matchMedia</code> in JavaScript, and a container query
          cannot drive a render decision — a second mechanism would only
          desynchronise from the first.
        </p>
      </section>

      <section className="pg-section">
        <h3>Two rules worth knowing</h3>
        <p>
          <strong>An element never matches a query against a container it
          declares itself.</strong>{" "}
          <code>@container</code> resolves against the nearest{" "}
          <em>ancestor</em> container, so a rule that sets{" "}
          <code>container-type</code> on <code>.foo</code> and then queries{" "}
          <code>.foo</code> silently reads some outer box — or never matches at
          all. Layout flips therefore live on the children:{" "}
          <code>flex-wrap</code> and <code>gap</code> are declared
          unconditionally on the container and only the children's{" "}
          <code>flex-basis</code> is queried. The same rule is why a dialog's{" "}
          <code>max-width</code> is still a media query.
        </p>
        <p>
          <strong>Every container is named.</strong> An anonymous container gets
          claimed by whichever ancestor happens to be nearest, which turns
          nesting two components into action at a distance. A query naming a
          container that does not exist simply never matches, so a mis-scoped
          query fails safe rather than latching onto something unrelated.
        </p>
        <p>
          Thresholds are literal <code>rem</code> values rather than tokens,
          because container query conditions cannot read custom properties. Each
          rule is written as the <em>narrow</em> override, so a browser without
          container query support renders the plain wide layout rather than a
          broken one.
        </p>
      </section>
    </>
  )
}
