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

export default function MessagePage() {
  return (
    <>
      <h2>Message</h2>

      <section className="pg-section">
        <h3>Conversation</h3>
        <div style={{ maxWidth: "28rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
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
      </section>

      <section className="pg-section">
        <h3>Avatar clears the footer</h3>
        <div style={{ maxWidth: "28rem" }}>
          <Message>
            <MessageAvatar>
              <Avatar>
                <AvatarFallback>AL</AvatarFallback>
              </Avatar>
            </MessageAvatar>
            <MessageContent>
              <Bubble variant="secondary">
                <BubbleContent>The avatar lines up with the bubble, not the footer.</BubbleContent>
              </Bubble>
              <MessageFooter>Delivered</MessageFooter>
            </MessageContent>
          </Message>
        </div>
      </section>

      <section className="pg-section">
        <h3>Grouped messages (avatar once)</h3>
        <div style={{ maxWidth: "28rem" }}>
          <MessageGroup>
            <Message>
              <MessageAvatar>
                <Avatar>
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
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
                <Avatar>
                  <AvatarFallback>AL</AvatarFallback>
                </Avatar>
              </MessageAvatar>
              <MessageContent>
                <Bubble variant="secondary">
                  <BubbleContent>…show the avatar only on the last row.</BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          </MessageGroup>
        </div>
      </section>
    </>
  )
}
