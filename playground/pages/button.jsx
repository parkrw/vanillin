import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"

export default function ButtonPage() {
  return (
    <>
      <h2>Button</h2>

      <section className="pg-section">
        <h3>Variants</h3>
        <div className="pg-row">
          <Button>Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <div className="pg-row">
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4m0 14v4M4.2 4.2l2.8 2.8m10 10 2.8 2.8M1 12h4m14 0h4M4.2 19.8l2.8-2.8m10-10 2.8-2.8" />
            </svg>
          </Button>
        </div>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <div className="pg-row">
          <Button disabled>Disabled</Button>
          <Button as="a" href="#button">
            As link
          </Button>
        </div>
      </section>
    </>
  )
}
