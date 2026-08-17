import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "../../ui/table/table.jsx"
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card/card.jsx"
import "../../ui/table/table.css"
import "../../ui/card/card.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function TablePage() {
  return (
    <>
      <h2>Table</h2>
      <p>Semantic HTML table with consistent styling and density support.</p>

      <InstallSnippet slug="table" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Table>
  <TableCaption>A list of recent invoices.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead style={{ textAlign: "right" }}>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV001</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell style={{ textAlign: "right" }}>$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>`}>
          <Table>
            <TableCaption>A list of recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead style={{ textAlign: "right" }}>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>INV001</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Credit Card</TableCell>
                <TableCell style={{ textAlign: "right" }}>$250.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>INV002</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>PayPal</TableCell>
                <TableCell style={{ textAlign: "right" }}>$150.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>INV003</TableCell>
                <TableCell>Unpaid</TableCell>
                <TableCell>Bank Transfer</TableCell>
                <TableCell style={{ textAlign: "right" }}>$350.00</TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell style={{ textAlign: "right" }}>$750.00</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Table, TableHeader, TableBody, TableRow,
  TableHead, TableCell, TableCaption } from "./ui/table/table"
import "./ui/table/table.css"

<Table>
  <TableCaption>A list of recent invoices.</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead style={{ textAlign: "right" }}>Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>INV001</TableCell>
      <TableCell>Paid</TableCell>
      <TableCell style={{ textAlign: "right" }}>$250.00</TableCell>
    </TableRow>
  </TableBody>
</Table>`}>
          <Table>
            <TableCaption>A list of recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead style={{ textAlign: "right" }}>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>INV001</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Credit Card</TableCell>
                <TableCell style={{ textAlign: "right" }}>$250.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>INV002</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>PayPal</TableCell>
                <TableCell style={{ textAlign: "right" }}>$150.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>INV003</TableCell>
                <TableCell>Unpaid</TableCell>
                <TableCell>Bank Transfer</TableCell>
                <TableCell style={{ textAlign: "right" }}>$350.00</TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell style={{ textAlign: "right" }}>$750.00</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Density</h3>
        <ComponentPreview code={`{/* Tighter rows for data-dense views */}
<div style={{ "--density-scale": "0.875" }}>
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Role</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow><TableCell>Alice</TableCell><TableCell>Admin</TableCell></TableRow>
      <TableRow><TableCell>Bob</TableCell><TableCell>Editor</TableCell></TableRow>
    </TableBody>
  </Table>
</div>`}>
          <div style={{ "--density-scale": "0.875" }}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow><TableCell>Alice</TableCell><TableCell>Admin</TableCell><TableCell>Active</TableCell></TableRow>
                <TableRow><TableCell>Bob</TableCell><TableCell>Editor</TableCell><TableCell>Active</TableCell></TableRow>
                <TableRow><TableCell>Carol</TableCell><TableCell>Viewer</TableCell><TableCell>Inactive</TableCell></TableRow>
              </TableBody>
            </Table>
          </div>
        </ComponentPreview>
        <p>
          Cell and header padding resolve through the <code>--space-*</code>{" "}
          density ramp.
        </p>
      </section>

      <section className="pg-section">
        <h3>Table in Card</h3>
        <ComponentPreview code={`<Card>
  <CardHeader>
    <CardTitle>Team members</CardTitle>
  </CardHeader>
  <CardContent>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Alice</TableCell>
          <TableCell>alice@example.com</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </CardContent>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "28rem" }}>
            <CardHeader>
              <CardTitle>Team members</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Alice</TableCell>
                    <TableCell>alice@example.com</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Bob</TableCell>
                    <TableCell>bob@example.com</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </ComponentPreview>
      </section>

      <ApiReference title="Table" props={[
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
