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
  return (
    <>
      <h2>Tabs</h2>
      <p>Organize content into switchable panels with keyboard navigation.</p>

      <InstallSnippet slug="tabs" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs/tabs"
import "./ui/tabs/tabs.css"

<Tabs defaultValue="one">
  <TabsList>
    <TabsTrigger value="one">Tab 1</TabsTrigger>
    <TabsTrigger value="two">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="one">Content 1</TabsContent>
  <TabsContent value="two">Content 2</TabsContent>
</Tabs>`}>
          <Tabs defaultValue="one" style={{ maxWidth: "24rem" }}>
            <TabsList>
              <TabsTrigger value="one">Tab 1</TabsTrigger>
              <TabsTrigger value="two">Tab 2</TabsTrigger>
            </TabsList>
            <TabsContent value="one">
              <p style={{ fontSize: "0.875rem" }}>First tab content.</p>
            </TabsContent>
            <TabsContent value="two">
              <p style={{ fontSize: "0.875rem" }}>Second tab content.</p>
            </TabsContent>
          </Tabs>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Tabs with Cards</h3>
        <ComponentPreview code={`<Tabs defaultValue="account">
  <TabsList>
    <TabsTrigger value="account">Account</TabsTrigger>
    <TabsTrigger value="password">Password</TabsTrigger>
  </TabsList>
  <TabsContent value="account">
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Make changes to your account.</CardDescription>
      </CardHeader>
      <CardContent>
        <Label htmlFor="name">Name</Label>
        <Input id="name" defaultValue="Pedro Duarte" />
      </CardContent>
      <CardFooter><Button>Save changes</Button></CardFooter>
    </Card>
  </TabsContent>
</Tabs>`}>
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
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Disabled Trigger</h3>
        <ComponentPreview code={`<Tabs defaultValue="active">
  <TabsList>
    <TabsTrigger value="active">Active</TabsTrigger>
    <TabsTrigger value="disabled" disabled>Disabled</TabsTrigger>
  </TabsList>
  <TabsContent value="active">The other tab is disabled.</TabsContent>
</Tabs>`}>
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
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Tabs with Form Sections</h3>
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
