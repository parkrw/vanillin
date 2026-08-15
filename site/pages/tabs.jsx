import { useState } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs/tabs.jsx"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../ui/card/card.jsx"
import { Button } from "../../ui/button/button.jsx"
import { Input } from "../../ui/input/input.jsx"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/tabs/tabs.css"
import "../../ui/card/card.css"
import "../../ui/button/button.css"
import "../../ui/input/input.css"
import "../../ui/label/label.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function TabsPage() {
  const [controlled, setControlled] = useState("overview")
  return (
    <>
      <h2>Tabs</h2>
      <p>Organize content into switchable panels with keyboard navigation.</p>

      <InstallSnippet slug="tabs" />

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          Arrow keys move focus between triggers and activate them
          automatically. <code>TabsContent</code> renders only the active
          panel; inactive panels return <code>null</code> and leave the DOM
          entirely.
        </p>
        <Tabs defaultValue="account" style={{ maxWidth: "24rem" }}>
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
                <CardDescription>Make changes to your account here.</CardDescription>
              </CardHeader>
              <CardContent style={{ display: "grid", gap: "0.75rem" }}>
                <div style={{ display: "grid", gap: "0.375rem" }}>
                  <Label htmlFor="tabs-name">Name</Label>
                  <Input id="tabs-name" defaultValue="Pedro Duarte" />
                </div>
                <div style={{ display: "grid", gap: "0.375rem" }}>
                  <Label htmlFor="tabs-username">Username</Label>
                  <Input id="tabs-username" defaultValue="@peduarte" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save changes</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Change your password here.</CardDescription>
              </CardHeader>
              <CardContent style={{ display: "grid", gap: "0.75rem" }}>
                <div style={{ display: "grid", gap: "0.375rem" }}>
                  <Label htmlFor="tabs-current">Current password</Label>
                  <Input id="tabs-current" type="password" />
                </div>
                <div style={{ display: "grid", gap: "0.375rem" }}>
                  <Label htmlFor="tabs-new">New password</Label>
                  <Input id="tabs-new" type="password" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>Save password</Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <p>
          A disabled trigger is skipped by arrow-key navigation and cannot be
          activated. Use it for tabs whose content is unavailable but should
          remain visible in the list.
        </p>
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="disabled" disabled>
              Disabled
            </TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <p style={{ fontSize: "0.875rem" }}>The other tab is disabled.</p>
          </TabsContent>
        </Tabs>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <p>
          Pass <code>value</code> and <code>onValueChange</code> to own the
          active tab externally. The state readout below updates on every
          switch.
        </p>
        <Tabs value={controlled} onValueChange={setControlled} style={{ maxWidth: "24rem" }}>
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>High-level summary of the service.</p>
          </TabsContent>
          <TabsContent value="metrics">
            <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>Request latency, error rate, throughput.</p>
          </TabsContent>
          <TabsContent value="logs">
            <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>Recent log entries.</p>
          </TabsContent>
        </Tabs>
        <p className="pg-desc" style={{ fontSize: "0.875rem" }}>
          Active tab: <strong>{controlled}</strong>
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs/tabs"
import "./ui/tabs/tabs.css"

<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    Account settings here.
  </TabsContent>
  <TabsContent value="password">
    Password form here.
  </TabsContent>
</Tabs>`}>
          <Tabs defaultValue="account" style={{ maxWidth: "24rem" }}>
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>Account settings here.</p>
            </TabsContent>
            <TabsContent value="password">
              <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>Password form here.</p>
            </TabsContent>
          </Tabs>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With Form Fields</h3>
        <ComponentPreview code={`<Tabs defaultValue="profile">
  <TabsList>
    <TabsTrigger value="profile">Profile</TabsTrigger>
    <TabsTrigger value="notifications">Notifications</TabsTrigger>
  </TabsList>
  <TabsContent value="profile">
    <Label htmlFor="display">Display name</Label>
    <Input id="display" placeholder="Your name" />
  </TabsContent>
  <TabsContent value="notifications">
    <p>Notification preferences go here.</p>
  </TabsContent>
</Tabs>`}>
          <Tabs defaultValue="profile" style={{ maxWidth: "24rem" }}>
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <div style={{ display: "grid", gap: "0.5rem", padding: "0.5rem 0" }}>
                <Label htmlFor="tabs-display">Display name</Label>
                <Input id="tabs-display" placeholder="Your name" />
                <Button style={{ justifySelf: "start" }}>Update</Button>
              </div>
            </TabsContent>
            <TabsContent value="notifications">
              <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>
                Notification preferences go here.
              </p>
            </TabsContent>
          </Tabs>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Many Triggers</h3>
        <ComponentPreview code={`<Tabs defaultValue="general">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
    <TabsTrigger value="integrations">Integrations</TabsTrigger>
    <TabsTrigger value="billing">Billing</TabsTrigger>
    <TabsTrigger value="advanced">Advanced</TabsTrigger>
  </TabsList>
  <TabsContent value="general">General settings.</TabsContent>
</Tabs>`}>
          <Tabs defaultValue="general">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="billing">Billing</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>
            <TabsContent value="general">
              <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>General settings.</p>
            </TabsContent>
            <TabsContent value="security">
              <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>Security options.</p>
            </TabsContent>
            <TabsContent value="integrations">
              <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>Connected services.</p>
            </TabsContent>
            <TabsContent value="billing">
              <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>Payment and invoices.</p>
            </TabsContent>
            <TabsContent value="advanced">
              <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>Advanced configuration.</p>
            </TabsContent>
          </Tabs>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Density</h3>
        <ComponentPreview code={`{/* Trigger padding scales with --density-scale */}
<div style={{ "--density-scale": "0.75" }}>
  <Tabs defaultValue="compact">
    <TabsList>
      <TabsTrigger value="compact">Compact</TabsTrigger>
      <TabsTrigger value="layout">Layout</TabsTrigger>
    </TabsList>
  </Tabs>
</div>`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBlockEnd: "0.25rem" }}>density 0.75</p>
              <div style={{ "--density-scale": "0.75" }}>
                <Tabs defaultValue="compact">
                  <TabsList>
                    <TabsTrigger value="compact">Compact</TabsTrigger>
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                  </TabsList>
                  <TabsContent value="compact">
                    <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>Tighter spacing for dense UIs.</p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--muted-foreground)", marginBlockEnd: "0.25rem" }}>density 1.2</p>
              <div style={{ "--density-scale": "1.2" }}>
                <Tabs defaultValue="spacious">
                  <TabsList>
                    <TabsTrigger value="spacious">Spacious</TabsTrigger>
                    <TabsTrigger value="layout">Layout</TabsTrigger>
                  </TabsList>
                  <TabsContent value="spacious">
                    <p style={{ fontSize: "0.875rem", padding: "0.5rem 0" }}>More breathing room.</p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Keyboard Navigation</h3>
        <p>
          Tabs use automatic activation: focus and selection move together.
          Arrow keys cycle through enabled triggers (wrapping at both ends).
          Disabled triggers are skipped. <code>Home</code> and{" "}
          <code>End</code> jump to the first and last enabled trigger.
        </p>
        <p>
          Each <code>TabsContent</code> panel has <code>tabIndex=0</code> so
          keyboard users can <code>Tab</code> into the panel content after
          selecting a trigger. The panel carries{" "}
          <code>aria-labelledby</code> pointing back to its trigger.
        </p>
      </section>

      <ApiReference title="Tabs" props={[
        { name: "value", type: "string", description: "Controlled active tab value" },
        { name: "defaultValue", type: "string", description: "Initial active tab (uncontrolled)" },
        { name: "onValueChange", type: "(value: string) => void", description: "Called when the active tab changes" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="TabsTrigger" props={[
        { name: "value", type: "string", description: "Value that activates this tab's content" },
        { name: "disabled", type: "boolean", description: "Disable this trigger" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
