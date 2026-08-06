import { useEffect, useRef, useState } from "react"

const RAIL_MIN = 160
const RAIL_MAX = 360
const RAIL_DEFAULT = 220

function useHeadings(route) {
  const [headings, setHeadings] = useState([])

  useEffect(() => {
    const derive = () => {
      const nodes = document.querySelectorAll(".pg-section > h3")
      const list = []
      for (const node of nodes) {
        if (!node.id) {
          node.id = node.textContent
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
        }
        list.push({ id: node.id, text: node.textContent.trim() })
      }
      setHeadings((prev) => {
        if (prev.length === list.length && prev.every((h, i) => h.id === list[i].id)) return prev
        return list
      })
    }

    derive()

    const main = document.querySelector(".pg-main")
    if (!main) return
    const observer = new MutationObserver(derive)
    observer.observe(main, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [route])

  return headings
}

function useActiveHeading(headings) {
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    if (!headings.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: `-${document.querySelector(".pg-topnav")?.offsetHeight || 56}px 0px -60% 0px` }
    )

    for (const { id } of headings) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [headings])

  return activeId
}

export function TableOfContents({ route }) {
  const headings = useHeadings(route)
  const activeId = useActiveHeading(headings)
  const [width, setWidth] = useState(() => {
    const stored = Number(localStorage.getItem("pg-rail-width"))
    return stored >= RAIL_MIN && stored <= RAIL_MAX ? stored : RAIL_DEFAULT
  })
  const widthRef = useRef(width)

  const startResize = (e) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = widthRef.current
    const onMove = (ev) => {
      const next = Math.min(RAIL_MAX, Math.max(RAIL_MIN, startWidth - (ev.clientX - startX)))
      widthRef.current = next
      setWidth(next)
    }
    const onUp = () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      document.body.style.removeProperty("cursor")
      document.body.style.removeProperty("user-select")
      localStorage.setItem("pg-rail-width", String(widthRef.current))
    }
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
    window.addEventListener("pointermove", onMove)
    window.addEventListener("pointerup", onUp)
  }

  if (!headings.length) return null

  return (
    <aside className="pg-rail" style={{ "--pg-rail-w": `${width}px` }} data-pg="rail">
      <nav className="pg-rail-nav" aria-label="On this page">
        <div className="pg-rail-label">On this page</div>
        <ul className="pg-rail-list">
          {headings.map(({ id, text }) => (
            <li key={id}>
              <a
                className="pg-rail-link"
                href={`#${id}`}
                data-active={activeId === id}
                onClick={(e) => {
                  e.preventDefault()
                  const el = document.getElementById(id)
                  if (el) el.scrollIntoView({ behavior: "smooth" })
                }}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div
        className="pg-rail-handle"
        onPointerDown={startResize}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize table of contents"
        data-pg="rail-handle"
      />
    </aside>
  )
}
