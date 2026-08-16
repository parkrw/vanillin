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
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

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

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
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
      <p>A file-upload card with media, title, description, and action buttons, with upload states, vertical orientation, image previews, and scroll-snap groups.</p>

      <InstallSnippet slug="attachment" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Attachment, AttachmentMedia, AttachmentContent, AttachmentTitle, AttachmentDescription } from "./ui/attachment/attachment"
import "./ui/attachment/attachment.css"

<Attachment state="done">
  <AttachmentMedia><FileIcon /></AttachmentMedia>
  <AttachmentContent>
    <AttachmentTitle>report.pdf</AttachmentTitle>
    <AttachmentDescription>1.2 MB</AttachmentDescription>
  </AttachmentContent>
</Attachment>`}>
          <Attachment state="done">
            <AttachmentMedia><FileIcon /></AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>report.pdf</AttachmentTitle>
              <AttachmentDescription>1.2 MB</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>States</h3>
        <ComponentPreview code={`<Attachment state="uploading">
  <AttachmentMedia><FileIcon /></AttachmentMedia>
  <AttachmentContent>
    <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
    <AttachmentDescription>Uploading… 1.2 MB</AttachmentDescription>
  </AttachmentContent>
</Attachment>
<Attachment state="processing">…</Attachment>
<Attachment state="error">…</Attachment>
<Attachment state="done">…</Attachment>`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <FileAttachment state="uploading" title="quarterly-report.pdf" description="Uploading… 1.2 MB" />
            <FileAttachment state="processing" title="quarterly-report.pdf" description="Processing" />
            <FileAttachment state="error" title="quarterly-report.pdf" description="Upload failed" />
            <FileAttachment state="done" title="quarterly-report.pdf" description="1.2 MB" />
          </div>
        </ComponentPreview>
        <p>
          The <code>state</code> prop drives <code>data-state</code> on the root, which the
          CSS uses to show a progress bar for <code>uploading</code>, a spinner
          for <code>processing</code>, and a destructive-tinted border for <code>error</code>.
          The <code>idle</code> state is the default when no file has been attached yet.
        </p>
      </section>

      <section className="pg-section">
        <h3>Sizes</h3>
        <ComponentPreview code={`<Attachment state="done">…default…</Attachment>
<Attachment state="done" size="sm">…small…</Attachment>
<Attachment state="done" size="xs">…extra-small…</Attachment>`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <FileAttachment title="default.pdf" description="1.2 MB" />
            <FileAttachment size="sm" title="small.pdf" description="1.2 MB" />
            <FileAttachment size="xs" title="extra-small.pdf" description="1.2 MB" />
          </div>
        </ComponentPreview>
        <p>
          <code>sm</code> and <code>xs</code> reduce icon size, padding, and font to fit
          tighter layouts like chat input bars.
        </p>
      </section>

      <section className="pg-section">
        <h3>Vertical with image media</h3>
        <ComponentPreview code={`<Attachment state="done" orientation="vertical" style={{ inlineSize: "10rem" }}>
  <AttachmentMedia variant="image">
    <img src="photo.jpg" alt="" />
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
</Attachment>`}>
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
            <Attachment state="done" orientation="vertical" style={{ inlineSize: "10rem" }}>
              <AttachmentMedia variant="image">
                <img src={demoImage(280)} alt="" />
              </AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>sunset.jpg</AttachmentTitle>
                <AttachmentDescription>1920 × 1080</AttachmentDescription>
              </AttachmentContent>
              <AttachmentActions>
                <AttachmentAction aria-label="Download sunset">
                  <DownloadIcon />
                </AttachmentAction>
              </AttachmentActions>
              <AttachmentTrigger aria-label="Open sunset.jpg" onClick={() => {}} />
            </Attachment>
          </div>
        </ComponentPreview>
        <p>
          <code>orientation="vertical"</code> stacks media above content. The{" "}
          <code>AttachmentMedia variant="image"</code> renders the child as a cropped
          thumbnail. <code>AttachmentTrigger</code> is an inset overlay that makes the
          entire card clickable while keeping action buttons above it in the stacking order.
        </p>
      </section>

      <section className="pg-section">
        <h3>With actions</h3>
        <ComponentPreview code={`<Attachment state="done">
  <AttachmentMedia><FileIcon /></AttachmentMedia>
  <AttachmentContent>
    <AttachmentTitle>presentation.pptx</AttachmentTitle>
    <AttachmentDescription>4.7 MB</AttachmentDescription>
  </AttachmentContent>
  <AttachmentActions>
    <AttachmentAction aria-label="Download file">
      <DownloadIcon />
    </AttachmentAction>
    <AttachmentAction aria-label="Remove file">
      <XIcon />
    </AttachmentAction>
  </AttachmentActions>
</Attachment>`}>
          <Attachment state="done">
            <AttachmentMedia><FileIcon /></AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>presentation.pptx</AttachmentTitle>
              <AttachmentDescription>4.7 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
              <AttachmentAction aria-label="Download file">
                <DownloadIcon />
              </AttachmentAction>
              <AttachmentAction aria-label="Remove file">
                <XIcon />
              </AttachmentAction>
            </AttachmentActions>
          </Attachment>
        </ComponentPreview>
        <p>
          <code>AttachmentAction</code> is a ghost icon button. Stack multiple actions in{" "}
          <code>AttachmentActions</code> for download, remove, preview, or any other per-file
          operation.
        </p>
      </section>

      <section className="pg-section">
        <h3>Image media without vertical</h3>
        <ComponentPreview code={`<Attachment state="done">
  <AttachmentMedia variant="image">
    <img src="thumbnail.jpg" alt="" />
  </AttachmentMedia>
  <AttachmentContent>
    <AttachmentTitle>cover-photo.jpg</AttachmentTitle>
    <AttachmentDescription>2.1 MB</AttachmentDescription>
  </AttachmentContent>
</Attachment>`}>
          <Attachment state="done">
            <AttachmentMedia variant="image">
              <img src={demoImage(40)} alt="" />
            </AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>cover-photo.jpg</AttachmentTitle>
              <AttachmentDescription>2.1 MB</AttachmentDescription>
            </AttachmentContent>
          </Attachment>
        </ComponentPreview>
        <p>
          <code>variant="image"</code> works in horizontal orientation too. The thumbnail
          renders inline beside the title and description.
        </p>
      </section>

      <section className="pg-section">
        <h3>Group (scroll-snap row, edge fade)</h3>
        <p>
          <code>AttachmentGroup</code> wraps cards in a scroll-snap row with a mask-based
          edge fade. The viewport insets by the fade width so the first and last card's borders
          are fully visible at their snap positions.
        </p>
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

      <ApiReference props={[
        { name: "state", type: '"idle" | "uploading" | "processing" | "error" | "done"', default: '"idle"', description: "Upload lifecycle state; drives data-state for CSS" },
        { name: "size", type: '"default" | "sm" | "xs"', default: '"default"', description: "Card size; icon, padding, and font scale down" },
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Stack direction for media and content" },
        { name: "AttachmentMedia: variant", type: '"icon" | "image"', default: '"icon"', description: "Image variant renders a cropped thumbnail preview" },
        { name: "AttachmentAction", type: "component", description: "Ghost icon button for per-file actions (download, remove)" },
        { name: "AttachmentTrigger", type: "component", description: "Inset overlay that makes the whole card clickable; actions stay above" },
        { name: "AttachmentTrigger: as", type: "ElementType", default: '"button"', description: 'Render as a different element (e.g. as="a" for a link)' },
        { name: "className", type: "string", description: "Additional CSS classes on any part" },
      ]} />
    </>
  )
}
