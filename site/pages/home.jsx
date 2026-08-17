import { lazy, Suspense } from "react"
import { Button } from "../../ui/button/button.jsx"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "../../ui/card/card.jsx"
import { Badge } from "../../ui/badge/badge.jsx"
import { Separator } from "../../ui/separator/separator.jsx"
import { Input } from "../../ui/input/input.jsx"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs/tabs.jsx"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../../ui/table/table.jsx"
import { Checkbox } from "../../ui/checkbox/checkbox.jsx"
import { Avatar, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import { Skeleton } from "../../ui/skeleton/skeleton.jsx"
import { CodeBlock } from "../code-example.jsx"
import { categories } from "../registry.js"

import "../../ui/button/button.css"
import "../../ui/card/card.css"
import "../../ui/badge/badge.css"
import "../../ui/separator/separator.css"
import "../../ui/input/input.css"
import "../../ui/tabs/tabs.css"
import "../../ui/table/table.css"
import "../../ui/checkbox/checkbox.css"
import "../../ui/avatar/avatar.css"
import "../../ui/skeleton/skeleton.css"
import "../code-example.css"

// The console showcase pulls in a large slice of the kit, so it loads as its
// own chunk instead of riding in the index bundle.
const ConsoleShowcase = lazy(() => import("../showcase/console.jsx"))

function HeroShowcase() {
  return (
    <div className="pg-hero-showcase" aria-hidden="true">
      <Tabs defaultValue="tasks">
        <Card>
          <CardHeader>
            <CardTitle>Sprint board</CardTitle>
            <CardAction>
              <TabsList>
                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>
            </CardAction>
          </CardHeader>
          <TabsContent value="tasks">
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: "2rem" }}></TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell><Checkbox defaultChecked /></TableCell>
                    <TableCell>Design tokens</TableCell>
                    <TableCell><Badge variant="success">Done</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>API routes</TableCell>
                    <TableCell><Badge variant="warning">Review</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell><Checkbox /></TableCell>
                    <TableCell>Unit tests</TableCell>
                    <TableCell><Badge variant="outline">Todo</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </TabsContent>
          <TabsContent value="team">
            <CardContent>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div className="pg-hero-showcase-row">
                  <Avatar><AvatarFallback>PW</AvatarFallback></Avatar>
                  <span style={{ fontSize: "0.875rem" }}>Parker</span>
                  <Badge variant="info">3 tasks</Badge>
                </div>
                <div className="pg-hero-showcase-row">
                  <Avatar><AvatarFallback>AK</AvatarFallback></Avatar>
                  <span style={{ fontSize: "0.875rem" }}>Alex</span>
                  <Badge variant="info">5 tasks</Badge>
                </div>
              </div>
            </CardContent>
          </TabsContent>
          <Separator />
          <CardFooter>
            <div className="pg-hero-showcase-row">
              <Input placeholder="Add a task..." className="pg-hero-showcase-input" />
              <Button size="sm">Add</Button>
            </div>
          </CardFooter>
        </Card>
      </Tabs>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="pg-home">
      <section className="pg-hero">
        <div className="pg-hero-copy">
          <Badge className="pg-hero-badge" style={{ boxShadow: "var(--shadow-md)" }}>Zero dependencies</Badge>
          <h1 className="pg-hero-title">vanillin</h1>
          <p className="pg-hero-desc">
            Copy-paste components for React. No Tailwind, no Radix, no runtime dependencies.
            Everything is plain CSS and standard DOM, so you own every line.
          </p>
          <div className="pg-hero-actions">
            <Button as="a" href="#installation">Get Started</Button>
            <Button variant="outline" as="a" href="#button">Browse Components</Button>
          </div>
          <CodeBlock
            code="npm i -D github:parkrw/vanillin"
            language="bash"
            className="pg-hero-install"
          />
        </div>
        <HeroShowcase />
      </section>

      <Separator />

      <section className="pg-home-console">
        <h2>Compose something real</h2>
        <p className="pg-desc">
          A cloud console assembled entirely from kit components: resizable panes,
          a filterable data table, a command palette, detail sheets, and toasts.
          Drag the divider, sort a column, open a server. The glass chrome falls
          back to solid surfaces under reduced transparency.
        </p>
        <Suspense
          fallback={<Skeleton style={{ blockSize: "40rem", borderRadius: "var(--radius-lg)" }} />}
        >
          <ConsoleShowcase />
        </Suspense>
      </section>

      <Separator />

      <section className="pg-features">
        <div className="pg-features-grid">
          <Card>
            <CardHeader>
              <CardTitle>Zero runtime deps</CardTitle>
              <CardDescription>
                React is the only peer. Everything in devDependencies serves the docs site or tests, and nothing leaks into your bundle.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Copy, don't install</CardTitle>
              <CardDescription>
                Components live in your project. <code>van add button</code> copies the files: no version lock, no upgrade that breaks your app.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Plain CSS</CardTitle>
              <CardDescription>
                Design tokens in custom properties, not a utility framework. One import per component, no build step required beyond what you already have.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Theme via config</CardTitle>
              <CardDescription>
                <code>van.config.json</code> drives brand colours, density, radius, motion, and per-component tokens. <code>van build</code> regenerates the CSS.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <Separator />

      <section className="pg-home-components">
        <h2>Components</h2>
        <p className="pg-desc">
          {Object.values(categories).reduce((n, c) => n + Object.keys(c.entries).length, 0)} components across {categories.length} categories.
        </p>
        <div className="pg-home-cat-grid">
          {categories.map(({ label, desc, entries }) => (
            <Card key={label} className="pg-home-cat-card">
              <CardHeader>
                <CardTitle>{label}</CardTitle>
                <CardDescription>{desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="pg-home-cat-tags">
                  {Object.entries(entries).slice(0, 8).map(([slug, { title }]) => (
                    <Badge key={slug} variant="secondary" as="a" href={`#${slug}`}>
                      {title}
                    </Badge>
                  ))}
                  {Object.keys(entries).length > 8 && (
                    <Badge variant="outline">+{Object.keys(entries).length - 8}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
