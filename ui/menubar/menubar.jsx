import { createContext, useContext, useId, useRef } from "react"
import { cn } from "../../lib/cn.js"
import { useControllableState } from "../../lib/use-controllable-state.js"
import { useRovingFocus } from "../../lib/use-roving-focus.js"
import { useDirection } from "../../lib/direction.jsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  useDropdownMenu,
} from "../dropdown-menu/dropdown-menu.jsx"

const MenubarContext = createContext(null)
const MenubarMenuContext = createContext(null)

/**
 * Root — a horizontal row of menus. `value` is the open menu's value ("" when
 * all closed); each MenubarMenu wraps a controlled DropdownMenu keyed off it,
 * so the task-12 menu (items, submenus, safe triangle) works unchanged.
 * Trigger focus roves (one tabbable trigger); menu items don't match the
 * roving selector, so their bubbled keydowns are ignored here.
 */
export function Menubar({ value, defaultValue = "", onValueChange, className, children, ...props }) {
  const [current, setValue] = useControllableState({
    value,
    defaultValue,
    onChange: onValueChange,
  })
  const menubarRef = useRef(null)

  useRovingFocus(menubarRef, { orientation: "horizontal", selector: "[data-menubar-trigger]" })

  // Cross-menu keyboard nav (ArrowRight/Left inside an open menu): triggers
  // carry data-menubar-value, so DOM order gives the menu order. Focus the
  // target trigger first — that takes focus out of the closing popover, so
  // its native focus restore doesn't fight the handoff.
  const moveToAdjacent = (fromValue, delta) => {
    const node = menubarRef.current
    if (!node) return
    const triggers = [...node.querySelectorAll("[data-menubar-trigger]")].filter(
      (el) => !el.disabled && el.getAttribute("aria-disabled") !== "true"
    )
    if (triggers.length === 0) return
    const index = triggers.findIndex((el) => el.dataset.menubarValue === fromValue)
    const next = triggers[(index + delta + triggers.length) % triggers.length]
    next.focus()
    setValue(next.dataset.menubarValue)
  }

  return (
    <MenubarContext.Provider value={{ value: current, setValue, moveToAdjacent }}>
      <div ref={menubarRef} role="menubar" className={cn("menubar", className)} {...props}>
        {children}
      </div>
    </MenubarContext.Provider>
  )
}

/** One menu in the bar — value defaults to a generated id. */
export function MenubarMenu({ value: valueProp, children }) {
  const autoValue = useId()
  const menuValue = valueProp ?? autoValue
  const { value, setValue } = useContext(MenubarContext)

  return (
    <MenubarMenuContext.Provider value={{ menuValue }}>
      <DropdownMenu
        open={value === menuValue}
        onOpenChange={(open) =>
          // A close only clears the root value if this menu still owns it —
          // a switch has already handed it to the next menu.
          setValue((prev) => (open ? menuValue : prev === menuValue ? "" : prev))
        }
      >
        {children}
      </DropdownMenu>
    </MenubarMenuContext.Provider>
  )
}

export function MenubarTrigger({ as: Comp = "button", onClick, onKeyDown, onPointerDown, onPointerEnter, className, ...props }) {
  const { value, setValue } = useContext(MenubarContext)
  const { menuValue } = useContext(MenubarMenuContext)
  const { open, triggerRef, contentId, focusLastRef, skipItemFocusRef } = useDropdownMenu()

  // Pointerdown light-dismisses the open popover natively; its queued toggle
  // event may sync state to closed before or after the click arrives. Snapshot
  // "was open" at pointerdown so the click always means close in that case,
  // instead of racing the toggle task and sometimes reopening.
  const wasOpenRef = useRef(false)

  const handlePointerDown = (event) => {
    onPointerDown?.(event)
    if (event.defaultPrevented) return
    wasOpenRef.current = open
  }

  // Enter/Space toggle via the button's native click activation — no keydown
  // duplicate (keydown-open plus synthesized click would immediately re-close).
  // Keyboard clicks have no pointerdown, so the snapshot stays false and the
  // live state decides.
  const handleClick = (event) => {
    onClick?.(event)
    if (event.defaultPrevented) return
    const wasOpen = wasOpenRef.current
    wasOpenRef.current = false
    if (wasOpen) setValue((prev) => (prev === menuValue ? "" : prev))
    else setValue((prev) => (prev === menuValue ? "" : menuValue))
  }

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    // Left/Right/Home/End roving between triggers is the menubar's job.
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setValue(menuValue)
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      focusLastRef.current = true
      setValue(menuValue)
    }
  }

  // Click-first model: hovering only switches between menus while one is
  // already open — and without stealing the item highlight.
  const handlePointerEnter = (event) => {
    onPointerEnter?.(event)
    if (event.defaultPrevented || event.pointerType === "touch") return
    if (value !== "" && value !== menuValue) {
      skipItemFocusRef.current = true
      setValue(menuValue)
    }
  }

  return (
    <Comp
      ref={triggerRef}
      type={Comp === "button" ? "button" : undefined}
      role="menuitem"
      aria-haspopup="menu"
      aria-expanded={open ? "true" : "false"}
      aria-controls={contentId}
      data-state={open ? "open" : "closed"}
      data-menubar-trigger=""
      data-menubar-value={menuValue}
      className={cn("menubar-trigger", className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerEnter={handlePointerEnter}
      {...props}
    />
  )
}

export function MenubarContent({ align = "start", alignOffset = -4, sideOffset = 8, onKeyDown, className, ...props }) {
  const { moveToAdjacent } = useContext(MenubarContext)
  const { menuValue } = useContext(MenubarMenuContext)
  const { contentRef } = useDropdownMenu()
  const dir = useDirection()
  const nextKey = dir === "rtl" ? "ArrowLeft" : "ArrowRight"
  const prevKey = dir === "rtl" ? "ArrowRight" : "ArrowLeft"

  const handleKeyDown = (event) => {
    onKeyDown?.(event)
    if (event.defaultPrevented) return
    // SubTrigger stops propagation on its open key and SubContent on its
    // close key, so a next-key arriving here is always a cross-menu move —
    // including from a plain item inside a submenu (Radix parity). The prev
    // key acts only at the top level; from inside a submenu it never
    // arrives (the sub consumed it to close).
    if (event.key === nextKey) {
      event.preventDefault()
      moveToAdjacent(menuValue, 1)
    } else if (event.key === prevKey && event.target.closest('[role="menu"]') === contentRef.current) {
      event.preventDefault()
      moveToAdjacent(menuValue, -1)
    }
  }

  return (
    <DropdownMenuContent
      align={align}
      alignOffset={alignOffset}
      sideOffset={sideOffset}
      className={cn("menubar-content", className)}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
}

export {
  DropdownMenuItem as MenubarItem,
  DropdownMenuCheckboxItem as MenubarCheckboxItem,
  DropdownMenuRadioGroup as MenubarRadioGroup,
  DropdownMenuRadioItem as MenubarRadioItem,
  DropdownMenuSub as MenubarSub,
  DropdownMenuSubTrigger as MenubarSubTrigger,
  DropdownMenuSubContent as MenubarSubContent,
  DropdownMenuGroup as MenubarGroup,
  DropdownMenuLabel as MenubarLabel,
  DropdownMenuSeparator as MenubarSeparator,
  DropdownMenuShortcut as MenubarShortcut,
}
