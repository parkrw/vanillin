import { createRoot } from "react-dom/client"
import OrderShowcase from "./showcase/order/index.jsx"
import "../styles/globals.css"
import "../styles/typeset.css"
// Side effect only: applies the visitor's colour scheme before the first paint.
import "./color-scheme.js"
import "./showcase/standalone.css"

createRoot(document.getElementById("root")).render(
  <OrderShowcase consoleHref={`${import.meta.env.BASE_URL}console.html`} />
)
