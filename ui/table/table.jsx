import { cn } from "../../lib/cn.js"

export function Table({ className, ...props }) {
  return (
    <div className="table-container">
      <table className={cn("table", className)} {...props} />
    </div>
  )
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("table-header", className)} {...props} />
}

export function TableBody({ className, ...props }) {
  return <tbody className={cn("table-body", className)} {...props} />
}

export function TableFooter({ className, ...props }) {
  return <tfoot className={cn("table-footer", className)} {...props} />
}

export function TableRow({ className, ...props }) {
  return <tr className={cn("table-row", className)} {...props} />
}

export function TableHead({ className, ...props }) {
  return <th className={cn("table-head", className)} {...props} />
}

export function TableCell({ className, ...props }) {
  return <td className={cn("table-cell", className)} {...props} />
}

export function TableCaption({ className, ...props }) {
  return <caption className={cn("table-caption", className)} {...props} />
}
