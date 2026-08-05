import { useState } from "react"
import { Button } from "../../../ui/button/button.jsx"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../ui/card/card.jsx"
import { Badge } from "../../../ui/badge/badge.jsx"
import { Avatar, AvatarFallback } from "../../../ui/avatar/avatar.jsx"
import { Input } from "../../../ui/input/input.jsx"
import { Switch } from "../../../ui/switch/switch.jsx"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../ui/tabs/tabs.jsx"
import { Separator } from "../../../ui/separator/separator.jsx"

import "../../../ui/button/button.css"
import "../../../ui/card/card.css"
import "../../../ui/badge/badge.css"
import "../../../ui/avatar/avatar.css"
import "../../../ui/input/input.css"
import "../../../ui/switch/switch.css"
import "../../../ui/tabs/tabs.css"
import "../../../ui/separator/separator.css"

export default function IntroductionPage() {
  const [notifications, setNotifications] = useState(true)

  return (
    <>
      <h2>Introduction</h2>

      <p>
        <strong>Zero dependencies</strong> React components with vanilla JS,
        JSX, and CSS. No Tailwind, no Radix, no Floating UI only React is
        required.
      </p>

      <p>
        Copy-paste, not install. Components are code you copy into your project
        and own. Inspired by shadcn.
      </p>

      <Separator style={{ margin: "1.5rem 0" }} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))", gap: "1rem", marginBlock: "1.5rem" }}>
        <Card>
          <CardHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Avatar>
                <AvatarFallback>VN</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>vanillin</CardTitle>
                <CardDescription>68 components, zero deps</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Badge>Stable</Badge>
              <Badge variant="secondary">React 18+</Badge>
              <Badge variant="outline">CSS only</Badge>
            </div>
          </CardContent>
          <CardFooter style={{ gap: "0.5rem" }}>
            <Button size="sm" as="a" href="#installation">Get started</Button>
            <Button size="sm" variant="outline" as="a" href="#button">Browse</Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle style={{ fontSize: "0.875rem" }}>Quick settings</CardTitle>
            <CardDescription>Built with real components</CardDescription>
          </CardHeader>
          <CardContent style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Input placeholder="Search components..." />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.875rem" }}>Push notifications</span>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="copy" style={{ marginBlock: "1.5rem" }}>
        <TabsList>
          <TabsTrigger value="copy">Copy-paste</TabsTrigger>
          <TabsTrigger value="cli">CLI</TabsTrigger>
        </TabsList>
        <TabsContent value="copy" style={{ padding: "1rem 0" }}>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>
            Clone the repo, copy <code>ui/button/</code> into your project, import it.
            Each component is self-contained — no package.json, no build step.
          </p>
        </TabsContent>
        <TabsContent value="cli" style={{ padding: "1rem 0" }}>
          <p style={{ margin: 0, fontSize: "0.875rem" }}>
            <code>npx github:parkrw/vanillin init</code> scaffolds the config.{" "}
            <code>van add button card tabs</code> copies components with
            their dependencies resolved automatically.
          </p>
        </TabsContent>
      </Tabs>

      <p>
        Pick a component in the sidebar to see it live — every page renders the
        real thing.
      </p>
    </>
  )
}
