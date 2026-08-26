import { lazy, Suspense } from "react"
import { Button } from "../../ui/button/button.jsx"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../../ui/card/card.jsx"
import { Badge } from "../../ui/badge/badge.jsx"
import { Separator } from "../../ui/separator/separator.jsx"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../ui/tabs/tabs.jsx"
import { Avatar, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import { HoverCard, HoverCardTrigger, HoverCardContent } from "../../ui/hover-card/hover-card.jsx"
import { Skeleton } from "../../ui/skeleton/skeleton.jsx"
import { Slider } from "../../ui/slider/slider.jsx"
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "../../ui/accordion/accordion.jsx"
import { Bubble, BubbleContent } from "../../ui/bubble/bubble.jsx"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../../ui/dropdown-menu/dropdown-menu.jsx"
import { ModeToggle } from "../../ui/mode-toggle/mode-toggle.jsx"
import { CodeBlock } from "../code-example.jsx"
import { categories } from "../registry.js"
import { setSiteDark, useSiteDark } from "../color-scheme.js"

import "../../ui/button/button.css"
import "../../ui/card/card.css"
import "../../ui/badge/badge.css"
import "../../ui/separator/separator.css"
import "../../ui/tabs/tabs.css"
import "../../ui/avatar/avatar.css"
import "../../ui/hover-card/hover-card.css"
import "../../ui/skeleton/skeleton.css"
import "../../ui/slider/slider.css"
import "../../ui/accordion/accordion.css"
import "../../ui/bubble/bubble.css"
import "../../ui/dropdown-menu/dropdown-menu.css"
import "../../ui/mode-toggle/mode-toggle.css"
import "../code-example.css"

// The console showcase pulls in a large slice of the kit, so it loads as its
// own chunk instead of riding in the index bundle. The support panel rides in
// the same panels chunk the console already uses. Neither renders a
// <Toaster/> of its own — the console hosts the page's single toaster, and
// the support panel's toasts queue through it.
const ConsoleShowcase = lazy(() => import("../showcase/console.jsx"))
const SupportPanel = lazy(() =>
  import("../showcase/panels/index.js").then((m) => ({ default: m.SupportPanel }))
)

/* One live component per category — each card in the Components grid doubles
   as that component's own miniature showcase. Keyed by category label. */
function FormsDemo() {
  return <Slider defaultValue={[40]} aria-label="Volume" style={{ width: "100%", maxWidth: "13rem" }} />
}

function DataDisplayDemo() {
  return (
    <div className="pg-home-demo-avatars">
      <Avatar><AvatarFallback>PW</AvatarFallback></Avatar>
      <Avatar><AvatarFallback>AK</AvatarFallback></Avatar>
      <Avatar><AvatarFallback>RM</AvatarFallback></Avatar>
      <Badge variant="secondary">+5</Badge>
    </div>
  )
}

function LayoutDemo() {
  return (
    <div className="pg-home-demo-skeleton" aria-hidden="true">
      <Skeleton style={{ inlineSize: "2.25rem", blockSize: "2.25rem", borderRadius: "50%" }} />
      <div className="pg-home-demo-skeleton-lines">
        <Skeleton style={{ blockSize: "0.75rem", inlineSize: "100%" }} />
        <Skeleton style={{ blockSize: "0.75rem", inlineSize: "70%" }} />
      </div>
    </div>
  )
}

function NavigationDemo() {
  return (
    <Tabs defaultValue="overview" className="pg-home-demo-tabs">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <p className="pg-home-demo-tabs-copy">Everything is quiet. Ship something.</p>
      </TabsContent>
      <TabsContent value="activity">
        <p className="pg-home-demo-tabs-copy">3 deploys today, all green.</p>
      </TabsContent>
    </Tabs>
  )
}

function OverlayDemo() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger as={Button} variant="outline">Options</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>My account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Log out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function DisclosureDemo() {
  return (
    <Accordion type="single" collapsible defaultValue="one" className="pg-home-demo-accordion">
      <AccordionItem value="one">
        <AccordionTrigger>Is it accessible?</AccordionTrigger>
        <AccordionContent>Keyboard, focus, and ARIA included.</AccordionContent>
      </AccordionItem>
      <AccordionItem value="two">
        <AccordionTrigger>Is it yours?</AccordionTrigger>
        <AccordionContent>Every line — the files live in your repo.</AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function CommunicationDemo() {
  return (
    <div className="pg-home-demo-bubbles">
      <Bubble variant="muted">
        <BubbleContent>Did the deploy go out?</BubbleContent>
      </Bubble>
      <Bubble align="end">
        <BubbleContent>Shipped ten minutes ago.</BubbleContent>
      </Bubble>
    </div>
  )
}

function PlatformDemo() {
  const dark = useSiteDark()
  return (
    <div className="pg-home-demo-mode">
      <ModeToggle isDark={dark} onIsDarkChange={setSiteDark} />
      <span className="pg-home-demo-hint">Flips the whole site.</span>
    </div>
  )
}

const CATEGORY_DEMOS = {
  Forms: { slug: "slider", title: "Slider", Demo: FormsDemo },
  "Data Display": { slug: "avatar", title: "Avatar", Demo: DataDisplayDemo },
  Layout: { slug: "skeleton", title: "Skeleton", Demo: LayoutDemo },
  Navigation: { slug: "tabs", title: "Tabs", Demo: NavigationDemo },
  Overlay: { slug: "dropdown-menu", title: "Dropdown Menu", Demo: OverlayDemo },
  Disclosure: { slug: "accordion", title: "Accordion", Demo: DisclosureDemo },
  Communication: { slug: "bubble", title: "Bubble", Demo: CommunicationDemo },
  Platform: { slug: "mode-toggle", title: "Mode Toggle", Demo: PlatformDemo },
}

function CategoryCard({ label, desc, entries }) {
  const slugs = Object.entries(entries)
  const demo = CATEGORY_DEMOS[label]
  return (
    <Card className="pg-home-cat-card">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
        <CardDescription>{desc}</CardDescription>
      </CardHeader>
      <CardContent className="pg-home-cat-demo">
        {demo ? <demo.Demo /> : null}
      </CardContent>
      <CardFooter className="pg-home-cat-foot">
        {demo && (
          <a className="pg-home-cat-demo-link" href={`#${demo.slug}`}>
            {demo.title}
          </a>
        )}
        <HoverCard openDelay={200} closeDelay={150}>
          <HoverCardTrigger
            as="a"
            href={`#${slugs[0][0]}`}
            className="pg-home-cat-more"
          >
            All {slugs.length} components →
          </HoverCardTrigger>
          <HoverCardContent className="pg-home-cat-hover">
            <div className="pg-home-cat-hover-title">
              {label} · {slugs.length} components
            </div>
            <div className="pg-home-cat-tags">
              {slugs.map(([slug, { title }]) => (
                <Badge key={slug} variant="secondary" as="a" href={`#${slug}`}>
                  {title}
                </Badge>
              ))}
            </div>
          </HoverCardContent>
        </HoverCard>
      </CardFooter>
    </Card>
  )
}

export default function HomePage() {
  return (
    <div className="pg-home">
      {/* Hero — centred copy with the console showcase as the opening visual. */}
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
        </div>
      </section>

      <section className="pg-home-console">
        <p className="pg-desc pg-home-console-desc">
          A cloud console assembled entirely from kit components: two collapsible
          rails, a breadcrumb bar, live numbers that flash orange on the way up and
          blue on the way down, a filterable data table, a command palette, detail
          sheets, and toasts. Drag a divider, fold a rail, sort a column, open a server.
        </p>
        <Suspense
          fallback={<Skeleton style={{ blockSize: "40rem", borderRadius: "var(--radius-lg)" }} />}
        >
          <ConsoleShowcase />
        </Suspense>
        <div className="pg-console-open">
          <Button as="a" href="#console" variant="outline" data-pg="console-open">
            Open full console
          </Button>
        </div>
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

      <section className="pg-home-support">
        <h2>Built for conversations too</h2>
        <p className="pg-desc">
          A support inbox from the same box of parts: message threads with bubbles
          and attachments, a composer with staged files, and a filterable ticket
          table — Message, Bubble, Attachment, ScrollArea, and Data Table working
          one screen.
        </p>
        <div className="pg-home-support-frame">
          <Suspense
            fallback={<Skeleton style={{ blockSize: "32rem", borderRadius: "var(--radius-lg)" }} />}
          >
            <SupportPanel />
          </Suspense>
        </div>
      </section>

      <Separator />

      <section className="pg-home-install">
        <h2>Install</h2>
        <p className="pg-desc">
          One dev dependency for the CLI, then copy in only what you use.
        </p>
        <div className="pg-home-install-grid">
          <div className="pg-home-install-step">
            <div className="pg-home-install-label">Add the CLI</div>
            <CodeBlock code="npm i -D github:parkrw/vanillin" language="bash" />
          </div>
          <div className="pg-home-install-step">
            <div className="pg-home-install-label">Copy components</div>
            <CodeBlock code="van init && van add button dialog" language="bash" />
          </div>
        </div>
      </section>

      <Separator />

      <section className="pg-home-components">
        <h2>Components</h2>
        <p className="pg-desc">
          {Object.values(categories).reduce((n, c) => n + Object.keys(c.entries).length, 0)} components across {categories.length} categories — each card shows one of them live.
        </p>
        <div className="pg-home-cat-grid">
          {categories.map((cat) => (
            <CategoryCard key={cat.label} {...cat} />
          ))}
        </div>
      </section>
    </div>
  )
}
