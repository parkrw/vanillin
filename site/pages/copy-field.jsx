import { useState } from "react"
import { CopyField } from "../../ui/copy-field/copy-field.jsx"
import "../../ui/copy-field/copy-field.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

const ARN = "arn:aws:iam::123456789012:role/console-readonly"
const CONNECTION = "postgres://svc_reporting:s3cr3t@db-prod-eu-west-1.internal:5432/analytics"
const NARROW = { inlineSize: "12rem" }

export default function CopyFieldPage() {
  const [copies, setCopies] = useState([])

  return (
    <>
      <h2>Copy Field</h2>

      <p>
        A read-only identifier with a one-click copy — resource IDs, ARNs,
        connection strings. The full <code>value</code> always reaches the
        clipboard, whatever the field paints.
      </p>

      <InstallSnippet slug="copy-field" />

      <section className="pg-section">
        <h3>Default</h3>
        <ComponentPreview code={`<CopyField value="arn:aws:iam::123456789012:role/console-readonly" />`}>
          <div className="pg-row" data-pg="cf-default">
            <CopyField value={ARN} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview defaultTab="code" code={`import { CopyField } from "./ui/copy-field/copy-field"
import "./ui/copy-field/copy-field.css"

<CopyField value={roleArn} />
<CopyField value={connectionString} label="Connection string" secret />
<CopyField value={clusterId} truncate="end" onCopy={(v) => track(v)} />`}>
          <div className="pg-row">
            <CopyField value={ARN} />
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Truncation</h3>
        <ComponentPreview code={`<CopyField value={arn} />                  // truncate="middle" (default)
<CopyField value={arn} truncate="end" />
<CopyField value={arn} truncate={false} />`}>
          <div>
            <p className="pg-prose">
              Both fields below are 12rem wide and hold the same ARN.{" "}
              <code>middle</code> keeps the last eight characters, so two roles
              sharing a prefix stay apart; <code>end</code> ellipsises at the far
              end and hides exactly the part that differs. <code>false</code>{" "}
              wraps instead.
            </p>
            <div className="pg-row">
              <div style={NARROW} data-pg="cf-middle">
                <CopyField value={ARN} label="middle" />
              </div>
              <div style={NARROW} data-pg="cf-end">
                <CopyField value={ARN} label="end" truncate="end" />
              </div>
              <div style={NARROW} data-pg="cf-wrap">
                <CopyField value={ARN} label="false" truncate={false} />
              </div>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Secret</h3>
        <ComponentPreview code={`<CopyField value={connectionString} label="Connection string" secret />`}>
          <div>
            <p className="pg-prose">
              <code>secret</code> paints twelve dots and adds a reveal toggle.
              Copying still copies the real value, so a credential can be handed
              on without ever being shown.
            </p>
            <div className="pg-row" data-pg="cf-secret">
              <CopyField value={CONNECTION} label="Connection string" secret />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With label</h3>
        <ComponentPreview code={`<CopyField value={arn} label="Role ARN" copyLabel="Copy" copiedLabel="Copied" />`}>
          <div>
            <p className="pg-prose">
              The label is visible above the value and joins the button's
              accessible name, so a stack of these does not read as a column of
              identical “Copy” buttons.
            </p>
            <div className="pg-row" data-pg="cf-label">
              <CopyField value={ARN} label="Role ARN" />
            </div>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Callback</h3>
        <ComponentPreview code={`<CopyField
  value={clusterId}
  copyLabel="Copy cluster ID"
  copiedLabel="Cluster ID copied"
  onCopy={(v) => track(v)}
/>`}>
          <div>
            <p className="pg-prose">
              <code>onCopy</code> runs after a successful write and receives the
              full value. <code>copyLabel</code> and <code>copiedLabel</code>{" "}
              replace the button's accessible name and the announcement.
            </p>
            <div className="pg-row" data-pg="cf-callback">
              <CopyField
                value="cluster-7f3a91"
                copyLabel="Copy cluster ID"
                copiedLabel="Cluster ID copied"
                onCopy={(v) => setCopies((c) => [...c, v])}
              />
              <span className="pg-prose" data-pg="cf-callback-count">
                {copies.length} copied
              </span>
            </div>
          </div>
        </ComponentPreview>
      </section>

      <ApiReference props={[
        { name: "value", type: "string", description: "The string copied. Always copied in full, even when masked or truncated" },
        { name: "label", type: "string", description: "Visible label; also joins the buttons' accessible names" },
        { name: "truncate", type: '"middle" | "end" | false', default: '"middle"', description: "middle keeps the last 8 characters and ellipsises the head; end ellipsises the end; false wraps" },
        { name: "secret", type: "boolean", default: "false", description: "Paint twelve dots and add a reveal toggle; copying still copies value" },
        { name: "copyLabel", type: "string", default: '"Copy"', description: "The copy button's accessible name before a copy" },
        { name: "copiedLabel", type: "string", default: '"Copied"', description: "Its name after a copy, and the text announced politely" },
        { name: "onCopy", type: "(value: string) => void", description: "Called with the full value after a successful write" },
        { name: "as", type: "ElementType", default: '"div"', description: "Render as a different element" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
