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

      {/* Basic — one item per view */}
      <section className="pg-section">
        <h3>Basic</h3>
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
      </section>

      {/* Multiple items per view */}
      <section className="pg-section">
        <h3>Multiple per view (3)</h3>
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
      </section>

      {/* Vertical */}
      <section className="pg-section">
        <h3>Vertical</h3>
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
      </section>

      {/* Interactive content inside slides */}
      <section className="pg-section">
        <h3>Click target</h3>
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
      </section>

      {/* Alignment */}
      <section className="pg-section">
        <h3>Alignment</h3>
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
      </section>

      {/* Loop */}
      <section className="pg-section">
        <h3>Loop</h3>
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
      </section>

      {/* Loop with narrow items */}
      <section className="pg-section">
        <h3>Loop (narrow items)</h3>
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

      {/* Autoplay */}
      <section className="pg-section">
        <h3>Autoplay</h3>
        <AutoplayDemo />
      </section>

      {/* API demo */}
      <section className="pg-section">
        <h3>API (slide counter)</h3>
        <ApiDemo />
      </section>

      <InstallSnippet slug="carousel" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "./ui/carousel/carousel"
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
          <p style={{ fontSize: "0.875rem", color: "var(--muted-foreground)" }}>See the live demos above.</p>
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
