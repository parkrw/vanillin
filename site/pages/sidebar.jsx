import { useState } from "react"
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarRail,
  SidebarInset,
  SidebarHeader,
  SidebarFooter,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  SidebarInput,
  useSidebar,
} from "../../ui/sidebar/sidebar.jsx"
import "../../ui/sidebar/sidebar.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const IconHome = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
)
const IconInbox = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
)
const IconCalendar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
)
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
)
const IconSettings = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
)
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
)

function SidebarStateDisplay() {
  const { state, open, isMobile, openMobile } = useSidebar()
  return (
    <div style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
      <p>state: <strong>{state}</strong></p>
      <p>open: <strong>{String(open)}</strong></p>
      <p>isMobile: <strong>{String(isMobile)}</strong></p>
      <p>openMobile: <strong>{String(openMobile)}</strong></p>
      <p style={{ marginTop: "0.5rem" }}>
        Toggle with <kbd style={{ fontSize: "0.75rem", padding: "0.125rem 0.25rem", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--muted)" }}>Cmd+B</kbd>
      </p>
    </div>
  )
}

function DemoSidebar({ variant = "sidebar", collapsible = "offcanvas", side = "left" }) {
  return (
    <Sidebar variant={variant} collapsible={collapsible} side={side}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton as="a" href="#sidebar" isActive tooltip="Acme Inc">
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1rem", height: "1rem", borderRadius: "var(--radius-sm)", background: "var(--sidebar-primary)", color: "var(--sidebar-primary-foreground)", fontSize: "0.625rem", fontWeight: 700 }}>A</span>
              <span>Acme Inc</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarInput placeholder="Search..." />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupAction title="Add project"><IconPlus /></SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Home">
                  <IconHome />
                  <span>Home</span>
                </SidebarMenuButton>
                <SidebarMenuBadge>24</SidebarMenuBadge>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Inbox">
                  <IconInbox />
                  <span>Inbox</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Calendar">
                  <IconCalendar />
                  <span>Calendar</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Search">
                  <IconSearch />
                  <span>Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Design Engineering">
                  <span>Design Engineering</span>
                </SidebarMenuButton>
                <SidebarMenuAction title="More"><IconPlus /></SidebarMenuAction>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <span>Sales &amp; Marketing</span>
                </SidebarMenuButton>
                <SidebarMenuSub>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="#sidebar" isActive>
                      <span>Overview</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton href="#sidebar">
                      <span>Analytics</span>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                </SidebarMenuSub>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Loading...</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
              <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Settings">
              <IconSettings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

const miniFrame = (h = "14rem") => ({
  position: "relative",
  height: h,
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-lg)",
  overflow: "hidden",
  contain: "layout size",
})

export default function SidebarPage() {
  const [variant, setVariant] = useState("sidebar")
  const [collapsible, setCollapsible] = useState("offcanvas")

  return (
    <>
      <h2>Sidebar</h2>
      <p>A collapsible navigation panel with icon-only, offcanvas, and floating modes. Swaps to a sheet on mobile via <code>matchMedia</code>, persists state in a cookie, and toggles with <kbd>Cmd+B</kbd>.</p>

      <InstallSnippet slug="sidebar" />

      <section className="pg-section" data-pg="sb-main">
        <h3>Default</h3>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.8125rem" }}>
            variant:{" "}
            <select value={variant} onChange={(e) => setVariant(e.target.value)} style={{ fontSize: "0.8125rem" }}>
              <option>sidebar</option>
              <option>floating</option>
              <option>inset</option>
            </select>
          </label>
          <label style={{ fontSize: "0.8125rem" }}>
            collapsible:{" "}
            <select value={collapsible} onChange={(e) => setCollapsible(e.target.value)} style={{ fontSize: "0.8125rem" }}>
              <option>offcanvas</option>
              <option>icon</option>
              <option>none</option>
            </select>
          </label>
        </div>
        <div
          className="sidebar-demo-frame"
          style={{
            position: "relative",
            height: "32rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            contain: "layout size",
          }}
        >
          <SidebarProvider
            defaultOpen
            style={{
              "--sidebar-width": "16rem",
              "--sidebar-width-icon": "3rem",
              minHeight: "100%",
            }}
          >
            <DemoSidebar variant={variant} collapsible={collapsible} />
            <SidebarInset>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <SidebarTrigger />
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Dashboard</span>
              </div>
              <SidebarStateDisplay />
            </SidebarInset>
          </SidebarProvider>
        </div>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import {
  SidebarProvider, Sidebar, SidebarTrigger, SidebarInset,
  SidebarContent, SidebarGroup, SidebarGroupLabel,
  SidebarGroupContent, SidebarMenu, SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar/sidebar"
import "./ui/sidebar/sidebar.css"

<SidebarProvider>
  <Sidebar>
    <SidebarContent>
      <SidebarGroup>
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton>Home</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
  </Sidebar>
  <SidebarInset>
    <SidebarTrigger />
    {/* page content */}
  </SidebarInset>
</SidebarProvider>`}>
          <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>See the live demos below.</p>
        </ComponentPreview>
      </section>

      <section className="pg-section" data-pg="sb-icon">
        <h3>Icon collapsible (starts collapsed)</h3>
        <div
          className="sidebar-demo-frame"
          style={{
            position: "relative",
            height: "24rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            contain: "layout size",
          }}
        >
          <SidebarProvider defaultOpen={false}>
            <DemoSidebar variant="sidebar" collapsible="icon" />
            <SidebarInset>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <SidebarTrigger />
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Icon Mode</span>
              </div>
              <SidebarStateDisplay />
            </SidebarInset>
          </SidebarProvider>
        </div>
      </section>

      <section className="pg-section" data-pg="sb-right">
        <h3>Right side</h3>
        <div
          className="sidebar-demo-frame"
          style={{
            position: "relative",
            height: "20rem",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            contain: "layout size",
          }}
        >
          <SidebarProvider defaultOpen>
            <SidebarInset>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", borderBottom: "1px solid var(--border)" }}>
                <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>Right Sidebar</span>
                <SidebarTrigger style={{ marginInlineStart: "auto" }} />
              </div>
            </SidebarInset>
            <DemoSidebar variant="sidebar" collapsible="offcanvas" side="right" />
          </SidebarProvider>
        </div>
      </section>

      {/* ── Focused feature demos ─────────────────────────────── */}

      <section className="pg-section">
        <h3>Groups with labels and actions</h3>
        <p>
          <code>SidebarGroupLabel</code> titles a group. <code>SidebarGroupAction</code> renders an icon button pinned to the group header, typically used for "add" or "create" shortcuts.
        </p>
        <ComponentPreview code={`<SidebarGroup>
  <SidebarGroupLabel>Workspace</SidebarGroupLabel>
  <SidebarGroupAction title="Create new">
    <PlusIcon />
  </SidebarGroupAction>
  <SidebarGroupContent>
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton>Team Board</SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton>Sprint View</SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  </SidebarGroupContent>
</SidebarGroup>`}>
          <div style={miniFrame()}>
            <SidebarProvider style={{ "--sidebar-width": "16rem", minHeight: "100%" }}>
              <Sidebar collapsible="none">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Workspace</SidebarGroupLabel>
                    <SidebarGroupAction title="Create new"><IconPlus /></SidebarGroupAction>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton>Team Board</SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>Sprint View</SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                  <SidebarGroup>
                    <SidebarGroupLabel>Resources</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton>Wiki</SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
              <SidebarInset>
                <div style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                  Content area
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Badges and active state</h3>
        <p>
          <code>SidebarMenuBadge</code> shows a count or label to the right of a menu item. Set <code>isActive</code> on <code>SidebarMenuButton</code> to highlight the current page.
        </p>
        <ComponentPreview code={`<SidebarMenu>
  <SidebarMenuItem>
    <SidebarMenuButton isActive>
      <InboxIcon />
      <span>Alerts</span>
    </SidebarMenuButton>
    <SidebarMenuBadge>5</SidebarMenuBadge>
  </SidebarMenuItem>
  <SidebarMenuItem>
    <SidebarMenuButton>
      <HomeIcon />
      <span>Mentions</span>
    </SidebarMenuButton>
    <SidebarMenuBadge>12</SidebarMenuBadge>
  </SidebarMenuItem>
</SidebarMenu>`}>
          <div style={miniFrame("12rem")}>
            <SidebarProvider style={{ "--sidebar-width": "16rem", minHeight: "100%" }}>
              <Sidebar collapsible="none">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Activity</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton isActive>
                            <IconInbox />
                            <span>Alerts</span>
                          </SidebarMenuButton>
                          <SidebarMenuBadge>5</SidebarMenuBadge>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>
                            <IconHome />
                            <span>Mentions</span>
                          </SidebarMenuButton>
                          <SidebarMenuBadge>12</SidebarMenuBadge>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
              <SidebarInset>
                <div style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                  Content area
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Menu actions</h3>
        <p>
          <code>SidebarMenuAction</code> places an action button next to a menu item. Pass <code>showOnHover</code> to reveal it only when the row is hovered.
        </p>
        <ComponentPreview code={`<SidebarMenu>
  <SidebarMenuItem>
    <SidebarMenuButton>Shared Files</SidebarMenuButton>
    <SidebarMenuAction showOnHover title="Add file">
      <PlusIcon />
    </SidebarMenuAction>
  </SidebarMenuItem>
  <SidebarMenuItem>
    <SidebarMenuButton>Media Library</SidebarMenuButton>
    <SidebarMenuAction title="Upload">
      <PlusIcon />
    </SidebarMenuAction>
  </SidebarMenuItem>
</SidebarMenu>`}>
          <div style={miniFrame("12rem")}>
            <SidebarProvider style={{ "--sidebar-width": "16rem", minHeight: "100%" }}>
              <Sidebar collapsible="none">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Files</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton>Shared Files</SidebarMenuButton>
                          <SidebarMenuAction showOnHover title="Add file"><IconPlus /></SidebarMenuAction>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>Media Library</SidebarMenuButton>
                          <SidebarMenuAction title="Upload"><IconPlus /></SidebarMenuAction>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
              <SidebarInset>
                <div style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                  Hover a row to reveal the add action
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Sub-menus</h3>
        <p>
          <code>SidebarMenuSub</code> nests a second-level list under a parent item. <code>SidebarMenuSubButton</code> renders as an anchor by default; set <code>isActive</code> on the current page.
        </p>
        <ComponentPreview code={`<SidebarMenu>
  <SidebarMenuItem>
    <SidebarMenuButton>Preferences</SidebarMenuButton>
    <SidebarMenuSub>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton isActive>General</SidebarMenuSubButton>
      </SidebarMenuSubItem>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton>Display</SidebarMenuSubButton>
      </SidebarMenuSubItem>
      <SidebarMenuSubItem>
        <SidebarMenuSubButton>Privacy</SidebarMenuSubButton>
      </SidebarMenuSubItem>
    </SidebarMenuSub>
  </SidebarMenuItem>
</SidebarMenu>`}>
          <div style={miniFrame()}>
            <SidebarProvider style={{ "--sidebar-width": "16rem", minHeight: "100%" }}>
              <Sidebar collapsible="none">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Account</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton>Preferences</SidebarMenuButton>
                          <SidebarMenuSub>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton href="#sidebar" isActive>General</SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton href="#sidebar">Display</SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton href="#sidebar">Privacy</SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </SidebarMenuSub>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
              <SidebarInset>
                <div style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                  Content area
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Skeleton loading</h3>
        <p>
          <code>SidebarMenuSkeleton</code> renders a pulsing placeholder while menu content is loading. Pass <code>showIcon</code> to include an icon-sized skeleton.
        </p>
        <ComponentPreview code={`<SidebarMenu>
  <SidebarMenuItem>
    <SidebarMenuSkeleton showIcon />
  </SidebarMenuItem>
  <SidebarMenuItem>
    <SidebarMenuSkeleton showIcon />
  </SidebarMenuItem>
  <SidebarMenuItem>
    <SidebarMenuSkeleton />
  </SidebarMenuItem>
</SidebarMenu>`}>
          <div style={miniFrame("12rem")}>
            <SidebarProvider style={{ "--sidebar-width": "16rem", minHeight: "100%" }}>
              <Sidebar collapsible="none">
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Loading...</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuSkeleton showIcon /></SidebarMenuItem>
                        <SidebarMenuItem><SidebarMenuSkeleton /></SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
              </Sidebar>
              <SidebarInset>
                <div style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                  Content area
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Non-collapsible with search</h3>
        <p>
          Set <code>collapsible="none"</code> for a sidebar that is always fully visible. <code>SidebarInput</code> extends the base <code>Input</code> component with sidebar-specific sizing and is typically placed in a <code>SidebarHeader</code>.
        </p>
        <ComponentPreview code={`<Sidebar collapsible="none">
  <SidebarHeader>
    <SidebarInput placeholder="Filter..." />
  </SidebarHeader>
  <SidebarSeparator />
  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Summary</SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton>Reports</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>
</Sidebar>`}>
          <div style={miniFrame()}>
            <SidebarProvider style={{ "--sidebar-width": "16rem", minHeight: "100%" }}>
              <Sidebar collapsible="none">
                <SidebarHeader>
                  <SidebarInput placeholder="Filter..." />
                </SidebarHeader>
                <SidebarSeparator />
                <SidebarContent>
                  <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                      <SidebarMenu>
                        <SidebarMenuItem>
                          <SidebarMenuButton>Summary</SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                          <SidebarMenuButton>Reports</SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton>
                        <IconSettings />
                        <span>Config</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarFooter>
              </Sidebar>
              <SidebarInset>
                <div style={{ padding: "1rem", fontSize: "0.8125rem", color: "var(--muted-foreground)" }}>
                  Content area
                </div>
              </SidebarInset>
            </SidebarProvider>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference title="Sidebar" props={[
        { name: "variant", type: '"sidebar" | "floating" | "inset"', default: '"sidebar"', description: "Visual style of the sidebar" },
        { name: "collapsible", type: '"offcanvas" | "icon" | "none"', default: '"offcanvas"', description: "Collapse behavior: fully hidden, icon-only strip, or always visible" },
        { name: "side", type: '"left" | "right"', default: '"left"', description: "Which edge the sidebar sits on" },
      ]} />

      <ApiReference title="SidebarProvider" props={[
        { name: "defaultOpen", type: "boolean", default: "true", description: "Initial open state (uncontrolled)" },
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
      ]} />

      <ApiReference title="SidebarMenuButton" props={[
        { name: "as", type: "ElementType", default: '"button"', description: "Render as a different element or component" },
        { name: "isActive", type: "boolean", default: "false", description: "Highlight this item as the current page" },
        { name: "variant", type: '"default" | "outline"', default: '"default"', description: "Visual style" },
        { name: "size", type: '"default" | "sm" | "lg"', default: '"default"', description: "Size of the button" },
        { name: "tooltip", type: "string | TooltipContentProps", description: "Tooltip shown when the sidebar is in icon-collapsed state" },
      ]} />

      <ApiReference title="useSidebar" props={[
        { name: "state", type: '"expanded" | "collapsed"', description: "Current sidebar state" },
        { name: "open", type: "boolean", description: "Whether the sidebar is open" },
        { name: "setOpen", type: "(open: boolean) => void", description: "Set the open state" },
        { name: "isMobile", type: "boolean", description: "Whether the viewport is below 768px" },
        { name: "openMobile", type: "boolean", description: "Whether the mobile sheet is open" },
        { name: "setOpenMobile", type: "(open: boolean) => void", description: "Set the mobile sheet state" },
        { name: "toggleSidebar", type: "() => void", description: "Toggle the sidebar open/closed" },
      ]} />
    </>
  )
}
