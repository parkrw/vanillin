import { Badge } from "../../ui/badge/badge.jsx"
import "../../ui/badge/badge.css"

export default function BadgePage() {
  return (
    <>
      <h2>Badge</h2>

      <section className="pg-section">
        <h3>Variants</h3>
        <p>
          The four base variants match shadcn/ui. <code>destructive</code> is a
          solid red badge — high contrast, meant for critical actions and
          destructive confirmations.
        </p>
        <div className="pg-row">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      <section className="pg-section">
        <h3>Status variants (soft)</h3>
        <p>
          Status variants use a soft treatment — tinted background, coloured
          text, tinted border — so they stay readable when badges cluster in
          dense table rows. Each maps to the <code>--success</code>,{" "}
          <code>--warning</code>, <code>--info</code>, and{" "}
          <code>--destructive</code> token families.
        </p>
        <p>
          The original <code>destructive</code> variant is kept as-is (solid)
          for backward compatibility. <code>destructive-soft</code> provides
          the same visual weight as the other status variants — use it when
          you want a red badge that sits alongside <code>success</code> or{" "}
          <code>warning</code> badges without dominating the row.
        </p>
        <p>
          Note: <code>StatusDot</code> calls this semantic state{" "}
          <code>error</code> (the console convention); Badge keeps{" "}
          <code>destructive</code> for shadcn parity.
        </p>
        <div className="pg-row" data-pg="badge-status">
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="destructive-soft">Destructive soft</Badge>
        </div>
      </section>
    </>
  )
}
