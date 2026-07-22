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

export default function EmptyPage() {
  return (
    <>
      <h2>Empty</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <Empty>
          <EmptyHeader>
            <EmptyMedia>
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No messages</EmptyTitle>
            <EmptyDescription>Your inbox is empty. New messages will appear here.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </section>

      <section className="pg-section">
        <h3>With Icon Variant</h3>
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
      </section>

      <section className="pg-section">
        <h3>With Actions</h3>
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
      </section>
    </>
  )
}
