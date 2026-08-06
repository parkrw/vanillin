import { Button } from "../../ui/button/button.jsx"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../ui/card/card.jsx"
import { Badge } from "../../ui/badge/badge.jsx"
import { Separator } from "../../ui/separator/separator.jsx"
import { Input } from "../../ui/input/input.jsx"
import { Label } from "../../ui/label/label.jsx"
import { Switch } from "../../ui/switch/switch.jsx"
import { Slider } from "../../ui/slider/slider.jsx"
import { Progress } from "../../ui/progress/progress.jsx"
import { Avatar, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import { CodeBlock } from "../code-example.jsx"
import { categories } from "../registry.js"

import "../../ui/button/button.css"
import "../../ui/card/card.css"
import "../../ui/badge/badge.css"
import "../../ui/separator/separator.css"
import "../../ui/input/input.css"
import "../../ui/label/label.css"
import "../../ui/switch/switch.css"
import "../../ui/slider/slider.css"
import "../../ui/progress/progress.css"
import "../../ui/avatar/avatar.css"
import "../code-example.css"

function HeroShowcase() {
  return (
    <div className="pg-hero-showcase" aria-hidden="true">
      <Card>
        <CardHeader>
          <CardTitle>Project settings</CardTitle>
          <CardDescription>Every control below is a vanillin component.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="pg-hero-showcase-row">
            <Label htmlFor="hero-name">Name</Label>
            <Input id="hero-name" defaultValue="vanillin" className="pg-hero-showcase-input" />
          </div>
          <Separator className="pg-hero-showcase-sep" />
          <div className="pg-hero-showcase-row">
            <Label htmlFor="hero-notify">Notifications</Label>
            <Switch id="hero-notify" defaultChecked />
            <Badge variant="secondary">beta</Badge>
          </div>
          <Separator className="pg-hero-showcase-sep" />
          <Slider defaultValue={[66]} aria-label="Volume" />
        </CardContent>
        <CardFooter>
          <div className="pg-hero-showcase-row">
            <Button size="sm">Save</Button>
            <Button size="sm" variant="outline">Cancel</Button>
          </div>
        </CardFooter>
      </Card>
      <Card>
        <CardContent>
          <div className="pg-hero-showcase-row">
            <Avatar>
              <AvatarFallback>PW</AvatarFallback>
            </Avatar>
            <Badge variant="success">deploy passed</Badge>
            <Progress value={80} className="pg-hero-showcase-progress" aria-label="Rollout" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="pg-home">
      <section className="pg-hero">
        <div className="pg-hero-copy">
          <Badge variant="outline" className="pg-hero-badge">Zero dependencies</Badge>
          <h1 className="pg-hero-title">vanillin</h1>
          <p className="pg-hero-desc">
            Copy-paste components for React. No Tailwind, no Radix, no runtime dependencies.
            Everything is plain CSS and standard DOM — you own every line.
          </p>
          <div className="pg-hero-actions">
            <Button as="a" href="#installation">Get Started</Button>
            <Button variant="outline" as="a" href="#button">Browse Components</Button>
          </div>
          <CodeBlock
            code="npx github:parkrw/vanillin init"
            language="bash"
            className="pg-hero-install"
          />
        </div>
        <HeroShowcase />
      </section>

      <Separator />

      <section className="pg-features">
        <div className="pg-features-grid">
          <Card>
            <CardHeader>
              <CardTitle>Zero runtime deps</CardTitle>
              <CardDescription>
                React is the only peer. Everything in devDependencies serves the docs site or tests — nothing leaks into your bundle.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Copy, don't install</CardTitle>
              <CardDescription>
                Components live in your project. <code>van add button</code> copies the files — no version lock, no upgrade that breaks your app.
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
