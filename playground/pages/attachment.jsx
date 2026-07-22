import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
  AttachmentTrigger,
  AttachmentGroup,
} from "../../ui/attachment/attachment.jsx"
import "../../ui/attachment/attachment.css"
import "../../ui/button/button.css"

function FileIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  )
}

function demoImage(hue) {
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="hsl(${hue} 40% 70%)"/></svg>`
  )}`
}

function FileAttachment({ state = "done", size, title, description }) {
  return (
    <Attachment state={state} size={size}>
      <AttachmentMedia>
        <FileIcon />
      </AttachmentMedia>
      <AttachmentContent>
        <AttachmentTitle>{title}</AttachmentTitle>
        <AttachmentDescription>{description}</AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        <AttachmentAction aria-label="Remove">
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  )
}

export default function AttachmentPage() {
  return (
    <>
      <h2>Attachment</h2>

      <section className="pg-section">
        <h3>States</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <FileAttachment state="uploading" title="quarterly-report.pdf" description="Uploading… 1.2 MB" />
          <FileAttachment state="processing" title="quarterly-report.pdf" description="Processing" />
          <FileAttachment state="error" title="quarterly-report.pdf" description="Upload failed" />
          <FileAttachment state="done" title="quarterly-report.pdf" description="1.2 MB" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <FileAttachment title="default.pdf" description="1.2 MB" />
          <FileAttachment size="sm" title="small.pdf" description="1.2 MB" />
          <FileAttachment size="xs" title="extra-small.pdf" description="1.2 MB" />
        </div>
      </section>

      <section className="pg-section">
        <h3>Vertical, image media, trigger</h3>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <Attachment state="done" orientation="vertical" style={{ inlineSize: "10rem" }}>
            <AttachmentMedia variant="image">
              <img src={demoImage(150)} alt="" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>forest.png</AttachmentTitle>
              <AttachmentDescription>640 × 480</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Download">
                <DownloadIcon />
              </AttachmentAction>
            </AttachmentActions>
            <AttachmentTrigger aria-label="Open forest.png" onClick={() => {}} />
          </Attachment>
        </div>
      </section>

      <section className="pg-section">
        <h3>Group (scroll-snap row, edge fade)</h3>
        <div style={{ maxWidth: "24rem" }}>
          <AttachmentGroup>
            {[20, 90, 150, 210, 280].map((hue, i) => (
              <Attachment key={hue} state="done" size="sm">
                <AttachmentMedia variant="image">
                  <img src={demoImage(hue)} alt="" />
                </AttachmentMedia>
                <AttachmentContent>
                  <AttachmentTitle>photo-{i + 1}.jpg</AttachmentTitle>
                  <AttachmentDescription>2.4 MB</AttachmentDescription>
                </AttachmentContent>
              </Attachment>
            ))}
          </AttachmentGroup>
        </div>
      </section>
    </>
  )
}
