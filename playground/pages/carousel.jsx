import { useEffect, useState } from "react"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "../../ui/carousel/carousel.jsx"
import "../../ui/carousel/carousel.css"
import "../../ui/button/button.css"

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

      {/* API demo — slide counter via setApi */}
      <section className="pg-section">
        <h3>API (slide counter)</h3>
        <ApiDemo />
      </section>
    </>
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
        style={{
          textAlign: "center",
          marginBlockStart: "0.5rem",
          fontSize: "0.875rem",
          color: "var(--muted-foreground)",
        }}
      >
        Slide {current} of {count}
      </p>
    </div>
  )
}
