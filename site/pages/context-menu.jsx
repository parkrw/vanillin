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
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(false)

  return (
    <>
      <h2>Context Menu</h2>
      <p>A menu activated by right-click or long-press and anchored at the pointer, with submenus, checkbox items, radio groups, and shortcuts.</p>

      <InstallSnippet slug="context-menu" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<ContextMenuContent>
  <ContextMenuItem onSelect={() => handleAction("back")}>
    Back
    <ContextMenuShortcut>Ctrl+[</ContextMenuShortcut>
  </ContextMenuItem>
  <ContextMenuItem disabled>
    Forward
    <ContextMenuShortcut>Ctrl+]</ContextMenuShortcut>
  </ContextMenuItem>
  <ContextMenuSub>
    <ContextMenuSubTrigger>More Tools</ContextMenuSubTrigger>
    <ContextMenuSubContent>
      <ContextMenuItem>Save Page As...</ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem>Developer Tools</ContextMenuItem>
    </ContextMenuSubContent>
  </ContextMenuSub>
  <ContextMenuSeparator />
  <ContextMenuCheckboxItem checked={showBookmarks} onCheckedChange={setShowBookmarks}>
    Show Bookmarks Bar
  </ContextMenuCheckboxItem>
  <ContextMenuSeparator />
  <ContextMenuLabel>People</ContextMenuLabel>
  <ContextMenuRadioGroup value={person} onValueChange={setPerson}>
    <ContextMenuRadioItem value="pedro">Pedro Duarte</ContextMenuRadioItem>
    <ContextMenuRadioItem value="colm">Colm Tuite</ContextMenuRadioItem>
  </ContextMenuRadioGroup>
</ContextMenuContent>`}>
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
        <p className="pg-desc">
          Every item type from the dropdown menu is available here: disabled items, shortcuts, a submenu, checkbox items, a label, and a radio group.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuItem, ContextMenuShortcut } from "./ui/context-menu/context-menu"
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
            <ContextMenuTrigger style={areaStyle}>Right click here</ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => setLastAction("back")}>
                Back
                <ContextMenuShortcut>Ctrl+[</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem onSelect={() => setLastAction("reload")}>
                Reload
                <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </ComponentPreview>
        <p className="pg-desc">
          The trigger is any element you want to make right-clickable. The menu opens at the pointer rather than at the trigger's edge, so where you click is where it appears.
        </p>
      </section>

      <section className="pg-section">
        <h3>Submenu on hover and keyboard</h3>
        <ComponentPreview code={`<ContextMenuSub>
  <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
  <ContextMenuSubContent>
    <ContextMenuItem>Archive</ContextMenuItem>
    <ContextMenuItem>Spam</ContextMenuItem>
    <ContextMenuItem>Trash</ContextMenuItem>
  </ContextMenuSubContent>
</ContextMenuSub>`}>
          <ContextMenu>
            <ContextMenuTrigger style={areaStyle}>Right click this message</ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => setLastAction("reply")}>Reply</ContextMenuItem>
              <ContextMenuItem onSelect={() => setLastAction("forward")}>Forward</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuSub>
                <ContextMenuSubTrigger>Move to</ContextMenuSubTrigger>
                <ContextMenuSubContent>
                  <ContextMenuItem onSelect={() => setLastAction("archive")}>Archive</ContextMenuItem>
                  <ContextMenuItem onSelect={() => setLastAction("spam")}>Spam</ContextMenuItem>
                  <ContextMenuItem onSelect={() => setLastAction("trash")}>Trash</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuContent>
          </ContextMenu>
        </ComponentPreview>
        <p className="pg-desc">
          A submenu opens on hover after a short delay and on ArrowRight from the keyboard. ArrowLeft closes it and returns focus to the sub trigger.
        </p>
      </section>

      <section className="pg-section">
        <h3>Checkbox items</h3>
        <ComponentPreview code={`<ContextMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
  Show grid
</ContextMenuCheckboxItem>
<ContextMenuCheckboxItem checked={snapToGrid} onCheckedChange={setSnapToGrid}>
  Snap to grid
</ContextMenuCheckboxItem>`}>
          <div style={{ width: "100%" }}>
            <ContextMenu>
              <ContextMenuTrigger style={areaStyle}>Right click the canvas</ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel>Canvas</ContextMenuLabel>
                <ContextMenuCheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
                  Show grid
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem checked={snapToGrid} onCheckedChange={setSnapToGrid}>
                  Snap to grid
                </ContextMenuCheckboxItem>
              </ContextMenuContent>
            </ContextMenu>
            <p className="pg-desc">
              Grid: {showGrid ? "shown" : "hidden"} · snapping: {snapToGrid ? "on" : "off"}
            </p>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Selecting an item closes the menu by default. Call <code>event.preventDefault()</code> in <code>onSelect</code> to keep it open for a run of toggles.
        </p>
      </section>

      <section className="pg-section">
        <h3>Destructive item</h3>
        <ComponentPreview code={`<ContextMenuItem
  style={{ color: "var(--destructive)" }}
  onSelect={() => remove()}
>
  Delete file
  <ContextMenuShortcut>Del</ContextMenuShortcut>
</ContextMenuItem>`}>
          <ContextMenu>
            <ContextMenuTrigger style={areaStyle}>Right click the file</ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onSelect={() => setLastAction("rename")}>Rename</ContextMenuItem>
              <ContextMenuItem onSelect={() => setLastAction("duplicate")}>Duplicate</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem
                style={{ color: "var(--destructive)" }}
                onSelect={() => setLastAction("delete")}
              >
                Delete file
                <ContextMenuShortcut>Del</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </ComponentPreview>
        <p className="pg-desc">
          There is no destructive variant baked in. Separate the dangerous item and colour it with <code>--destructive</code> so it reads as the odd one out.
        </p>
      </section>

      <section className="pg-section">
        <h3>Disabled trigger</h3>
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
        <p className="pg-desc">
          A disabled trigger does not swallow the event, so the browser's own context menu appears. That matters over text and images, where the native menu carries copy and save.
        </p>
      </section>

      <ApiReference props={[
        { name: "disabled", type: "boolean", default: "false", description: "On ContextMenuTrigger, lets the native context menu through instead" },
        { name: "onSelect", type: "(event) => void", description: "On ContextMenuItem, fires on click or Enter; preventDefault keeps the menu open" },
        { name: "checked", type: "boolean", description: "On ContextMenuCheckboxItem, controlled checked state" },
        { name: "onCheckedChange", type: "(checked: boolean) => void", description: "On ContextMenuCheckboxItem, called when toggled" },
        { name: "value", type: "string", description: "On ContextMenuRadioGroup, the currently selected radio value" },
        { name: "onValueChange", type: "(value: string) => void", description: "On ContextMenuRadioGroup, called when a radio item is selected" },
      ]} />
    </>
  )
}
