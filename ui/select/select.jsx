import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useAnchorPosition } from "../../lib/use-anchor-position.js"

const SelectContext = createContext(null)
const SelectContentContext = createContext(null)

function getOptions(listboxEl) {
  if (!listboxEl) return []
  return [...listboxEl.querySelectorAll('[role="option"]')].filter(
    (el) => !el.hasAttribute("aria-disabled")
  )
}

function optionLabel(el) {
  return (el.dataset.textValue ?? el.textContent ?? "").trim()
}

/**
 * Root — value and open are both controllable. The content is always
 * mounted (popover recipe), so option labels and typeahead work even while
 * closed. Items register value->label for SelectValue; an `items` prop
 * ([{value, label}]) is consulted first (Base UI parity).
 *
 * A visually-hidden native `<select>` mirrors the options so that
 * `required`, `:invalid`, `form.checkValidity()` and form submission all
 * work for free.  Pass a `ref` to call `setCustomValidity` for server-side
 * errors.
 */
export function Select({
  value,
  defaultValue = "",
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  items,
  name,
  required,
  form,
  disabled = false,
  ref,
  children,
  // Leftover props (id, aria-*, …) forward to the trigger — the root renders
  // no DOM node of its own, and dropping them silently broke FormControl.
  ...rootProps
}) {
  const [currentValue, setValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const contentId = useId()
  const [labels, setLabels] = useState({})

  const registerLabel = useCallback((itemValue, label) => {
    setLabels((prev) => (prev[itemValue] === label ? prev : { ...prev, [itemValue]: label }))
  }, [])

  const getLabel = useCallback(
    (itemValue) =>
      items?.find((item) => item.value === itemValue)?.label ?? labels[itemValue],
    [items, labels]
  )

  const selectValue = useCallback(
    (itemValue) => {
      setValue(itemValue)
      setOpen(false)
      triggerRef.current?.focus()
    },
    [setValue, setOpen]
  )

  // Shared typeahead buffer (trigger while closed, listbox while open) —
  // 1s of silence resets the query.
  const typeaheadRef = useRef({ query: "", timer: null })
  const appendTypeahead = useCallback((char) => {
    const state = typeaheadRef.current
    clearTimeout(state.timer)
    state.query += char.toLowerCase()
    state.timer = setTimeout(() => {
      state.query = ""
    }, 1000)
    return state.query
  }, [])
  useEffect(() => () => clearTimeout(typeaheadRef.current.timer), [])

  // A fresh query on every open/close — a buffer typed in one state must
  // not prefix matches in the other (Radix parity).
  useEffect(() => {
    const state = typeaheadRef.current
    clearTimeout(state.timer)
    state.query = ""
  }, [isOpen])

  // Visually-hidden native <select> for constraint validation + form
  // submission.  Not display:none — that excludes it from validation.
  const nativeSelectRef = useRef(null)
  useImperativeHandle(ref, () => ({
    setCustomValidity: (msg) => nativeSelectRef.current?.setCustomValidity(msg),
  }), [])

  const hasFormBinding = name != null || required

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        setValue,
        open: isOpen,
        setOpen,
        triggerRef,
        contentRef,
        contentId,
        disabled,
        registerLabel,
        getLabel,
        selectValue,
        typeaheadRef,
        appendTypeahead,
        rootProps,
      }}
    >
      {children}
      {hasFormBinding && (
        <select
          ref={nativeSelectRef}
          aria-hidden="true"
          tabIndex={-1}
          className="select-native-hidden"
          name={name}
          required={required || undefined}
          form={form}
          disabled={disabled || undefined}
          value={currentValue}
          onChange={() => {}}
        >
          <option value="" />
          {Object.entries(labels).map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      )}
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  as: Comp = "button",
  size = "default",
  onClick,
  onKeyDown,
  onPointerDown,
  className,
  children,
  ...props
}) {
  const {
    value,
    open,
    setOpen,
    triggerRef,
    contentRef,
    contentId,
    disabled,
    selectValue,
    appendTypeahead,
    rootProps,
  } = useContext(SelectContext)

  // Pointerdown light-dismisses the open popover; the queued toggle may sync
  // state to closed before the click arrives. Snapshot "was open" so the
  // click always means close then (task-14 gotcha).
  const wasOpenRef = useRef(false)

  const handlePointerDown = (event) => {
    onPointerDown?.(event)
    if (event.defaultPrevented) return
    wasOpenRef.current = open
  }

  const handleClick = (event) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = false
    if (wasOpen) setOpen(false)
    else setOpen((prev) => !prev)
  }

  // Enter/Space open via the button's native click activation — no keydown
  // duplicate (menubar precedent); Space stays out of the closed typeahead
  // for the same reason.
  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      setOpen(true)
    } else if (
      event.key.length === 1 &&
      event.key !== " " &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      // Closed typeahead sets the value directly, native <select> parity.
      const query = appendTypeahead(event.key)
      const match = getOptions(contentRef.current).find((el) =>
        optionLabel(el).toLowerCase().startsWith(query)
      )
      if (match) selectValue(match.dataset.value)
    }
  }

  return (
    <Comp
      {...rootProps}
      ref={triggerRef}
      type={Comp === "button" ? "button" : undefined}
      role="combobox"
      aria-haspopup="listbox"
      aria-expanded={open ? "true" : "false"}
      aria-controls={contentId}
      disabled={disabled || undefined}
      data-state={open ? "open" : "closed"}
      data-size={size}
      data-placeholder={value === "" ? "" : undefined}
      className={cn("select-trigger", className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      {...props}
    >
      {children}
      <svg
        className="select-trigger-chevron"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </Comp>
  )
}

export function SelectValue({ placeholder, className, ...props }) {
  const { value, getLabel } = useContext(SelectContext)
  const label = value === "" ? undefined : getLabel(value) ?? value

  return (
    <span
      data-placeholder={label === undefined ? "" : undefined}
      className={cn("select-value", className)}
      {...props}
    >
      {label ?? placeholder}
    </span>
  )
}

export function SelectContent({
  side = "bottom",
  align = "start",
  sideOffset = 4,
  alignItemWithTrigger = false,
  onKeyDown,
  className,
  children,
  ...props
}) {
  const {
    value,
    setOpen,
    open,
    triggerRef,
    contentRef,
    contentId,
    typeaheadRef,
    appendTypeahead,
  } = useContext(SelectContext)

  const [canScrollUp, setCanScrollUp] = useState(false)
  const [canScrollDown, setCanScrollDown] = useState(false)
  const topSentinelRef = useRef(null)
  const bottomSentinelRef = useRef(null)

  // Popper positioning (disabled in item-aligned mode).
  useAnchorPosition(open && !alignItemWithTrigger, triggerRef, contentRef, {
    side,
    align,
    sideOffset,
  })

  const setOpenRef = useRef(setOpen)
  setOpenRef.current = setOpen

  // Sync native dismissal (outside click, Esc) back into state.
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const handler = (event) => {
      if (event.newState === "closed") setOpenRef.current(false)
    }
    el.addEventListener("toggle", handler)
    return () => el.removeEventListener("toggle", handler)
  }, [contentRef])

  // IntersectionObserver for scroll-button visibility.  Sentinels sit at
  // the very top and bottom of the scrollable content; when a sentinel
  // scrolls out of the root (the content element) the corresponding
  // direction becomes scrollable.
  useEffect(() => {
    const el = contentRef.current
    const topSentinel = topSentinelRef.current
    const bottomSentinel = bottomSentinelRef.current
    if (!open || !el || !topSentinel || !bottomSentinel) {
      setCanScrollUp(false)
      setCanScrollDown(false)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === topSentinel) setCanScrollUp(!entry.isIntersecting)
          else if (entry.target === bottomSentinel) setCanScrollDown(!entry.isIntersecting)
        }
      },
      { root: el, threshold: 0 }
    )
    observer.observe(topSentinel)
    observer.observe(bottomSentinel)
    return () => observer.disconnect()
  }, [open, contentRef])

  // State -> native popover, gated on live :popover-open (task-13 gotcha).
  // On open: match the trigger width, then focus the selected option.
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const showing = el.matches(":popover-open")
    if (open) {
      const trigger = triggerRef.current

      if (alignItemWithTrigger && trigger) {
        // ---- Item-aligned positioning ----
        // Position the popup so the selected item sits on the trigger,
        // then clamp to the viewport.  Clamping creates overflow that
        // the scroll buttons handle.
        const padding = 8
        const vh = document.documentElement.clientHeight
        const vw = document.documentElement.clientWidth
        const triggerRect = trigger.getBoundingClientRect()

        el.style.minInlineSize = `${triggerRect.width}px`
        el.style.maxBlockSize = `${vh - 2 * padding}px`
        el.style.position = "fixed"
        el.style.right = "auto"
        el.style.bottom = "auto"
        el.style.left = "0px"
        el.style.top = "0px"
        // Kill the @starting-style scale(0.96) — it skews
        // getBoundingClientRect and looks wrong for item-aligned anyway
        // (the content fades in at its aligned position instead).
        el.style.transform = "none"
        delete el.dataset.side

        if (!showing) {
          try { el.showPopover() } catch { /* mid-transition */ }
        }

        // Measure with scrollTop at 0 so getBoundingClientRect gives
        // the item's position within the un-scrolled content.
        el.scrollTop = 0
        const options = getOptions(el)
        const selected =
          options.find((opt) => opt.dataset.value === value) ?? options[0]

        if (selected) {
          // itemTop is the item's screen-y when the content is at (0, 0).
          const itemTop = selected.getBoundingClientRect().top
          let top = triggerRect.top - itemTop
          let scrollTop = 0

          // Clamp to viewport top.
          if (top < padding) {
            scrollTop = padding - top
            top = padding
          }

          // Clamp to viewport bottom.
          const contentHeight = el.offsetHeight
          const bottomOverflow = top + contentHeight - (vh - padding)
          if (bottomOverflow > 0) {
            top -= bottomOverflow
            scrollTop += bottomOverflow
            if (top < padding) {
              scrollTop += padding - top
              top = padding
            }
          }

          const maxScroll = el.scrollHeight - el.clientHeight
          scrollTop = Math.max(0, Math.min(scrollTop, maxScroll))

          let left = triggerRect.left
          left = Math.max(padding, Math.min(left, vw - el.offsetWidth - padding))

          el.style.left = `${left}px`
          el.style.top = `${top}px`
          el.scrollTop = scrollTop

          selected.focus()
        }
      } else {
        // ---- Popper mode (existing behaviour) ----
        // Clear any item-aligned overrides from a previous open.
        el.style.transform = ""
        el.style.maxBlockSize = ""
        if (trigger) el.style.minInlineSize = `${trigger.getBoundingClientRect().width}px`
        if (!showing) {
          try { el.showPopover() } catch { /* mid-transition; toggle sync settles it */ }
        }
        const options = getOptions(el)
        const target = options.find((opt) => opt.dataset.value === value) ?? options[0]
        if (target) {
          target.focus()
          target.scrollIntoView({ block: "nearest" })
        }
      }
    } else if (showing) {
      try { el.hidePopover() } catch { /* already hidden */ }
    }
  }, [open, contentRef, triggerRef, value, alignItemWithTrigger])

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    const listbox = contentRef.current
    if (!listbox) return

    const options = getOptions(listbox)
    const currentIndex = options.indexOf(document.activeElement)
    const focusOption = (el) => {
      el.focus()
      el.scrollIntoView({ block: "nearest" })
    }

    switch (event.key) {
      case "ArrowDown": {
        event.preventDefault()
        if (options.length === 0) break
        focusOption(options[currentIndex < options.length - 1 ? currentIndex + 1 : 0])
        break
      }
      case "ArrowUp": {
        event.preventDefault()
        if (options.length === 0) break
        focusOption(options[currentIndex > 0 ? currentIndex - 1 : options.length - 1])
        break
      }
      case "Home": {
        event.preventDefault()
        if (options.length > 0) focusOption(options[0])
        break
      }
      case "End": {
        event.preventDefault()
        if (options.length > 0) focusOption(options[options.length - 1])
        break
      }
      case "Escape": {
        // Native light dismiss also fires; close through state and put
        // focus back on the trigger ourselves.
        setOpen(false)
        triggerRef.current?.focus()
        break
      }
      case "Tab": {
        // Tab never leaves an open listbox (Radix parity).
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        break
      }
      default: {
        const isChar =
          event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
        // Space selects (handled by the item) unless a typeahead query is
        // in flight — then it's part of the query ("new york").
        if (!isChar || (event.key === " " && typeaheadRef.current.query === "")) break
        event.preventDefault()
        const query = appendTypeahead(event.key)
        const match = options.find((el) =>
          optionLabel(el).toLowerCase().startsWith(query)
        )
        if (match) focusOption(match)
        break
      }
    }
  }

  return (
    <SelectContentContext.Provider value={{ canScrollUp, canScrollDown }}>
      <div
        ref={contentRef}
        id={contentId}
        popover="auto"
        role="listbox"
        tabIndex={-1}
        data-state={open ? "open" : "closed"}
        className={cn("select-content", className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        <div ref={topSentinelRef} className="select-sentinel" aria-hidden="true" />
        {children}
        <div ref={bottomSentinelRef} className="select-sentinel" aria-hidden="true" />
      </div>
    </SelectContentContext.Provider>
  )
}

export function SelectItem({
  value: itemValue,
  textValue,
  disabled = false,
  onClick,
  onKeyDown,
  onPointerMove,
  onPointerLeave,
  className,
  children,
  ...props
}) {
  const { value, registerLabel, selectValue, typeaheadRef } = useContext(SelectContext)
  const itemRef = useRef(null)
  const selected = value === itemValue

  // Register this option's label for SelectValue (trigger renders it
  // without the listbox ever having opened).
  useLayoutEffect(() => {
    registerLabel(itemValue, textValue ?? itemRef.current?.textContent?.trim() ?? "")
  }, [itemValue, textValue, registerLabel, children])

  const handleSelect = () => {
    if (!disabled) selectValue(itemValue)
  }

  const handleClick = (event) => {
    onClick?.(event)
    if (!event.defaultPrevented) handleSelect()
  }

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    if (event.key === "Enter" || (event.key === " " && typeaheadRef.current.query === "")) {
      event.preventDefault()
      handleSelect()
    }
  }

  // Focus follows the pointer; leaving parks focus on the listbox
  // (dropdown-menu precedent).
  const handlePointerMove = (event) => {
    onPointerMove?.(event)
    if (event.defaultPrevented || event.pointerType !== "mouse" || disabled) return
    if (document.activeElement !== event.currentTarget) event.currentTarget.focus()
  }

  const handlePointerLeave = (event) => {
    onPointerLeave?.(event)
    if (event.defaultPrevented || event.pointerType !== "mouse") return
    if (document.activeElement === event.currentTarget)
      event.currentTarget.closest('[role="listbox"]')?.focus()
  }

  return (
    <div
      ref={itemRef}
      role="option"
      tabIndex={-1}
      aria-selected={selected ? "true" : "false"}
      data-state={selected ? "checked" : "unchecked"}
      data-value={itemValue}
      data-text-value={textValue}
      className={cn("select-item", className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...(disabled ? { "aria-disabled": "true", "data-disabled": "" } : {})}
      {...props}
    >
      <span className="select-item-text">{children}</span>
      <span className="select-item-indicator">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
    </div>
  )
}

export function SelectGroup({ className, ...props }) {
  return <div role="group" className={cn("select-group", className)} {...props} />
}

export function SelectLabel({ className, ...props }) {
  return <div className={cn("select-label", className)} {...props} />
}

export function SelectSeparator({ className, ...props }) {
  return <div role="separator" className={cn("select-separator", className)} {...props} />
}

/* -------------------------------------------------------------------
   Scroll buttons — decorative affordance for item-aligned mode.
   aria-hidden, not focusable.  Scroll on hover; keyboard users never
   need them (arrow keys already scroll the active option into view).
   Visibility driven by IntersectionObserver on sentinels inside the
   content.
   ------------------------------------------------------------------- */

const SCROLL_SPEED = 3 // px per animation frame

export function SelectScrollUpButton({ className, children, ...props }) {
  const ctx = useContext(SelectContentContext)
  const { contentRef } = useContext(SelectContext)
  const canScrollUp = ctx?.canScrollUp ?? false
  const frameRef = useRef(0)

  const startScroll = useCallback(() => {
    const el = contentRef.current
    if (!el || frameRef.current) return
    const tick = () => {
      el.scrollTop = Math.max(0, el.scrollTop - SCROLL_SPEED)
      if (el.scrollTop > 0) frameRef.current = requestAnimationFrame(tick)
      else frameRef.current = 0
    }
    frameRef.current = requestAnimationFrame(tick)
  }, [contentRef])

  const stopScroll = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
  }, [])

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])
  useEffect(() => { if (!canScrollUp) stopScroll() }, [canScrollUp, stopScroll])

  return (
    <div
      className={cn("select-scroll-button select-scroll-up-button", className)}
      aria-hidden="true"
      data-state={canScrollUp ? "visible" : "hidden"}
      onPointerEnter={startScroll}
      onPointerLeave={stopScroll}
      {...props}
    >
      {children ?? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m18 15-6-6-6 6" />
        </svg>
      )}
    </div>
  )
}

export function SelectScrollDownButton({ className, children, ...props }) {
  const ctx = useContext(SelectContentContext)
  const { contentRef } = useContext(SelectContext)
  const canScrollDown = ctx?.canScrollDown ?? false
  const frameRef = useRef(0)

  const startScroll = useCallback(() => {
    const el = contentRef.current
    if (!el || frameRef.current) return
    const tick = () => {
      const maxScroll = el.scrollHeight - el.clientHeight
      el.scrollTop = Math.min(maxScroll, el.scrollTop + SCROLL_SPEED)
      if (el.scrollTop < maxScroll) frameRef.current = requestAnimationFrame(tick)
      else frameRef.current = 0
    }
    frameRef.current = requestAnimationFrame(tick)
  }, [contentRef])

  const stopScroll = useCallback(() => {
    cancelAnimationFrame(frameRef.current)
    frameRef.current = 0
  }, [])

  useEffect(() => () => cancelAnimationFrame(frameRef.current), [])
  useEffect(() => { if (!canScrollDown) stopScroll() }, [canScrollDown, stopScroll])

  return (
    <div
      className={cn("select-scroll-button select-scroll-down-button", className)}
      aria-hidden="true"
      data-state={canScrollDown ? "visible" : "hidden"}
      onPointerEnter={startScroll}
      onPointerLeave={stopScroll}
      {...props}
    >
      {children ?? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      )}
    </div>
  )
}
