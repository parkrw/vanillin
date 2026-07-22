import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "../../ui/button-group/button-group.jsx"
import "../../ui/button-group/button-group.css"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"

export default function ButtonGroupPage() {
  return (
    <>
      <h2>Button Group</h2>

      <section className="pg-section">
        <h3>Basic</h3>
        <div className="pg-row">
          <ButtonGroup aria-label="Actions">
            <Button variant="outline">Archive</Button>
            <Button variant="outline">Report</Button>
            <Button variant="outline">Snooze</Button>
          </ButtonGroup>
        </div>
      </section>

      <section className="pg-section">
        <h3>With Separator</h3>
        <div className="pg-row">
          <ButtonGroup aria-label="Split action">
            <Button variant="outline">Save</Button>
            <ButtonGroupSeparator />
            <Button variant="outline" size="icon" aria-label="More options">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </Button>
          </ButtonGroup>
        </div>
      </section>

      <section className="pg-section">
        <h3>With Text</h3>
        <div className="pg-row">
          <ButtonGroup aria-label="Navigation">
            <ButtonGroupText>Page 1 of 10</ButtonGroupText>
            <Button variant="outline" size="icon" aria-label="Previous">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </Button>
            <Button variant="outline" size="icon" aria-label="Next">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Button>
          </ButtonGroup>
        </div>
      </section>

      <section className="pg-section">
        <h3>Vertical</h3>
        <div className="pg-row">
          <ButtonGroup orientation="vertical" aria-label="Text formatting">
            <Button variant="outline" size="icon" aria-label="Bold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              </svg>
            </Button>
            <Button variant="outline" size="icon" aria-label="Italic">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" x2="10" y1="4" y2="4" />
                <line x1="14" x2="5" y1="20" y2="20" />
                <line x1="15" x2="9" y1="4" y2="20" />
              </svg>
            </Button>
            <Button variant="outline" size="icon" aria-label="Underline">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 4v6a6 6 0 0 0 12 0V4" />
                <line x1="4" x2="20" y1="20" y2="20" />
              </svg>
            </Button>
          </ButtonGroup>
        </div>
      </section>
    </>
  )
}
