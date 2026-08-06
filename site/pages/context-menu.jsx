import { useState } from "react"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
} from "../../ui/context-menu/context-menu.jsx"
import "../../ui/context-menu/context-menu.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const areaStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "9rem",
  width: "100%",
  border: "1px dashed var(--border)",
  borderRadius: "var(--radius-md)",
  fontSize: "0.875rem",
  userSelect: "none",
}

export default function ContextMenuPage() {
  const [lastAction, setLastAction] = useState("")
  const [showBookmarks, setShowBookmarks] = useState(true)
  const [person, setPerson] = useState("pedro")

  return (
    <>
      <h2>Context Menu</h2>
      <p>A menu activated by right-click or long-press, anchored at the pointer — submenus, checkbox items, radio groups, and shortcuts included.</p>

      <InstallSnippet slug="context-menu" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuShortcut } from "./ui/context-menu/context-menu"
import "./ui/context-menu/context-menu.css"

<ContextMenu>
  <ContextMenuTrigger style={areaStyle}>
    Right click here
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem onSelect={() => handleAction("back")}>
      Back
      <ContextMenuShortcut>Ctrl+[</ContextMenuShortcut>
    </ContextMenuItem>
    <ContextMenuItem onSelect={() => handleAction("reload")}>
      Reload
      <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
    </ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`}>
          <ContextMenu>
            <ContextMenuTrigger data-pg="context-trigger" style={areaStyle}>
              Right click here
            </ContextMenuTrigger>
            <ContextMenuContent data-pg="context-menu">
              <ContextMenuItem onSelect={() => setLastAction("back")}>
                Back
                <ContextMenuShortcut>Ctrl+[</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem disabled>
                Forward
                <ContextMenuShortcut>Ctrl+]</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setLastAction("reload")}>
                Reload
                <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSub>
                <ContextMenuSubTrigger data-pg="ctx-sub-trigger">
                  More Tools
                </ContextMenuSubTrigger>
                <ContextMenuSubContent data-pg="ctx-sub-content">
                  <ContextMenuItem onSelect={() => setLastAction("save-page")}>
                    Save Page As...
                  </ContextMenuItem>
                  <ContextMenuItem onSelect={() => setLastAction("shortcut")}>
                    Create Shortcut...
                  </ContextMenuItem>
                  <ContextMenuSeparator />
                  <ContextMenuItem onSelect={() => setLastAction("dev-tools")}>
                    Developer Tools
                  </ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
              <ContextMenuItem data-pg="ctx-after-sub-item" onSelect={() => setLastAction("print")}>
                Print...
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuCheckboxItem
                data-pg="ctx-cb-bookmarks"
                checked={showBookmarks}
                onCheckedChange={setShowBookmarks}
              >
                Show Bookmarks Bar
              </ContextMenuCheckboxItem>
              <ContextMenuSeparator />
              <ContextMenuLabel>People</ContextMenuLabel>
              <ContextMenuRadioGroup value={person} onValueChange={setPerson}>
                <ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
                <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuContent>
          </ContextMenu>
          <p className="pg-desc">
            Last action: <span data-pg="context-readout">{lastAction}</span>{" "}
            bookmarks:<span data-pg="ctx-cb-readout">{showBookmarks ? "on" : "off"}</span>{" "}
            person:<span data-pg="ctx-radio-readout">{person}</span>
          </p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <ComponentPreview code={`<ContextMenu>
  <ContextMenuTrigger disabled style={areaStyle}>
    Right click here (native menu)
  </ContextMenuTrigger>
  <ContextMenuContent>
    <ContextMenuItem>Never shown</ContextMenuItem>
  </ContextMenuContent>
</ContextMenu>`}>
          <ContextMenu>
            <ContextMenuTrigger disabled data-pg="context-disabled-trigger" style={areaStyle}>
              Right click here (native menu)
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem>Never shown</ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "disabled", type: "boolean", default: "false", description: "On ContextMenuTrigger — lets the native context menu through instead" },
        { name: "onSelect", type: "(event) => void", description: "On ContextMenuItem — fires on click or Enter; preventDefault keeps the menu open" },
        { name: "checked", type: "boolean", description: "On ContextMenuCheckboxItem — controlled checked state" },
        { name: "onCheckedChange", type: "(checked: boolean) => void", description: "On ContextMenuCheckboxItem — called when toggled" },
        { name: "value", type: "string", description: "On ContextMenuRadioGroup — the currently selected radio value" },
        { name: "onValueChange", type: "(value: string) => void", description: "On ContextMenuRadioGroup — called when a radio item is selected" },
      ]} />
    </>
  )
}
