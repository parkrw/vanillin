import { useEffect, useState } from "react"
import { createRoot } from "react-dom/client"
import ConsoleShowcase from "./showcase/console/index.jsx"
import "../styles/globals.css"
import "../styles/typeset.css"
// Side effect only: applies the visitor's colour scheme before the first paint.
import "./color-scheme.js"
import "./showcase/standalone.css"

const orderHref = `${import.meta.env.BASE_URL}order.html`

function ConsoleApp() {
  const [paletteOpen, setPaletteOpen] = useState(false)

  /* The console binds no chord of its own (#50) — it mounts twice in the docs
     SPA, and a second binding stacked two palettes. Here there is one mount
     and no site palette above it, so the host owns the chord. */
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((v) => !v)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <ConsoleShowcase
      orderHref={orderHref}
      paletteOpen={paletteOpen}
      onPaletteOpenChange={setPaletteOpen}
    />
  )
}

createRoot(document.getElementById("root")).render(<ConsoleApp />)
