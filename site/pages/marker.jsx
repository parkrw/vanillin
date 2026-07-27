import { Marker, MarkerIcon, MarkerContent } from "../../ui/marker/marker.jsx"
import "../../ui/marker/marker.css"

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  )
}

export default function MarkerPage() {
  return (
    <>
      <h2>Marker</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: "28rem" }}>
          <Marker>
            <MarkerIcon>
              <CheckIcon />
            </MarkerIcon>
            <MarkerContent>Explored 4 files</MarkerContent>
          </Marker>
          <Marker>
            <MarkerIcon>
              <FileIcon />
            </MarkerIcon>
            <MarkerContent>Opened implementation notes</MarkerContent>
          </Marker>
          <Marker>
            <MarkerContent>A default marker without icon</MarkerContent>
          </Marker>
        </div>
      </section>

      <section className="pg-section">
        <h3>Border Variant</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "28rem" }}>
          <Marker variant="border">
            <MarkerIcon>
              <FileIcon />
            </MarkerIcon>
            <MarkerContent>Opened implementation notes</MarkerContent>
          </Marker>
          <Marker variant="border">
            <MarkerIcon>
              <AlertIcon />
            </MarkerIcon>
            <MarkerContent>Review required before merge</MarkerContent>
          </Marker>
        </div>
      </section>

      <section className="pg-section">
        <h3>Separator Variant</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxWidth: "28rem" }}>
          <Marker variant="separator">
            <MarkerContent>Today</MarkerContent>
          </Marker>
          <Marker variant="separator">
            <MarkerContent>Yesterday</MarkerContent>
          </Marker>
        </div>
      </section>

      <section className="pg-section">
        <h3>As Link</h3>
        <div style={{ maxWidth: "28rem" }}>
          <Marker as="a" href="#marker">
            <MarkerIcon>
              <CheckIcon />
            </MarkerIcon>
            <MarkerContent>View the pull request</MarkerContent>
          </Marker>
        </div>
      </section>
    </>
  )
}
