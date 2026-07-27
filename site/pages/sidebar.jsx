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

/* SVG icon helpers — inline to avoid deps */
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

export default function SidebarPage() {
  const [variant, setVariant] = useState("sidebar")
  const [collapsible, setCollapsible] = useState("offcanvas")

  return (
    <>
      <h2>Sidebar</h2>

      <section className="pg-section">
        <h3>Controls</h3>
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
      </section>

      <section className="pg-section" data-pg="sb-main">
        <h3>Default (left, offcanvas)</h3>
        {/* Render inside a bounded container so the site shell stays usable.
            The sidebar is position:fixed inside this container, but we use CSS
            containment + overflow:hidden + relative positioning to scope it. */}
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
              /* Override the fixed positioning for the demo frame */
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
    </>
  )
}
