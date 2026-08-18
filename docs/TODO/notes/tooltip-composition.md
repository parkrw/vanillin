# Putting a Tooltip on a control that is already a trigger

`TooltipTrigger` renders its own element and claims two things on it: `ref` (for `useAnchorPosition`) and `data-state` (`open`/`closed` for the tooltip). Every other trigger in the kit claims at least one of the same. So a tooltip cannot simply share an element with a dropdown, collapsible or select trigger; the two collide, and which one loses is decided by prop-spread order.

Three cases, all measured on task 88's console showcase:

**The other trigger needs no ref** (`CollapsibleTrigger`, `TabsTrigger`) — nest with the *other* trigger outermost:

```jsx
<Tooltip>
  <CollapsibleTrigger as={TooltipTrigger} className="…">…</CollapsibleTrigger>
  <TooltipContent side="right">Toggle group</TooltipContent>
</Tooltip>
```

`CollapsibleTrigger` renders `<TooltipTrigger data-state={collapsibleOpen} …>`; `TooltipTrigger` sets its own `data-state` *before* `{...props}`, so the collapsible's value wins and caret rotation keeps working, while the tooltip's `ref` survives because the collapsible passes none. Reversing the nesting (`TooltipTrigger as={CollapsibleTrigger}`) silently breaks the caret: the tooltip's `data-state` lands last.

**The other trigger needs a ref** (`DropdownMenuTrigger`, `SelectTrigger`, `PopoverTrigger`) — both refs cannot fit on one element. Wrap instead:

```jsx
<Tooltip>
  <TooltipTrigger as="span" className="ck-tip">
    <DropdownMenuTrigger as={Button} …>…</DropdownMenuTrigger>
  </TooltipTrigger>
  <TooltipContent>Actions for …</TooltipContent>
</Tooltip>
```

React's `onFocus` maps to `focusin`, which bubbles, so keyboard focus on the inner button still opens the tooltip. Give the span `display: inline-flex` or it collapses the layout. Cost: `aria-describedby` lands on the span, not the button — so the button still needs its own `aria-label`. `site/pages/avatar.jsx:217` uses the same `as="span"` wrapper for a non-interactive target.

**A plain icon button** — no conflict, use `TooltipTrigger as={Button}` directly.

Never put a `Tooltip` *inside* a `<button>`: `TooltipContent` renders a `<div popover>` next to the trigger, and a div inside a button is invalid content. That rules out tooltipping a caret span in isolation; tooltip the whole trigger instead.
