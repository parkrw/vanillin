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

export default function DrawerPage() {
  return (
    <>
      <h2>Drawer</h2>

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
    </>
  )
}
