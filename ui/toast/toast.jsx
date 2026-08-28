import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react"
import { cn } from "../../lib/cn.js"
import { useSwipe } from "../../lib/use-swipe.js"

/* ------------------------------------------------------------------ */
/*  Module-level toast store — usable outside React                   */
/* ------------------------------------------------------------------ */

const DEFAULT_VISIBLE_TOASTS = 3

// A queued toast past `visibleToasts` sits scaled behind the collapsed stack,
// so twice the visible count is the most a reader can ever reach — and the most
// worth holding a DOM node, swipe handler and timer for. A retry loop calling
// toast.error() per attempt drops its oldest attempts instead of growing the
// page without bound; in a synchronous burst the dropped ones never render.
const QUEUE_MULTIPLE = 2

let nextId = 0
let toasts = []
const listeners = new Set()

// The cap is the store's, but it is not a global setting: every mounted
// Toaster registers its own `visibleToasts * QUEUE_MULTIPLE` and the widest
// live one wins. Registering per instance is what lets an unmounted Toaster
// take its cap with it — a module-level number written by one Toaster's effect
// would outlive that Toaster and leave the queue permanently loose.
const queueLimits = new Map()

function currentLimit() {
  if (queueLimits.size === 0) return DEFAULT_VISIBLE_TOASTS * QUEUE_MULTIPLE
  let widest = 0
  for (const limit of queueLimits.values()) widest = Math.max(widest, limit)
  return widest
}

/**
 * Which toast to evict, oldest first within each group: one already dismissed,
 * then one that dismisses itself, then the plain oldest. A `duration: Infinity`
 * toast is waiting on something — a promise, a reader — so dropping it strands
 * `toast.promise`'s success/error update with no toast left to update.
 */
function evictionIndex(queue) {
  const oldest = queue.length - 1
  for (let i = oldest; i >= 0; i--) if (queue[i].dismissed) return i
  for (let i = oldest; i >= 0; i--) if (queue[i].duration !== Infinity) return i
  return oldest
}

function capped(queue, limit) {
  if (queue.length <= limit) return queue
  const next = [...queue]
  while (next.length > limit) next.splice(evictionIndex(next), 1)
  return next
}

function trimQueue() {
  const limit = currentLimit()
  if (toasts.length <= limit) return
  toasts = capped(toasts, limit)
  notify()
}

// Announcing is a single job even when the app mounts more than one Toaster:
// two sets of live regions mirroring one queue means every toast is read twice.
// The first Toaster to mount owns the regions and hands them to the next in
// line when it unmounts.
const announcers = []
const announcerListeners = new Set()

function announcerSubscribe(fn) {
  announcerListeners.add(fn)
  return () => announcerListeners.delete(fn)
}

function announcerSnapshot() {
  return announcers[0]
}

function claimAnnouncer(token) {
  announcers.push(token)
  announcerListeners.forEach((fn) => fn())
}

function releaseAnnouncer(token) {
  const at = announcers.indexOf(token)
  if (at !== -1) announcers.splice(at, 1)
  announcerListeners.forEach((fn) => fn())
}

function registerQueueLimit(token, limit) {
  queueLimits.set(token, limit)
  trimQueue()
}

function unregisterQueueLimit(token) {
  queueLimits.delete(token)
  trimQueue()
}

// Every mutator here assigns a fresh array, so useSyncExternalStore already
// sees a new snapshot identity — notify must not copy the queue again.
function notify() {
  listeners.forEach((fn) => fn())
}

// Drop-oldest, so the newest toast always wins the slot. An id handed back by
// toast() may already name a dropped toast; dismiss/update on it are no-ops.
function addToast(opts) {
  const id = String(++nextId)
  const t = { id, createdAt: Date.now(), ...opts }
  toasts = capped([t, ...toasts], currentLimit())
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

/**
 * `error` interrupts; every other variant waits its turn. Sonner escalates
 * only a toast the caller marks important, and an approaching-quota warning is
 * not worth cutting a screen reader off mid-sentence, so `warning` stays
 * polite.
 */
function isAssertive(t) {
  return t.type === "error"
}

/**
 * Only plain-string title/description reach the live region: a JSX title would
 * duplicate its whole subtree — action buttons included — into the a11y tree.
 */
function announceText(t) {
  return [t.title, t.description].filter((v) => typeof v === "string" && v).join(". ")
}

/**
 * True when the region can carry the whole message. A JSX title beside a string
 * description would otherwise announce the description alone, so the reader
 * hears "Card declined" and never "Payment failed".
 */
function fullyAnnounceable(t) {
  if (t.custom != null) return false
  return [t.title, t.description].every((v) => v == null || typeof v === "string")
}

export function Toaster({
  position = "bottom-right",
  visibleToasts = DEFAULT_VISIBLE_TOASTS,
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
  const [hovered, setHovered] = useState(false)
  const [blurred, setBlurred] = useState(false)

  // How many toasts are on screen. Every consumer of that idea reads this one
  // value — the collapsed class, the announcement slice and the queue cap — so
  // they cannot disagree about which toasts a reader can actually reach. A
  // negative, fractional or NaN prop falls back to the default rather than
  // making some toasts invisible and audible, or visible and silent.
  const presented =
    Number.isFinite(visibleToasts) && visibleToasts >= 0
      ? Math.floor(visibleToasts)
      : DEFAULT_VISIBLE_TOASTS
  // The cap decides existence, not just the collapsed class, so it never
  // reaches 0: `presented === 0` hides every toast without discarding it.
  const queueCap = Math.max(1, presented) * QUEUE_MULTIPLE
  const listRef = useRef(null)
  const tokenRef = useRef(null)
  if (tokenRef.current === null) tokenRef.current = {}

  // Undefined on the first render — the claim lands in an effect below — so the
  // owner's regions mount empty in one commit and take content in a later one,
  // which is the whole point of having them.
  const announcer = useSyncExternalStore(announcerSubscribe, announcerSnapshot, announcerSnapshot)
  const announces = announcer === tokenRef.current

  // Two independent pause sources: unhovering a toast while the window is
  // still in the background must not restart its timer.
  const paused = hovered || blurred

  // Sync expand prop
  useEffect(() => {
    setExpanded(expandProp)
  }, [expandProp])

  useEffect(() => {
    const token = {}
    registerQueueLimit(token, queueCap)
    return () => unregisterQueueLimit(token)
  }, [queueCap])

  const handleHeight = useCallback((id, height) => {
    setHeights((prev) => {
      if (prev[id] === height) return prev
      return { ...prev, [id]: height }
    })
  }, [])

  // A toast dropped by the queue cap never runs its exit path, so heights are
  // pruned from the queue itself rather than on removal.
  useEffect(() => {
    setHeights((prev) => {
      const live = new Set(allToasts.map((t) => t.id))
      const stale = Object.keys(prev).filter((id) => !live.has(id))
      if (stale.length === 0) return prev
      const next = { ...prev }
      for (const id of stale) delete next[id]
      return next
    })
  }, [allToasts])

  useEffect(() => {
    const token = tokenRef.current
    claimAnnouncer(token)
    return () => releaseAnnouncer(token)
  }, [])

  // mouseleave never fires for a node removed under a motionless pointer, so
  // hover would stick true and park every later toast's timer. An empty queue
  // has nothing hoverable, which is the case that strands a whole page.
  useEffect(() => {
    if (allToasts.length === 0) setHovered(false)
  }, [allToasts.length])

  // Pause all timers while the window is in the background
  useEffect(() => {
    const onBlur = () => setBlurred(true)
    const onFocus = () => setBlurred(false)
    window.addEventListener("blur", onBlur)
    window.addEventListener("focus", onFocus)
    return () => {
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("focus", onFocus)
    }
  }, [])

  // Announcement tracks visibility exactly: a toast the reader can see is one
  // the reader can hear, and no other. A toast queued behind the collapsed stack
  // would otherwise tell a screen-reader user about messages a sighted user
  // cannot see — and with visibleToasts 0, about messages nobody can see. The
  // mirror of that is just as wrong, so expanding the stack, which reveals every
  // capped toast, announces them too.
  const shown = expanded ? allToasts.length : presented
  const announcements = { polite: [], assertive: [] }
  for (const t of allToasts.slice(0, shown)) {
    if (t.dismissed || !fullyAnnounceable(t) || !announceText(t)) continue
    announcements[isAssertive(t) ? "assertive" : "polite"].push(t)
  }

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
      onMouseEnter={() => { setExpanded(true); setHovered(true) }}
      onMouseLeave={() => { if (!expandProp) setExpanded(false); setHovered(false) }}
      {...props}
    >
      {/* Announcement is the regions' job, not the toast's. Assistive tech
          watches live regions that existed before the mutation, so these two
          are mounted with the Toaster and empty — a toast's text arriving is
          then a change to a region already being watched. aria-atomic is off
          because each entry is an independent message: adding one reads only
          that one, and a dismissal removing one reads nothing. */}
      <div className="toaster-live" role="status" aria-live="polite" aria-atomic="false">
        {announces && announcements.polite.map((t) => (
          <div key={t.id}>{announceText(t)}</div>
        ))}
      </div>
      <div className="toaster-live" role="alert" aria-live="assertive" aria-atomic="false">
        {announces && announcements.assertive.map((t) => (
          <div key={t.id}>{announceText(t)}</div>
        ))}
      </div>
      <ol className="toaster-list">
        {allToasts.map((t, index) => (
          <ToastItem
            key={t.id}
            toast={t}
            index={index}
            position={position}
            expanded={expanded}
            visibleToasts={presented}
            defaultDuration={defaultDuration}
            closeButton={closeButton}
            onDismiss={() => dismissToast(t.id)}
            onRemove={() => removeToast(t.id)}
            onHeight={(h) => handleHeight(t.id, h)}
            offset={offsets[t.id]}
            paused={paused}
          />
        ))}
      </ol>
    </section>
  )
}

const VELOCITY_THRESHOLD = 1.0 // px/ms — a deliberate flick (~1000 px/s)

// setTimeout truncates its delay to a signed 32-bit int, so a delay past
// 2^31-1 ms wraps and fires on the next tick. 24.9 days is a caller asking for
// a sticky toast the long way round, so it is held like Infinity, not dismissed
// at once. The replaced polling loop was immune because it passed min(left, 50).
const MAX_TIMEOUT = 2 ** 31 - 1

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
  paused,
}) {
  const ref = useRef(null)
  const [mounted, setMounted] = useState(false)
  const [exiting, setExiting] = useState(false)
  const remainingRef = useRef(null)
  const mountedTypeRef = useRef(true)

  // Swipe-to-dismiss via the shared primitive.
  const swipeAxis = position.includes("center") ? "y" : "x"
  const swipeSign = position.includes("left") ? -1 : 1

  const swipeHandlers = useSwipe({
    axis: swipeAxis,
    shouldStart: (event) => !event.target.closest("button, a, input"),
    onMove: (delta, event) => {
      const el = event.currentTarget
      const offset = Math.max(0, delta * swipeSign)
      el.setAttribute("data-swiping", "")
      el.style.transform =
        swipeAxis === "x"
          ? `translateX(${offset * swipeSign}px)`
          : `translateY(${offset}px)`
    },
    onEnd: ({ delta, velocity }, event) => {
      const el = event.currentTarget
      el.removeAttribute("data-swiping")
      const offset = Math.max(0, delta * swipeSign)
      const rect = el.getBoundingClientRect()
      const size = swipeAxis === "x" ? rect.width : rect.height
      const velocityDismiss = velocity * swipeSign > VELOCITY_THRESHOLD

      if (offset > size * 0.25 || velocityDismiss) {
        if (velocityDismiss) {
          const scale = Math.max(0.3, VELOCITY_THRESHOLD / Math.abs(velocity))
          el.style.setProperty("--exit-scale", scale.toFixed(2))
        }
        onDismiss()
      } else {
        el.style.transform = ""
      }
    },
    onCancel: (event) => {
      const el = event.currentTarget
      el.removeAttribute("data-swiping")
      el.style.transform = ""
    },
  })

  const duration = t.duration !== undefined ? t.duration : defaultDuration
  const limited = index >= visibleToasts
  // toast.custom(jsx) and a JSX title give the region no string to carry, so
  // those toasts fall back to announcing from their own node. That is the
  // unreliable path this task exists to replace, but it is what shipped and it
  // beats silence.
  const announcedByRegion = fullyAnnounceable(t) && announceText(t) !== ""
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

  // Reset timer refs on type change (e.g. promise loading → success).
  // Declared BEFORE the timer effect so React runs this setup first on
  // re-renders: refs are cleared, then the timer effect sees null and
  // re-initializes them to a fresh duration.  Skip initial mount —
  // the timer effect handles its own first initialization.
  useEffect(() => {
    if (mountedTypeRef.current) {
      mountedTypeRef.current = false
      return
    }
    if (t.type !== "loading" && duration !== Infinity) {
      remainingRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.type])

  // Auto-dismiss on one timeout per running segment — no polling. `paused` is
  // state, so pausing re-runs this effect: the cleanup banks what is left in
  // remainingRef and the next run schedules exactly that. A type change is the
  // other way round — the reset effect above is declared first, so its setup
  // has already nulled remainingRef by the time this one reads it, and a
  // promise toast resolving to success gets its full duration rather than
  // whatever was left of the loading state.
  useEffect(() => {
    if (t.dismissed || duration === Infinity || duration > MAX_TIMEOUT) return

    if (remainingRef.current === null) remainingRef.current = duration
    if (paused) return

    const start = Date.now()
    const remaining = remainingRef.current
    const timer = setTimeout(onDismiss, remaining)
    return () => {
      clearTimeout(timer)
      remainingRef.current = Math.max(0, remaining - (Date.now() - start))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t.dismissed, duration, t.type, paused])

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

  return (
    <li
      ref={ref}
      role={isAssertive(t) ? "alert" : "status"}
      // The visible toast enters the DOM already holding its text, which most
      // assistive tech will not announce — and the tech that does would then
      // say it twice, once here and once from the Toaster's live region. So
      // whenever the region has the text, this node stays quiet.
      aria-live={announcedByRegion ? "off" : isAssertive(t) ? "assertive" : "polite"}
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
      {...swipeHandlers}
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
