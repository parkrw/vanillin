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
