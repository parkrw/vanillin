export default function IntroductionPage() {
  return (
    <>
      <h2>Introduction</h2>

      <p>
        vanillin (van) is <strong>zero dependencies</strong>{" "} React components
        with vanilla JS, JSX, and CSS. No Tailwind, no Radix, no Floating
        UI; only React is required.
      </p>

      <p>
        Copy-paste away, it is not a package you install. Components are code
        you copy into your project and own. Subcomponent names match the similar kit
        shadcn closely, upstream docs and examples mostly map 1:1. Radix&rsquo;s{" "}
        <code>asChild</code> becomes an <code>as</code> prop, and stateful
        components take <code>value</code>/<code>defaultValue</code> plus an{" "}
        <code>onValueChange</code>-style callback, controlled or uncontrolled.
      </p>

      <p>
        Pick a component in the sidebar to see it live; every component page renders the
        real thing.
      </p>
    </>
  )
}
