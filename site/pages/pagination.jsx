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

export default function PaginationPage() {
  return (
    <>
      <h2>Pagination</h2>

      <section className="pg-section">
        <h3>Default</h3>
        <div className="pg-row">
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
        </div>
      </section>

      <section className="pg-section">
        <h3>First page (previous disabled)</h3>
        <div className="pg-row">
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
        </div>
      </section>
    </>
  )
}
