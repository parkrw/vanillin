import { Dialog, DialogTrigger, DialogContent } from "../../ui/dialog/dialog.jsx"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/dialog/dialog.css"
import "../../ui/button/button.css"

export default function DialogPage() {
  return (
    <>
      <h2>Dialog</h2>

      <section className="pg-section">
        <h3>Basic</h3>
        <Dialog>
          <DialogTrigger as={Button} variant="outline">
            Open dialog
          </DialogTrigger>
          <DialogContent>
            <p>Dialog body content.</p>
          </DialogContent>
        </Dialog>
      </section>
    </>
  )
}
