import "../../ui/typography/typography.css"

export default function TypographyPage() {
  return (
    <>
      <h2>Typography</h2>

      <section className="pg-section">
        <h3>Headings</h3>
        <div className="typography">
          <h1>This is an h1 heading</h1>
          <h2>This is an h2 heading</h2>
          <h3>This is an h3 heading</h3>
          <h4>This is an h4 heading</h4>
        </div>
      </section>

      <section className="pg-section">
        <h3>Paragraph</h3>
        <div className="typography">
          <p>
            The king, seeing how much happier his subjects were, realized the error of
            his ways and repealed the tax on laughter. From that day forward, the kingdom
            was known as the happiest place in the land.
          </p>
        </div>
      </section>

      <section className="pg-section">
        <h3>Blockquote</h3>
        <div className="typography">
          <blockquote>
            After all, everyone enjoys a good laugh, and laughter is the best medicine.
          </blockquote>
        </div>
      </section>

      <section className="pg-section">
        <h3>Table</h3>
        <div className="typography">
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
        </div>
      </section>

      <section className="pg-section">
        <h3>Lists</h3>
        <div className="typography">
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
        </div>
      </section>

      <section className="pg-section">
        <h3>Inline Code</h3>
        <div className="typography">
          <p>
            Use the <code>cn()</code> utility to merge class names.
          </p>
        </div>
      </section>

      <section className="pg-section">
        <h3>Semantic Styles</h3>
        <div className="typography">
          <p className="lead">
            A lead paragraph that introduces the content with larger, muted text.
          </p>
          <p className="large">Large text for emphasis.</p>
          <p className="small">Small text for fine print.</p>
          <p className="muted">Muted text for secondary information.</p>
        </div>
      </section>
    </>
  )
}
