import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { cn } from "../../lib/cn.js"

/* ------------------------------------------------------------------ */
/*  Module-level toast store — usable outside React                   */
/* ------------------------------------------------------------------ */

let nextId = 0
let toasts = []
const listeners = new Set()

function notify() {
  toasts = [...toasts]
  listeners.forEach((fn) => fn())
}

function addToast(opts) {
  const id = String(++nextId)
  const t = { id, createdAt: Date.now(), ...opts }
  toasts = [t, ...toasts]
  notify()
  return id
}

function updateToast(id, opts) {
  toasts = toasts.map((t) => (t.id === id ? { ...t, ...opts } : t))
  notify()
}

function dismissToast(id) {
  if (id == null) {
    // dismiss all
    toasts = toasts.map((t) => ({ ...t, dismissed: true }))
  } else {
    toasts = toasts.map((t) => (t.id === id ? { ...t, dismissed: true } : t))
  }
  notify()
}

function removeToast(id) {
  toasts = toasts.filter((t) => t.id !== id)
  notify()
}

function getSnapshot() {
  return toasts
}

function subscribe(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/**
 * Imperative toast API — callable outside React.
 *
 *   toast("Hello")
 *   toast.success("Saved")
 *   toast.error("Failed")
 *   toast.promise(asyncFn, { loading, success, error })
 */
export function toast(titleOrOpts, opts) {
  const data = typeof titleOrOpts === "string" ? { title: titleOrOpts, ...opts } : titleOrOpts
  return addToast(data)
}

toast.success = (titleOrOpts, opts) => {
  const data = typeof titleOrOpts === "string" ? { title: titleOrOpts, ...opts } : titleOrOpts
  return addToast({ ...data, type: "success" })
}

toast.error = (titleOrOpts, opts) => {
  const data = typeof titleOrOpts === "string" ? { title: titleOrOpts, ...opts } : titleOrOpts
  return addToast({ ...data, type: "error" })
}

toast.warning = (titleOrOpts, opts) => {
  const data = typeof titleOrOpts === "string" ? { title: titleOrOpts, ...opts } : titleOrOpts
  return addToast({ ...data, type: "warning" })
}

toast.info = (titleOrOpts, opts) => {
  const data = typeof titleOrOpts === "string" ? { title: titleOrOpts, ...opts } : titleOrOpts
  return addToast({ ...data, type: "info" })
}

toast.loading = (titleOrOpts, opts) => {
  const data = typeof titleOrOpts === "string" ? { title: titleOrOpts, ...opts } : titleOrOpts
  return addToast({ ...data, type: "loading", duration: Infinity })
}

toast.promise = (promise, opts) => {
  const id = addToast({
    title: typeof opts.loading === "string" ? opts.loading : opts.loading?.title,
    ...(typeof opts.loading === "object" ? opts.loading : {}),
    type: "loading",
    duration: Infinity,
  })
  promise
    .then((result) => {
      const s = opts.success
      const resolved = typeof s === "function" ? s(result) : s
      updateToast(id, {
        title: typeof resolved === "string" ? resolved : resolved?.title,
        description: typeof resolved === "object" ? resolved.description : undefined,
        type: "success",
        duration: undefined,
      })
    })
    .catch((err) => {
      const e = opts.error
      const resolved = typeof e === "function" ? e(err) : e
      updateToast(id, {
        title: typeof resolved === "string" ? resolved : resolved?.title,
        description: typeof resolved === "object" ? resolved.description : undefined,
        type: "error",
        duration: undefined,
      })
    })
  return id
}

toast.dismiss = dismissToast

toast.custom = (jsx, opts) => {
  return addToast({ ...opts, custom: jsx })
}

/* ------------------------------------------------------------------ */
/*  Toaster — the React container                                     */
/* ------------------------------------------------------------------ */

const TYPE_ICONS = {
  success: () => (
    <svg className="toast-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
      <path d="M6.5 10.5 8.5 12.5 13.5 7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  error: () => (
    <svg className="toast-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
      <path d="M7.5 7.5 12.5 12.5 M12.5 7.5 7.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warning: () => (
    <svg className="toast-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2 L19 17 H1 Z" fill="currentColor" opacity="0.15" />
      <path d="M10 8v3 M10 13.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: () => (
    <svg className="toast-icon" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
      <path d="M10 9v4 M10 6.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  loading: () => (
    <svg className="toast-icon toast-icon--loading" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" opacity="0.2" />
      <path d="M10 2a8 8 0 0 1 8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
}

export function Toaster({
  position = "bottom-right",
  visibleToasts = 3,
  duration: defaultDuration = 4000,
  closeButton = false,
  expand: expandProp = false,
  richColors = false,
  className,
  ...props
}) {
  const allToasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
  const [expanded, setExpanded] = useState(expandProp)
  const [heights, setHeights] = useState({})
  const pausedRef = useRef(false)
  const listRef = useRef(null)

  // Sync expand prop
  useEffect(() => {
    setExpanded(expandProp)
  }, [expandProp])

  const handleRemove = useCallback((id) => {
    removeToast(id)
    setHeights((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const handleHeight = useCallback((id, height) => {
    setHeights((prev) => {
      if (prev[id] === height) return prev
      return { ...prev, [id]: height }
    })
  }, [])

  // Pause all timers on window blur
  useEffect(() => {
    const onBlur = () => { pausedRef.current = true }
    const onFocus = () => { pausedRef.current = false }
    window.addEventListener("blur", onBlur)
    window.addEventListener("focus", onFocus)
    return () => {
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  if (allToasts.length === 0) return null

  // Compute stacking offsets
  const GAP = 8
  const offsets = {}
  let cumOffset = 0
  for (let i = 0; i < allToasts.length; i++) {
    const t = allToasts[i]
    offsets[t.id] = cumOffset
    const h = heights[t.id] || 0
    cumOffset += h + GAP
  }

  return (
    <section
      ref={listRef}
      aria-label="Notifications"
      tabIndex={-1}
      className={cn(
        "toaster",
        `toaster--${position}`,
        richColors && "toaster--rich",
        className
      )}
      onMouseEnter={() => { setExpanded(true); pausedRef.current = true }}
      onMouseLeave={() => { if (!expandProp) setExpanded(false); pausedRef.current = false }}
      {...props}
    >
      <ol className="toaster-list">
        {allToasts.map((t, index) => (
          <ToastItem
            key={t.id}
            toast={t}
            index={index}
            position={position}
            expanded={expanded}
            visibleToasts={visibleToasts}
            defaultDuration={defaultDuration}
            closeButton={closeButton}
            onDismiss={() => dismissToast(t.id)}
            onRemove={() => handleRemove(t.id)}
            onHeight={(h) => handleHeight(t.id, h)}
            offset={offsets[t.id]}
            pausedRef={pausedRef}
          />
        ))}
      </ol>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  Individual toast                                                  */
/* ------------------------------------------------------------------ */

function ToastItem({
  toast: t,
  index,
  position,
  expanded,
  visibleToasts,
  defaultDuration,
  closeButton,
  onDismiss,
  onRemove,
  onHeight,
  offset,
  pausedRef,
}) {
  const ref = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [exiting, setExiting] = useState(false)
  const timerRef = useRef(null)
  const remainingRef = useRef(null)
  const startRef = useRef(null)
  const drag = useRef(null)
  const mountedTypeRef = useRef(true)

  const duration = t.duration !== undefined ? t.duration : defaultDuration
  const limited = index >= visibleToasts
  const Icon = TYPE_ICONS[t.type]

  // Measure height
  useEffect(() => {
    if (!ref.current) return
    const h = ref.current.offsetHeight
    onHeight(h)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.title, t.description, t.type])

  // Entry animation
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true))
  }, [])

  // Auto-dismiss timer with pause support.
  // remainingRef tracks how much time the toast has left; startRef marks
  // when the current running segment began.  On pause we bank the
  // remainder and null startRef so the resume branch re-initializes the
  // segment without clobbering the banked value.
  useEffect(() => {
    if (t.dismissed || duration === Infinity) return

    // Initialize remaining on first mount / type change
    if (remainingRef.current === null) remainingRef.current = duration

    const tick = () => {
      if (pausedRef.current) {
        // Bank remaining time before parking — elapsed since startRef
        // has been running unpausedly, so subtract it now.
        if (startRef.current !== null) {
          remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startRef.current))
          startRef.current = null
        }
        timerRef.current = setTimeout(tick, 50)
        return
      }
      // Resume / first tick: start a new running segment, keep banked
      // remainingRef intact.
      if (startRef.current === null) {
        startRef.current = Date.now()
      }
      const elapsed = Date.now() - startRef.current
      const left = remainingRef.current - elapsed
      if (left <= 0) {
        onDismiss()
      } else {
        timerRef.current = setTimeout(tick, Math.min(left, 50))
      }
    }

    tick()
    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.dismissed, duration, t.type])

  // Reset timer on type change (e.g. promise resolved from loading).
  // Skip the initial mount — the timer effect already initializes there.
  useEffect(() => {
    if (mountedTypeRef.current) {
      mountedTypeRef.current = false
      return
    }
    if (t.type !== "loading" && duration !== Infinity) {
      startRef.current = null
      remainingRef.current = null // cleared so the timer effect re-initializes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.type])

  // Exit: play animation, then remove from store
  useEffect(() => {
    if (!t.dismissed) return
    setExiting(true)
    const node = ref.current
    if (!node) { onRemove(); return }

    const animations = node.getAnimations()
    if (animations.length > 0) {
      Promise.all(animations.map((a) => a.finished)).then(onRemove).catch(onRemove)
    } else {
      // If no animation (reduced-motion), wait a short beat
      const timer = setTimeout(onRemove, 50)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.dismissed])

  // Swipe-to-dismiss (inline, threshold only, no velocity)
  const swipeAxis = position.includes("center") ? "y" : "x"
  const swipeSign = position.includes("left") ? -1 : 1

  const onPointerDown = (event) => {
    if (event.target.closest("button, a, input")) return
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    drag.current = {
      start: swipeAxis === "x" ? event.clientX : event.clientY,
      offset: 0,
      size: swipeAxis === "x" ? rect.width : rect.height,
    }
    el.setPointerCapture(event.pointerId)
  }

  const onPointerMove = (event) => {
    if (!drag.current) return
    const el = ref.current
    const pos = swipeAxis === "x" ? event.clientX : event.clientY
    const raw = (pos - drag.current.start) * swipeSign
    const offset = Math.max(0, raw)
    drag.current.offset = offset
    el.setAttribute("data-swiping", "")
    el.style.transform =
      swipeAxis === "x"
        ? `translateX(${offset * swipeSign}px)`
        : `translateY(${offset}px)`
  }

  const onPointerUp = () => {
    if (!drag.current) return
    const el = ref.current
    const { offset, size } = drag.current
    drag.current = null
    el.removeAttribute("data-swiping")
    if (offset > size * 0.25) {
      onDismiss()
    } else {
      el.style.transform = ""
    }
  }

  const onPointerCancel = () => {
    if (!drag.current) return
    drag.current = null
    const el = ref.current
    if (el) {
      el.removeAttribute("data-swiping")
      el.style.transform = ""
    }
  }

  return (
    <li
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "toast",
        t.type && `toast--${t.type}`,
        mounted && !exiting && "toast--mounted",
        exiting && "toast--exit",
        limited && !expanded && "toast--limited",
      )}
      data-type={t.type || undefined}
      data-index={index}
      data-mounted={mounted ? "" : undefined}
      data-dismissed={t.dismissed ? "" : undefined}
      data-limited={limited && !expanded ? "" : undefined}
      data-expanded={expanded ? "" : undefined}
      style={{
        "--toast-index": index,
        "--toast-offset": `${offset}px`,
        "--toast-z": 1000 - index,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      {t.custom ? (
        typeof t.custom === "function" ? t.custom({ id: t.id, dismiss: () => onDismiss() }) : t.custom
      ) : (
        <>
          {Icon && <Icon />}
          <div className="toast-content">
            {t.title && <div className="toast-title">{t.title}</div>}
            {t.description && <div className="toast-description">{t.description}</div>}
          </div>
          <div className="toast-buttons">
            {t.action && (
              <button
                className="toast-action"
                onClick={() => {
                  t.action.onClick?.()
                  onDismiss()
                }}
              >
                {t.action.label}
              </button>
            )}
            {t.cancel && (
              <button
                className="toast-cancel"
                onClick={() => {
                  t.cancel.onClick?.()
                  onDismiss()
                }}
              >
                {t.cancel.label}
              </button>
            )}
          </div>
          {closeButton && (
            <button className="toast-close" aria-label="Close" onClick={onDismiss}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </>
      )}
    </li>
  )
}
