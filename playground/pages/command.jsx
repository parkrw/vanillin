import { useEffect, useState } from "react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "../../ui/command/command.jsx"
import "../../ui/command/command.css"

function CalendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M8 2v4M16 2v4M3 10h18" />
    </svg>
  )
}

export default function CommandPage() {
  const [last, setLast] = useState("none")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [highlighted, setHighlighted] = useState("")

  // ⌘K / Ctrl+K opens the palette (shadcn's documented pattern).
  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setDialogOpen((open) => !open)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  const select = (value) => {
    setLast(value)
    setDialogOpen(false)
  }

  return (
    <>
      <h2>Command</h2>
      <p>
        Last selected: <span data-pg="cmd-last">{last}</span>
      </p>

      <section className="pg-section">
        <h3>Default (groups, shortcuts, disabled item)</h3>
        <Command className="command--bordered" data-pg="cmd-root">
          <CommandInput placeholder="Type a command or search..." data-pg="cmd-input" />
          <CommandList data-pg="cmd-list">
            <CommandEmpty data-pg="cmd-empty">No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions" data-pg="cmd-group-suggestions">
              <CommandItem value="calendar" onSelect={select} data-pg="cmd-item-calendar">
                <CalendarIcon />
                Calendar
              </CommandItem>
              <CommandItem value="emoji" onSelect={select} data-pg="cmd-item-emoji">
                Search Emoji
              </CommandItem>
              <CommandItem value="launch" disabled onSelect={select} data-pg="cmd-item-launch">
                Launch (unavailable)
              </CommandItem>
            </CommandGroup>
            <CommandSeparator data-pg="cmd-separator" />
            <CommandGroup heading="Settings" data-pg="cmd-group-settings">
              <CommandItem
                value="profile"
                keywords={["account", "me"]}
                onSelect={select}
                data-pg="cmd-item-profile"
              >
                Profile
                <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem value="billing" onSelect={select} data-pg="cmd-item-billing">
                Billing
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </section>

      <section className="pg-section">
        <h3>Dialog palette (⌘K / Ctrl+K)</h3>
        <button type="button" className="btn btn--outline" onClick={() => setDialogOpen(true)} data-pg="cmd-dialog-trigger">
          Open palette
        </button>
        <CommandDialog open={dialogOpen} onOpenChange={setDialogOpen} data-pg="cmd-dialog">
          <CommandInput placeholder="Type a command or search..." data-pg="cmd-dialog-input" />
          <CommandList data-pg="cmd-dialog-list">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Navigation">
              <CommandItem value="go-home" onSelect={select} data-pg="cmd-item-go-home">
                Go to Home
              </CommandItem>
              <CommandItem value="go-docs" onSelect={select} data-pg="cmd-item-go-docs">
                Go to Docs
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </section>

      <section className="pg-section">
        <h3>Controlled highlight + loop</h3>
        <Command
          className="command--bordered"
          loop
          value={highlighted}
          onValueChange={setHighlighted}
        >
          <CommandInput placeholder="Wraps at both ends" data-pg="cmd-loop-input" />
          <CommandList data-pg="cmd-loop-list">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandItem value="one" onSelect={select} data-pg="cmd-item-one">
              One
            </CommandItem>
            <CommandItem value="two" onSelect={select} data-pg="cmd-item-two">
              Two
            </CommandItem>
            <CommandItem value="three" onSelect={select} data-pg="cmd-item-three">
              Three
            </CommandItem>
          </CommandList>
        </Command>
        <p>
          Highlighted: <span data-pg="cmd-loop-state">{highlighted}</span>
        </p>
      </section>

      <section className="pg-section">
        <h3>shouldFilter={"{false}"} (filter server-side yourself)</h3>
        <Command className="command--bordered" shouldFilter={false}>
          <CommandInput placeholder="Typing never filters" data-pg="cmd-nofilter-input" />
          <CommandList data-pg="cmd-nofilter-list">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandItem value="alpha" onSelect={select}>
              Alpha
            </CommandItem>
            <CommandItem value="beta" onSelect={select}>
              Beta
            </CommandItem>
          </CommandList>
        </Command>
      </section>
    </>
  )
}
