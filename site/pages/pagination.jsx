import { useState } from "react"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../../ui/pagination/pagination.jsx"
import "../../ui/button/button.css"
import "../../ui/pagination/pagination.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function PaginationPage() {
  const [page, setPage] = useState(3)
  const totalPages = 5

  return (
    <>
      <h2>Pagination</h2>
      <p>Page navigation with previous and next controls, numbered links, and an ellipsis, built on semantic <code>nav</code> and list markup.</p>

      <InstallSnippet slug="pagination" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "./ui/pagination/pagination"
import "./ui/pagination/pagination.css"

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">3</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`}>
          <Pagination aria-label="Usage pagination">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#pagination" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination" isActive>2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#pagination" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </ComponentPreview>
        <p className="pg-desc">
          <code>Pagination</code> renders a labelled <code>nav</code> and <code>PaginationContent</code> a <code>ul</code>, so a screen reader announces the control as navigation with a list of pages.
        </p>
      </section>

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<Pagination>
  <PaginationContent>
    <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
    <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
    <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
    <PaginationItem><PaginationEllipsis /></PaginationItem>
    <PaginationItem><PaginationNext href="#" /></PaginationItem>
  </PaginationContent>
</Pagination>`}>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#pagination" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination" isActive>2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#pagination" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </ComponentPreview>
        <p className="pg-desc">
          The active link carries <code>aria-current="page"</code> and switches from ghost to outline. The ellipsis is <code>aria-hidden</code> with screen-reader text, so it never reads as a page you can go to.
        </p>
      </section>

      <section className="pg-section">
        <h3>First page</h3>
        <ComponentPreview code={`<Pagination aria-label="First page pagination">
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious aria-disabled="true" tabIndex={-1} />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>`}>
          <Pagination aria-label="First page pagination">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious aria-disabled="true" tabIndex={-1} />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination" isActive>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#pagination" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </ComponentPreview>
        <p className="pg-desc">
          Dropping <code>href</code> and setting <code>aria-disabled</code> plus <code>tabIndex={-1}</code> disables the control without removing it, so the row keeps its width as you page through.
        </p>
      </section>

      <section className="pg-section">
        <h3>Last page</h3>
        <ComponentPreview code={`<PaginationItem>
  <PaginationNext aria-disabled="true" tabIndex={-1} />
</PaginationItem>`}>
          <Pagination aria-label="Last page pagination">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#pagination" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">9</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination" isActive>10</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext aria-disabled="true" tabIndex={-1} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </ComponentPreview>
        <p className="pg-desc">
          Same treatment at the other end. Nothing in the component tracks which page you are on, so both edges are yours to render.
        </p>
      </section>

      <section className="pg-section">
        <h3>Windowed with two ellipses</h3>
        <ComponentPreview code={`<PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
<PaginationItem><PaginationEllipsis /></PaginationItem>
<PaginationItem><PaginationLink href="#">24</PaginationLink></PaginationItem>
<PaginationItem><PaginationLink href="#" isActive>25</PaginationLink></PaginationItem>
<PaginationItem><PaginationLink href="#">26</PaginationLink></PaginationItem>
<PaginationItem><PaginationEllipsis /></PaginationItem>
<PaginationItem><PaginationLink href="#">50</PaginationLink></PaginationItem>`}>
          <Pagination aria-label="Windowed pagination">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#pagination" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">24</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination" isActive>25</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">26</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">50</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#pagination" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </ComponentPreview>
        <p className="pg-desc">
          Keep the first and last page always visible and window the rest. The row then stays a fixed width no matter how deep into 50 pages the reader is.
        </p>
      </section>

      <section className="pg-section">
        <h3>Controlled with buttons</h3>
        <ComponentPreview code={`const [page, setPage] = useState(3)

<PaginationLink
  as="button"
  isActive={page === n}
  onClick={() => setPage(n)}
>
  {n}
</PaginationLink>`}>
          <div>
            <Pagination aria-label="Controlled pagination">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    as="button"
                    aria-disabled={page === 1 || undefined}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                  />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                  <PaginationItem key={number}>
                    <PaginationLink
                      as="button"
                      isActive={page === number}
                      onClick={() => setPage(number)}
                    >
                      {number}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    as="button"
                    aria-disabled={page === totalPages || undefined}
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <p className="pg-desc" data-pg="pagination-readout">
              Showing page {page} of {totalPages}.
            </p>
          </div>
        </ComponentPreview>
        <p className="pg-desc">
          Pass <code>as="button"</code> when the page change happens in the client and there is no URL to link to. The classes and <code>aria-current</code> wiring are identical.
        </p>
      </section>

      <section className="pg-section">
        <h3>Router links</h3>
        <ComponentPreview code={`{/* Any component works: pass it through \`as\`. */}
<PaginationLink as={Link} to="/posts?page=2">
  2
</PaginationLink>`}>
          <Pagination aria-label="Router pagination">
            <PaginationContent>
              <PaginationItem>
                <PaginationLink href="#pagination" isActive>1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#pagination">3</PaginationLink>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </ComponentPreview>
        <p className="pg-desc">
          <code>as</code> is on <code>PaginationLink</code>, so a router link keeps its own navigation behaviour and picks up the pagination styling.
        </p>
      </section>

      <ApiReference props={[
        { name: "isActive", type: "boolean", default: "false", description: "On PaginationLink, marks the current page with aria-current and outline style" },
        { name: "size", type: '"default" | "sm" | "lg" | "icon"', default: '"icon"', description: "On PaginationLink, button size; previous/next override it to default" },
        { name: "as", type: "ElementType", default: '"a"', description: "On PaginationLink, render a button or a router link instead of an anchor" },
        { name: "aria-disabled", type: '"true"', description: "On PaginationPrevious and PaginationNext, visually and functionally disables the control" },
        { name: "href", type: "string", description: "On PaginationLink, PaginationPrevious, and PaginationNext, the page URL" },
        { name: "className", type: "string", description: "Additional CSS classes on any sub-component" },
      ]} />
    </>
  )
}
