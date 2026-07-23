import { createContext, useContext, useEffect, useId, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { usePresence } from "../../lib/use-presence.js"
import { useReturnFocus } from "../../lib/use-return-focus.js"
import { useScrollLock } from "../../lib/scroll-lock.js"

const DialogContext = createContext(null)
const DialogContentContext = createContext(null)

/** Internal hook for dialog-recipe reuses that must close through state so
 * the exit animation plays (e.g. drawer swipe-dismiss). */
export function useDialog() {
  return useContext(DialogContext)
}

/**
 * Controlled via `open` + `onOpenChange`, uncontrolled via `defaultOpen`.
 * Content is a native <dialog> shown with showModal(): top layer, native
 * focus containment, inert background. Esc routes through state (cancel is
 * prevented) so the exit animation plays before unmount.
 */
export function Dialog({ open, defaultOpen = false, onOpenChange, children }) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  return (
    <DialogContext.Provider value={{ open: isOpen, setOpen }}>{children}</DialogContext.Provider>
  )
}

export function DialogTrigger({ as: Comp = "button", onClick, ...props }) {
  const { open, setOpen } = useContext(DialogContext)
  return (
    <Comp
      type={Comp === "button" ? "button" : undefined}
      aria-haspopup="dialog"
      data-state={open ? "open" : "closed"}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setOpen(true)
      }}
      {...props}
    />
  )
}

/** No-op compat exports: showModal() already renders in the top layer, and
 * the overlay is the <dialog>'s ::backdrop (see dialog.css). */
export function DialogPortal({ children }) {
  return children
}

export function DialogOverlay() {
  return null
}

export function DialogContent({
  showCloseButton = true,
  dismissible = true,
  className,
  children,
  ...props
}) {
  const { open, setOpen } = useContext(DialogContext)
  const baseId = useId()
  const titleId = `${baseId}-title`
  const descriptionId = `${baseId}-description`
  const ref = useRef(null)
  const present = usePresence(open, ref)
  useScrollLock(present)
  useReturnFocus(present)

  // Plain useEffect, declared after useReturnFocus: its effect must run
  // first, while the trigger still has focus, before showModal() moves it.
  useEffect(() => {
    const node = ref.current
    if (present && node && !node.open) node.showModal()
  }, [present])

  if (!present) return null
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-state={open ? "open" : "closed"}
      className={cn("dialog", className)}
      onCancel={(event) => {
        event.preventDefault()
        setOpen(false)
      }}
      onClose={() => setOpen(false)}
      onPointerDown={(event) => {
        // Clicks on ::backdrop target the <dialog> itself; a coordinate
        // check keeps padding clicks from counting as outside.
        const rect = event.currentTarget.getBoundingClientRect()
        const outside =
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        if (outside && dismissible) setOpen(false)
      }}
      {...props}
    >
      <DialogContentContext.Provider value={{ titleId, descriptionId }}>
        {children}
        {showCloseButton && (
          <button
            type="button"
            aria-label="Close"
            className="dialog-close"
            onClick={() => setOpen(false)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        )}
      </DialogContentContext.Provider>
    </dialog>
  )
}

export function DialogHeader({ className, ...props }) {
  return <div className={cn("dialog-header", className)} {...props} />
}

export function DialogFooter({ className, ...props }) {
  return <div className={cn("dialog-footer", className)} {...props} />
}

export function DialogTitle({ className, ...props }) {
  const { titleId } = useContext(DialogContentContext)
  return <h2 id={titleId} className={cn("dialog-title", className)} {...props} />
}

export function DialogDescription({ className, ...props }) {
  const { descriptionId } = useContext(DialogContentContext)
  return <p id={descriptionId} className={cn("dialog-description", className)} {...props} />
}

export function DialogClose({ as: Comp = "button", onClick, ...props }) {
  const { setOpen } = useContext(DialogContext)
  return (
    <Comp
      type={Comp === "button" ? "button" : undefined}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) setOpen(false)
      }}
      {...props}
    />
  )
}
