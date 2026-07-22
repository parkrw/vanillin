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

export default function TabsPage() {
  return (
    <>
      <h2>Tabs</h2>

      <section className="pg-section">
        <h3>Default</h3>
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
        <h3>Disabled Trigger</h3>
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
    </>
  )
}
