import { useEffect, useMemo, useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../../ui/carousel/carousel.jsx"
import { Autoplay } from "../../ui/carousel/plugins/autoplay.js"
import "../../ui/carousel/carousel.css"
import { Button } from "../../ui/button/button.jsx"
import "../../ui/button/button.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const card = (h = "12rem") => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  blockSize: h,
  borderRadius: "var(--radius-md)",
  backgroundColor: "var(--muted)",
  fontSize: "2rem",
  fontWeight: 600,
})

export default function CarouselPage() {
  return (
    <>
      <h2>Carousel</h2>
      <p>A scroll-snap carousel with prev/next buttons, keyboard and swipe navigation, looping, alignment, and an autoplay plugin.</p>

      <InstallSnippet slug="carousel" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "./ui/carousel/carousel"
import "./ui/carousel/carousel.css"

<Carousel>
  <CarouselContent>
    <CarouselItem>Slide 1</CarouselItem>
    <CarouselItem>Slide 2</CarouselItem>
    <CarouselItem>Slide 3</CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}>
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>See the live demos below.</p>
        </ComponentPreview>
      </section>

      {/* Basic — one item per view */}
      <section className="pg-section">
        <h3>Basic</h3>
        <ComponentPreview code={`<Carousel>
  <CarouselContent>
    {Array.from({ length: 5 }, (_, i) => (
      <CarouselItem key={i}>
        <div className="slide">{i + 1}</div>
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}>
          <div style={{ paddingInline: "4rem", maxInlineSize: "24rem" }}>
            <Carousel data-pg="c-basic">
              <CarouselContent>
                {Array.from({ length: 5 }, (_, i) => (
                  <CarouselItem key={i}>
                    <div style={card()}>{i + 1}</div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </ComponentPreview>
      </section>

      {/* Multiple items per view */}
      <section className="pg-section">
        <h3>Multiple per view (3)</h3>
        <ComponentPreview code={`<Carousel>
  <CarouselContent style={{ gap: "0.5rem" }}>
    {items.map((item, i) => (
      <CarouselItem
        key={i}
        style={{ flex: "0 0 calc(33.333% - 0.334rem)" }}
      >
        {item}
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}>
          <div style={{ paddingInline: "4rem", maxInlineSize: "32rem" }}>
            <Carousel data-pg="c-multi">
              <CarouselContent style={{ gap: "0.5rem" }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <CarouselItem
                    key={i}
                    style={{ flex: "0 0 calc(33.333% - 0.334rem)" }}
                  >
                    <div style={card("8rem")}>{i + 1}</div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </ComponentPreview>
      </section>

      {/* Vertical */}
      <section className="pg-section">
        <h3>Vertical</h3>
        <ComponentPreview code={`<Carousel orientation="vertical">
  <CarouselContent style={{ blockSize: "12rem" }}>
    {items.map((item, i) => (
      <CarouselItem key={i} style={{ flex: "0 0 100%" }}>
        {item}
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}>
          <div style={{ paddingBlock: "4rem", maxInlineSize: "24rem" }}>
            <Carousel orientation="vertical" data-pg="c-vertical">
              <CarouselContent style={{ blockSize: "12rem" }}>
                {Array.from({ length: 5 }, (_, i) => (
                  <CarouselItem key={i} style={{ flex: "0 0 100%" }}>
                    <div style={card("100%")}>{i + 1}</div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </ComponentPreview>
      </section>

      {/* Interactive content inside slides */}
      <section className="pg-section">
        <h3>Click target</h3>
        <ComponentPreview code={`<Carousel>
  <CarouselContent>
    <CarouselItem>
      <Button variant="outline" size="sm">Click me</Button>
    </CarouselItem>
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}>
          <div style={{ paddingInline: "4rem", maxInlineSize: "24rem" }}>
            <Carousel data-pg="c-click">
              <CarouselContent>
                {Array.from({ length: 3 }, (_, i) => (
                  <CarouselItem key={i}>
                    <div style={card()}>
                      <Button
                        variant="outline"
                        size="sm"
                        data-pg="c-click-btn"
                        data-clicks="0"
                        onClick={(e) => {
                          const n = Number(e.currentTarget.dataset.clicks) + 1
                          e.currentTarget.dataset.clicks = String(n)
                        }}
                      >
                        Click me
                      </Button>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </ComponentPreview>
      </section>

      {/* Alignment — opts.align: start | center | end */}
      <section className="pg-section">
        <h3>Alignment</h3>
        <p className="pg-prose">
          <code>opts.align</code> maps directly to <code>scroll-snap-align</code> on
          each slide. Values: <code>"start"</code> (default),{" "}
          <code>"center"</code>, <code>"end"</code>. Most useful with
          partial-width slides so the active item is visually centred.
        </p>
        <ComponentPreview code={`<Carousel opts={{ align: "center" }}>
  <CarouselContent style={{ gap: "0.5rem" }}>
    {items.map((item, i) => (
      <CarouselItem key={i} style={{ flex: "0 0 60%" }}>
        {item}
      </CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}>
          <div style={{ paddingInline: "4rem", maxInlineSize: "32rem" }}>
            <Carousel opts={{ align: "center" }} data-pg="c-align">
              <CarouselContent style={{ gap: "0.5rem" }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <CarouselItem
                    key={i}
                    style={{ flex: "0 0 60%" }}
                  >
                    <div style={card("8rem")}>{i + 1}</div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </ComponentPreview>
      </section>

      {/* Loop — opts.loop */}
      <section className="pg-section">
        <h3>Loop</h3>
        <p className="pg-prose">
          <code>opts.loop</code> wraps navigation at both ends. Internally,
          slides are cloned before and after the real set; when scroll settles on
          a clone the container jumps invisibly to the corresponding real slide.
          Clones are <code>aria-hidden</code> and <code>inert</code> so keyboard
          users never land on them. Both nav buttons stay enabled.
        </p>
        <ComponentPreview code={`<Carousel opts={{ loop: true }}>
  <CarouselContent>
    {items.map((item, i) => (
      <CarouselItem key={i}>{item}</CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}>
          <div style={{ paddingInline: "4rem", maxInlineSize: "24rem" }}>
            <Carousel opts={{ loop: true }} data-pg="c-loop">
              <CarouselContent>
                {Array.from({ length: 5 }, (_, i) => (
                  <CarouselItem key={i}>
                    <div style={card()}>{i + 1}</div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </ComponentPreview>
      </section>

      {/* Loop with many narrow items — tests clone optimisation */}
      <section className="pg-section">
        <h3>Loop (narrow items)</h3>
        <p className="pg-prose">
          Same loop behaviour but with narrower items. The carousel only
          clones enough slides to fill one viewport plus a safety margin
          on each side, so this 10-item carousel has fewer clones than a
          naive 2N approach.
        </p>
        <div style={{ paddingInline: "4rem", maxInlineSize: "32rem" }}>
          <Carousel opts={{ loop: true }} data-pg="c-loop-narrow">
            <CarouselContent style={{ gap: "0.5rem" }}>
              {Array.from({ length: 10 }, (_, i) => (
                <CarouselItem
                  key={i}
                  style={{ flex: "0 0 calc(25% - 0.375rem)" }}
                >
                  <div style={card("6rem")}>{i + 1}</div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </section>

      {/* Autoplay plugin */}
      <section className="pg-section">
        <h3>Autoplay</h3>
        <p className="pg-prose">
          The plugin contract is{" "}
          <code>{"{ name, init(api, opts), destroy() }"}</code>, called on
          mount/unmount. <code>Autoplay</code> is the first built-in plugin.
          It pauses on hover, on focus-within, and when the page is hidden.
          Under <code>prefers-reduced-motion: reduce</code> it never starts.
          The interval is a fixed literal (not a motion token).
        </p>
        <ComponentPreview code={`import { Autoplay } from "./ui/carousel/plugins/autoplay"

<Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 3000 })]}>
  <CarouselContent>
    {items.map((item, i) => (
      <CarouselItem key={i}>{item}</CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>`}>
          <AutoplayDemo />
        </ComponentPreview>
      </section>

      {/* API demo */}
      <section className="pg-section">
        <h3>API (slide counter)</h3>
        <ComponentPreview code={`const [api, setApi] = useState(null)
const [current, setCurrent] = useState(0)
const [count, setCount] = useState(0)

useEffect(() => {
  if (!api) return
  setCount(api.scrollSnapList().length)
  setCurrent(api.selectedScrollSnap() + 1)
  const onSelect = () => setCurrent(api.selectedScrollSnap() + 1)
  api.on("select", onSelect)
  return () => api.off("select", onSelect)
}, [api])

<Carousel setApi={setApi}>
  <CarouselContent>
    {items.map((item, i) => (
      <CarouselItem key={i}>{item}</CarouselItem>
    ))}
  </CarouselContent>
  <CarouselPrevious />
  <CarouselNext />
</Carousel>
<p>Slide {current} of {count}</p>`}>
          <ApiDemo />
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"', description: "Scroll axis" },
        { name: "opts.align", type: '"start" | "center" | "end"', default: '"start"', description: "Scroll-snap alignment on each slide" },
        { name: "opts.loop", type: "boolean", default: "false", description: "Wrap navigation at both ends via cloned slides" },
        { name: "plugins", type: "Plugin[]", description: "Array of plugin instances (e.g. Autoplay)" },
        { name: "setApi", type: "(api) => void", description: "Receives the imperative API for external control" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}

function AutoplayDemo() {
  const plugins = useMemo(() => [Autoplay({ delay: 3000 })], [])
  return (
    <div style={{ paddingInline: "4rem", maxInlineSize: "24rem" }}>
      <Carousel opts={{ loop: true }} plugins={plugins} data-pg="c-autoplay">
        <CarouselContent>
          {Array.from({ length: 5 }, (_, i) => (
            <CarouselItem key={i}>
              <div style={card()}>{i + 1}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  )
}

function ApiDemo() {
  const [api, setApi] = useState(null)
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) return
    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)
    const onSelect = () => setCurrent(api.selectedScrollSnap() + 1)
    api.on("select", onSelect)
    return () => api.off("select", onSelect)
  }, [api])

  return (
    <div style={{ paddingInline: "4rem", maxInlineSize: "24rem" }}>
      <Carousel setApi={setApi} data-pg="c-api">
        <CarouselContent>
          {Array.from({ length: 5 }, (_, i) => (
            <CarouselItem key={i}>
              <div style={card()}>{i + 1}</div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
      <p
        data-pg="c-api-counter"
        className="pg-desc"
        style={{
          textAlign: "center",
          marginBlockStart: "0.5rem",
        }}
      >
        Slide {current} of {count}
      </p>
    </div>
  )
}
