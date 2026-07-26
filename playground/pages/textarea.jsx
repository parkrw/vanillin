import { Textarea } from "../../ui/textarea/textarea.jsx"
import "../../ui/textarea/textarea.css"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/label/label.css"

/**
 * ## autoResize
 *
 * The `autoResize` prop enables CSS `field-sizing: content` so the textarea
 * grows with its content. It is opt-in rather than default because a textarea
 * that grows in a fixed-height panel would break surrounding layouts.
 *
 * When `autoResize` is set, `rows` sets the minimum visible height and a
 * `max-height` cap (20 rem) prevents unbounded growth; once the cap is reached
 * the textarea scrolls normally.
 *
 * `field-sizing: content` is progressive enhancement: where the browser does
 * not support it, the textarea falls back to its standard fixed-height,
 * manual-resize behaviour with no visual breakage.
 */
export default function TextareaPage() {
  return (
    <>
      <h2>Textarea</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div style={{ maxWidth: "24rem" }}>
          <Textarea placeholder="Type your message..." />
        </div>
      </section>

      <section className="pg-section">
        <h3>With label</h3>
        <div style={{ maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <Label htmlFor="ta-bio">Bio</Label>
          <Textarea id="ta-bio" placeholder="Tell us about yourself" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Auto resize</h3>
        <div style={{ maxWidth: "24rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <Textarea
            autoResize
            rows={3}
            placeholder="Grows with content (rows=3 minimum)..."
            aria-label="Auto resize"
          />
          <Textarea
            autoResize
            rows={2}
            placeholder="Empty auto-resize (rows=2)"
            aria-label="Auto resize empty"
          />
        </div>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "24rem" }}>
          <Textarea placeholder="Disabled" disabled />
          <Textarea placeholder="Invalid" aria-invalid="true" />
        </div>
      </section>
    </>
  )
}
