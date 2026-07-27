import { createRoot } from "react-dom/client"
import "../styles/globals.css"
import "./site.css"
// styles/van.css is deliberately NOT imported. It is the generator's
// output for the sample van.config.json — a consumer's theme. Importing it
// re-declares :root tokens after globals.css and, at equal specificity, wins on
// source order: it re-themes the site and pins --density-scale so
// [data-density] cannot override it. The kit's docs must render with kit
// defaults. Scoping generated output to a preview container is a task-38 job.
import { App } from "./app.jsx"

createRoot(document.getElementById("root")).render(<App />)
