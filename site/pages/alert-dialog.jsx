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
  return (
    <>
      <h2>Alert Dialog</h2>
      <p>A modal that demands a response — no X button, no backdrop dismiss, so the user must choose an action before continuing.</p>

      <InstallSnippet slug="alert-dialog" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "./ui/alert-dialog/alert-dialog"
import "./ui/alert-dialog/alert-dialog.css"

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
      </section>

      <section className="pg-section">
        <h3>How it differs from Dialog</h3>
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
