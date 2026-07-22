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
