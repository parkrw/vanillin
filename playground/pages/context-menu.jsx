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

      <section className="pg-section">
        <h3>Default</h3>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          Last action: <span data-pg="context-readout">{lastAction}</span>{" "}
          bookmarks:<span data-pg="ctx-cb-readout">{showBookmarks ? "on" : "off"}</span>{" "}
          person:<span data-pg="ctx-radio-readout">{person}</span>
        </p>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <ContextMenu>
          <ContextMenuTrigger disabled data-pg="context-disabled-trigger" style={areaStyle}>
            Right click here (native menu)
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem>Never shown</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </section>
    </>
  )
}
