import { useEffect, useRef } from "react"

/**
 * useHighlight — paint search matches with the CSS Custom Highlight API.
 *
 * Walks text nodes inside `containerRef`, finds case-insensitive substring
 * matches for `query`, builds Range objects, and registers them as a
 * `Highlight` under `name` in the global `CSS.highlights` registry.
 *
 * Progressive enhancement: when `CSS.highlights` is absent the hook is a
 * complete no-op — filtering still works, only the paint is missing.
 *
 * Matching is per-text-node substring, not cross-node. A match that spans
 * two text nodes (e.g. "hel<b>lo</b>") will not be highlighted. This is
 * acceptable for our consumers (command palette items, table cells) where
 * inline markup inside a single word is rare.
 *
 * The fuzzy scorer (`command-score`) may surface items whose matched
 * characters are non-contiguous (e.g. "gp" → "Git Push"). Substring
 * highlighting will correctly show nothing for those items — the filter
 * surfaced them, but there is no contiguous "gp" to paint. This is honest
 * behaviour; painting scattered single characters would mislead.
 *
 * `::highlight()` supports only: color, background-color, text-decoration,
 * text-shadow. No padding, no border-radius.
 *
 * @param {import("react").RefObject} containerRef - ref to the DOM subtree
 * @param {string} query - the search string (empty → clear all highlights)
 * @param {object} [options]
 * @param {string} [options.name="vanillin-search"] - CSS.highlights registry key
 *   (must be a valid CSS `<custom-ident>` so `::highlight(name)` works).
 *   Two mounted instances with the same name clobber each other — pass
 *   different names if both are visible simultaneously.
 * @param {number} [options.maxRanges=2000] - cap on ranges to prevent perf
 *   degradation on large containers with short queries.
 * @returns {{ supported: boolean }}
 */
export function useHighlight(containerRef, query, options) {
  const name = options?.name ?? "vanillin-search"
  const maxRanges = options?.maxRanges ?? 2000

  const supported = typeof CSS !== "undefined" && CSS.highlights != null
  const supportedRef = useRef(supported)
  supportedRef.current = supported

  // Stable refs for values used inside the effect — avoids tearing the
  // effect on every render while keeping the latest values accessible.
  const queryRef = useRef(query)
  queryRef.current = query
  const maxRef = useRef(maxRanges)
  maxRef.current = maxRanges

  useEffect(() => {
    if (!supportedRef.current) return

    const container = containerRef.current
    if (!container) return

    /** Escape regex metacharacters so user input like `(` doesn't throw. */
    function escapeRegex(s) {
      return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    }

    /** Walk text nodes, build Ranges for substring matches, register. */
    function run() {
      const q = queryRef.current
      if (!q) {
        CSS.highlights.delete(name)
        return
      }

      const pattern = new RegExp(escapeRegex(q), "gi")
      const ranges = []
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode(node) {
            // Skip text inside <script>, <style>, and aria-hidden subtrees.
            let el = node.parentElement
            while (el && el !== container) {
              const tag = el.tagName
              if (tag === "SCRIPT" || tag === "STYLE") return NodeFilter.FILTER_REJECT
              if (el.getAttribute("aria-hidden") === "true") return NodeFilter.FILTER_REJECT
              el = el.parentElement
            }
            return NodeFilter.FILTER_ACCEPT
          },
        }
      )

      let textNode
      while ((textNode = walker.nextNode())) {
        const text = textNode.textContent
        if (!text) continue
        pattern.lastIndex = 0
        let match
        while ((match = pattern.exec(text))) {
          const range = new Range()
          range.setStart(textNode, match.index)
          range.setEnd(textNode, match.index + match[0].length)
          ranges.push(range)
          if (ranges.length >= maxRef.current) break
        }
        if (ranges.length >= maxRef.current) break
      }

      if (ranges.length > 0) {
        CSS.highlights.set(name, new Highlight(...ranges))
      } else {
        CSS.highlights.delete(name)
      }
    }

    run()

    // Re-run when the DOM mutates (items show/hide, content changes).
    // The Highlight API itself mutates nothing, so no self-observation risk.
    let rafId
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(run)
    })
    observer.observe(container, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["hidden"],
    })

    return () => {
      observer.disconnect()
      cancelAnimationFrame(rafId)
      CSS.highlights.delete(name)
    }
  }, [containerRef, query, name])
  // `query` in the dep array ensures the effect re-runs on every keystroke.
  // The MutationObserver handles DOM-only changes between query changes.

  return { supported }
}
