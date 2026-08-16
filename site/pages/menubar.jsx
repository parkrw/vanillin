import { useState } from "react"
import {
  Menubar,
  MenubarMenu,
  MenubarTrigger,
  MenubarContent,
  MenubarItem,
  MenubarSeparator,
  MenubarShortcut,
  MenubarCheckboxItem,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "../../ui/menubar/menubar.jsx"
import { DirectionProvider } from "../../lib/direction.jsx"
import "../../ui/menubar/menubar.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function MenubarPage() {
  const [lastAction, setLastAction] = useState("")
  const [showBookmarks, setShowBookmarks] = useState(true)
  const [profile, setProfile] = useState("benoit")
  const [wordWrap, setWordWrap] = useState(true)
  const [density, setDensity] = useState("comfortable")

  return (
    <>
      <h2>Menubar</h2>
      <p>A horizontal menu bar with keyboard-driven navigation. Menus open on click and switch on hover once one is open, like a native application menu.</p>

      <InstallSnippet slug="menubar" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarItem, MenubarShortcut, MenubarSeparator } from "./ui/menubar/menubar"
import "./ui/menubar/menubar.css"

<Menubar>
  <MenubarMenu>
    <MenubarTrigger>Actions</MenubarTrigger>
    <MenubarContent>
      <MenubarItem onSelect={() => run("deploy")}>
        Deploy
        <MenubarShortcut>Ctrl+D</MenubarShortcut>
      </MenubarItem>
      <MenubarSeparator />
      <MenubarItem onSelect={() => run("rollback")}>Roll back</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`}>
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>Actions</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={() => setLastAction("deploy")}>
                  Deploy
                  <MenubarShortcut>Ctrl+D</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={() => setLastAction("rollback")}>Roll back</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </ComponentPreview>
        <p className="pg-desc">
          Every menu needs its own <code>MenubarMenu</code>. The bar owns which one is open, so only one menu is ever mounted at a time.
        </p>
      </section>

      <section className="pg-section">
        <h3>Application menu</h3>
        <ComponentPreview code={`<Menubar>
  <MenubarMenu value="file">
    <MenubarTrigger>File</MenubarTrigger>
    <MenubarContent>
      <MenubarItem onSelect={() => handleAction("new-tab")}>
        New Tab
        <MenubarShortcut>Ctrl+T</MenubarShortcut>
      </MenubarItem>
      <MenubarItem onSelect={() => handleAction("new-window")}>
        New Window
        <MenubarShortcut>Ctrl+N</MenubarShortcut>
      </MenubarItem>
      <MenubarItem disabled>New Incognito Window</MenubarItem>
      <MenubarSeparator />
      <MenubarSub>
        <MenubarSubTrigger>Share</MenubarSubTrigger>
        <MenubarSubContent>
          <MenubarItem onSelect={() => handleAction("email-link")}>Email link</MenubarItem>
          <MenubarItem onSelect={() => handleAction("messages")}>Messages</MenubarItem>
          <MenubarItem onSelect={() => handleAction("notes")}>Notes</MenubarItem>
        </MenubarSubContent>
      </MenubarSub>
      <MenubarSeparator />
      <MenubarItem onSelect={() => handleAction("print")}>
        Print…
        <MenubarShortcut>Ctrl+P</MenubarShortcut>
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>

  <MenubarMenu value="view">
    <MenubarTrigger>View</MenubarTrigger>
    <MenubarContent>
      <MenubarCheckboxItem checked={showBookmarks} onCheckedChange={setShowBookmarks}>
        Always Show Bookmarks Bar
      </MenubarCheckboxItem>
      <MenubarSeparator />
      <MenubarItem onSelect={() => handleAction("reload")}>
        Reload
        <MenubarShortcut>Ctrl+R</MenubarShortcut>
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>

  <MenubarMenu value="profiles">
    <MenubarTrigger>Profiles</MenubarTrigger>
    <MenubarContent>
      <MenubarRadioGroup value={profile} onValueChange={setProfile}>
        <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
        <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
        <MenubarRadioItem value="luis">Luis</MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`}>
          <Menubar data-pg="menubar">
            <MenubarMenu value="file">
              <MenubarTrigger data-pg="mb-trigger-file">File</MenubarTrigger>
              <MenubarContent data-pg="mb-menu-file">
                <MenubarItem onSelect={() => setLastAction("new-tab")}>
                  New Tab
                  <MenubarShortcut>Ctrl+T</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => setLastAction("new-window")}>
                  New Window
                  <MenubarShortcut>Ctrl+N</MenubarShortcut>
                </MenubarItem>
                <MenubarItem disabled>New Incognito Window</MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger data-pg="mb-sub-trigger">Share</MenubarSubTrigger>
                  <MenubarSubContent data-pg="mb-sub-content">
                    <MenubarItem onSelect={() => setLastAction("email-link")}>
                      Email link
                    </MenubarItem>
                    <MenubarItem onSelect={() => setLastAction("messages")}>Messages</MenubarItem>
                    <MenubarItem onSelect={() => setLastAction("notes")}>Notes</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
                <MenubarSeparator />
                <MenubarItem onSelect={() => setLastAction("print")}>
                  Print…
                  <MenubarShortcut>Ctrl+P</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu value="edit">
              <MenubarTrigger data-pg="mb-trigger-edit">Edit</MenubarTrigger>
              <MenubarContent data-pg="mb-menu-edit">
                <MenubarItem onSelect={() => setLastAction("undo")}>
                  Undo
                  <MenubarShortcut>Ctrl+Z</MenubarShortcut>
                </MenubarItem>
                <MenubarItem onSelect={() => setLastAction("redo")}>
                  Redo
                  <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut>
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={() => setLastAction("cut")}>Cut</MenubarItem>
                <MenubarItem onSelect={() => setLastAction("copy")}>Copy</MenubarItem>
                <MenubarItem onSelect={() => setLastAction("paste")}>Paste</MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu value="view">
              <MenubarTrigger data-pg="mb-trigger-view">View</MenubarTrigger>
              <MenubarContent data-pg="mb-menu-view">
                <MenubarCheckboxItem
                  data-pg="mb-cb-bookmarks"
                  checked={showBookmarks}
                  onCheckedChange={setShowBookmarks}
                >
                  Always Show Bookmarks Bar
                </MenubarCheckboxItem>
                <MenubarSeparator />
                <MenubarItem onSelect={() => setLastAction("reload")}>
                  Reload
                  <MenubarShortcut>Ctrl+R</MenubarShortcut>
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>

            <MenubarMenu value="profiles">
              <MenubarTrigger data-pg="mb-trigger-profiles">Profiles</MenubarTrigger>
              <MenubarContent data-pg="mb-menu-profiles">
                <MenubarRadioGroup value={profile} onValueChange={setProfile}>
                  <MenubarRadioItem value="andy">Andy</MenubarRadioItem>
                  <MenubarRadioItem value="benoit">Benoit</MenubarRadioItem>
                  <MenubarRadioItem value="luis">Luis</MenubarRadioItem>
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          <p className="pg-desc">
            Last action: <span data-pg="mb-readout">{lastAction}</span> · bookmarks:{" "}
            <span data-pg="mb-cb-readout">{showBookmarks ? "on" : "off"}</span> · profile:{" "}
            <span data-pg="mb-radio-readout">{profile}</span>
          </p>
        </ComponentPreview>
        <p className="pg-desc">
          Click a trigger to open it, then hover the others to switch. Arrow keys move between triggers without opening anything, and once a menu is open they move between menus.
        </p>
      </section>

      <section className="pg-section">
        <h3>Submenus</h3>
        <ComponentPreview code={`<MenubarSub>
  <MenubarSubTrigger>Export as</MenubarSubTrigger>
  <MenubarSubContent>
    <MenubarItem>PNG</MenubarItem>
    <MenubarItem>SVG</MenubarItem>
    <MenubarItem>PDF</MenubarItem>
  </MenubarSubContent>
</MenubarSub>`}>
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>Insert</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={() => setLastAction("image")}>Image</MenubarItem>
                <MenubarItem onSelect={() => setLastAction("table")}>Table</MenubarItem>
                <MenubarSeparator />
                <MenubarSub>
                  <MenubarSubTrigger>Export as</MenubarSubTrigger>
                  <MenubarSubContent>
                    <MenubarItem onSelect={() => setLastAction("png")}>PNG</MenubarItem>
                    <MenubarItem onSelect={() => setLastAction("svg")}>SVG</MenubarItem>
                    <MenubarItem onSelect={() => setLastAction("pdf")}>PDF</MenubarItem>
                  </MenubarSubContent>
                </MenubarSub>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </ComponentPreview>
        <p className="pg-desc">
          ArrowRight on a sub trigger opens the submenu; on any other item it jumps to the next menu in the bar. ArrowLeft inside a submenu closes only the submenu and leaves the parent open.
        </p>
      </section>

      <section className="pg-section">
        <h3>Checkbox and radio items</h3>
        <ComponentPreview code={`<MenubarCheckboxItem checked={wordWrap} onCheckedChange={setWordWrap}>
  Word wrap
</MenubarCheckboxItem>
<MenubarSeparator />
<MenubarRadioGroup value={density} onValueChange={setDensity}>
  <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
  <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
</MenubarRadioGroup>`}>
          <div>
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Editor</MenubarTrigger>
                <MenubarContent>
                  <MenubarCheckboxItem checked={wordWrap} onCheckedChange={setWordWrap}>
                    Word wrap
                  </MenubarCheckboxItem>
                  <MenubarSeparator />
                  <MenubarRadioGroup value={density} onValueChange={setDensity}>
                    <MenubarRadioItem value="compact">Compact</MenubarRadioItem>
                    <MenubarRadioItem value="comfortable">Comfortable</MenubarRadioItem>
                  </MenubarRadioGroup>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
            <p className="pg-desc">
              Word wrap: {wordWrap ? "on" : "off"} · density: {density}
            </p>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Both items are controlled: the bar reports the change and closes, and the state lives in your component. Reopen the menu and the indicators reflect it.
        </p>
      </section>

      <section className="pg-section">
        <h3>Disabled triggers and items</h3>
        <ComponentPreview code={`<MenubarTrigger disabled>Debug</MenubarTrigger>`}>
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>Window</MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={() => setLastAction("minimize")}>Minimize</MenubarItem>
                <MenubarItem disabled>Merge All Windows</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger disabled>Debug</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Attach process</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </ComponentPreview>
        <p className="pg-desc">
          A disabled trigger drops out of the roving tabindex, so Home, End, and the arrow keys step over it rather than parking focus on something that cannot open.
        </p>
      </section>

      <section className="pg-section">
        <h3>RTL</h3>
        <ComponentPreview code={`<DirectionProvider dir="rtl">
  <Menubar>
    <MenubarMenu>
      <MenubarTrigger>ملف</MenubarTrigger>
      <MenubarContent>
        <MenubarItem>جديد</MenubarItem>
        <MenubarSub>
          <MenubarSubTrigger>مشاركة</MenubarSubTrigger>
          <MenubarSubContent>
            <MenubarItem>بريد إلكتروني</MenubarItem>
            <MenubarItem>رسائل</MenubarItem>
          </MenubarSubContent>
        </MenubarSub>
      </MenubarContent>
    </MenubarMenu>
  </Menubar>
</DirectionProvider>`}>
          <DirectionProvider dir="rtl">
            <div dir="rtl">
              <Menubar>
                <MenubarMenu>
                  <MenubarTrigger>ملف</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>جديد</MenubarItem>
                    <MenubarSub>
                      <MenubarSubTrigger>مشاركة</MenubarSubTrigger>
                      <MenubarSubContent>
                        <MenubarItem>بريد إلكتروني</MenubarItem>
                        <MenubarItem>رسائل</MenubarItem>
                      </MenubarSubContent>
                    </MenubarSub>
                  </MenubarContent>
                </MenubarMenu>
                <MenubarMenu>
                  <MenubarTrigger>تحرير</MenubarTrigger>
                  <MenubarContent>
                    <MenubarItem>تراجع</MenubarItem>
                    <MenubarItem>إعادة</MenubarItem>
                  </MenubarContent>
                </MenubarMenu>
              </Menubar>
            </div>
          </DirectionProvider>
        </ComponentPreview>
        <p className="pg-desc">
          Under RTL the bar reads right to left and the arrow keys follow: ArrowLeft moves to the next trigger. Menus and submenus anchor from the inline start.
        </p>
      </section>

      <ApiReference props={[
        { name: "value", type: "string", description: "On MenubarMenu, a unique value identifying the menu" },
        { name: "onSelect", type: "(event) => void", description: "On MenubarItem, fires on activation" },
        { name: "disabled", type: "boolean", default: "false", description: "On MenubarItem, skipped by arrow nav and not activatable" },
        { name: "checked", type: "boolean", description: "On MenubarCheckboxItem, controlled checked state" },
        { name: "onCheckedChange", type: "(checked: boolean) => void", description: "On MenubarCheckboxItem, called when toggled" },
      ]} />
    </>
  )
}
