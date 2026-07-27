import { cn } from "../../lib/cn.js"

/*
 * The roles below duplicate what these elements already mean natively. They are
 * explicit because `.table--stack` changes `display` to lay rows out as cards,
 * and a table whose parts are no longer `display: table-*` loses its table
 * semantics — rows and cells would be announced as orphaned text. An explicit
 * role survives the display change. Each one is spread before `{...props}`, so
 * a consumer can still override it (`role="rowheader"` on a row header cell).
 */

export function Table({ className, ...props }) {
  return (
    <div className="table-container">
      <table role="table" className={cn("table", className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }) {
  return <thead role="rowgroup" className={cn("table-header", className)} {...props} />
}

export function TableBody({ className, ...props }) {
  return <tbody role="rowgroup" className={cn("table-body", className)} {...props} />
}

export function TableFooter({ className, ...props }) {
  return <tfoot role="rowgroup" className={cn("table-footer", className)} {...props} />
}

export function TableRow({ className, ...props }) {
  return <tr role="row" className={cn("table-row", className)} {...props} />
}

export function TableHead({ className, ...props }) {
  return <th role="columnheader" className={cn("table-head", className)} {...props} />
}

export function TableCell({ className, ...props }) {
  return <td role="cell" className={cn("table-cell", className)} {...props} />
}

export function TableCaption({ className, ...props }) {
  return <caption className={cn("table-caption", className)} {...props} />
}
