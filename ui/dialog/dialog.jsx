import { createContext, useContext, useEffect, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { usePresence } from "../../lib/use-presence.js"
import { useReturnFocus } from "../../lib/use-return-focus.js"
import { useScrollLock } from "../../lib/scroll-lock.js"

const DialogContext = createContext(null)

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

export function DialogContent({ className, children, ...props }) {
  const { open, setOpen } = useContext(DialogContext)
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
        if (outside) setOpen(false)
      }}
      {...props}
    >
      {children}
    </dialog>
  )
}
