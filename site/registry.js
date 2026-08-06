import { lazy } from "react"

export const docsGroups = [
  {
    label: "Get started",
    entries: {
      introduction: {
        title: "Introduction",
        desc: "What vanillin is, and why copy-paste beats a dependency.",
        page: lazy(() => import("./pages/docs/introduction.jsx")),
      },
      installation: {
        title: "Installation",
        desc: "Add components to your project with the CLI or by hand.",
        page: lazy(() => import("./pages/docs/installation.jsx")),
      },
      configuration: {
        title: "Configuration",
        desc: "van.config.json — theme, components, paths, and validation.",
        page: lazy(() => import("./pages/docs/configuration.jsx")),
      },
    },
  },
  {
    label: "Docs",
    entries: {
      cli: {
        title: "CLI",
        desc: "init, add, diff, update — the tool that copies components in.",
        page: lazy(() => import("./pages/docs/cli.jsx")),
      },
      theming: {
        title: "Theming",
        desc: "Design tokens, van.config.json, dark mode, and density.",
        page: lazy(() => import("./pages/docs/theming.jsx")),
      },
      schema: {
        title: "Schema",
        desc: "Zero-dep validation and the resolver behind the config.",
        page: lazy(() => import("./pages/docs/schema.jsx")),
      },
      contracts: {
        title: "Component contracts",
        desc: "Manifests and hashes — how van diff tells kit changes from yours.",
        page: lazy(() => import("./pages/docs/contracts.jsx")),
      },
    },
  },
]

export const docs = Object.fromEntries(
  docsGroups.flatMap(({ entries }) => Object.entries(entries))
)

export const categories = [
  {
    label: "Forms",
    desc: "Inputs, selects, pickers, and the form engine that binds them.",
    entries: {
      button: { title: "Button", page: lazy(() => import("./pages/button.jsx")) },
      "button-group": { title: "Button Group", page: lazy(() => import("./pages/button-group.jsx")) },
      input: { title: "Input", page: lazy(() => import("./pages/input.jsx")) },
      "input-group": { title: "Input Group", page: lazy(() => import("./pages/input-group.jsx")) },
      "input-otp": { title: "Input OTP", page: lazy(() => import("./pages/input-otp.jsx")) },
      textarea: { title: "Textarea", page: lazy(() => import("./pages/textarea.jsx")) },
      checkbox: { title: "Checkbox", page: lazy(() => import("./pages/checkbox.jsx")) },
      "radio-group": { title: "Radio Group", page: lazy(() => import("./pages/radio-group.jsx")) },
      switch: { title: "Switch", page: lazy(() => import("./pages/switch.jsx")) },
      select: { title: "Select", page: lazy(() => import("./pages/select.jsx")) },
      "native-select": { title: "Native Select", page: lazy(() => import("./pages/native-select.jsx")) },
      combobox: { title: "Combobox", page: lazy(() => import("./pages/combobox.jsx")) },
      slider: { title: "Slider", page: lazy(() => import("./pages/slider.jsx")) },
      label: { title: "Label", page: lazy(() => import("./pages/label.jsx")) },
      field: { title: "Field", page: lazy(() => import("./pages/field.jsx")) },
      form: { title: "Form", page: lazy(() => import("./pages/form.jsx")) },
      "form-fields": { title: "Form Fields", page: lazy(() => import("./pages/form-fields.jsx")) },
      "use-form": { title: "useForm", page: lazy(() => import("./pages/use-form.jsx")) },
      calendar: { title: "Calendar", page: lazy(() => import("./pages/calendar.jsx")) },
      "date-input": { title: "Date Input", page: lazy(() => import("./pages/date-input.jsx")) },
      "date-picker": { title: "Date Picker", page: lazy(() => import("./pages/date-picker.jsx")) },
      "time-picker": { title: "Time Picker", page: lazy(() => import("./pages/time-picker.jsx")) },
    },
  },
  {
    label: "Data Display",
    desc: "Tables, badges, avatars, and read-only presentation.",
    entries: {
      table: { title: "Table", page: lazy(() => import("./pages/table.jsx")) },
      "data-table": { title: "Data Table", page: lazy(() => import("./pages/data-table.jsx")) },
      badge: { title: "Badge", page: lazy(() => import("./pages/badge.jsx")) },
      avatar: { title: "Avatar", page: lazy(() => import("./pages/avatar.jsx")) },
      progress: { title: "Progress", page: lazy(() => import("./pages/progress.jsx")) },
      spinner: { title: "Spinner", page: lazy(() => import("./pages/spinner.jsx")) },
      empty: { title: "Empty", page: lazy(() => import("./pages/empty.jsx")) },
      item: { title: "Item", page: lazy(() => import("./pages/item.jsx")) },
      kbd: { title: "Kbd", page: lazy(() => import("./pages/kbd.jsx")) },
      "status-dot": { title: "Status Dot", page: lazy(() => import("./pages/status-dot.jsx")) },
      typography: { title: "Typography", page: lazy(() => import("./pages/typography.jsx")) },
      format: { title: "Format", page: lazy(() => import("./pages/format.jsx")) },
      marker: { title: "Marker", page: lazy(() => import("./pages/marker.jsx")) },
    },
  },
  {
    label: "Layout",
    desc: "Cards, separators, scroll areas, and resizable panels.",
    entries: {
      card: { title: "Card", page: lazy(() => import("./pages/card.jsx")) },
      separator: { title: "Separator", page: lazy(() => import("./pages/separator.jsx")) },
      "aspect-ratio": { title: "Aspect Ratio", page: lazy(() => import("./pages/aspect-ratio.jsx")) },
      resizable: { title: "Resizable", page: lazy(() => import("./pages/resizable.jsx")) },
      "scroll-area": { title: "Scroll Area", page: lazy(() => import("./pages/scroll-area.jsx")) },
      skeleton: { title: "Skeleton", page: lazy(() => import("./pages/skeleton.jsx")) },
      carousel: { title: "Carousel", page: lazy(() => import("./pages/carousel.jsx")) },
    },
  },
  {
    label: "Navigation",
    desc: "Breadcrumbs, tabs, menus, and sidebars.",
    entries: {
      breadcrumb: { title: "Breadcrumb", page: lazy(() => import("./pages/breadcrumb.jsx")) },
      pagination: { title: "Pagination", page: lazy(() => import("./pages/pagination.jsx")) },
      tabs: { title: "Tabs", page: lazy(() => import("./pages/tabs.jsx")) },
      "navigation-menu": { title: "Navigation Menu", page: lazy(() => import("./pages/navigation-menu.jsx")) },
      sidebar: { title: "Sidebar", page: lazy(() => import("./pages/sidebar.jsx")) },
      menubar: { title: "Menubar", page: lazy(() => import("./pages/menubar.jsx")) },
    },
  },
  {
    label: "Overlay",
    desc: "Dialogs, popovers, tooltips — everything on the top layer.",
    entries: {
      dialog: { title: "Dialog", page: lazy(() => import("./pages/dialog.jsx")) },
      "alert-dialog": { title: "Alert Dialog", page: lazy(() => import("./pages/alert-dialog.jsx")) },
      sheet: { title: "Sheet", page: lazy(() => import("./pages/sheet.jsx")) },
      drawer: { title: "Drawer", page: lazy(() => import("./pages/drawer.jsx")) },
      popover: { title: "Popover", page: lazy(() => import("./pages/popover.jsx")) },
      tooltip: { title: "Tooltip", page: lazy(() => import("./pages/tooltip.jsx")) },
      "hover-card": { title: "Hover Card", page: lazy(() => import("./pages/hover-card.jsx")) },
      "dropdown-menu": { title: "Dropdown Menu", page: lazy(() => import("./pages/dropdown-menu.jsx")) },
      "context-menu": { title: "Context Menu", page: lazy(() => import("./pages/context-menu.jsx")) },
      command: { title: "Command", page: lazy(() => import("./pages/command.jsx")) },
      toast: { title: "Toast (Sonner)", page: lazy(() => import("./pages/toast.jsx")) },
    },
  },
  {
    label: "Disclosure",
    desc: "Accordions, collapsibles, toggles, and alerts.",
    entries: {
      accordion: { title: "Accordion", page: lazy(() => import("./pages/accordion.jsx")) },
      collapsible: { title: "Collapsible", page: lazy(() => import("./pages/collapsible.jsx")) },
      toggle: { title: "Toggle", page: lazy(() => import("./pages/toggle.jsx")) },
      "toggle-group": { title: "Toggle Group", page: lazy(() => import("./pages/toggle-group.jsx")) },
      alert: { title: "Alert", page: lazy(() => import("./pages/alert.jsx")) },
    },
  },
  {
    label: "Communication",
    desc: "Chat bubbles, messages, and attachments.",
    entries: {
      bubble: { title: "Bubble", page: lazy(() => import("./pages/bubble.jsx")) },
      attachment: { title: "Attachment", page: lazy(() => import("./pages/attachment.jsx")) },
      message: { title: "Message", page: lazy(() => import("./pages/message.jsx")) },
      "message-scroller": { title: "Message Scroller", page: lazy(() => import("./pages/message-scroller.jsx")) },
    },
  },
  {
    label: "Platform",
    desc: "Primitives and platform features — view transitions, density, direction.",
    entries: {
      primitives: { title: "Primitives (lib/)", page: lazy(() => import("./pages/primitives.jsx")) },
      "mode-toggle": { title: "Mode Toggle", page: lazy(() => import("./pages/mode-toggle.jsx")) },
      "view-transitions": { title: "View Transitions", page: lazy(() => import("./pages/view-transitions.jsx")) },
      "container-queries": { title: "Container Queries", page: lazy(() => import("./pages/container-queries.jsx")) },
      direction: { title: "Direction", page: lazy(() => import("./pages/direction.jsx")) },
      density: { title: "Density", page: lazy(() => import("./pages/density.jsx")) },
    },
  },
]

export const registry = Object.fromEntries(
  categories.flatMap(({ entries }) => Object.entries(entries))
)
