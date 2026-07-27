import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "../../ui/bubble/bubble.jsx"
import "../../ui/bubble/bubble.css"

const variants = ["default", "secondary", "muted", "tinted", "outline", "destructive"]

export default function BubblePage() {
  return (
    <>
      <h2>Bubble</h2>

      <section className="pg-section">
        <h3>Variants</h3>
        <div className="pg-col" style={{ maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {variants.map((variant) => (
            <Bubble key={variant} variant={variant}>
              <BubbleContent>{variant}</BubbleContent>
            </Bubble>
          ))}
        </div>
      </section>

      <section className="pg-section">
        <h3>Ghost (full width, unframed)</h3>
        <div style={{ maxWidth: "24rem" }}>
          <Bubble variant="ghost">
            <BubbleContent>
              Ghost bubbles span the full width without a surface — used for
              assistant prose in AI chats.
            </BubbleContent>
          </Bubble>
        </div>
      </section>

      <section className="pg-section">
        <h3>Conversation with reactions</h3>
        <div style={{ maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Bubble variant="secondary">
            <BubbleContent>Did you see the launch?</BubbleContent>
          </Bubble>
          <Bubble align="end">
            <BubbleContent>Yes! Incredible footage.</BubbleContent>
            <BubbleReactions>
              <span>🚀</span>
              <span>2</span>
            </BubbleReactions>
          </Bubble>
          <Bubble variant="secondary">
            <BubbleContent>Watch party this weekend?</BubbleContent>
            <BubbleReactions side="top" align="start">
              <span>👍</span>
            </BubbleReactions>
          </Bubble>
        </div>
      </section>

      <section className="pg-section">
        <h3>Group (consecutive messages)</h3>
        <div style={{ maxWidth: "24rem" }}>
          <BubbleGroup>
            <Bubble align="end">
              <BubbleContent>Three quick thoughts:</BubbleContent>
            </Bubble>
            <Bubble align="end">
              <BubbleContent>Grouped bubbles square their shared corners.</BubbleContent>
            </Bubble>
            <Bubble align="end">
              <BubbleContent>Outer corners stay round.</BubbleContent>
            </Bubble>
          </BubbleGroup>
        </div>
      </section>

      <section className="pg-section">
        <h3>Tappable (as="a")</h3>
        <div style={{ maxWidth: "24rem" }}>
          <Bubble variant="tinted">
            <BubbleContent as="a" href="#bubble">
              Open shared document →
            </BubbleContent>
          </Bubble>
        </div>
      </section>
    </>
  )
}
