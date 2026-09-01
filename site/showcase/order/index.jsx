import { Toaster } from "../../../ui/toast/toast.jsx"
import { TooltipProvider } from "../../../ui/tooltip/tooltip.jsx"
import { OrderPage } from "./order-page.jsx"
import "../../../ui/toast/toast.css"
import "../../../ui/tooltip/tooltip.css"
import "../console.css"

/* The wizard's own frame. It reuses the console's `.ck-console` shell for the
   token overrides and the scroller, but carries no chrome: the whole page is
   the order form, and its header holds the way back. */
export default function OrderShowcase({ consoleHref }) {
  return (
    <TooltipProvider delayDuration={250}>
      <div className="ck-console" data-pg="order">
        <div className="ck-scroller">
          <div className="ck-content">
            <OrderPage consoleHref={consoleHref} />
          </div>
        </div>
        <Toaster position="bottom-right" richColors />
      </div>
    </TooltipProvider>
  )
}
