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
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../../ui/drawer/drawer.css"
import "../../ui/button/button.css"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function DrawerPage() {
  return (
    <>
      <h2>Drawer</h2>
      <p>A touch-first panel that slides in from any edge and dismisses with a swipe.</p>

      <InstallSnippet slug="drawer" />

      <section className="pg-section">
        <h3>Swipe to dismiss</h3>
        <p>
          A touch-first panel that slides in from any edge and dismisses with a
          swipe. The drawer closes on <strong>drag distance</strong> (past 25%
          of its size) <em>or</em> <strong>flick velocity</strong> (above
          1 px/ms in the dismiss direction). The two gates are independent — a
          fast short flick dismisses the same as a slow long drag. Under reduced
          motion the drawer still dismisses; only the slide animation is
          suppressed. The grab handle (<code>.drawer-handle</code>) renders by
          default to signal the gesture; set <code>showSwipeHandle=&#123;false&#125;</code> to hide it.
        </p>
      </section>

      <section className="pg-section">
        <h3>Swipe directions</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {["down", "up", "left", "right"].map((direction) => (
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
      </section>

      <ApiReference props={[
        { name: "swipeDirection", type: '"down" | "up" | "left" | "right"', default: '"down"', description: "Edge the drawer anchors to and swipe direction for dismissal" },
        { name: "showSwipeHandle", type: "boolean", default: "true", description: "Show the grab handle that signals the swipe gesture" },
      ]} />
    </>
  )
}
