import { useEffect, useState } from "react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandLoading,
  CommandSeparator,
  CommandShortcut,
} from "../../ui/command/command.jsx"
import "../../ui/command/command.css"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"

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

const FAKE_RESULTS = ["Deploy to staging", "Deploy to production", "Delete branch"]

function AsyncCommandDemo({ onSelect }) {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [items, setItems] = useState(FAKE_RESULTS)

  useEffect(() => {
    if (query === "") {
      setItems(FAKE_RESULTS)
      return
    }
    setLoading(true)
    const id = setTimeout(() => {
      setItems(
        FAKE_RESULTS.filter((i) => i.toLowerCase().includes(query.toLowerCase()))
      )
      setLoading(false)
    }, 600)
    return () => clearTimeout(id)
  }, [query])

  return (
    <Command className="command--bordered" shouldFilter={false} data-pg="cmd-async">
      <CommandInput
        placeholder="Search actions..."
        value={query}
        onValueChange={setQuery}
        data-pg="cmd-async-input"
      />
      <CommandList data-pg="cmd-async-list">
        {loading && (
          <CommandLoading data-pg="cmd-async-loading">Fetching results...</CommandLoading>
        )}
        {!loading && items.length === 0 && (
          <CommandEmpty data-pg="cmd-async-empty">No results found.</CommandEmpty>
        )}
        {items.map((item) => (
          <CommandItem key={item} value={item} onSelect={onSelect}>
            {item}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  )
}

export default function CommandPage() {
  const [last, setLast] = useState("none")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [highlighted, setHighlighted] = useState("")

  // ⌘K / Ctrl+K opens the palette (the conventional shortcut).
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
        <Button variant="outline" onClick={() => setDialogOpen(true)} data-pg="cmd-dialog-trigger">
          Open palette
        </Button>
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
        <p>
          When <code>shouldFilter={"{false}"}</code>, the component does not
          score or reorder items. The consumer owns filtering and ordering
          entirely — useful for server-backed palettes.
        </p>
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

      <section className="pg-section">
        <h3>Fuzzy scoring and re-sort</h3>
        <p>
          Filtering now uses a fuzzy scorer (ported from cmdk's{" "}
          <code>command-score</code>, MIT) that ranks candidates by match
          quality and re-sorts the list via CSS <code>order</code>. Try
          typing <strong>"gp"</strong> — "Git Push" surfaces first because
          both initials match at word boundaries, even though "Grep" is
          authored earlier.
        </p>
        <p>
          A custom <code>filter</code> prop returning only 0 or 1 preserves
          DOM (authored) order — that is the back-compat story for anyone
          who wrote a binary filter before scoring existed.
        </p>
        <Command className="command--bordered" data-pg="cmd-fuzzy">
          <CommandInput placeholder='Try "gp"...' data-pg="cmd-fuzzy-input" />
          <CommandList data-pg="cmd-fuzzy-list">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Git">
              <CommandItem value="Git Status" onSelect={select} data-pg="cmd-item-git-status">
                Git Status
              </CommandItem>
              <CommandItem value="Git Commit" onSelect={select} data-pg="cmd-item-git-commit">
                Git Commit
              </CommandItem>
              <CommandItem value="Git Push" onSelect={select} data-pg="cmd-item-git-push">
                Git Push
              </CommandItem>
              <CommandItem value="Git Pull" onSelect={select} data-pg="cmd-item-git-pull">
                Git Pull
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="Tools">
              <CommandItem value="Grep" onSelect={select} data-pg="cmd-item-grep">
                Grep
              </CommandItem>
              <CommandItem value="Generate Report" onSelect={select} data-pg="cmd-item-gen-report">
                Generate Report
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </section>

      <section className="pg-section">
        <h3>Search-match highlighting (CSS Custom Highlight API)</h3>
        <p>
          When <code>shouldFilter</code> is on (the default), the command
          palette highlights substring matches via the{" "}
          <a href="https://developer.mozilla.org/en-US/docs/Web/API/CSS_Custom_Highlight_API">
            CSS Custom Highlight API
          </a>
          . No <code>&lt;mark&gt;</code> injection, no DOM mutation — the
          browser paints ranges directly over existing text nodes.
        </p>
        <p>
          Try typing <strong>"cal"</strong> in the default demo above — the
          matching substring is painted. For non-contiguous fuzzy matches
          (e.g. <strong>"gp"</strong> → "Git Push"), no highlight appears
          because there is no contiguous substring; the fuzzy scorer surfaced
          the item, but exact highlighting would mislead.
        </p>
        <p>
          <code>::highlight()</code> supports only{" "}
          <code>color</code>, <code>background-color</code>,{" "}
          <code>text-decoration</code>, and <code>text-shadow</code> — no
          padding, no border-radius. The visual is a translucent background
          tinted with <code>var(--primary)</code>.
        </p>
        <p>
          Progressive enhancement: in browsers without{" "}
          <code>CSS.highlights</code> the feature is simply absent —
          filtering still works, only the paint is missing. Supported in
          Chrome 105+, Edge 105+, Safari 17.2+, and Firefox 132+.
        </p>
      </section>

      <section className="pg-section">
        <h3>Async / loading</h3>
        <p>
          <code>CommandLoading</code> renders while an async filter is in
          flight (<code>aria-live="polite"</code>, <code>role="status"</code>).
          It suppresses the empty state so "No results" does not flash
          during the fetch.
        </p>
        <AsyncCommandDemo onSelect={select} />
      </section>
    </>
  )
}
