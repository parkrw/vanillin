import { Toaster, toast } from "../../ui/toast/toast.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/toast/toast.css"
import "../../ui/button/button.css"

// Expose toast on window for test access
if (typeof window !== "undefined") window.__toast = toast

export default function ToastPage() {
  return (
    <>
      <h2>Toast (Sonner)</h2>
      <Toaster position="bottom-right" closeButton richColors data-pg="toaster" duration={4000} />

      <section className="pg-section">
        <h3>Variants</h3>
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
      </section>

      <section className="pg-section">
        <h3>Actions</h3>
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
      </section>

      <section className="pg-section">
        <h3>Promise</h3>
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
      </section>

      <section className="pg-section">
        <h3>Swipe to dismiss</h3>
        <p>
          A toast dismisses on <strong>drag distance</strong> (past 25% of its
          width) <em>or</em> <strong>flick velocity</strong> (above 1 px/ms in
          the dismiss direction). The two gates are independent — a fast short
          flick dismisses the same as a slow long drag. Under reduced motion the
          toast still dismisses; only the exit animation is suppressed.
        </p>
      </section>

      <section className="pg-section">
        <h3>Short duration (test helpers)</h3>
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
    </>
  )
}
