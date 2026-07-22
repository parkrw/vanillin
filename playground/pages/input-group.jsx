import {
  InputGroup,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
} from "../../ui/input-group/input-group.jsx"
import "../../ui/input-group/input-group.css"

export default function InputGroupPage() {
  return (
    <>
      <h2>Input Group</h2>

      <section className="pg-section">
        <h3>With Icon (inline-start)</h3>
        <div className="pg-row" style={{ maxWidth: "24rem" }}>
          <InputGroup>
            <InputGroupAddon>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </InputGroupAddon>
            <InputGroupInput placeholder="Search..." />
          </InputGroup>
        </div>
      </section>

      <section className="pg-section">
        <h3>With Icon (inline-end)</h3>
        <div className="pg-row" style={{ maxWidth: "24rem" }}>
          <InputGroup>
            <InputGroupInput placeholder="Enter email..." />
            <InputGroupAddon align="inline-end">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="20" height="16" x="2" y="4" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </section>

      <section className="pg-section">
        <h3>With Text</h3>
        <div className="pg-row" style={{ maxWidth: "24rem" }}>
          <InputGroup>
            <InputGroupAddon>
              <InputGroupText>https://</InputGroupText>
            </InputGroupAddon>
            <InputGroupInput placeholder="example.com" />
          </InputGroup>
        </div>
      </section>

      <section className="pg-section">
        <h3>With Button</h3>
        <div className="pg-row" style={{ maxWidth: "24rem" }}>
          <InputGroup>
            <InputGroupInput placeholder="Type a message..." />
            <InputGroupAddon align="inline-end">
              <InputGroupButton>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
                Send
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </section>

      <section className="pg-section">
        <h3>Textarea with Block Addon</h3>
        <div className="pg-row" style={{ maxWidth: "24rem" }}>
          <InputGroup>
            <InputGroupTextarea placeholder="Write your message..." />
            <InputGroupAddon align="block-end">
              <InputGroupButton size="icon-xs" aria-label="Attach file">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </InputGroupButton>
              <InputGroupButton size="icon-xs" aria-label="Emoji">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                  <line x1="9" x2="9.01" y1="9" y2="9" />
                  <line x1="15" x2="15.01" y1="9" y2="9" />
                </svg>
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </div>
      </section>
    </>
  )
}
