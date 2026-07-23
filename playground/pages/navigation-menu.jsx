import { useState } from "react"
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from "../../ui/navigation-menu/navigation-menu.jsx"
import "../../ui/navigation-menu/navigation-menu.css"

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

      <section className="pg-section">
        <h3>Default</h3>
        {/* delays shortened for test speed (defaults: 200/150) */}
        <NavigationMenu delayDuration={100} closeDelay={100} data-pg="nm">
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
          </NavigationMenuList>
        </NavigationMenu>
        <p>
          Open item: <span data-pg="nm-ctrl-state">{value === "" ? "none" : value}</span>
        </p>
      </section>
    </>
  )
}
