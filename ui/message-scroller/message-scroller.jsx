import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react"
import { cn } from "../../lib/cn.js"

const MessageScrollerContext = createContext(null)

/**
 * Headless root. Follows appended content while the reader is at the live
 * edge; user scroll intent (wheel, touch, keyboard, scrollbar drag) releases
 * follow; reaching the end re-engages it when `autoScroll`.
 */
export function MessageScrollerProvider({
  autoScroll = true,
  defaultScrollPosition = "end",
  scrollPreviousItemPeek = 0,
  children,
}) {
  const viewportRef = useRef(null)
  const contentRef = useRef(null)
  const followingRef = useRef(autoScroll && defaultScrollPosition === "end")
  const [following, setFollowingState] = useState(followingRef.current)

  const setFollowing = useCallback((next) => {
    followingRef.current = next
    setFollowingState(next)
  }, [])

  const scrollToEnd = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    viewport.scrollTop = viewport.scrollHeight
    if (autoScroll) setFollowing(true)
  }, [autoScroll, setFollowing])

  const scrollToStart = useCallback(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    setFollowing(false)
    viewport.scrollTop = 0
  }, [setFollowing])

  const scrollToMessage = useCallback(
    (messageId) => {
      const viewport = viewportRef.current
      const item = viewport?.querySelector(`[data-message-id="${CSS.escape(messageId)}"]`)
      if (!item) return
      setFollowing(false)
      viewport.scrollTop =
        item.getBoundingClientRect().top -
        viewport.getBoundingClientRect().top +
        viewport.scrollTop -
        scrollPreviousItemPeek
    },
    [scrollPreviousItemPeek, setFollowing]
  )

  return (
    <MessageScrollerContext.Provider
      value={{
        viewportRef,
        contentRef,
        autoScroll,
        defaultScrollPosition,
        scrollPreviousItemPeek,
        following,
        followingRef,
        setFollowing,
        scrollToEnd,
        scrollToStart,
        scrollToMessage,
      }}
    >
      {children}
    </MessageScrollerContext.Provider>
  )
}

export function MessageScroller({ className, ...props }) {
  const { following } = useContext(MessageScrollerContext)
  return (
    <div
      data-state={following ? "following" : "released"}
      className={cn("message-scroller", className)}
      {...props}
    />
  )
}

export function MessageScrollerViewport({ preserveScrollOnPrepend = true, className, ...props }) {
  const { viewportRef, contentRef, autoScroll, defaultScrollPosition, followingRef, setFollowing } =
    useContext(MessageScrollerContext)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (defaultScrollPosition === "end") viewport.scrollTop = viewport.scrollHeight
    else if (defaultScrollPosition === "last-anchor")
      viewport.scrollTop = viewport.querySelector("[data-scroll-anchor]")?.offsetTop ?? 0
    // "start": browsers already start at 0
  }, [])

  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return

    let prevScrollHeight = viewport.scrollHeight
    let prevFirst = content.firstElementChild

    const pin = () => {
      viewport.scrollTop = viewport.scrollHeight
    }
    const release = () => {
      if (viewport.scrollHeight > viewport.clientHeight) setFollowing(false)
    }

    // childList mutations distinguish prepend (new first child) from append
    const mutations = new MutationObserver(() => {
      if (followingRef.current) pin()
      else if (preserveScrollOnPrepend && content.firstElementChild !== prevFirst)
        viewport.scrollTop += viewport.scrollHeight - prevScrollHeight
      prevScrollHeight = viewport.scrollHeight
      prevFirst = content.firstElementChild
    })
    mutations.observe(content, { childList: true })

    // growth without childList changes (streaming text, image loads)
    const resizes = new ResizeObserver(() => {
      if (followingRef.current) pin()
      prevScrollHeight = viewport.scrollHeight
    })
    resizes.observe(content)

    const onScroll = () => {
      if (!autoScroll || followingRef.current) return
      if (viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight < 2) setFollowing(true)
    }
    const onWheel = (event) => {
      if (event.deltaY < 0) release()
    }
    const onKeyDown = (event) => {
      if (event.key === "ArrowUp" || event.key === "PageUp" || event.key === "Home") release()
    }
    const onPointerDown = (event) => {
      // pointerdown on the viewport itself past the content box = scrollbar drag
      if (event.target !== viewport) return
      const scrollbarSize = viewport.offsetWidth - viewport.clientWidth
      if (!scrollbarSize) return
      const rtl = getComputedStyle(viewport).direction === "rtl"
      if (rtl ? event.offsetX < scrollbarSize : event.offsetX >= viewport.clientWidth) release()
    }

    viewport.addEventListener("scroll", onScroll, { passive: true })
    viewport.addEventListener("wheel", onWheel, { passive: true })
    viewport.addEventListener("touchmove", release, { passive: true })
    viewport.addEventListener("keydown", onKeyDown)
    viewport.addEventListener("pointerdown", onPointerDown)
    return () => {
      mutations.disconnect()
      resizes.disconnect()
      viewport.removeEventListener("scroll", onScroll)
      viewport.removeEventListener("wheel", onWheel)
      viewport.removeEventListener("touchmove", release)
      viewport.removeEventListener("keydown", onKeyDown)
      viewport.removeEventListener("pointerdown", onPointerDown)
    }
  }, [viewportRef, contentRef, autoScroll, preserveScrollOnPrepend, followingRef, setFollowing])

  return (
    <div ref={viewportRef} tabIndex={0} className={cn("message-scroller-viewport", className)} {...props} />
  )
}

export function MessageScrollerContent({ className, ...props }) {
  const { contentRef } = useContext(MessageScrollerContext)
  return <div ref={contentRef} className={cn("message-scroller-content", className)} {...props} />
}

/** Inert (disabled, `data-active="false"`) until there is content below the fold. */
export function MessageScrollerButton({ className, onClick, children, ...props }) {
  const { scrollToEnd } = useContext(MessageScrollerContext)
  const { end } = useMessageScrollerScrollable()
  return (
    <button
      type="button"
      aria-label="Scroll to bottom"
      data-active={end ? "true" : "false"}
      disabled={!end}
      className={cn("message-scroller-button", className)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) scrollToEnd()
      }}
      {...props}
    >
      {children ?? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      )}
    </button>
  )
}

export function useMessageScroller() {
  const { scrollToMessage, scrollToEnd, scrollToStart } = useContext(MessageScrollerContext)
  return { scrollToMessage, scrollToEnd, scrollToStart }
}

export function useMessageScrollerScrollable() {
  const { viewportRef, contentRef } = useContext(MessageScrollerContext)
  const [scrollable, setScrollable] = useState({ start: false, end: false })
  useEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return
    const sync = () => {
      const start = viewport.scrollTop > 1
      const end = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight > 1
      setScrollable((prev) => (prev.start === start && prev.end === end ? prev : { start, end }))
    }
    sync()
    viewport.addEventListener("scroll", sync, { passive: true })
    const resizes = new ResizeObserver(sync)
    resizes.observe(viewport)
    if (contentRef.current) resizes.observe(contentRef.current)
    return () => {
      viewport.removeEventListener("scroll", sync)
      resizes.disconnect()
    }
  }, [viewportRef, contentRef])
  return scrollable
}

export function useMessageScrollerVisibility() {
  const { viewportRef, contentRef } = useContext(MessageScrollerContext)
  const [visibility, setVisibility] = useState({ currentAnchorId: null, visibleMessageIds: [] })
  useEffect(() => {
    const viewport = viewportRef.current
    const content = contentRef.current
    if (!viewport || !content) return
    const onScreen = new Map()
    const publish = () => {
      const ids = [...content.querySelectorAll("[data-message-id]")]
        .filter((el) => onScreen.get(el))
        .map((el) => el.dataset.messageId)
      setVisibility((prev) =>
        prev.visibleMessageIds.join(" ") === ids.join(" ")
          ? prev
          : { currentAnchorId: ids[0] ?? null, visibleMessageIds: ids }
      )
    }
    const intersections = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) onScreen.set(entry.target, entry.isIntersecting)
        publish()
      },
      { root: viewport }
    )
    content.querySelectorAll("[data-message-id]").forEach((el) => intersections.observe(el))
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes)
          if (node.nodeType === 1 && node.dataset.messageId) intersections.observe(node)
        for (const node of record.removedNodes) onScreen.delete(node)
      }
    })
    mutations.observe(content, { childList: true })
    return () => {
      intersections.disconnect()
      mutations.disconnect()
    }
  }, [viewportRef, contentRef])
  return visibility
}

export function MessageScrollerItem({ messageId, scrollAnchor = false, className, ...props }) {
  return (
    <div
      data-message-id={messageId}
      data-scroll-anchor={scrollAnchor ? "" : undefined}
      className={cn("message-scroller-item", className)}
      {...props}
    />
  )
}
