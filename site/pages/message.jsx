import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "../../ui/message/message.jsx"
import { Bubble, BubbleContent } from "../../ui/bubble/bubble.jsx"
import { Avatar, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import "../../ui/message/message.css"
import "../../ui/bubble/bubble.css"
import "../../ui/avatar/avatar.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function MessagePage() {
  return (
    <>
      <h2>Message</h2>
      <p>A chat-message row with avatar, header, bubble, and footer: the layout primitive that pairs with Bubble.</p>

      <InstallSnippet slug="message" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Message, MessageAvatar, MessageContent, MessageHeader } from "./ui/message/message"
import { Bubble, BubbleContent } from "./ui/bubble/bubble"
import { Avatar, AvatarFallback } from "./ui/avatar/avatar"

<Message>
  <MessageAvatar>
    <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
  </MessageAvatar>
  <MessageContent>
    <MessageHeader>Ada</MessageHeader>
    <Bubble variant="secondary">
      <BubbleContent>Morning!</BubbleContent>
    </Bubble>
  </MessageContent>
</Message>`}>
          <div style={{ maxWidth: "28rem" }}>
            <Message>
              <MessageAvatar>
                <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader>Ada</MessageHeader>
                <Bubble variant="secondary">
                  <BubbleContent>Morning!</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Conversation</h3>
        <ComponentPreview code={`<Message>
  <MessageAvatar>
    <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
  </MessageAvatar>
  <MessageContent>
    <MessageHeader>Ada</MessageHeader>
    <Bubble variant="secondary">
      <BubbleContent>Morning! Ship day?</BubbleContent>
    </Bubble>
  </MessageContent>
</Message>
<Message align="end">
  <MessageContent>
    <Bubble align="end">
      <BubbleContent>Ship day. Tests are green.</BubbleContent>
    </Bubble>
    <MessageFooter>Read 9:41</MessageFooter>
  </MessageContent>
</Message>`}>
          <div style={{ maxWidth: "28rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <Message>
              <MessageAvatar>
                <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
              </MessageAvatar>
              <MessageContent>
                <MessageHeader>Ada</MessageHeader>
                <Bubble variant="secondary">
                  <BubbleContent>Morning! Ship day?</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
            <Message align="end">
              <MessageContent>
                <Bubble align="end">
                  <BubbleContent>Ship day. Tests are green.</BubbleContent>
                </Bubble>
                <MessageFooter>Read 9:41</MessageFooter>
              </MessageContent>
            </Message>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Avatar Clears the Footer</h3>
        <ComponentPreview code={`<Message>
  <MessageAvatar>
    <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
  </MessageAvatar>
  <MessageContent>
    <Bubble variant="secondary">
      <BubbleContent>The avatar lines up with the bubble, not the footer.</BubbleContent>
    </Bubble>
    <MessageFooter>Delivered</MessageFooter>
  </MessageContent>
</Message>`}>
          <div style={{ maxWidth: "28rem" }}>
            <Message>
              <MessageAvatar>
                <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble variant="secondary">
                  <BubbleContent>The avatar lines up with the bubble, not the footer.</BubbleContent>
                </Bubble>
                <MessageFooter>Delivered</MessageFooter>
              </MessageContent>
            </Message>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Grouped Messages (avatar once)</h3>
        <ComponentPreview code={`<MessageGroup>
  <Message>
    <MessageAvatar>
      <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
    </MessageAvatar>
    <MessageContent>
      <MessageHeader>Ada</MessageHeader>
      <Bubble variant="secondary">
        <BubbleContent>Consecutive rows from one sender…</BubbleContent>
      </Bubble>
    </MessageContent>
  </Message>
  <Message>
    <MessageAvatar>
      <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
    </MessageAvatar>
    <MessageContent>
      <Bubble variant="secondary">
        <BubbleContent>…show the avatar only on the last row.</BubbleContent>
      </Bubble>
    </MessageContent>
  </Message>
</MessageGroup>`}>
          <div style={{ maxWidth: "28rem" }}>
            <MessageGroup>
              <Message>
                <MessageAvatar>
                  <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
                </MessageAvatar>
                <MessageContent>
                  <MessageHeader>Ada</MessageHeader>
                  <Bubble variant="secondary">
                    <BubbleContent>Consecutive rows from one sender…</BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
              <Message>
                <MessageAvatar>
                  <Avatar><AvatarFallback>AL</AvatarFallback></Avatar>
                </MessageAvatar>
                <MessageContent>
                  <Bubble variant="secondary">
                    <BubbleContent>…show the avatar only on the last row.</BubbleContent>
                  </Bubble>
                </MessageContent>
              </Message>
            </MessageGroup>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "align", type: '"start" | "end"', default: '"start"', description: "Horizontal alignment: start for incoming, end for outgoing" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
