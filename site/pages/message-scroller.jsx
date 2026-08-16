import { useRef, useState } from "react"
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
  useMessageScrollerScrollable,
  useMessageScrollerVisibility,
} from "../../ui/message-scroller/message-scroller.jsx"
import { Message, MessageContent } from "../../ui/message/message.jsx"
import { Bubble, BubbleContent } from "../../ui/bubble/bubble.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/message-scroller/message-scroller.css"
import "../../ui/message/message.css"
import "../../ui/bubble/bubble.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

function Readout() {
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility()
  const { start, end } = useMessageScrollerScrollable()
  return (
    <p className="pg-detail">
      anchor <output aria-label="Current anchor">{currentAnchorId}</output> · visible{" "}
      <output aria-label="Visible messages">{visibleMessageIds.join(" ")}</output> · scrollable{" "}
      <output aria-label="Scrollable">{`start:${start} end:${end}`}</output>
    </p>
  )
}

const makeMessage = (n, note = "") => ({
  id: `m${n}`,
  align: n % 2 ? "start" : "end",
  text: note || `Message ${n} in the transcript.`,
})

export default function MessageScrollerPage() {
  const [messages, setMessages] = useState(() =>
    Array.from({ length: 14 }, (_, i) => makeMessage(i + 1))
  )
  const nextId = useRef(15)
  const prevId = useRef(0)

  const append = () =>
    setMessages((current) => [...current, makeMessage(nextId.current++, `Streamed reply ${nextId.current - 1}.`)])
  const prepend = () =>
    setMessages((current) => [
      ...Array.from({ length: 3 }, () => makeMessage(prevId.current--, `Older message ${prevId.current + 1}.`)).reverse(),
      ...current,
    ])

  return (
    <>
      <h2>Message Scroller</h2>
      <p>A stick-to-bottom scrollable transcript: appending keeps the newest message in view, scrolling up releases it, and a button re-engages.</p>

      <InstallSnippet slug="message-scroller" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import {
  MessageScroller, MessageScrollerButton, MessageScrollerContent,
  MessageScrollerItem, MessageScrollerProvider, MessageScrollerViewport,
} from "./ui/message-scroller/message-scroller"
import "./ui/message-scroller/message-scroller.css"

<MessageScrollerProvider>
  <MessageScroller style={{ blockSize: "18rem" }}>
    <MessageScrollerViewport>
      <MessageScrollerContent>
        {messages.map(msg => (
          <MessageScrollerItem key={msg.id} messageId={msg.id}>
            {msg.text}
          </MessageScrollerItem>
        ))}
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>See the live demo below.</p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Stick-to-bottom transcript</h3>
        <p>
          Pinned to the live edge: appending keeps the newest message in view. Scroll up (wheel,
          keys, scrollbar) to release; scroll back to the bottom to re-engage. Prepending keeps
          your place.
        </p>
        <div style={{ display: "flex", gap: "0.5rem", marginBlockEnd: "0.75rem" }}>
          <Button variant="outline" size="sm" aria-label="Append message" onClick={append}>
            Append message
          </Button>
          <Button variant="outline" size="sm" aria-label="Prepend messages" onClick={prepend}>
            Prepend 3 older
          </Button>
        </div>
        <MessageScrollerProvider>
          <MessageScroller
            style={{ blockSize: "18rem", maxInlineSize: "28rem", border: "1px solid var(--border)", borderRadius: "var(--radius-lg)" }}
          >
            <MessageScrollerViewport>
              <MessageScrollerContent>
                {messages.map((message) => (
                  <MessageScrollerItem key={message.id} messageId={message.id}>
                    <Message align={message.align}>
                      <MessageContent>
                        <Bubble align={message.align} variant={message.align === "end" ? "default" : "secondary"}>
                          <BubbleContent>{message.text}</BubbleContent>
                        </Bubble>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                ))}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            <MessageScrollerButton />
          </MessageScroller>
          <Readout />
        </MessageScrollerProvider>
      </section>

      <section className="pg-section">
        <h3>Follow and release</h3>
        <ComponentPreview defaultTab="code" code={`// The scroller tracks two states via data-state on the root:
//   "following": pinned to the live edge, new items auto-scroll
//   "released": user scrolled away, new items do not move the viewport
//
// Wheel-up, touch-move, keyboard (ArrowUp/PageUp/Home), and scrollbar
// drag all release follow. Scrolling back to the end re-engages it.
// autoScroll (default true) controls whether re-engagement happens.

<MessageScrollerProvider autoScroll={true}>
  <MessageScroller>
    {/* data-state="following" or "released" on this element */}
    <MessageScrollerViewport>
      <MessageScrollerContent>
        {messages.map(msg => (
          <MessageScrollerItem key={msg.id} messageId={msg.id}>
            {msg.text}
          </MessageScrollerItem>
        ))}
      </MessageScrollerContent>
    </MessageScrollerViewport>
    <MessageScrollerButton />
  </MessageScroller>
</MessageScrollerProvider>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            The live demo above shows both states. Scroll up to release, click the
            button or scroll to the end to re-engage.
          </p>
        </ComponentPreview>
        <p>
          The <code>data-state</code> attribute on the root element reflects <code>"following"</code> or{" "}
          <code>"released"</code>. Use it to style the scroller differently when the user has scrolled
          away, for example showing a "new messages" indicator.
        </p>
      </section>

      <section className="pg-section">
        <h3>Prepend preserves position</h3>
        <ComponentPreview defaultTab="code" code={`// When messages are prepended (older history loaded above), the
// viewport adjusts scrollTop so the currently-viewed message stays
// in place. This works by tracking childList mutations and
// compensating for the height difference.

<MessageScrollerViewport preserveScrollOnPrepend={true}>
  <MessageScrollerContent>
    {/* prepending items here won't jump the user's view */}
  </MessageScrollerContent>
</MessageScrollerViewport>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            Click "Prepend 3 older" in the demo above and notice your scroll position
            holds steady.
          </p>
        </ComponentPreview>
        <p>
          <code>preserveScrollOnPrepend</code> is on by default. It compensates for the
          added height of newly prepended children so that the message the reader was looking at
          stays in place. Content growth from streaming text or image loads is handled
          separately by a <code>ResizeObserver</code> on the content element.
        </p>
      </section>

      <section className="pg-section">
        <h3>Scroll-to-bottom button</h3>
        <ComponentPreview defaultTab="code" code={`// MessageScrollerButton is inert (disabled, data-active="false")
// when the viewport is already at the live edge, and active when
// there is content below the fold. Click calls scrollToEnd().

<MessageScrollerButton />

// Custom children replace the default chevron icon:
<MessageScrollerButton>
  ↓ New messages
</MessageScrollerButton>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            The button in the demo above shows this in action. Scroll up to see it
            activate, then click to jump back.
          </p>
        </ComponentPreview>
        <p>
          The button carries <code>data-active="true"</code> when there is content below the
          fold, <code>"false"</code> when at the bottom. It is also <code>disabled</code> when
          inactive, so keyboard users skip it. Pass children to replace the default chevron SVG.
        </p>
      </section>

      <section className="pg-section">
        <h3>Visibility and scrollable hooks</h3>
        <ComponentPreview defaultTab="code" code={`import {
  useMessageScrollerVisibility,
  useMessageScrollerScrollable,
  useMessageScroller,
} from "./ui/message-scroller/message-scroller"

function StatusBar() {
  const { currentAnchorId, visibleMessageIds } = useMessageScrollerVisibility()
  const { start, end } = useMessageScrollerScrollable()
  const { scrollToMessage, scrollToEnd, scrollToStart } = useMessageScroller()

  return (
    <div>
      <p>Anchor: {currentAnchorId}</p>
      <p>Visible: {visibleMessageIds.join(", ")}</p>
      <p>Can scroll: start={String(start)}, end={String(end)}</p>
      <button onClick={scrollToEnd}>Jump to latest</button>
      <button onClick={scrollToStart}>Jump to oldest</button>
    </div>
  )
}`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            The readout below the demo above uses both hooks live.
          </p>
        </ComponentPreview>
        <p>
          <code>useMessageScrollerVisibility</code> uses an <code>IntersectionObserver</code> scoped
          to the viewport. It reports which <code>messageId</code> values are on screen and which
          one is the topmost (the anchor). The observer watches for items added or removed via
          a <code>MutationObserver</code>, so dynamically appended messages are tracked automatically.
        </p>
        <p>
          <code>useMessageScrollerScrollable</code> reports whether the viewport can scroll in each
          direction, updating on scroll and resize events. Use <code>start</code> and <code>end</code>{" "}
          to show directional scroll indicators or shadow fades.
        </p>
        <p>
          <code>useMessageScroller</code> exposes imperative navigation: <code>scrollToEnd</code>,{" "}
          <code>scrollToStart</code>, and <code>scrollToMessage(id)</code>. The last one sets{" "}
          <code>scrollTop</code> so the targeted item aligns to the top of the viewport, offset
          by <code>scrollPreviousItemPeek</code> from the provider.
        </p>
      </section>

      <section className="pg-section">
        <h3>Default scroll position</h3>
        <ComponentPreview defaultTab="code" code={`// "end" (default): starts pinned to the bottom
<MessageScrollerProvider defaultScrollPosition="end">

// "start": starts at the top, browsers' natural position
<MessageScrollerProvider defaultScrollPosition="start">

// "last-anchor": scrolls to the first [data-scroll-anchor] item
<MessageScrollerProvider defaultScrollPosition="last-anchor">
  <MessageScroller>
    <MessageScrollerViewport>
      <MessageScrollerContent>
        <MessageScrollerItem messageId="old" scrollAnchor>
          Last read position
        </MessageScrollerItem>
        <MessageScrollerItem messageId="new">
          New since you left
        </MessageScrollerItem>
      </MessageScrollerContent>
    </MessageScrollerViewport>
  </MessageScroller>
</MessageScrollerProvider>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>
            The <code>last-anchor</code> mode is useful for restoring a read position when
            the user returns to a conversation.
          </p>
        </ComponentPreview>
        <p>
          <code>defaultScrollPosition</code> controls where the viewport starts on mount.
          The <code>"last-anchor"</code> option looks for the first <code>MessageScrollerItem</code>{" "}
          with <code>scrollAnchor</code> and scrolls that item to the top, letting you mark a
          "last read" position in the transcript.
        </p>
      </section>

      <ApiReference props={[
        { name: "MessageScrollerProvider: autoScroll", type: "boolean", default: "true", description: "Re-engage follow when the user scrolls back to the bottom" },
        { name: "MessageScrollerProvider: defaultScrollPosition", type: '"end" | "start" | "last-anchor"', default: '"end"', description: "Where the viewport starts on mount" },
        { name: "MessageScrollerProvider: scrollPreviousItemPeek", type: "number", default: "0", description: "Pixels of the previous item to show when scrollToMessage is called" },
        { name: "MessageScrollerViewport: preserveScrollOnPrepend", type: "boolean", default: "true", description: "Compensate scrollTop when items are prepended" },
        { name: "MessageScrollerItem: messageId", type: "string", description: "Unique ID used by visibility and anchor hooks" },
        { name: "MessageScrollerItem: scrollAnchor", type: "boolean", default: "false", description: 'Marks this item as the scroll target for defaultScrollPosition="last-anchor"' },
        { name: "MessageScrollerButton", type: "component", description: "Scroll-to-bottom button, auto-disabled when already at the live edge" },
        { name: "useMessageScrollerVisibility", type: "hook", description: "Returns { currentAnchorId, visibleMessageIds }" },
        { name: "useMessageScrollerScrollable", type: "hook", description: "Returns { start, end } booleans for scroll direction" },
        { name: "useMessageScroller", type: "hook", description: "Returns { scrollToMessage, scrollToEnd, scrollToStart } imperative handles" },
      ]} />
    </>
  )
}
