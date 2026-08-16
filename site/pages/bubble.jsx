import { Bubble, BubbleContent, BubbleGroup, BubbleReactions } from "../../ui/bubble/bubble.jsx"
import "../../ui/bubble/bubble.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const variants = ["default", "secondary", "muted", "tinted", "outline", "destructive"]

export default function BubblePage() {
  return (
    <>
      <h2>Bubble</h2>
      <p>A chat-message surface with alignment, reactions, and grouping for consecutive messages from one sender.</p>

      <InstallSnippet slug="bubble" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Bubble, BubbleContent } from "./ui/bubble/bubble"
import "./ui/bubble/bubble.css"

<Bubble>
  <BubbleContent>Hello there</BubbleContent>
</Bubble>`}>
          <Bubble>
            <BubbleContent>Hello there</BubbleContent>
          </Bubble>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Variants</h3>
        <ComponentPreview code={`<Bubble variant="default"><BubbleContent>default</BubbleContent></Bubble>
<Bubble variant="secondary"><BubbleContent>secondary</BubbleContent></Bubble>
<Bubble variant="muted"><BubbleContent>muted</BubbleContent></Bubble>
<Bubble variant="tinted"><BubbleContent>tinted</BubbleContent></Bubble>
<Bubble variant="outline"><BubbleContent>outline</BubbleContent></Bubble>
<Bubble variant="destructive"><BubbleContent>destructive</BubbleContent></Bubble>`}>
          <div style={{ maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {variants.map((variant) => (
              <Bubble key={variant} variant={variant}>
                <BubbleContent>{variant}</BubbleContent>
              </Bubble>
            ))}
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Ghost (full width, unframed)</h3>
        <ComponentPreview code={`<Bubble variant="ghost">
  <BubbleContent>
    Ghost bubbles span the full width without a surface —
    used for assistant prose in AI chats.
  </BubbleContent>
</Bubble>`}>
          <div style={{ maxWidth: "24rem" }}>
            <Bubble variant="ghost">
              <BubbleContent>
                Ghost bubbles span the full width without a surface — used for
                assistant prose in AI chats.
              </BubbleContent>
            </Bubble>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Conversation with Reactions</h3>
        <ComponentPreview code={`<Bubble variant="secondary">
  <BubbleContent>Did you see the launch?</BubbleContent>
</Bubble>
<Bubble align="end">
  <BubbleContent>Yes! Incredible footage.</BubbleContent>
  <BubbleReactions>
    <span>\u{1F680}</span><span>2</span>
  </BubbleReactions>
</Bubble>
<Bubble variant="secondary">
  <BubbleContent>Watch party this weekend?</BubbleContent>
  <BubbleReactions side="top" align="start">
    <span>\u{1F44D}</span>
  </BubbleReactions>
</Bubble>`}>
          <div style={{ maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <Bubble variant="secondary">
              <BubbleContent>Did you see the launch?</BubbleContent>
            </Bubble>
            <Bubble align="end">
              <BubbleContent>Yes! Incredible footage.</BubbleContent>
              <BubbleReactions>
                <span>{"\u{1F680}"}</span>
                <span>2</span>
              </BubbleReactions>
            </Bubble>
            <Bubble variant="secondary">
              <BubbleContent>Watch party this weekend?</BubbleContent>
              <BubbleReactions side="top" align="start">
                <span>{"\u{1F44D}"}</span>
              </BubbleReactions>
            </Bubble>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Group (consecutive messages)</h3>
        <ComponentPreview code={`<BubbleGroup>
  <Bubble align="end">
    <BubbleContent>Three quick thoughts:</BubbleContent>
  </Bubble>
  <Bubble align="end">
    <BubbleContent>Grouped bubbles square their shared corners.</BubbleContent>
  </Bubble>
  <Bubble align="end">
    <BubbleContent>Outer corners stay round.</BubbleContent>
  </Bubble>
</BubbleGroup>`}>
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
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Tappable (as="a")</h3>
        <ComponentPreview code={`<Bubble variant="tinted">
  <BubbleContent as="a" href="#bubble">
    Open shared document →
  </BubbleContent>
</Bubble>`}>
          <div style={{ maxWidth: "24rem" }}>
            <Bubble variant="tinted">
              <BubbleContent as="a" href="#bubble">
                Open shared document {"→"}
              </BubbleContent>
            </Bubble>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "variant", type: '"default" | "secondary" | "muted" | "tinted" | "outline" | "ghost" | "destructive"', default: '"default"', description: "Visual style of the bubble surface" },
        { name: "align", type: '"start" | "end"', default: '"start"', description: "Horizontal alignment — start for incoming, end for outgoing" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
