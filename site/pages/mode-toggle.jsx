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

/**
 * Every demo drives the site's own scheme store, so the page doubles as a live
 * check on the sweep — and so the nav toggle and these stay in step. A private
 * `useState` per demo would fight whichever wrote `.dark` last.
 */
export default function ModeTogglePage() {
  const isDark = useSiteDark()
  const scheme = useColorScheme({ value: isDark, onChange: setSiteDark })

  return (
    <>
      <h2>Mode Toggle</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <p>
          An icon button. The sun contracts and its rays retract as the crescent
          slides in, while the new scheme is revealed by an ellipse rising out of
          the button — light through grey to dark, and the reverse on the way
          back.
        </p>
        <div className="pg-row">
          <ModeToggle isDark={isDark} onIsDarkChange={setSiteDark} />
        </div>
      </section>

      <section className="pg-section">
        <h3>Driven by a switch or a checkbox</h3>
        <p>
          <code>ModeToggle</code> renders one control on purpose. Any other
          control drives the same swap through <code>useColorScheme</code>, so
          copying <code>mode-toggle.jsx</code> never drags a Switch and a
          Checkbox along with it.
        </p>
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
        <pre>
          <code>{`const { isDark, toggle } = useColorScheme({
  value: theme === "dark",
  onChange: (dark) => setTheme(dark ? "dark" : "light"),
})

<Switch checked={isDark} onCheckedChange={() => toggle()} />`}</code>
        </pre>
      </section>

      <section className="pg-section">
        <h3>Applying the scheme is yours</h3>
        <p>
          The hook tracks a boolean and drives the transition. It never writes{" "}
          <code>.dark</code>, touches <code>localStorage</code>, or reads a
          cookie — an app on <code>next-themes</code> already does all three, and
          duplicating them here would fight it. Wire{" "}
          <code>onIsDarkChange</code> to whatever you already use.
        </p>
        <pre>
          <code>{`// next-themes
const { theme, setTheme } = useTheme()
<ModeToggle
  isDark={theme === "dark"}
  onIsDarkChange={(dark) => setTheme(dark ? "dark" : "light")}
/>`}</code>
        </pre>
      </section>

      <section className="pg-section">
        <h3>Without the sweep</h3>
        <p>
          <code>transition={"{false}"}</code> swaps instantly. Reduced-motion
          users already get this path — <code>withViewTransition</code> falls
          back to a plain update, so the scheme still changes.
        </p>
        <div className="pg-row">
          <ModeToggle isDark={isDark} onIsDarkChange={setSiteDark} transition={false} />
        </div>
      </section>
    </>
  )
}
