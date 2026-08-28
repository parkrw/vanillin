import { useState } from "react"
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
  const [visibleToasts, setVisibleToasts] = useState(3)
  const [secondToaster, setSecondToaster] = useState(false)

  return (
    <>
      <h2>Toast (Sonner)</h2>
      <p>Non-intrusive notifications that appear temporarily and auto-dismiss.</p>
      <Toaster
        position="bottom-right"
        closeButton
        richColors
        data-pg="toaster"
        duration={4000}
        visibleToasts={visibleToasts}
      />
      {secondToaster && (
        <Toaster position="top-left" data-pg="toaster-second" visibleToasts={10} />
      )}

      <InstallSnippet slug="toast" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`toast("Event has been created")
toast.success("Profile updated", { description: "Your changes have been saved." })
toast.error("Something went wrong", { description: "Please try again." })`}>
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
        <p className="pg-desc">
          Toasts stack from the corner and dismiss themselves. Fire several in a row and the newest sits on top while the older ones slide behind it.
        </p>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Toaster, toast } from "./ui/toast/toast"
import "./ui/toast/toast.css"

// Place <Toaster /> once in your app root
<Toaster position="bottom-right" />

// Trigger from anywhere
toast("Event has been created")
toast.success("Saved", { description: "Changes saved." })
toast.error("Failed", { description: "Please try again." })`}>
          <Button variant="outline" onClick={() => toast("Deployment queued")}>
            Queue deployment
          </Button>
        </ComponentPreview>
        <p className="pg-desc">
          <code>toast()</code> is a plain function, not a hook, so it can be called from an event handler, a router guard, or a promise chain without touching the component tree.
        </p>
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
        <h3>Duration</h3>
        <ComponentPreview code={`toast("Quick toast", { duration: 800 })
toast("Medium toast", { duration: 2000 })`}>
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
        </ComponentPreview>
        <p className="pg-desc">
          <code>duration</code> overrides the <code>Toaster</code> default for one toast. Pass <code>Infinity</code> for a message the reader has to dismiss.
        </p>
      </section>

      <section className="pg-section">
        <h3>Announcement and the queue cap</h3>
        <ComponentPreview code={`// Fire more than visibleToasts * 2 and the oldest are dropped
for (let i = 1; i <= 11; i++) toast("Retry " + i)`}>
          <Button
            variant="outline"
            data-pg="flood"
            onClick={() => {
              for (let i = 1; i <= 11; i++) toast(`Retry ${i}`)
            }}
          >
            Fire 11 toasts
          </Button>
          <Button
            variant="outline"
            data-pg="custom"
            onClick={() => toast.custom(<strong data-pg="custom-body">Payment failed</strong>)}
          >
            Custom JSX
          </Button>
          <Button
            variant="outline"
            data-pg="visible-1"
            onClick={() => setVisibleToasts(1)}
          >
            visibleToasts = 1
          </Button>
          <Button
            variant="outline"
            data-pg="visible-3"
            onClick={() => setVisibleToasts(3)}
          >
            visibleToasts = 3
          </Button>
          <Button
            variant="outline"
            data-pg="jsx-title"
            onClick={() =>
              toast({
                title: <strong data-pg="jsx-title-body">Payment failed</strong>,
                description: "Card declined",
              })
            }
          >
            JSX title
          </Button>
          <Button
            variant="outline"
            data-pg="promise-reject"
            onClick={() =>
              toast.promise(
                new Promise((_, reject) => setTimeout(() => reject(new Error("nope")), 600)),
                { loading: "Saving changes...", success: "Saved", error: "Could not save" }
              )
            }
          >
            Promise that rejects
          </Button>
          <Button
            variant="outline"
            data-pg="visible-negative"
            onClick={() => setVisibleToasts(-1)}
          >
            visibleToasts = -1
          </Button>
          <Button
            variant="outline"
            data-pg="visible-0"
            onClick={() => setVisibleToasts(0)}
          >
            visibleToasts = 0
          </Button>
          <Button
            variant="outline"
            data-pg="sticky-overflow"
            onClick={() => toast("Sticky", { duration: 2147483648 })}
          >
            Duration past 2^31
          </Button>
          <Button
            variant="outline"
            data-pg="second-toaster"
            onClick={() => setSecondToaster((on) => !on)}
          >
            Toggle a second Toaster
          </Button>
        </ComponentPreview>
        <p className="pg-desc">
          The <code>Toaster</code> mounts two visually-hidden live regions and keeps them in the DOM whether or not a toast is showing, because assistive tech only announces changes to a region that already existed. A toast&rsquo;s text is mirrored into the polite region; the toast itself carries <code>aria-live=&quot;off&quot;</code> so nothing is read twice.
        </p>
        <p className="pg-desc">
          <code>toast.error()</code> announces through the assertive region and renders <code>role=&quot;alert&quot;</code>, so it interrupts. <code>toast.warning()</code> stays polite &mdash; sonner escalates only a toast the caller marks important, and a quota notice is not worth cutting a screen reader off mid-sentence.
        </p>
        <p className="pg-desc">
          The live queue is capped at <code>visibleToasts * 2</code> and drops the oldest past it, so a retry loop cannot grow the page without bound. A dropped toast is one that would have sat behind the collapsed stack; in a synchronous burst like the button above, it never renders at all. <code>toast()</code> still returns an id for a dropped toast; <code>dismiss</code> and <code>update</code> on it do nothing.
        </p>
        <p className="pg-desc">
          Announcement follows visibility. A toast queued behind the collapsed stack is not on screen, so it reaches the region when it is promoted to the front, not when it is created &mdash; and expanding the stack, which reveals the whole queue, announces the rest. One <code>Toaster</code> owns the regions even if an app mounts several, so a toast is never read twice; that owner&rsquo;s own <code>visibleToasts</code> and expansion decide what is announced, which is one more reason to mount <code>Toaster</code> once.
        </p>
        <p className="pg-desc">
          Eviction skips a toast that is waiting on something: already-dismissed toasts go first, then self-dismissing ones, and a <code>duration: Infinity</code> toast &mdash; <code>toast.loading()</code> and the pending half of <code>toast.promise()</code> &mdash; is dropped only when the whole queue is non-expiring. A burst of ordinary toasts therefore cannot strand a promise with no toast left to resolve into. A duration past 2<sup>31</sup>&minus;1&nbsp;ms is held rather than dismissed, because <code>setTimeout</code> would wrap it to the next tick.
        </p>
        <p className="pg-desc">
          Lowering <code>visibleToasts</code> trims the queue at once. Each mounted <code>Toaster</code> registers its own cap and the widest live one wins, so unmounting a wide <code>Toaster</code> tightens the queue back down. A <code>visibleToasts</code> below 1 falls back to the default cap rather than discarding every toast.
        </p>
        <p className="pg-desc">
          <code>toast.custom()</code> and a JSX <code>title</code> give the region no whole message to carry, so those toasts announce from their own node instead &mdash; the same way every toast did before, and less reliable. A JSX title beside a string description counts as JSX: announcing the description alone would read out half the message. Pass a string <code>title</code> when the message has to be heard.
        </p>
      </section>

      <ApiReference title="toast()" props={[
        { name: "toast(message)", type: "function", description: "Show a default toast" },
        { name: "toast.success()", type: "function", description: "Success variant" },
        { name: "toast.error()", type: "function", description: 'Error variant — role="alert", announced assertively' },
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
        { name: "visibleToasts", type: "number", default: "3", description: "Max toasts visible at once; the live queue is capped at twice this and drops the oldest" },
        { name: "expand", type: "boolean", default: "false", description: "Expand all toasts by default" },
      ]} />
    </>
  )
}
