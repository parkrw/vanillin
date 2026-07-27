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

export default function MenubarPage() {
  const [lastAction, setLastAction] = useState("")
  const [showBookmarks, setShowBookmarks] = useState(true)
  const [profile, setProfile] = useState("benoit")

  return (
    <>
      <h2>Menubar</h2>

      <section className="pg-section">
        <h3>Default</h3>
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
        <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
          Last action: <span data-pg="mb-readout">{lastAction}</span> · bookmarks:{" "}
          <span data-pg="mb-cb-readout">{showBookmarks ? "on" : "off"}</span> · profile:{" "}
          <span data-pg="mb-radio-readout">{profile}</span>
        </p>
      </section>

      <section className="pg-section">
        <h3>RTL</h3>
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
      </section>
    </>
  )
}
