import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useAnchorPosition } from "../../lib/use-anchor-position.js"

const ComboboxContext = createContext(null)

function getOptions(popupEl) {
  if (!popupEl) return []
  return [...popupEl.querySelectorAll('[role="option"]')].filter(
    (el) => !el.hasAttribute("aria-disabled") && !el.hidden
  )
}

function normalizeItem(item) {
  return typeof item === "string" ? { value: item, label: item } : item
}

/**
 * Root — value, open, and inputValue are all controllable. The popup is
 * always mounted (popover recipe). Focus never leaves the input: options
 * carry a highlight (root state, option DOM id) surfaced through
 * aria-activedescendant, not real focus. `query` is the active filter and
 * is separate from `inputValue` — it resets on close so a selected label
 * never filters the reopened list.
 */
export function Combobox({
  value,
  defaultValue,
  onValueChange,
  open,
  defaultOpen = false,
  onOpenChange,
  inputValue,
  defaultInputValue = "",
  onInputValueChange,
  items,
  autoHighlight = false,
  multiple = false,
  name,
  disabled = false,
  children,
}) {
  const effectiveDefault = defaultValue !== undefined ? defaultValue : (multiple ? [] : "")
  const [currentValue, setValue] = useControllableState({
    value,
    defaultValue: effectiveDefault,
    onChange: onValueChange,
  })
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  })
  const [currentInput, setInputValue] = useControllableState({
    value: inputValue,
    defaultValue: defaultInputValue,
    onChange: onInputValueChange,
  })
  const [query, setQuery] = useState("")
  const [highlightedId, setHighlightedId] = useState(null)
  const [empty, setEmpty] = useState(false)
  const anchorRef = useRef(null)
  const inputRef = useRef(null)
  const contentRef = useRef(null)
  const listId = useId()
  const [labels, setLabels] = useState({})

  const registerLabel = useCallback((itemValue, label) => {
    setLabels((prev) => (prev[itemValue] === label ? prev : { ...prev, [itemValue]: label }))
  }, [])

  const getLabel = useCallback(
    (itemValue) =>
      items?.map(normalizeItem).find((item) => item.value === itemValue)?.label ??
      labels[itemValue],
    [items, labels]
  )

  const matches = useCallback(
    (label) => query === "" || label.toLowerCase().includes(query.toLowerCase()),
    [query]
  )

  const selectValue = useCallback(
    (itemValue) => {
      if (multiple) {
        setValue((prev) => {
          const list = prev ?? []
          return list.includes(itemValue)
            ? list.filter((v) => v !== itemValue)
            : [...list, itemValue]
        })
        setInputValue("")
        setQuery("")
        inputRef.current?.focus()
      } else {
        setValue(itemValue)
        setInputValue(getLabel(itemValue) ?? itemValue)
        setOpen(false)
        inputRef.current?.focus()
      }
    },
    [multiple, setValue, setInputValue, getLabel, setOpen, setQuery]
  )

  // Close resets the filter and highlight, and reverts the input to the
  // selected label — typed text that selected nothing doesn't stick.
  // In multiple mode there is no display label; just clear the query.
  const valueRef = useRef(currentValue)
  valueRef.current = currentValue
  const getLabelRef = useRef(getLabel)
  getLabelRef.current = getLabel
  const multipleRef = useRef(multiple)
  multipleRef.current = multiple
  const revertInput = useCallback(() => {
    setQuery("")
    setHighlightedId(null)
    if (multipleRef.current) {
      setInputValue("")
    } else {
      const v = valueRef.current
      setInputValue(v === "" ? "" : getLabelRef.current(v) ?? v)
    }
  }, [setInputValue])
  useEffect(() => {
    if (isOpen) return
    revertInput()
  }, [isOpen, revertInput])

  return (
    <ComboboxContext.Provider
      value={{
        value: currentValue,
        open: isOpen,
        setOpen,
        inputValue: currentInput,
        setInputValue,
        query,
        setQuery,
        highlightedId,
        setHighlightedId,
        empty,
        setEmpty,
        anchorRef,
        inputRef,
        contentRef,
        listId,
        items,
        autoHighlight,
        multiple,
        disabled,
        registerLabel,
        getLabel,
        matches,
        selectValue,
        revertInput,
      }}
    >
      {children}
      {name != null && (
        <input type="hidden" name={name} value={currentValue} disabled={disabled} />
      )}
    </ComboboxContext.Provider>
  )
}

export function ComboboxInput({
  placeholder,
  onChange,
  onKeyDown,
  onClick,
  onPointerDown,
  className,
  ...props
}) {
  const {
    open,
    setOpen,
    inputValue,
    setInputValue,
    setQuery,
    highlightedId,
    setHighlightedId,
    anchorRef,
    inputRef,
    contentRef,
    listId,
    disabled,
    selectValue,
    revertInput,
  } = useContext(ComboboxContext)

  // Pointerdown on the input light-dismisses the open popup natively; the
  // queued toggle syncs state to closed before the click lands. Snapshot
  // "was open" (task-14 pattern) — a click on the input keeps it open.
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
    if (wasOpen) {
      // Re-show the natively hidden popup directly — if the queued
      // light-dismiss toggle hasn't synced yet, hide+show coalesce to
      // open→open and the sync ignores it (task-13 pattern).
      const el = contentRef.current
      if (el && !el.matches(":popover-open")) {
        try { el.showPopover() } catch { /* mid-transition */ }
      }
    }
    setOpen(true)
  }

  const handleChange = (event) => {
    onChange?.(event)
    if (event.defaultPrevented) return
    setInputValue(event.target.value)
    setQuery(event.target.value)
    setOpen(true)
  }

  const moveHighlight = (dir) => {
    const options = getOptions(contentRef.current)
    if (options.length === 0) return
    const currentIndex = options.findIndex((el) => el.id === highlightedId)
    let next
    if (currentIndex === -1) next = dir > 0 ? options[0] : options[options.length - 1]
    else {
      const i = currentIndex + dir
      next = options[i < 0 ? options.length - 1 : i % options.length]
    }
    setHighlightedId(next.id)
    next.scrollIntoView({ block: "nearest" })
  }

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    switch (event.key) {
      case "ArrowDown":
      case "ArrowUp": {
        event.preventDefault()
        if (!open) setOpen(true)
        moveHighlight(event.key === "ArrowDown" ? 1 : -1)
        break
      }
      case "Home":
      case "End": {
        // Only hijacked while an option is highlighted — otherwise the
        // caret moves in the text, native input behavior.
        if (!open || highlightedId == null) break
        event.preventDefault()
        const options = getOptions(contentRef.current)
        const target = event.key === "Home" ? options[0] : options[options.length - 1]
        if (target) {
          setHighlightedId(target.id)
          target.scrollIntoView({ block: "nearest" })
        }
        break
      }
      case "Enter": {
        if (!open || highlightedId == null) break
        event.preventDefault()
        const el = document.getElementById(highlightedId)
        if (el) selectValue(el.dataset.value)
        break
      }
      case "Escape": {
        // A queued native toggle can sync `open` to false while the popup is
        // still showing — don't gate on state alone, and revert directly
        // instead of relying on an open→closed transition (which the stale
        // sync already consumed). Fully closed: let Escape bubble.
        const popupEl = contentRef.current
        const visuallyOpen = popupEl?.matches(":popover-open")
        if (!open && !visuallyOpen) break
        event.preventDefault()
        if (open) setOpen(false)
        if (visuallyOpen && !open) {
          try { popupEl.hidePopover() } catch { /* mid-transition */ }
        }
        revertInput()
        break
      }
      case "Tab": {
        // Close and let focus move on (no blur handler — see task file).
        if (open) setOpen(false)
        break
      }
    }
  }

  return (
    <div
      ref={anchorRef}
      data-state={open ? "open" : "closed"}
      data-disabled={disabled ? "" : undefined}
      className={cn("combobox-input-group", className)}
    >
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open ? "true" : "false"}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? highlightedId ?? undefined : undefined}
        autoComplete="off"
        spellCheck="false"
        placeholder={placeholder}
        value={inputValue}
        disabled={disabled || undefined}
        className="combobox-input"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        {...props}
      />
      <ComboboxChevron />
    </div>
  )
}

function ComboboxChevron() {
  const { open, setOpen, inputRef, disabled } = useContext(ComboboxContext)
  const wasOpenRef = useRef(false)

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label="Open popup"
      disabled={disabled || undefined}
      className="combobox-trigger"
      onPointerDown={() => {
        wasOpenRef.current = open
      }}
      onClick={() => {
        const wasOpen = wasOpenRef.current
        wasOpenRef.current = false
        setOpen(!wasOpen)
        inputRef.current?.focus()
      }}
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
        <path d="m7 15 5 5 5-5" />
        <path d="m7 9 5-5 5 5" />
      </svg>
    </button>
  )
}

export function ComboboxContent({
  side = "bottom",
  align = "start",
  sideOffset = 4,
  className,
  children,
  ...props
}) {
  const {
    open,
    setOpen,
    query,
    highlightedId,
    setHighlightedId,
    setEmpty,
    anchorRef,
    contentRef,
    autoHighlight,
  } = useContext(ComboboxContext)

  useAnchorPosition(open, anchorRef, contentRef, { side, align, sideOffset })

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

  // State -> native popover, gated on live :popover-open (task-13 gotcha).
  // Width matches the input group; focus stays in the input — nothing to
  // focus here (combobox delta vs select).
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const showing = el.matches(":popover-open")
    if (open) {
      const anchor = anchorRef.current
      if (anchor) el.style.minInlineSize = `${anchor.getBoundingClientRect().width}px`
      if (!showing) {
        try { el.showPopover() } catch { /* mid-transition; toggle sync settles it */ }
      }
    } else if (showing) {
      try { el.hidePopover() } catch { /* already hidden */ }
    }
  }, [open, contentRef, anchorRef])

  // Post-render, after items toggled `hidden` for the new query: empty
  // state, stale-highlight cleanup, and autoHighlight of the first match.
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const options = getOptions(el)
    setEmpty(query !== "" && options.length === 0)
    const highlightedVisible =
      highlightedId != null && options.some((opt) => opt.id === highlightedId)
    if (autoHighlight && query !== "") {
      const first = options[0]?.id ?? null
      if (first !== highlightedId) setHighlightedId(first)
    } else if (!highlightedVisible && highlightedId != null) {
      setHighlightedId(null)
    }
  }, [query, open, children, highlightedId, autoHighlight, contentRef, setEmpty, setHighlightedId])

  return (
    <div
      ref={contentRef}
      popover="auto"
      data-state={open ? "open" : "closed"}
      className={cn("combobox-content", className)}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * The listbox. Function children render the root `items` pre-filtered by
 * the current query (Base UI collection parity); element children filter
 * themselves via `hidden`.
 */
export function ComboboxList({ className, children, ...props }) {
  const { listId, items, multiple, matches } = useContext(ComboboxContext)

  let rendered = children
  if (typeof children === "function") {
    rendered = (items ?? [])
      .map(normalizeItem)
      .filter((item) => matches(item.label))
      .map((item) => children(item))
  }

  return (
    <div
      id={listId}
      role="listbox"
      aria-multiselectable={multiple ? "true" : undefined}
      className={cn("combobox-list", className)}
      {...props}
    >
      {rendered}
    </div>
  )
}

export function ComboboxItem({
  value: itemValue,
  textValue,
  disabled = false,
  onClick,
  onPointerMove,
  onPointerLeave,
  className,
  children,
  ...props
}) {
  const {
    value,
    highlightedId,
    setHighlightedId,
    multiple,
    registerLabel,
    matches,
    selectValue,
  } = useContext(ComboboxContext)
  const id = useId()
  const itemRef = useRef(null)
  const selected = multiple
    ? Array.isArray(value) && value.includes(itemValue)
    : value === itemValue
  const highlighted = highlightedId === id
  const [label, setLabel] = useState(textValue ?? "")

  // Register this option's label (input reverts to it on close) and keep a
  // copy for self-filtering.
  useLayoutEffect(() => {
    const text = textValue ?? itemRef.current?.textContent?.trim() ?? ""
    setLabel(text)
    registerLabel(itemValue, text)
  }, [itemValue, textValue, registerLabel, children])

  const visible = matches(label)

  const handleClick = (event) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled) return
    selectValue(itemValue)
  }

  // Highlight follows the pointer; leaving clears it (no real focus moves —
  // combobox delta vs select).
  const handlePointerMove = (event) => {
    onPointerMove?.(event)
    if (event.defaultPrevented || event.pointerType !== "mouse" || disabled) return
    if (!highlighted) setHighlightedId(id)
  }

  const handlePointerLeave = (event) => {
    onPointerLeave?.(event)
    if (event.defaultPrevented || event.pointerType !== "mouse") return
    if (highlighted) setHighlightedId(null)
  }

  return (
    <div
      ref={itemRef}
      id={id}
      role="option"
      hidden={visible ? undefined : true}
      aria-selected={selected ? "true" : "false"}
      data-state={selected ? "checked" : "unchecked"}
      data-highlighted={highlighted ? "" : undefined}
      data-value={itemValue}
      className={cn("combobox-item", className)}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      {...(disabled ? { "aria-disabled": "true", "data-disabled": "" } : {})}
      {...props}
    >
      <span className="combobox-item-text">{children}</span>
      <span className="combobox-item-indicator">
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

export function ComboboxEmpty({ className, ...props }) {
  const { empty } = useContext(ComboboxContext)
  if (!empty) return null
  return <div className={cn("combobox-empty", className)} {...props} />
}

export function ComboboxGroup({ className, ...props }) {
  return <div role="group" className={cn("combobox-group", className)} {...props} />
}

export function ComboboxLabel({ className, ...props }) {
  return <div className={cn("combobox-label", className)} {...props} />
}

export function ComboboxSeparator({ className, ...props }) {
  return <div role="separator" className={cn("combobox-separator", className)} {...props} />
}
