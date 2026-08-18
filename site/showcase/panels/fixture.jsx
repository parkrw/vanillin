import { createRoot } from "react-dom/client"
import { Toaster, toast } from "../../../ui/toast/toast.jsx"
import { SettingsPanel, StatusShowcase, SupportPanel } from "./index.js"
import "../../../styles/globals.css"
import "../../../styles/typeset.css"
import "../../../ui/toast/toast.css"

// Same hook site/pages/toast.jsx exposes, so the suite can dismiss toasts
// outright instead of waiting out each auto-dismiss timer.
if (typeof window !== "undefined") window.__toast = toast

createRoot(document.getElementById("root")).render(
  <>
    <SupportPanel />
    <SettingsPanel />
    <StatusShowcase />
    <Toaster />
  </>
)
