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
import "../../ui/table/table.css"

export default function TablePage() {
  return (
    <>
      <h2>Table</h2>

      <section className="pg-section">
        <h3>Default</h3>
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
      </section>

      <section className="pg-section">
        <h3>Density</h3>
        <p>
          Cell and header padding resolve through the <code>--space-*</code>{" "}
          density ramp. Set <code>--density-scale</code> on <code>:root</code>{" "}
          to tighten (<code>0.875</code>) or loosen (<code>1.25</code>) row
          height uniformly — this is the primary lever for fitting more rows on
          screen in data-dense views.
        </p>
      </section>
    </>
  )
}
