import { useState } from "react"
import { Button } from "../../../ui/button/button.jsx"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../../ui/card/card.jsx"
import { Badge } from "../../../ui/badge/badge.jsx"
import { Avatar, AvatarFallback } from "../../../ui/avatar/avatar.jsx"
import { Input } from "../../../ui/input/input.jsx"
import { Switch } from "../../../ui/switch/switch.jsx"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../../ui/tabs/tabs.jsx"
import { Separator } from "../../../ui/separator/separator.jsx"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "../../../ui/dialog/dialog.jsx"

import "../../../ui/button/button.css"
import "../../../ui/card/card.css"
import "../../../ui/badge/badge.css"
import "../../../ui/avatar/avatar.css"
import "../../../ui/input/input.css"
import "../../../ui/switch/switch.css"
import "../../../ui/tabs/tabs.css"
import "../../../ui/separator/separator.css"
import "../../../ui/dialog/dialog.css"
import { CodeBlock, ComponentPreview } from "../../code-example.jsx"
import "../../code-example.css"

export default function IntroductionPage() {
  const [notifications, setNotifications] = useState(true)

  return (
    <>
      <h2>Introduction</h2>

      <p>
        Vanillin is a React component kit. You copy the source into your
        project and own it — no package to install, no version to track, no
        upgrade that can break your app. Every component is vanilla JSX and
        CSS with React as the only runtime dependency.
      </p>

      <h3>Why it exists</h3>

      <p>
        shadcn/ui proved that copy-paste distribution works. But it locks
        you into Tailwind for styling and Radix for behaviour, and both
        carry weight: Tailwind means a build step and a utility vocabulary
        your whole team must learn; Radix means a dozen packages behind
        every overlay. Vanillin keeps the distribution model and the API
        surface, replaces both dependencies with vanilla CSS and
        framework-free primitives, and adds React 19 support from day one.
      </p>

      <h3>What you get</h3>

      <ul>
        <li>
          <strong>Zero runtime dependencies</strong> — only React.
          Overlays use native <code>&lt;dialog&gt;</code> and popover.
          Focus trapping, roving focus, dismissable layers, anchor
          positioning, and safe triangles are all in <code>lib/</code>,
          framework-free.
        </li>
        <li>
          <strong>Plain CSS</strong> — design tokens
          in <code>globals.css</code>, scoped component styles
          in <code>.css</code> files. No utility classes, no build
          plugin required beyond what your bundler already does.
        </li>
        <li>
          <strong>Full ownership</strong> — the files are yours once
          copied. Edit them, delete them, fork them.
          A <code>.van.json</code> sidecar tracks what you were given so
          the CLI can tell your edits from upstream changes.
        </li>
        <li>
          <strong>Theming through config</strong> — edit{" "}
          <code>van.config.json</code>, run <code>van build</code>, and
          the generated <code>van.css</code> re-themes everything.
          Brand colours, radius, density, motion, fonts, and per-component
          variant and size overrides.
          See <a href="#configuration">Configuration</a>.
        </li>
      </ul>

      <Separator style={{ margin: "1.5rem 0" }} />

      <h3>See it working</h3>

      <p>
        A native <code>&lt;dialog&gt;</code> overlay, no Radix, no
        packages. The trigger, the content panel, and the close button are
        all plain JSX that you own:
      </p>

      <ComponentPreview code={`<Dialog>
  <DialogTrigger as={Button}>Open dialog</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Zero dependencies</DialogTitle>
      <DialogDescription>
        This dialog uses the native &lt;dialog&gt; element
        with showModal(). No Radix, no portal library.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <DialogClose as={Button} variant="outline">
        Close
      </DialogClose>
    </DialogFooter>
  </DialogContent>
</Dialog>`}>
        <Dialog>
          <DialogTrigger as={Button}>Open dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Zero dependencies</DialogTitle>
              <DialogDescription>
                This dialog uses the native &lt;dialog&gt; element
                with showModal(). No Radix, no portal library.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose as={Button} variant="outline">
                Close
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ComponentPreview>

      <h3>Copy, import, done</h3>

      <p>
        Each component is a directory. Copy it, import the JSX and its
        CSS, and you have a working component with no build plugin beyond
        what your bundler already does:
      </p>

      <CodeBlock language="jsx" code={`import { Button } from "./ui/button/button"
import "./ui/button/button.css"

function App() {
  return <Button variant="outline">Click me</Button>
}`} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))", gap: "1rem", marginBlock: "1.5rem" }}>
        <Card>
          <CardHeader>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <Avatar>
                <AvatarFallback>VN</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle>vanillin</CardTitle>
                <CardDescription>69 components, zero deps</CardDescription>
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
            <code>van init</code> scaffolds the config.{" "}
            <code>van add button card tabs</code> copies components with
            their dependencies resolved automatically.
          </p>
        </TabsContent>
      </Tabs>

      <p>
        Every page in this site renders the real component — pick one in
        the sidebar to see it live.
      </p>
    </>
  )
}
