// System page layout: description → demos → reference.
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../../ui/table/table.jsx"
import "../../ui/typography/typography.css"
import "../../ui/table/table.css"
import { ComponentPreview } from "../code-example.jsx"
import "../code-example.css"

export default function TypographyPage() {
  return (
    <>
      <h2>Typography</h2>
      <p>
        A CSS-only typeset container that gives rendered HTML consistent sizing and spacing from three rhythm variables. Wrap any block in <code>.typeset</code>; no component import needed.
      </p>

      <section className="pg-section">
        <h3>Typeset container</h3>
        <p className="pg-desc">
          Wrap rendered HTML or markdown in <code>.typeset</code> and every block element
          picks up consistent sizing and spacing from three rhythm variables:
          {" "}<code>--typeset-size</code>, <code>--typeset-leading</code>, <code>--typeset-flow</code>.
        </p>
        <ComponentPreview code={`import "./ui/typography/typography.css"

<div className="typeset">
  <h1>Heading one</h1>
  <p>Body text with consistent sizing and spacing.</p>
  <h2>Heading two</h2>
  <p>Every block picks up rhythm automatically.</p>
  <h3>Heading three</h3>
  <blockquote>Blockquote with border and muted color.</blockquote>
  <ul><li>List items</li></ul>
  <table>...</table>
  <p className="lead">Lead paragraph.</p>
  <p className="muted">Muted text.</p>
</div>`}>
          <div className="typeset" data-pg="typeset-base">
            <h1>Heading one</h1>
            <p>
              The king, seeing how much happier his subjects were, realized the error of
              his ways and repealed the tax on laughter. From that day forward, the kingdom
              was known as the happiest place in the land.
            </p>
            <h2>Heading two</h2>
            <p>
              After all, everyone enjoys a good laugh. The jesters rejoiced, the bakers
              baked celebratory cakes, and even the royal cats seemed to purr with approval.
            </p>
            <h3>Heading three</h3>
            <p>Use the <code>cn()</code> utility to merge class names conditionally.</p>
            <h4>Heading four</h4>
            <blockquote>
              After all, everyone enjoys a good laugh, and laughter is the best medicine.
            </blockquote>
            <ul>
              <li>First item in the unordered list</li>
              <li>Second item with more detail</li>
              <li>Third and final item</li>
            </ul>
            <ol>
              <li>Step one of the process</li>
              <li>Step two continues here</li>
              <li>Step three wraps it up</li>
            </ol>
            <table>
              <thead>
                <tr>
                  <th>King</th>
                  <th>Status</th>
                  <th>Decree</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Harold</td>
                  <td>Active</td>
                  <td>Tax reform</td>
                </tr>
                <tr>
                  <td>William</td>
                  <td>Retired</td>
                  <td>Land grants</td>
                </tr>
                <tr>
                  <td>Eleanor</td>
                  <td>Active</td>
                  <td>Free laughter</td>
                </tr>
              </tbody>
            </table>
            <hr />
            <p className="lead">
              A lead paragraph that introduces the content with larger, muted text.
            </p>
            <p className="large">Large text for emphasis.</p>
            <p className="small">Small text for fine print.</p>
            <p className="muted">Muted text for secondary information.</p>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Docs preset</h3>
        <p className="pg-desc">
          <code>.typeset-docs</code> gives a roomier rhythm for documentation pages.
        </p>
        <ComponentPreview code={`<div className="typeset typeset-docs">
  <h3>Documentation heading</h3>
  <p>Wider leading and more generous block spacing.</p>
  <ul>
    <li>Wider line-height for long-form reading</li>
    <li>More vertical space between blocks</li>
  </ul>
</div>`}>
          <div className="typeset typeset-docs" data-pg="typeset-docs">
            <h3>Documentation heading</h3>
            <p>
              This paragraph uses the docs preset with wider leading and more generous
              block spacing. The rhythm variables override the base values without
              touching any element rules.
            </p>
            <ul>
              <li>Wider line-height for long-form reading</li>
              <li>More vertical space between blocks</li>
            </ul>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Chat preset</h3>
        <p className="pg-desc">
          <code>.typeset-chat</code> gives a compact rhythm for messaging and streaming content.
        </p>
        <ComponentPreview code={`<div className="typeset typeset-chat">
  <p>Chat messages use tighter spacing and a smaller base size.</p>
  <h4>A heading inside chat</h4>
  <p>Inline <code>code</code> scales with the surrounding text.</p>
</div>`}>
          <div className="typeset typeset-chat" data-pg="typeset-chat">
            <p>
              Chat messages use tighter spacing and a smaller base size. Headings and
              lists scale proportionally because every size derives from the same three
              variables.
            </p>
            <h4>A heading inside chat</h4>
            <p>Inline <code>code</code> scales with the surrounding text.</p>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Custom rhythm</h3>
        <p className="pg-desc">
          Override the rhythm variables on any element to create a one-off scope.
        </p>
        <ComponentPreview code={`<div className="typeset"
  style={{ "--typeset-size": "1.125rem", "--typeset-leading": "2", "--typeset-flow": "2rem" }}>
  <h3>Large, airy prose</h3>
  <p>Every heading, list and table responds because all sizes
     derive from three rhythm variables.</p>
</div>`}>
          <div
            className="typeset"
            style={{ "--typeset-size": "1.125rem", "--typeset-leading": "2", "--typeset-flow": "2rem" }}
            data-pg="typeset-custom"
          >
            <h3>Large, airy prose</h3>
            <p>
              This scope sets a larger base size, double line-height and generous flow.
              Every heading, list and table inside it responds because all sizes derive
              from the three rhythm variables, with no per-element overrides needed.
            </p>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Opt-out</h3>
        <p className="pg-desc">
          <code>.not-typeset</code> or <code>data-not-typeset</code> resets an element
          and its children back to inherited styles.
        </p>
        <ComponentPreview code={`<div className="typeset">
  <p>Inside .typeset.</p>
  <div className="not-typeset">
    <p>Opted out: inherits from the page, not the typeset container.</p>
  </div>
  <p>Back inside .typeset.</p>
</div>`}>
          <div className="typeset" data-pg="typeset-optout">
            <p>This paragraph is inside <code>.typeset</code>.</p>
            <div className="not-typeset" data-pg="not-typeset">
              <p>This paragraph opted out: it inherits from the page, not the typeset container.</p>
            </div>
            <p>Back inside <code>.typeset</code>.</p>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Typography component</h3>
        <p className="pg-desc">
          The <code>.typography</code> component uses the same rhythm variables as{" "}
          <code>.typeset</code>. Changing <code>--typeset-size</code> at the root
          scales both uniformly.
        </p>
        <ComponentPreview code={`<div className="typography">
  <h1>Heading one</h1>
  <h2>Heading two</h2>
  <h3>Heading three</h3>
  <h4>Heading four</h4>
  <p>Semantic helpers: .lead, .large, .small, .muted.</p>
</div>`}>
          <div className="typography">
            <h1>Heading one</h1>
            <h2>Heading two</h2>
            <h3>Heading three</h3>
            <h4>Heading four</h4>
            <p>
              The typography component includes semantic helpers:{" "}
              <code>.lead</code>, <code>.large</code>, <code>.small</code>, <code>.muted</code>.
            </p>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Reference</h3>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Description</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell><code>--typeset-size</code></TableCell>
              <TableCell><code>1rem</code></TableCell>
              <TableCell>Base font size. Docs: <code>1.0625rem</code>. Chat: <code>0.9375rem</code>.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>--typeset-leading</code></TableCell>
              <TableCell><code>1.75</code></TableCell>
              <TableCell>Line-height ratio. Docs: <code>1.8</code>. Chat: <code>1.5</code>.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>--typeset-flow</code></TableCell>
              <TableCell><code>1.5rem</code></TableCell>
              <TableCell>Vertical spacing between blocks. Docs: <code>1.75rem</code>. Chat: <code>1rem</code>.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>--typeset-font-body</code></TableCell>
              <TableCell><code>var(--font-sans)</code></TableCell>
              <TableCell>Body font family for typeset containers.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>--typeset-font-heading</code></TableCell>
              <TableCell><code>var(--font-sans)</code></TableCell>
              <TableCell>Heading font family.</TableCell>
            </TableRow>
            <TableRow>
              <TableCell><code>--typeset-font-mono</code></TableCell>
              <TableCell><code>var(--font-mono)</code></TableCell>
              <TableCell>Monospace family for <code>code</code> and <code>pre</code> blocks.</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </>
  )
}
