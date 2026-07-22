import { cn } from "../../lib/cn.js"

export function NativeSelect({ className, ...props }) {
  return <select className={cn("native-select", className)} {...props} />
}

export function NativeSelectOption(props) {
  return <option {...props} />
}

export function NativeSelectOptGroup(props) {
  return <optgroup {...props} />
}
