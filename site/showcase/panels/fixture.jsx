import { createRoot } from "react-dom/client"
import { Toaster } from "../../../ui/toast/toast.jsx"
import { SettingsPanel, StatusShowcase, SupportPanel } from "./index.js"
import "../../../styles/globals.css"
import "../../../styles/typeset.css"
import "../../../ui/toast/toast.css"

createRoot(document.getElementById("root")).render(
  <>
    <SupportPanel />
    <SettingsPanel />
    <StatusShowcase />
    <Toaster />
  </>
)
