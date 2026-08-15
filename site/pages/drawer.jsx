import { useState } from "react"
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
import { Label } from "../../ui/label/label.jsx"
import { Input } from "../../ui/input/input.jsx"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../../ui/drawer/drawer.css"
import "../../ui/button/button.css"
import "../../ui/label/label.css"
import "../../ui/input/input.css"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function DrawerPage() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <h2>Drawer</h2>
      <p>A touch-first panel that slides in from any edge and dismisses with a swipe.</p>

      <InstallSnippet slug="drawer" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Drawer, DrawerTrigger, DrawerClose, DrawerContent,
  DrawerHeader, DrawerFooter, DrawerTitle, DrawerDescription }
  from "./ui/drawer/drawer"
import "./ui/drawer/drawer.css"

<Drawer>
  <DrawerTrigger as={Button} variant="outline">Open drawer</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Notifications</DrawerTitle>
      <DrawerDescription>Your recent notifications.</DrawerDescription>
    </DrawerHeader>
    <p>You have 3 unread messages.</p>
    <DrawerFooter>
      <Button>Mark all read</Button>
      <DrawerClose as={Button} variant="outline">Dismiss</DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}>
          <Drawer>
            <DrawerTrigger as={Button} variant="outline">Open drawer</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Notifications</DrawerTitle>
                <DrawerDescription>Your recent notifications.</DrawerDescription>
              </DrawerHeader>
              <p>You have 3 unread messages.</p>
              <DrawerFooter>
                <Button>Mark all read</Button>
                <DrawerClose as={Button} variant="outline">Dismiss</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Swipe to dismiss</h3>
        <p>
          The drawer closes on drag distance (past 25% of its size) or flick
          velocity (above 1 px/ms in the dismiss direction). The two gates are
          independent: a fast short flick dismisses the same as a slow long
          drag. Under reduced motion the drawer still dismisses; only the slide
          animation is suppressed. The grab handle (<code>.drawer-handle</code>)
          renders by default to signal the gesture;
          set <code>showSwipeHandle=&#123;false&#125;</code> to hide it.
        </p>
      </section>

      <section className="pg-section">
        <h3>Swipe directions</h3>
        <ComponentPreview code={`<Drawer swipeDirection="left">
  <DrawerTrigger as={Button} variant="outline">Open left</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Move goal</DrawerTitle>
      <DrawerDescription>Set your daily activity goal.</DrawerDescription>
    </DrawerHeader>
    <p>Swipe left to dismiss, or use the buttons below.</p>
    <DrawerFooter>
      <Button>Submit</Button>
      <DrawerClose as={Button} variant="outline">Cancel</DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}>
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
        </ComponentPreview>
        <p>
          <code>swipeDirection</code> names both the anchored edge and the
          dismiss gesture: <code>"down"</code> anchors to the bottom and
          dismisses on a downward swipe.
        </p>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [open, setOpen] = useState(false)

<Drawer open={open} onOpenChange={setOpen}>
  <DrawerTrigger as={Button} variant="outline">Toggle drawer</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Controlled drawer</DrawerTitle>
      <DrawerDescription>Open state lives in the page.</DrawerDescription>
    </DrawerHeader>
  </DrawerContent>
</Drawer>`}>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger as={Button} variant="outline">Toggle drawer</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Controlled drawer</DrawerTitle>
                <DrawerDescription>Open state lives in the page.</DrawerDescription>
              </DrawerHeader>
            </DrawerContent>
          </Drawer>
          <p className="pg-desc">
            state: {open ? "open" : "closed"}
          </p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Form in drawer</h3>
        <ComponentPreview code={`<Drawer>
  <DrawerTrigger as={Button}>New task</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Create task</DrawerTitle>
      <DrawerDescription>Add a new task to your list.</DrawerDescription>
    </DrawerHeader>
    <form onSubmit={handleSubmit}>
      <Label htmlFor="task-title">Title</Label>
      <Input id="task-title" required placeholder="Buy groceries" />
      <Label htmlFor="task-due">Due date</Label>
      <Input id="task-due" type="date" required />
      <DrawerFooter>
        <DrawerClose as={Button} variant="outline">Discard</DrawerClose>
        <Button type="submit">Create task</Button>
      </DrawerFooter>
    </form>
  </DrawerContent>
</Drawer>`}>
          <Drawer>
            <DrawerTrigger as={Button}>New task</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Create task</DrawerTitle>
                <DrawerDescription>Add a new task to your list.</DrawerDescription>
              </DrawerHeader>
              <form onSubmit={e => e.preventDefault()} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", padding: "0 1rem" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <Label htmlFor="drawer-task-title">Title</Label>
                  <Input id="drawer-task-title" required placeholder="Buy groceries" />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <Label htmlFor="drawer-task-due">Due date</Label>
                  <Input id="drawer-task-due" type="date" required />
                </div>
                <DrawerFooter>
                  <DrawerClose as={Button} variant="outline">Discard</DrawerClose>
                  <Button type="submit">Create task</Button>
                </DrawerFooter>
              </form>
            </DrawerContent>
          </Drawer>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Hidden handle</h3>
        <ComponentPreview code={`<Drawer showSwipeHandle={false}>
  <DrawerTrigger as={Button} variant="outline">Open plain</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>No grab handle</DrawerTitle>
      <DrawerDescription>
        The handle is hidden but swipe-to-dismiss still works.
      </DrawerDescription>
    </DrawerHeader>
    <DrawerFooter>
      <DrawerClose as={Button} variant="outline">Close drawer</DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}>
          <Drawer showSwipeHandle={false}>
            <DrawerTrigger as={Button} variant="outline">Open plain</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>No grab handle</DrawerTitle>
                <DrawerDescription>
                  The handle is hidden but swipe-to-dismiss still works.
                </DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose as={Button} variant="outline">Close drawer</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Scrollable content</h3>
        <ComponentPreview code={`<Drawer>
  <DrawerTrigger as={Button} variant="outline">View terms</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Terms of service</DrawerTitle>
      <DrawerDescription>Please review the following terms.</DrawerDescription>
    </DrawerHeader>
    <div style={{ maxHeight: "12rem", overflowY: "auto" }}>
      <p>Section 1: ...</p>
      <p>Section 2: ...</p>
    </div>
    <DrawerFooter>
      <Button>Accept terms</Button>
      <DrawerClose as={Button} variant="outline">Decline</DrawerClose>
    </DrawerFooter>
  </DrawerContent>
</Drawer>`}>
          <Drawer>
            <DrawerTrigger as={Button} variant="outline">View terms</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Terms of service</DrawerTitle>
                <DrawerDescription>Please review the following terms.</DrawerDescription>
              </DrawerHeader>
              <div style={{ maxHeight: "12rem", overflowY: "auto", padding: "0 1rem" }}>
                <p>Section 1: You agree to use this software responsibly and in accordance with all applicable laws and regulations.</p>
                <p>Section 2: The software is provided as-is without warranty of any kind, express or implied.</p>
                <p>Section 3: You may not redistribute or sublicense this software without prior written consent.</p>
                <p>Section 4: We reserve the right to modify these terms at any time with reasonable notice.</p>
                <p>Section 5: Your continued use of the software constitutes acceptance of any modified terms.</p>
              </div>
              <DrawerFooter>
                <Button>Accept terms</Button>
                <DrawerClose as={Button} variant="outline">Decline</DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Action list</h3>
        <ComponentPreview code={`<Drawer>
  <DrawerTrigger as={Button} variant="outline">More actions</DrawerTrigger>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Actions</DrawerTitle>
    </DrawerHeader>
    <DrawerClose as={Button} variant="ghost">Share</DrawerClose>
    <DrawerClose as={Button} variant="ghost">Duplicate</DrawerClose>
    <DrawerClose as={Button} variant="ghost">Archive</DrawerClose>
    <DrawerClose as={Button} variant="destructive">Delete</DrawerClose>
  </DrawerContent>
</Drawer>`}>
          <Drawer>
            <DrawerTrigger as={Button} variant="outline">More actions</DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Actions</DrawerTitle>
              </DrawerHeader>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", padding: "0 1rem" }}>
                <DrawerClose as={Button} variant="ghost">Share</DrawerClose>
                <DrawerClose as={Button} variant="ghost">Duplicate</DrawerClose>
                <DrawerClose as={Button} variant="ghost">Archive</DrawerClose>
                <DrawerClose as={Button} variant="destructive">Delete</DrawerClose>
              </div>
            </DrawerContent>
          </Drawer>
        </ComponentPreview>
        <p>
          <code>DrawerClose</code> on each button dismisses the drawer after the
          action fires, giving a mobile action-sheet pattern.
        </p>
      </section>

      <ApiReference title="Drawer" props={[
        { name: "swipeDirection", type: '"down" | "up" | "left" | "right"', default: '"down"', description: "Edge the drawer anchors to and swipe direction for dismissal" },
        { name: "showSwipeHandle", type: "boolean", default: "true", description: "Show the grab handle that signals the swipe gesture" },
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "defaultOpen", type: "boolean", default: "false", description: "Initial open state (uncontrolled)" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
      ]} />
    </>
  )
}
