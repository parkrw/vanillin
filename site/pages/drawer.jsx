import {
  Drawer,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "../../ui/drawer/drawer.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/drawer/drawer.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function DrawerPage() {
  return (
    <>
      <h2>Drawer</h2>
      <p>A touch-first panel that slides in from any edge and dismisses with a swipe — the grab handle signals the gesture.</p>

      <InstallSnippet slug="drawer" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Drawer, DrawerTrigger, DrawerClose, DrawerContent, DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription } from "./ui/drawer/drawer"
import "./ui/drawer/drawer.css"

<Drawer>
  <DrawerTrigger as={Button} variant="outline">
    Open drawer
  </DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Move goal</DrawerTitle>
      <DrawerDescription>Set your daily activity goal.</DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <Button>Submit</Button>
      <DrawerClose as={Button} variant="outline">Cancel</DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}>
          <Drawer>
            <DrawerTrigger as={Button} variant="outline">
              Open down
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Move goal</DrawerTitle>
                <DrawerDescription>Set your daily activity goal.</DrawerDescription>
              </DrawerHeader>
              <p>Swipe down to dismiss, or use the buttons below.</p>
              <DrawerFooter>
                <Button>Submit</Button>
                <DrawerClose as={Button} variant="outline">
                  Cancel
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Swipe to dismiss</h3>
        <p>
          The drawer dismisses on <strong>drag distance</strong> (past 25% of
          its size) <em>or</em> <strong>flick velocity</strong> (above 1 px/ms
          in the dismiss direction). The two gates are independent — a fast
          short flick dismisses the same as a slow long drag. Under reduced
          motion the drawer still dismisses; only the slide animation is
          suppressed.
        </p>
        <p>
          The grab handle (<code>.drawer-handle</code>) renders by default to signal that the panel is swipeable. Set <code>showSwipeHandle=&#123;false&#125;</code> to hide it.
        </p>
      </section>

      <section className="pg-section">
        <h3>Swipe directions</h3>
        <ComponentPreview code={`{/* swipeDirection names the dismiss gesture and the anchored edge */}
<Drawer swipeDirection="up">…</Drawer>
<Drawer swipeDirection="left">…</Drawer>
<Drawer swipeDirection="right">…</Drawer>`}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {["up", "left", "right"].map((direction) => (
              <Drawer key={direction} swipeDirection={direction}>
                <DrawerTrigger as={Button} variant="outline">
                  Open {direction}
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>Move goal</DrawerTitle>
                    <DrawerDescription>Set your daily activity goal.</DrawerDescription>
                  </DrawerHeader>
                  <p>Swipe {direction} to dismiss, or use the buttons below.</p>
                  <DrawerFooter>
                    <Button>Submit</Button>
                    <DrawerClose as={Button} variant="outline">
                      Cancel
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            ))}
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "swipeDirection", type: '"down" | "up" | "left" | "right"', default: '"down"', description: "Edge the drawer anchors to and the swipe direction that dismisses it" },
        { name: "showSwipeHandle", type: "boolean", default: "true", description: "Show the grab-handle bar inside the drawer" },
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "defaultOpen", type: "boolean", default: "false", description: "Uncontrolled initial open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
      ]} />
    </>
  )
}
