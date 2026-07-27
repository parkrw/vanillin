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

export default function DropdownMenuPage() {
  const [lastAction, setLastAction] = useState("")

  // Checkbox state
  const [statusBar, setStatusBar] = useState(false)
  const [activityBar, setActivityBar] = useState(true)

  // Radio state
  const [position, setPosition] = useState("bottom")

  return (
    <>
      <h2>Dropdown Menu</h2>

      <section className="pg-section">
        <h3>Default</h3>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          Last action: <span data-pg="dropdown-readout">{lastAction}</span>
        </p>
      </section>

      <section className="pg-section">
        <h3>Checkbox Items</h3>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          <span data-pg="cb-readout">
            statusbar:{statusBar ? "on" : "off"} activity:{activityBar ? "on" : "off"}
          </span>
        </p>
      </section>

      <section className="pg-section">
        <h3>Radio Group</h3>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          Position: <span data-pg="radio-readout">{position}</span>
        </p>
      </section>
      <section className="pg-section">
        <h3>Submenu</h3>
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
    </>
  )
}
