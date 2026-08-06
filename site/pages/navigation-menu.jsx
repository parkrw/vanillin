import { useState } from "react"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  NavigationMenuViewport,
  NavigationMenuIndicator,
  navigationMenuTriggerStyle,
} from "../../ui/navigation-menu/navigation-menu.jsx"
import "../../ui/navigation-menu/navigation-menu.css"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../install-snippet.css"
import "../api-reference.css"

const components = [
  { title: "Alert Dialog", description: "A modal dialog that interrupts the user with important content." },
  { title: "Hover Card", description: "For sighted users to preview content behind a link." },
  { title: "Progress", description: "Displays an indicator showing the completion progress of a task." },
  { title: "Tabs", description: "Layered sections of content displayed one at a time." },
]

export default function NavigationMenuPage() {
  const [value, setValue] = useState("")

  return (
    <>
      <h2>Navigation Menu</h2>
      <p>A site navigation bar with hover-triggered dropdown panels, directional content animations, and full keyboard support.</p>

      <InstallSnippet slug="navigation-menu" />

      <section className="pg-section">
        <h3>Viewport mode (default)</h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBottom: "0.75rem" }}>
          One shared viewport morphs its size when switching between items.
          Content slides directionally; the indicator arrow follows the active
          trigger. This is the default mode.
        </p>
        <NavigationMenu delayDuration={100} closeDelay={100} data-pg="nm-vp">
          <NavigationMenuList>
            <NavigationMenuItem value="learn">
              <NavigationMenuTrigger data-pg="nm-vp-trigger-learn">Getting started</NavigationMenuTrigger>
              <NavigationMenuContent data-pg="nm-vp-content-learn">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem", width: "28rem" }}>
                  <NavigationMenuLink href="#navigation-menu" data-pg="nm-vp-link-intro">
                    <div>Introduction</div>
                    <p>Zero-dependency components built on modern platform APIs.</p>
                  </NavigationMenuLink>
                  <NavigationMenuLink href="#navigation-menu">
                    <div>Installation</div>
                    <p>Copy the component folder into your project and import it.</p>
                  </NavigationMenuLink>
                  <NavigationMenuLink href="#navigation-menu">
                    <div>Theming</div>
                    <p>Tokens in globals.css drive color, radius, and motion.</p>
                  </NavigationMenuLink>
                  <NavigationMenuLink href="#navigation-menu">
                    <div>Motion</div>
                    <p>One scale and easing knob for every transition.</p>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="components">
              <NavigationMenuTrigger data-pg="nm-vp-trigger-comp">Components</NavigationMenuTrigger>
              <NavigationMenuContent data-pg="nm-vp-content-comp">
                <div style={{ width: "18rem" }}>
                  {components.map((c) => (
                    <NavigationMenuLink key={c.title} href="#navigation-menu">
                      <div>{c.title}</div>
                      <p>{c.description}</p>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="#navigation-menu"
                className={navigationMenuTriggerStyle()}
              >
                Docs
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuIndicator />
          </NavigationMenuList>
          <NavigationMenuViewport />
        </NavigationMenu>
      </section>

      <section className="pg-section">
        <h3>Per-item popover mode</h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--muted-foreground)", marginBottom: "0.75rem" }}>
          Each trigger anchors its own popover panel. Better for wide menus
          where panel widths vary significantly. Pass <code>viewport=&#123;false&#125;</code>.
        </p>
        <NavigationMenu viewport={false} delayDuration={100} closeDelay={100} data-pg="nm">
          <NavigationMenuList>
            <NavigationMenuItem value="learn">
              <NavigationMenuTrigger data-pg="nm-trigger-learn">Getting started</NavigationMenuTrigger>
              <NavigationMenuContent data-pg="nm-content-learn">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.25rem", width: "28rem" }}>
                  <NavigationMenuLink href="#navigation-menu" data-pg="nm-link-intro">
                    <div>Introduction</div>
                    <p>Zero-dependency components built on modern platform APIs.</p>
                  </NavigationMenuLink>
                  <NavigationMenuLink href="#navigation-menu">
                    <div>Installation</div>
                    <p>Copy the component folder into your project and import it.</p>
                  </NavigationMenuLink>
                  <NavigationMenuLink href="#navigation-menu">
                    <div>Theming</div>
                    <p>Tokens in globals.css drive color, radius, and motion.</p>
                  </NavigationMenuLink>
                  <NavigationMenuLink href="#navigation-menu">
                    <div>Motion</div>
                    <p>One scale and easing knob for every transition.</p>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="components">
              <NavigationMenuTrigger data-pg="nm-trigger-components">Components</NavigationMenuTrigger>
              <NavigationMenuContent data-pg="nm-content-components">
                <div style={{ width: "18rem" }}>
                  {components.map((c) => (
                    <NavigationMenuLink key={c.title} href="#navigation-menu">
                      <div>{c.title}</div>
                      <p>{c.description}</p>
                    </NavigationMenuLink>
                  ))}
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="#navigation-menu"
                className={navigationMenuTriggerStyle()}
                data-pg="nm-link-docs"
              >
                Docs
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <NavigationMenu value={value} onValueChange={setValue} delayDuration={100} closeDelay={100}>
          <NavigationMenuList>
            <NavigationMenuItem value="one">
              <NavigationMenuTrigger data-pg="nm-ctrl-trigger">Menu one</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div style={{ width: "14rem" }}>
                  <NavigationMenuLink href="#navigation-menu">
                    <div>Link A</div>
                  </NavigationMenuLink>
                  <NavigationMenuLink href="#navigation-menu">
                    <div>Link B</div>
                  </NavigationMenuLink>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuIndicator />
          </NavigationMenuList>
          <NavigationMenuViewport />
        </NavigationMenu>
        <p>
          Open item: <span data-pg="nm-ctrl-state">{value === "" ? "none" : value}</span>
        </p>
      </section>

      <ApiReference props={[
        { name: "value", type: "string", description: "Controlled open item value" },
        { name: "onValueChange", type: "(value: string) => void", description: "Called when the open item changes" },
        { name: "viewport", type: "boolean", default: "true", description: "Use a shared viewport (true) or per-item popovers (false)" },
        { name: "delayDuration", type: "number", default: "200", description: "Milliseconds before opening on hover" },
        { name: "closeDelay", type: "number", default: "150", description: "Milliseconds grace period before closing on leave" },
      ]} />
    </>
  )
}
