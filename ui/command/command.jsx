import {
  createContext,
  useCallback,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { cn } from "../../lib/cn.js"
import { commandScore } from "../../lib/command-score.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useHighlight } from "../../lib/use-highlight.js"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../dialog/dialog.jsx"

const CommandContext = createContext(null)

/** Collect visible options, sorted by CSS `order` (visual order). */
function getOptions(listEl) {
  if (!listEl) return []
  const options = [...listEl.querySelectorAll('[role="option"]')].filter(
    (el) => !el.hasAttribute("aria-disabled") && !el.hidden
  )
  options.sort((a, b) => {
    const oa = parseInt(getComputedStyle(a).order, 10) || 0
    const ob = parseInt(getComputedStyle(b).order, 10) || 0
    return oa - ob
  })
  return options
}

/** Fuzzy scorer — returns a 0–1 score. Replaces the old substring filter.
 * Keywords and rendered label text are folded into the search. */
function defaultFilter(value, search, keywords) {
  const haystack = [value, ...(keywords ?? [])].join(" ")
  return commandScore(haystack, search)
}

/**
 * Root. `value` is the **highlighted** item (cmdk semantics — nothing is
 * persisted; activation calls the item's `onSelect`), so there is no
 * selection indicator. The first visible item is highlighted automatically
 * and re-highlighted whenever the search changes.
 */
export function Command({
  value,
  defaultValue = "",
  onValueChange,
  filter = defaultFilter,
  shouldFilter = true,
  loop = false,
  label,
  vimBindings = true,
  disablePointerSelection = false,
  className,
  children,
  ...props
}) {
  const [currentValue, setValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const [search, setSearch] = useState("")
  const [empty, setEmpty] = useState(false)
  const [ids, setIds] = useState({})
  const listRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()

  // Scores map: itemValue -> score (0–1). Updated per search change.
  const scoresRef = useRef(new Map())

  // Items register their DOM id so aria-activedescendant can name the
  // highlighted option (root state is the item value, not the id).
  const registerId = useCallback((itemValue, id) => {
    setIds((prev) => (prev[itemValue] === id ? prev : { ...prev, [itemValue]: id }))
  }, [])

  const unregisterId = useCallback((itemValue) => {
    setIds((prev) => {
      if (!(itemValue in prev)) return prev
      const next = { ...prev }
      delete next[itemValue]
      return next
    })
  }, [])

  const filterRef = useRef(filter)
  filterRef.current = filter

  /** Return a 0–1 score for an item. Items call this to decide visibility
   * and to set their CSS `order`. */
  const score = useCallback(
    (itemValue, keywords, text) => {
      if (!shouldFilter || search === "") return 1
      const fn = filterRef.current
      const extra = fn === defaultFilter && text ? [...(keywords ?? []), text] : keywords
      return fn(itemValue, search, extra)
    },
    [shouldFilter, search]
  )

  /** Register a score for an item value. Called from CommandItem's layout effect. */
  const setScore = useCallback((itemValue, s) => {
    scoresRef.current.set(itemValue, s)
  }, [])

  /** Get the max score among a group's visible items. */
  const getGroupScore = useCallback((groupEl) => {
    if (!groupEl) return 0
    const items = groupEl.querySelectorAll('[role="option"]:not([hidden])')
    let max = 0
    for (const item of items) {
      const s = scoresRef.current.get(item.dataset.value) ?? 0
      if (s > max) max = s
    }
    return max
  }, [])

  // Loading indicator count — CommandEmpty checks this to avoid
  // showing "no results" while loading.
  const [loadingCount, setLoadingCount] = useState(0)

  // Paint substring matches via the CSS Custom Highlight API.
  // Only active when shouldFilter is true — when the consumer owns
  // filtering (shouldFilter={false}), they own highlighting too.
  useHighlight(listRef, shouldFilter ? search : "")

  return (
    <CommandContext.Provider
      value={{
        value: currentValue,
        setValue,
        search,
        setSearch,
        empty,
        setEmpty,
        ids,
        registerId,
        unregisterId,
        listRef,
        inputRef,
        listId,
        label,
        loop,
        vimBindings,
        disablePointerSelection,
        score,
        setScore,
        shouldFilter,
        getGroupScore,
        loadingCount,
        setLoadingCount,
      }}
    >
      <div className={cn("command", className)} {...props}>
        {children}
      </div>
    </CommandContext.Provider>
  )
}

/**
 * Palette form: ui/dialog (showModal recipe) around a Command. The header is
 * visually hidden — the dialog still needs an accessible name, and the
 * input is the first focusable so showModal() lands there.
 */
export function CommandDialog({
  title = "Command Palette",
  description = "Search for a command to run...",
  open,
  defaultOpen,
  onOpenChange,
  showCloseButton = false,
  className,
  children,
  ...props
}) {
  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn("command-dialog", className)}
        showCloseButton={showCloseButton}
        {...props}
      >
        <DialogHeader className="command-dialog-header">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Command>{children}</Command>
      </DialogContent>
    </Dialog>
  )
}

export function CommandInput({
  value,
  onValueChange,
  onChange,
  onKeyDown,
  className,
  ...props
}) {
  const {
    value: highlighted,
    setValue,
    search,
    setSearch,
    ids,
    listRef,
    inputRef,
    listId,
    loop,
    vimBindings,
  } = useContext(CommandContext)

  // Controlled search mirrors into root state, which is what items filter
  // against — one source of truth for both rendering and filtering.
  useLayoutEffect(() => {
    if (value !== undefined) setSearch(value)
  }, [value, setSearch])

  const handleChange = (event) => {
    onChange?.(event)
    if (event.defaultPrevented) return
    if (value === undefined) setSearch(event.target.value)
    onValueChange?.(event.target.value)
  }

  const move = (dir) => {
    const options = getOptions(listRef.current)
    if (options.length === 0) return
    const currentIndex = options.findIndex((el) => el.dataset.value === highlighted)
    let next
    if (currentIndex === -1) next = dir > 0 ? options[0] : options[options.length - 1]
    else {
      const i = currentIndex + dir
      if (i < 0 || i >= options.length) {
        if (!loop) return
        next = options[i < 0 ? options.length - 1 : 0]
      } else next = options[i]
    }
    setValue(next.dataset.value)
    next.scrollIntoView({ block: "nearest" })
  }

  const jump = (edge) => {
    const options = getOptions(listRef.current)
    const target = edge === "first" ? options[0] : options[options.length - 1]
    if (!target) return
    setValue(target.dataset.value)
    target.scrollIntoView({ block: "nearest" })
  }

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        move(1)
        break
      case "ArrowUp":
        event.preventDefault()
        move(-1)
        break
      case "Home":
        event.preventDefault()
        jump("first")
        break
      case "End":
        event.preventDefault()
        jump("last")
        break
      case "Enter": {
        const el = getOptions(listRef.current).find((o) => o.dataset.value === highlighted)
        if (!el) break
        event.preventDefault()
        // The item's click handler owns activation — no callback registry.
        el.click()
        break
      }
      case "n":
      case "j":
        if (vimBindings && event.ctrlKey) {
          event.preventDefault()
          move(1)
        }
        break
      case "p":
      case "k":
        if (vimBindings && event.ctrlKey) {
          event.preventDefault()
          move(-1)
        }
        break
    }
  }

  return (
    <div className={cn("command-input-wrapper", className)}>
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.3-4.3" />
      </svg>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded="true"
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={ids[highlighted] ?? undefined}
        autoComplete="off"
        spellCheck="false"
        value={search}
        className="command-input"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        {...props}
      />
    </div>
  )
}

/** The listbox. Owns the post-render pass: empty state + auto-highlight of
 * the first visible option (items have toggled `hidden` by now). */
export function CommandList({ className, children, ...props }) {
  const { value, setValue, search, setEmpty, ids, listRef, listId, label, loadingCount } =
    useContext(CommandContext)

  // Layout effect, so the first paint never flashes the empty state before
  // items have registered. `ids` is a dep because an item whose value comes
  // from its text content only lands in the DOM on its second render — the
  // registration it triggers is what re-runs this pass.
  const prevSearchRef = useRef(search)
  useLayoutEffect(() => {
    const options = getOptions(listRef.current)
    setEmpty(options.length === 0 && loadingCount === 0)
    const searchChanged = prevSearchRef.current !== search
    prevSearchRef.current = search
    if (options.length === 0) {
      if (value !== "") setValue("")
      return
    }
    const first = options[0].dataset.value
    // Every search change re-highlights the top result (cmdk); otherwise
    // only a highlight that filtered out has to move.
    const stale = searchChanged || !options.some((el) => el.dataset.value === value)
    if (stale && value !== first) setValue(first)
  }, [search, children, value, ids, listRef, setEmpty, setValue, loadingCount])

  return (
    <div
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label={label}
      className={cn("command-list", className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CommandEmpty({ className, ...props }) {
  const { empty } = useContext(CommandContext)
  if (!empty) return null
  return <div role="presentation" className={cn("command-empty", className)} {...props} />
}

export function CommandGroup({ heading, forceMount, className, children, ...props }) {
  const headingId = useId()
  const groupRef = useRef(null)
  const { search, shouldFilter, getGroupScore } = useContext(CommandContext)

  // Set CSS order on the group based on its best item's score.
  useLayoutEffect(() => {
    if (!shouldFilter || search === "" || !groupRef.current) {
      // Reset order when not filtering.
      groupRef.current.style.order = ""
      return
    }
    const best = getGroupScore(groupRef.current)
    // Higher score -> lower order number (appears first).
    // Map 0–1 score to order 0–999999. Ties keep DOM order (stable).
    groupRef.current.style.order = best > 0 ? String(Math.round((1 - best) * 999999)) : ""
  }, [search, shouldFilter, getGroupScore, children])

  return (
    <div
      ref={groupRef}
      role="group"
      aria-labelledby={heading != null ? headingId : undefined}
      data-force-mount={forceMount ? "" : undefined}
      className={cn("command-group", className)}
      {...props}
    >
      {heading != null && (
        <div id={headingId} className="command-group-heading">
          {heading}
        </div>
      )}
      {children}
    </div>
  )
}

export function CommandItem({
  value: itemValue,
  keywords,
  onSelect,
  disabled = false,
  forceMount = false,
  onClick,
  onPointerMove,
  className,
  children,
  ...props
}) {
  const {
    value: highlighted,
    setValue,
    registerId,
    unregisterId,
    disablePointerSelection,
    score: scoreFn,
    setScore,
    shouldFilter,
    search,
  } = useContext(CommandContext)
  const id = useId()
  const itemRef = useRef(null)
  const [text, setText] = useState("")
  // cmdk infers a missing value from the item's text content.
  const value = itemValue ?? text
  const selected = highlighted === value && value !== ""

  useLayoutEffect(() => {
    setText(itemRef.current?.textContent?.trim() ?? "")
  }, [children])

  useLayoutEffect(() => {
    if (value === "") return
    registerId(value, id)
    return () => unregisterId(value)
  }, [value, id, registerId, unregisterId])

  const itemScore = scoreFn(value, keywords, text)
  const visible = forceMount || itemScore > 0

  // Set CSS order based on score so higher-scoring items appear first.
  useLayoutEffect(() => {
    if (!shouldFilter || search === "" || !itemRef.current) {
      itemRef.current.style.order = ""
      setScore(value, 1)
      return
    }
    if (visible) {
      // Higher score -> lower order number.
      const order = Math.round((1 - itemScore) * 999999)
      itemRef.current.style.order = String(order)
      setScore(value, itemScore)
    } else {
      setScore(value, 0)
    }
  }, [shouldFilter, search, itemScore, visible, value, setScore])

  const handleClick = (event) => {
    onClick?.(event)
    if (event.defaultPrevented || disabled) return
    onSelect?.(value)
  }

  const handlePointerMove = (event) => {
    onPointerMove?.(event)
    if (event.defaultPrevented || event.pointerType !== "mouse") return
    if (disablePointerSelection || disabled || selected) return
    setValue(value)
  }

  return (
    <div
      ref={itemRef}
      id={id}
      role="option"
      hidden={visible ? undefined : true}
      aria-selected={selected ? "true" : "false"}
      data-selected={selected ? "" : undefined}
      data-value={value}
      className={cn("command-item", className)}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      {...(disabled ? { "aria-disabled": "true", "data-disabled": "" } : {})}
      {...props}
    >
      {children}
    </div>
  )
}

/** Visible only while the search is empty, unless `alwaysRender` (cmdk). */
export function CommandSeparator({ alwaysRender = false, className, ...props }) {
  const { search } = useContext(CommandContext)
  if (search !== "" && !alwaysRender) return null
  return <div role="separator" className={cn("command-separator", className)} {...props} />
}

export function CommandShortcut({ className, ...props }) {
  return <span className={cn("command-shortcut", className)} {...props} />
}

/** Loading indicator. Renders while an async filter is in flight.
 * `aria-live="polite"` announces to screen readers; does not count
 * toward CommandEmpty's "no results" check. */
export function CommandLoading({ progress, className, children, ...props }) {
  const { setLoadingCount } = useContext(CommandContext)

  useLayoutEffect(() => {
    setLoadingCount((c) => c + 1)
    return () => setLoadingCount((c) => c - 1)
  }, [setLoadingCount])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading..."
      aria-valuenow={progress}
      className={cn("command-loading", className)}
      {...props}
    >
      {children}
    </div>
  )
}
