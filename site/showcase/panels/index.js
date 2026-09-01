/*
 * Standalone showcase panels for the Acme Cloud console mock.
 *
 * Each export is a zero-prop component that brings its own CSS and data, so
 * it renders correctly on its own and can be dropped into any console slot.
 * None of them render a <Toaster/>: the host does that once, and two toasters
 * in one tree queue against each other.
 */
export { SupportPanel } from "./support-panel.jsx"
export { OrganizationPanel, ProfilePanel } from "./settings-panel.jsx"
export { StatusShowcase } from "./status-showcase.jsx"
