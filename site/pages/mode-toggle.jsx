import { ModeToggle } from "../../ui/mode-toggle/mode-toggle.jsx"
import { useColorScheme } from "../../lib/use-color-scheme.js"
import { setSiteDark, useSiteDark } from "../color-scheme.js"
import { Switch } from "../../ui/switch/switch.jsx"
import { Checkbox } from "../../ui/checkbox/checkbox.jsx"
import { Label } from "../../ui/label/label.jsx"
import "../../ui/mode-toggle/mode-toggle.css"
import "../../ui/switch/switch.css"
import "../../ui/checkbox/checkbox.css"
import "../../ui/label/label.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function ModeTogglePage() {
  const isDark = useSiteDark()
  const scheme = useColorScheme({ value: isDark, onChange: setSiteDark })

  return (
    <>
      <h2>Mode Toggle</h2>
      <p>An icon button that swaps the colour scheme. A pendant lamp swings on its cord as if the chain had been pulled, and the light under it goes out. The scheme swaps instantly, and the feedback is inside the button, where its size is fixed and it looks the same on every display.</p>

      <InstallSnippet slug="mode-toggle" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<ModeToggle isDark={isDark} onIsDarkChange={setIsDark} />`}>
          <div className="pg-row">
            <ModeToggle isDark={isDark} onIsDarkChange={setSiteDark} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { ModeToggle } from "./ui/mode-toggle/mode-toggle"
import "./ui/mode-toggle/mode-toggle.css"

<ModeToggle isDark={isDark} onIsDarkChange={setIsDark} />`}>
          <div className="pg-row">
            <ModeToggle isDark={isDark} onIsDarkChange={setSiteDark} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Driven by a switch or a checkbox</h3>
        <p>
          <code>ModeToggle</code> renders one control on purpose. Any other
          control drives the same swap through <code>useColorScheme</code>, so
          copying <code>mode-toggle.jsx</code> never drags a Switch and a
          Checkbox along with it.
        </p>
        <ComponentPreview code={`const { isDark, toggle } = useColorScheme({
  value: theme === "dark",
  onChange: (dark) => setTheme(dark ? "dark" : "light"),
})

<Label htmlFor="mt-switch">Dark mode</Label>
<Switch id="mt-switch" checked={isDark} onCheckedChange={() => toggle()} />

<Checkbox id="mt-checkbox" checked={isDark} onCheckedChange={() => toggle()} />
<Label htmlFor="mt-checkbox">Dark mode</Label>`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="pg-row">
              <Label htmlFor="mt-switch">Dark mode</Label>
              <Switch
                id="mt-switch"
                checked={scheme.isDark}
                onCheckedChange={() => scheme.toggle()}
              />
            </div>
            <div className="pg-row">
              <Checkbox
                id="mt-checkbox"
                checked={scheme.isDark}
                onCheckedChange={() => scheme.toggle()}
              />
              <Label htmlFor="mt-checkbox">Dark mode</Label>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Applying the scheme is yours</h3>
        <p>
          The hook tracks a boolean and nothing else. It never writes{" "}
          <code>.dark</code>, touches <code>localStorage</code>, or reads a
          cookie. An app on <code>next-themes</code> already does all three, and
          duplicating them here would fight it. Wire{" "}
          <code>onIsDarkChange</code> to whatever you already use.
        </p>
        <ComponentPreview code={`// next-themes
const { theme, setTheme } = useTheme()
<ModeToggle
  isDark={theme === "dark"}
  onIsDarkChange={(dark) => setTheme(dark ? "dark" : "light")}
/>`}>
          <div className="pg-row">
            <ModeToggle isDark={isDark} onIsDarkChange={setSiteDark} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Reduced motion</h3>
        <p>
          The swing is CSS keyframes, so it tracks <code>--motion-scale</code>{" "}
          and switches off under{" "}
          <code>prefers-reduced-motion: reduce</code> without a branch in the
          component. The scheme still changes; only the swing and the press
          scale go.
        </p>
      </section>

      <ApiReference props={[
        { name: "isDark", type: "boolean", description: "Controlled dark-mode state" },
        { name: "defaultIsDark", type: "boolean", default: "false", description: "Initial state (uncontrolled)" },
        { name: "onIsDarkChange", type: "(isDark: boolean) => void", description: "Called when the scheme changes" },
        { name: "children", type: "ReactNode", default: "<ModeToggleIcon />", description: "Custom icon to replace the default lamp glyph" },
        { name: "labels", type: "{ toDark: string, toLight: string }", default: '{ toDark: "Switch to dark mode", toLight: "Switch to light mode" }', description: "Accessible labels for each direction" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
