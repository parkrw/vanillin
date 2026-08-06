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
  return (
    <>
      <h2>Pagination</h2>
      <p>Page navigation with previous/next controls, numbered links, and ellipsis — built on semantic nav and list markup.</p>

      <InstallSnippet slug="pagination" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "./ui/pagination/pagination"
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
      </section>

      <section className="pg-section">
        <h3>First page (previous disabled)</h3>
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
      </section>

      <ApiReference props={[
        { name: "isActive", type: "boolean", default: "false", description: "On PaginationLink — marks the current page with aria-current and outline style" },
        { name: "aria-disabled", type: '"true"', description: "On PaginationPrevious/Next — visually and functionally disables the control" },
        { name: "href", type: "string", description: "On PaginationLink/Previous/Next — the page URL" },
        { name: "className", type: "string", description: "Additional CSS classes on any sub-component" },
      ]} />
    </>
  )
}
