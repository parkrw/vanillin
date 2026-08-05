import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table/table.jsx"
import "../ui/table/table.css"

export function ApiReference({ title = "API Reference", props: propDefs }) {
  if (!propDefs?.length) return null

  return (
    <div className="pg-api-ref">
      <h3>{title}</h3>
      <Table className="pg-api-table">
        <TableHeader>
          <TableRow>
            <TableHead>Prop</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Default</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {propDefs.map((prop) => (
            <TableRow key={prop.name}>
              <TableCell>
                <code className="pg-api-prop">{prop.name}</code>
              </TableCell>
              <TableCell>
                <code className="pg-api-type">{prop.type}</code>
              </TableCell>
              <TableCell>
                {prop.default != null ? (
                  <code className="pg-api-default">{prop.default}</code>
                ) : (
                  <span className="pg-api-none">—</span>
                )}
              </TableCell>
              <TableCell>{prop.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
