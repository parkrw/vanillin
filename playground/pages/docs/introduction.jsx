export default function IntroductionPage() {
  return (
    <>
      <h2>Introduction</h2>

      <p>
        vanillin is shadcn/ui recreated with <strong>zero dependencies</strong>{" "}
        — vanilla React JSX and plain CSS. No Tailwind, no Radix, no Floating
        UI; the only thing your project needs is React.
      </p>

      <p>
        Like shadcn/ui, it is not a package you install. Components are code
        you copy into your project and own. Subcomponent names match the
        originals exactly, so upstream docs and examples map 1:1. Radix&rsquo;s{" "}
        <code>asChild</code> becomes an <code>as</code> prop, and stateful
        components take <code>value</code>/<code>defaultValue</code> plus an{" "}
        <code>onValueChange</code>-style callback, controlled or uncontrolled.
      </p>

      <p>
        Pick a component in the sidebar to see it live — every page renders the
        real thing.
      </p>
    </>
  )
}
