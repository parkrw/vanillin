import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from "../../../ui/command/command.jsx"
import { CATEGORIES } from "../console-data.js"
import { fakeTask } from "../shared.jsx"
import "../../../ui/command/command.css"
import "../../../ui/kbd/kbd.css"

export function ConsolePalette({ open, onOpenChange, onNavigate, orderHref }) {
  const go = (svcId, page) => {
    onNavigate(svcId, page)
    onOpenChange(false)
  }
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Console search"
      description="Jump to a page or run an action"
    >
      <CommandInput placeholder="Where to? Try volumes or invoices..." />
      <CommandList>
        <CommandEmpty>No pages match.</CommandEmpty>
        {CATEGORIES.map((cat) => (
          <CommandGroup key={cat.id} heading={cat.label}>
            {cat.items.flatMap((svc) =>
              svc.pages.map((page) => (
                <CommandItem
                  key={`${svc.id}-${page}`}
                  value={`${cat.label} ${svc.name} ${page}`}
                  onSelect={() => go(svc.id, page)}
                >
                  {page}
                  <CommandShortcut>{svc.name}</CommandShortcut>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        ))}
        <CommandSeparator />
        <CommandGroup heading="Actions">
          {/* A real navigation, not onNavigate: the order wizard is a page of
              its own now, outside this console's router. Turning this back
              into onNavigate would look for a console page that no longer
              exists. */}
          <CommandItem
            value="order vdc virtual data center new"
            onSelect={() => { onOpenChange(false); window.location.assign(orderHref) }}
          >
            Order a VDC
          </CommandItem>
          <CommandItem
            value="launch virtual machine vm create server"
            onSelect={() => { fakeTask("Launch virtual machine", "Scheduling on az-east-1a"); onOpenChange(false) }}
          >
            Launch a virtual machine
          </CommandItem>
          <CommandItem
            value="create volume block storage"
            onSelect={() => { fakeTask("Create volume", "fast-ssd, 100 GB"); onOpenChange(false) }}
          >
            Create a volume
          </CommandItem>
          <CommandItem
            value="upload machine image"
            onSelect={() => { fakeTask("Upload machine image", "ubuntu-24.04-acme"); onOpenChange(false) }}
          >
            Upload a machine image
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
