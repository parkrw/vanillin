import { Toaster, toast } from "../../ui/toast/toast.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/toast/toast.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

if (typeof window !== "undefined") window.__toast = toast

export default function ToastPage() {
  return (
    <>
      <h2>Toast (Sonner)</h2>
      <p>Non-intrusive notifications that appear temporarily and auto-dismiss.</p>
      <Toaster position="bottom-right" closeButton richColors data-pg="toaster" duration={4000} />

      <InstallSnippet slug="toast" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Toaster, toast } from "./ui/toast/toast"
import "./ui/toast/toast.css"

// Place <Toaster /> once in your app root
<Toaster position="bottom-right" />

// Trigger from anywhere
toast("Event has been created")
toast.success("Saved", { description: "Changes saved." })
toast.error("Failed", { description: "Please try again." })`}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Button variant="outline" onClick={() => toast("Event has been created")}>
              Default
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.success("Profile updated", { description: "Your changes have been saved." })}
            >
              Success
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.error("Something went wrong", { description: "Please try again." })}
            >
              Error
            </Button>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Variants</h3>
        <ComponentPreview code={`toast.warning("Approaching limit", { description: "80% of quota used." })
toast.info("Tip", { description: "Press Ctrl+K to open command palette." })
toast.loading("Uploading...")`}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Button
              variant="outline"
              onClick={() => toast.warning("Approaching limit", { description: "80% of quota used." })}
            >
              Warning
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.info("Tip", { description: "Press Ctrl+K to open command palette." })}
            >
              Info
            </Button>
            <Button
              variant="outline"
              onClick={() => toast.loading("Uploading...")}
            >
              Loading
            </Button>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Actions</h3>
        <ComponentPreview code={`toast("Event created", {
  action: { label: "Undo", onClick: () => toast.info("Undone!") },
})

toast("Delete item?", {
  action: { label: "Confirm", onClick: () => toast.success("Deleted") },
  cancel: { label: "Cancel", onClick: () => {} },
})`}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Button
              variant="outline"
              onClick={() =>
                toast("Event created", {
                  action: { label: "Undo", onClick: () => toast.info("Undone!") },
                })
              }
            >
              With action
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast("Delete item?", {
                  action: { label: "Confirm", onClick: () => toast.success("Deleted") },
                  cancel: { label: "Cancel", onClick: () => {} },
                })
              }
            >
              With action + cancel
            </Button>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Promise</h3>
        <ComponentPreview code={`toast.promise(
  fetch("/api/save"),
  {
    loading: "Saving changes...",
    success: (data) => \`\${data.name} saved successfully\`,
    error: "Could not save",
  }
)`}>
          <Button
            variant="outline"
            onClick={() =>
              toast.promise(
                new Promise((resolve) => setTimeout(() => resolve({ name: "Docs" }), 2000)),
                {
                  loading: "Saving changes...",
                  success: (data) => `${data.name} saved successfully`,
                  error: "Could not save",
                }
              )
            }
          >
            Save with promise
          </Button>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Toast from Form Submit</h3>
        <ComponentPreview code={`function handleSubmit(e) {
  e.preventDefault()
  toast.success("Form submitted", {
    description: "Your feedback has been received.",
  })
}

<form onSubmit={handleSubmit}>
  <input className="input" placeholder="Your feedback" />
  <Button type="submit">Send</Button>
</form>`}>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              toast.success("Form submitted", { description: "Your feedback has been received." })
            }}
            style={{ display: "flex", gap: "0.5rem", maxWidth: "22rem" }}
          >
            <input className="input" placeholder="Your feedback" style={{ flex: 1 }} />
            <Button type="submit">Send</Button>
          </form>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Test Helpers</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Button
            variant="outline"
            data-pg="short"
            onClick={() => toast("Quick toast", { duration: 800 })}
          >
            800ms toast
          </Button>
          <Button
            variant="outline"
            data-pg="medium"
            onClick={() => toast("Medium toast", { duration: 2000 })}
          >
            2s toast
          </Button>
        </div>
      </section>

      <ApiReference title="toast()" props={[
        { name: "toast(message)", type: "function", description: "Show a default toast" },
        { name: "toast.success()", type: "function", description: "Success variant" },
        { name: "toast.error()", type: "function", description: "Error variant" },
        { name: "toast.warning()", type: "function", description: "Warning variant" },
        { name: "toast.info()", type: "function", description: "Info variant" },
        { name: "toast.loading()", type: "function", description: "Loading variant with spinner" },
        { name: "toast.promise()", type: "function", description: "Tracks a promise (loading → success/error)" },
      ]} />

      <ApiReference title="Toaster" props={[
        { name: "position", type: "string", default: '"bottom-right"', description: "Where toasts appear on screen" },
        { name: "duration", type: "number", default: "4000", description: "Default auto-dismiss duration in ms" },
        { name: "closeButton", type: "boolean", default: "false", description: "Show a close button on each toast" },
        { name: "richColors", type: "boolean", default: "false", description: "Use coloured backgrounds for variants" },
        { name: "visibleToasts", type: "number", default: "3", description: "Max toasts visible at once" },
        { name: "expand", type: "boolean", default: "false", description: "Expand all toasts by default" },
      ]} />
    </>
  )
}
