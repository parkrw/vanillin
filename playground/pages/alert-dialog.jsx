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

export default function AlertDialogPage() {
  return (
    <>
      <h2>Alert Dialog</h2>

      <section className="pg-section">
        <h3>Default</h3>
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
      </section>
    </>
  )
}
