import { useState } from "react"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "../../ui/alert-dialog/alert-dialog.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/alert-dialog/alert-dialog.css"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function AlertDialogPage() {
  const [publishOpen, setPublishOpen] = useState(false)
  const [published, setPublished] = useState(false)

  return (
    <>
      <h2>Alert Dialog</h2>
      <p>A modal that demands a response. There is no X button and no backdrop dismiss, so the user must choose an action before continuing.</p>

      <InstallSnippet slug="alert-dialog" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "./ui/alert-dialog/alert-dialog"
import "./ui/alert-dialog/alert-dialog.css"

<AlertDialog>
  <AlertDialogTrigger as={Button} variant="outline">
    Discard draft
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
      <AlertDialogDescription>
        Your unsaved edits will be lost.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Keep editing</AlertDialogCancel>
      <AlertDialogAction>Discard</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}>
          <AlertDialog>
            <AlertDialogTrigger as={Button} variant="outline">
              Discard draft
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  Your unsaved edits will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep editing</AlertDialogCancel>
                <AlertDialogAction>Discard</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Destructive confirmation</h3>
        <ComponentPreview code={`<AlertDialog>
  <AlertDialogTrigger as={Button} variant="outline">
    Delete account
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone. This will permanently delete your account.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction>Continue</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}>
          <AlertDialog>
            <AlertDialogTrigger as={Button} variant="outline">
              Delete account
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your account.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ComponentPreview>
        <p className="pg-desc">
          Cancel comes before Action in the footer, so native autofocus lands on the least destructive button.
        </p>
      </section>

      <section className="pg-section">
        <h3>Destructive action styling</h3>
        <ComponentPreview code={`{/* AlertDialogAction forwards Button props. */}
<AlertDialogAction variant="destructive">Delete forever</AlertDialogAction>`}>
          <AlertDialog>
            <AlertDialogTrigger as={Button} variant="destructive">
              Wipe workspace
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Wipe this workspace?</AlertDialogTitle>
                <AlertDialogDescription>
                  Every project, deploy history, and secret in this workspace is removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Back out</AlertDialogCancel>
                <AlertDialogAction variant="destructive">Delete forever</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </ComponentPreview>
        <p className="pg-desc">
          <code>AlertDialogAction</code> and <code>AlertDialogCancel</code> render a <code>Button</code>, so every button prop passes through. Cancel defaults to <code>variant="outline"</code>.
        </p>
      </section>

      <section className="pg-section">
        <h3>Controlled</h3>
        <ComponentPreview code={`const [open, setOpen] = useState(false)
const [published, setPublished] = useState(false)

<AlertDialog open={open} onOpenChange={setOpen}>
  <AlertDialogTrigger as={Button}>Publish release</AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Publish to production?</AlertDialogTitle>
      <AlertDialogDescription>
        Every subscriber receives this build immediately.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Not yet</AlertDialogCancel>
      <AlertDialogAction onClick={() => setPublished(true)}>
        Publish
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`}>
          <div className="pg-row">
            <AlertDialog open={publishOpen} onOpenChange={setPublishOpen}>
              <AlertDialogTrigger as={Button}>Publish release</AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Publish to production?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Every subscriber receives this build immediately.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Not yet</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setPublished(true)}>Publish</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <span className="pg-desc" data-pg="ad-readout">
              {published ? "release published" : "not published"}
            </span>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          <code>onOpenChange</code> fires for every close path, including Escape, so a controlled parent never drifts out of sync with the dialog.
        </p>
      </section>

      <section className="pg-section">
        <h3>How it differs from Dialog</h3>
        <ComponentPreview code={`{/* AlertDialogContent is DialogContent with three overrides baked in. */}
<DialogContent
  role="alertdialog"
  dismissible={false}
  showCloseButton={false}
  className="alert-dialog"
/>`}>
          <div className="pg-row">
            <AlertDialog>
              <AlertDialogTrigger as={Button} variant="secondary">
                Try dismissing this
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Backdrop clicks do nothing</AlertDialogTitle>
                  <AlertDialogDescription>
                    Click outside the panel: it stays open. Escape still closes, matching Radix semantics.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Dismiss</AlertDialogCancel>
                  <AlertDialogAction>Understood</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </ComponentPreview>
        <p>
          AlertDialog re-exports Dialog with three overrides: <code>role="alertdialog"</code>, no close button, and backdrop clicks are ignored.
          Escape still closes (matching Radix semantics). Place Cancel before Action so native autofocus lands on the least-destructive button.
        </p>
      </section>

      <ApiReference props={[
        { name: "open", type: "boolean", description: "Controlled open state" },
        { name: "defaultOpen", type: "boolean", default: "false", description: "Uncontrolled initial open state" },
        { name: "onOpenChange", type: "(open: boolean) => void", description: "Called when open state changes" },
      ]} />
    </>
  )
}
