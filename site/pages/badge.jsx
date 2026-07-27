import { useState } from "react"
import { Badge, Chip } from "../../ui/badge/badge.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/badge/badge.css"
import "../../ui/button/button.css"

const initialChips = ["Design", "Engineering", "Ops"]

export default function BadgePage() {
  const [chips, setChips] = useState(initialChips)

  return (
    <>
      <h2>Badge</h2>

      <section className="pg-section">
        <h3>Variants</h3>
        <p>
          Four base variants. <code>destructive</code> is a
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
          <code>destructive</code>, the name the variant has always had.
        </p>
        <div className="pg-row" data-pg="badge-status">
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="destructive-soft">Destructive soft</Badge>
        </div>
      </section>

      <section className="pg-section">
        <h3>Chip</h3>
        <p>
          <code>Chip</code> is a badge with a dismiss affordance: it renders{" "}
          <code>&lt;Badge variant="secondary" className="badge--chip"&gt;</code>{" "}
          plus a truncating label and an optional remove button. It lives here
          rather than in its own slug because a chip <em>is</em> a badge — same
          primitive, same meaning — and the kit had drifted into two
          implementations of it (<code>ui/combobox</code> had its own).{" "}
          <code>ui/combobox</code> now imports this one.
        </p>
        <p>
          Pass <code>onRemove</code> for the button; omit it for a static chip.
          The button is <code>tabIndex={"{-1}"}</code> on purpose — Tab must not
          walk eight chips to reach the control they sit in, so pair it with a
          Backspace shortcut the way combobox does. Its accessible name
          defaults to <code>Remove &lt;label&gt;</code>; override with{" "}
          <code>removeLabel</code> when the child is not a plain string. Long
          labels ellipsis at <code>10rem</code>.
        </p>
        <div className="pg-row" data-pg="badge-chips">
          <Chip>Static</Chip>
          {chips.map((c) => (
            <Chip key={c} onRemove={() => setChips(chips.filter((x) => x !== c))}>
              {c}
            </Chip>
          ))}
          <Chip onRemove={() => {}} disabled>
            Disabled
          </Chip>
          <Chip onRemove={() => {}}>
            A label long enough to be truncated by the chip
          </Chip>
        </div>
        <div className="pg-row">
          <Button variant="outline" size="sm" onClick={() => setChips(initialChips)}>
            Reset chips
          </Button>
        </div>
      </section>

      <section className="pg-section">
        <h3>Density</h3>
        <p>
          Padding and gap scale with <code>--density-scale</code> via the{" "}
          <code>--space-*</code> ramp.
        </p>
      </section>
    </>
  )
}
