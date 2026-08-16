import { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "../../ui/dropdown-menu/dropdown-menu.jsx"
import { DirectionProvider } from "../../lib/direction.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/dropdown-menu/dropdown-menu.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function DropdownMenuPage() {
  const [lastAction, setLastAction] = useState("")

  const [statusBar, setStatusBar] = useState(false)
  const [activityBar, setActivityBar] = useState(true)

  const [position, setPosition] = useState("bottom")

  return (
    <>
      <h2>Dropdown Menu</h2>
      <p>A menu of actions anchored to a trigger button, with groups, shortcuts, disabled items, submenus, checkbox items, and radio items.</p>

      <InstallSnippet slug="dropdown-menu" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<DropdownMenu>
  <DropdownMenuTrigger as={Button} variant="outline">
    Actions
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={() => handleAction("profile")}>
      Profile
      <DropdownMenuShortcut>Ctrl+P</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => handleAction("logout")}>
      Log out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}>
          <DropdownMenu>
            <DropdownMenuTrigger as={Button} variant="outline" data-pg="dropdown-trigger">
              Actions
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onSelect={() => setLastAction("profile")}>
                  Profile
                  <DropdownMenuShortcut>Ctrl+P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLastAction("settings")}>
                  Settings
                  <DropdownMenuShortcut>Ctrl+,</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  Billing (disabled)
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                data-pg="prevent-close-item"
                onSelect={(e) => {
                  e.preventDefault()
                  setLastAction("toggled (stays open)")
                }}
              >
                Toggle option (stays open)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setLastAction("logout")}>
                Log out
                <DropdownMenuShortcut>Ctrl+Q</DropdownMenuShortcut>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="pg-desc">
            Last action: <span data-pg="dropdown-readout">{lastAction}</span>
          </p>
        </ComponentPreview>
        <p className="pg-desc">
          Selecting an item closes the menu. Call <code>event.preventDefault()</code> inside <code>onSelect</code> to keep it open, which is what the third item here does.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut } from "./ui/dropdown-menu/dropdown-menu"
import "./ui/dropdown-menu/dropdown-menu.css"

<DropdownMenu>
  <DropdownMenuTrigger as={Button} variant="outline">
    Options
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem onSelect={() => handleAction("profile")}>
      Profile
      <DropdownMenuShortcut>Ctrl+P</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem onSelect={() => handleAction("logout")}>
      Log out
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`}>
          <DropdownMenu>
            <DropdownMenuTrigger as={Button} variant="outline">
              Options
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setLastAction("profile")}>
                Profile
                <DropdownMenuShortcut>Ctrl+P</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setLastAction("logout")}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ComponentPreview>
        <p className="pg-desc">
          The trigger is whatever you pass to <code>as</code>. It gets <code>aria-haspopup</code>, <code>aria-expanded</code>, and the keyboard wiring; the styling stays yours.
        </p>
      </section>

      <section className="pg-section">
        <h3>Alignment</h3>
        <ComponentPreview code={`<DropdownMenuContent align="end">…</DropdownMenuContent>`}>
          <div className="pg-row">
            <DropdownMenu>
              <DropdownMenuTrigger as={Button} variant="outline">
                Aligned start
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onSelect={() => setLastAction("rename")}>Rename</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLastAction("archive")}>Archive</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger as={Button} variant="outline">
                Aligned end
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={() => setLastAction("duplicate")}>Duplicate</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setLastAction("export")}>Export</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Align the menu to the edge of the trigger nearest the viewport edge, so a menu on the right of a toolbar grows inward rather than off-screen.
        </p>
      </section>

      <section className="pg-section">
        <h3>Checkbox Items</h3>
        <ComponentPreview code={`<DropdownMenu>
  <DropdownMenuTrigger as={Button} variant="outline">View</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Panels</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuCheckboxItem checked={statusBar} onCheckedChange={setStatusBar}>
      Status Bar
    </DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem checked={activityBar} onCheckedChange={setActivityBar}>
      Activity Bar
    </DropdownMenuCheckboxItem>
  </DropdownMenuContent>
</DropdownMenu>`}>
          <DropdownMenu>
            <DropdownMenuTrigger as={Button} variant="outline" data-pg="checkbox-trigger">
              View
            </DropdownMenuTrigger>
            <DropdownMenuContent data-pg="checkbox-menu">
              <DropdownMenuLabel>Panels</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                data-pg="cb-statusbar"
                checked={statusBar}
                onCheckedChange={setStatusBar}
              >
                Status Bar
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                data-pg="cb-activity"
                checked={activityBar}
                onCheckedChange={setActivityBar}
              >
                Activity Bar
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="pg-desc">
            <span data-pg="cb-readout">
              statusbar:{statusBar ? "on" : "off"} activity:{activityBar ? "on" : "off"}
            </span>
          </p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Radio Group</h3>
        <ComponentPreview code={`<DropdownMenu>
  <DropdownMenuTrigger as={Button} variant="outline">Position</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
      <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>
  </DropdownMenuContent>
</DropdownMenu>`}>
          <DropdownMenu>
            <DropdownMenuTrigger as={Button} variant="outline" data-pg="radio-trigger">
              Position
            </DropdownMenuTrigger>
            <DropdownMenuContent data-pg="radio-menu">
              <DropdownMenuLabel>Panel Position</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
                <DropdownMenuRadioItem value="top">Top</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="bottom">Bottom</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="right">Right</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="pg-desc">
            Position: <span data-pg="radio-readout">{position}</span>
          </p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Submenu</h3>
        <ComponentPreview code={`<DropdownMenu>
  <DropdownMenuTrigger as={Button} variant="outline">Invite</DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem>Email</DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>Email</DropdownMenuItem>
        <DropdownMenuItem>Message</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>More...</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  </DropdownMenuContent>
</DropdownMenu>`}>
          <DropdownMenu>
            <DropdownMenuTrigger as={Button} variant="outline" data-pg="submenu-trigger">
              Invite
            </DropdownMenuTrigger>
            <DropdownMenuContent data-pg="submenu-menu">
              <DropdownMenuItem onSelect={() => setLastAction("email")}>
                Email
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger data-pg="sub-trigger">
                  Invite users
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent data-pg="sub-content">
                  <DropdownMenuItem onSelect={() => setLastAction("sub-email")}>
                    Email
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setLastAction("sub-message")}>
                    Message
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => setLastAction("sub-more")}>
                    More...
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem data-pg="after-sub-item" onSelect={() => setLastAction("other")}>
                Other action
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Submenu (RTL)</h3>
        <DirectionProvider dir="rtl">
          <DropdownMenu>
            <DropdownMenuTrigger as={Button} variant="outline">
              RTL menu
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Item one</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>More options</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem>Sub item A</DropdownMenuItem>
                  <DropdownMenuItem>Sub item B</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem>Item two</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </DirectionProvider>
      </section>

      <ApiReference props={[
        { name: "onSelect", type: "(event) => void", description: "On DropdownMenuItem, fires on activation; preventDefault keeps the menu open" },
        { name: "disabled", type: "boolean", default: "false", description: "On DropdownMenuItem, skipped by arrow nav and not activatable" },
        { name: "checked", type: "boolean", description: "On DropdownMenuCheckboxItem, controlled checked state" },
        { name: "onCheckedChange", type: "(checked: boolean) => void", description: "On DropdownMenuCheckboxItem, called when toggled" },
        { name: "value", type: "string", description: "On DropdownMenuRadioGroup, the currently selected radio value" },
        { name: "onValueChange", type: "(value: string) => void", description: "On DropdownMenuRadioGroup, called when a radio item is selected" },
      ]} />
    </>
  )
}
