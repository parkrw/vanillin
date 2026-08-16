import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "../../ui/empty/empty.jsx"
import "../../ui/empty/empty.css"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import { Card, CardHeader, CardTitle, CardContent } from "../../ui/card/card.jsx"
import "../../ui/card/card.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

function InboxIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </svg>
  )
}

function CloudIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  )
}

export default function EmptyPage() {
  return (
    <>
      <h2>Empty</h2>
      <p>A placeholder for empty states: icon, title, description, and optional action buttons in a centred layout.</p>

      <InstallSnippet slug="empty" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "./ui/empty/empty"
import "./ui/empty/empty.css"

<Empty>
  <EmptyHeader>
    <EmptyMedia><InboxIcon /></EmptyMedia>
    <EmptyTitle>Nothing here</EmptyTitle>
    <EmptyDescription>Content will appear when available.</EmptyDescription>
  </EmptyHeader>
</Empty>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>See the live demos below.</p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-empty-frame" data-pg="empty-frame">
          <Empty data-pg="empty-default">
            <EmptyHeader>
              <EmptyMedia>
                <InboxIcon />
              </EmptyMedia>
              <EmptyTitle>No messages</EmptyTitle>
              <EmptyDescription>Your inbox is empty. New messages will appear here.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </div>
        <p className="pg-desc">
          <code>Empty</code> paints no bounds of its own: it centres itself in whatever box you give it. The dashed frame belongs to the docs site, not the component, so you can see where the box ends.
        </p>
      </section>

      <section className="pg-section">
        <h3>Icon media</h3>
        <ComponentPreview code={`<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <CloudIcon />
    </EmptyMedia>
    <EmptyTitle>Cloud Storage Empty</EmptyTitle>
    <EmptyDescription>Upload files to your cloud storage to access them anywhere.</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button>Upload Files</Button>
  </EmptyContent>
</Empty>`}>
          <div className="pg-empty-frame" style={{ width: "100%" }}>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CloudIcon />
                </EmptyMedia>
                <EmptyTitle>Cloud Storage Empty</EmptyTitle>
                <EmptyDescription>Upload files to your cloud storage to access them anywhere.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button>Upload Files</Button>
              </EmptyContent>
            </Empty>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>variant="icon"</code> renders the media slot as a filled circle. Use it when the empty state is a resting state rather than a problem.
        </p>
      </section>

      <section className="pg-section">
        <h3>With actions</h3>
        <ComponentPreview code={`<EmptyContent>
  <Button variant="outline">Clear filters</Button>
  <Button>New search</Button>
</EmptyContent>`}>
          <div className="pg-empty-frame" style={{ width: "100%" }}>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <SearchIcon />
                </EmptyMedia>
                <EmptyTitle>No results found</EmptyTitle>
                <EmptyDescription>Try adjusting your search or filters to find what you are looking for.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline">Clear filters</Button>
                <Button>New search</Button>
              </EmptyContent>
            </Empty>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>EmptyContent</code> lays its children out in a row. Put the recovery action last so it reads as the primary one.
        </p>
      </section>

      <section className="pg-section">
        <h3>Text only</h3>
        <ComponentPreview code={`{/* EmptyMedia is optional. */}
<Empty>
  <EmptyHeader>
    <EmptyTitle>No activity yet</EmptyTitle>
    <EmptyDescription>Events from the last 30 days will show up here.</EmptyDescription>
  </EmptyHeader>
</Empty>`}>
          <div className="pg-empty-frame" style={{ width: "100%" }}>
            <Empty>
              <EmptyHeader>
                <EmptyTitle>No activity yet</EmptyTitle>
                <EmptyDescription>Events from the last 30 days will show up here.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Every slot is optional. Dropping the media keeps the state quiet, which suits a panel that is empty by default rather than by accident.
        </p>
      </section>

      <section className="pg-section">
        <h3>Error state</h3>
        <ComponentPreview code={`<Empty>
  <EmptyHeader>
    <EmptyMedia variant="icon">
      <AlertIcon />
    </EmptyMedia>
    <EmptyTitle>Could not load deployments</EmptyTitle>
    <EmptyDescription>The build service did not respond. Nothing was lost.</EmptyDescription>
  </EmptyHeader>
  <EmptyContent>
    <Button variant="outline">Try again</Button>
  </EmptyContent>
</Empty>`}>
          <div className="pg-empty-frame" style={{ width: "100%" }}>
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <AlertIcon />
                </EmptyMedia>
                <EmptyTitle>Could not load deployments</EmptyTitle>
                <EmptyDescription>The build service did not respond. Nothing was lost.</EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button variant="outline">Try again</Button>
              </EmptyContent>
            </Empty>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          A failed fetch and an empty result look the same to the layout, so say which one it is in the description. The component carries no error styling of its own.
        </p>
      </section>

      <section className="pg-section">
        <h3>Inside a card</h3>
        <ComponentPreview code={`<Card>
  <CardHeader>
    <CardTitle>Team members</CardTitle>
  </CardHeader>
  <CardContent>
    <Empty>
      <EmptyHeader>
        <EmptyTitle>Nobody here yet</EmptyTitle>
        <EmptyDescription>Invite a teammate to get started.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="sm">Send invite</Button>
      </EmptyContent>
    </Empty>
  </CardContent>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "28rem" }}>
            <CardHeader>
              <CardTitle>Team members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="pg-empty-frame">
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>Nobody here yet</EmptyTitle>
                    <EmptyDescription>Invite a teammate to get started.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button size="sm">Send invite</Button>
                  </EmptyContent>
                </Empty>
              </div>
            </CardContent>
          </Card>
        </ComponentPreview>
        <p className="pg-desc">
          In real use the card is the container, so the dashed frame comes off. It stays here only because the docs site frames every <code>Empty</code> demo the same way.
        </p>
      </section>

      <ApiReference props={[
        { name: "className", type: "string", description: "Additional CSS classes on the root" },
        { name: "EmptyMedia: variant", type: '"default" | "icon"', default: '"default"', description: "Icon variant renders media as a filled circle" },
      ]} />
    </>
  )
}
