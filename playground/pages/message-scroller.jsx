import { useRef, useState } from "react"
import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "../../ui/message-scroller/message-scroller.jsx"
import { Message, MessageContent } from "../../ui/message/message.jsx"
import { Bubble, BubbleContent } from "../../ui/bubble/bubble.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/message-scroller/message-scroller.css"
import "../../ui/message/message.css"
import "../../ui/bubble/bubble.css"
import "../../ui/button/button.css"

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
          </MessageScroller>
        </MessageScrollerProvider>
      </section>
    </>
  )
}
