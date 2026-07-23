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
} from "../../ui/dropdown-menu/dropdown-menu.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/dropdown-menu/dropdown-menu.css"
import "../../ui/button/button.css"

export default function DropdownMenuPage() {
  const [lastAction, setLastAction] = useState("")

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
    </>
  )
}
