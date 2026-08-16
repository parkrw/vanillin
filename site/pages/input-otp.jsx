import { useState } from "react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "../../ui/input-otp/input-otp.jsx"
import "../../ui/input-otp/input-otp.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function InputOTPPage() {
  const [code, setCode] = useState("")
  const [completed, setCompleted] = useState("none")

  return (
    <>
      <h2>Input OTP</h2>
      <p>One-time-password input rendered as individual slots over a single hidden <code>&lt;input&gt;</code>, so native autofill and IME keep working.</p>

      <InstallSnippet slug="input-otp" />

      <section className="pg-section">
        <h3>Default (6 slots)</h3>
        <ComponentPreview code={`import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp/input-otp"
import "./ui/input-otp/input-otp.css"

<InputOTP maxLength={6}>
  <InputOTPGroup>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <InputOTPSlot key={i} index={i} />
    ))}
  </InputOTPGroup>
</InputOTP>`}>
          <InputOTP maxLength={6} data-pg="otp-input">
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} data-pg={`otp-slot-${i}`} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Digits only, grouped with a separator, onComplete</h3>
        <ComponentPreview code={`<InputOTP
  maxLength={6}
  pattern={REGEXP_ONLY_DIGITS}
  value={code}
  onChange={setCode}
  onComplete={setCompleted}
>
  <InputOTPGroup>
    <InputOTPSlot index={0} />
    <InputOTPSlot index={1} />
    <InputOTPSlot index={2} />
  </InputOTPGroup>
  <InputOTPSeparator />
  <InputOTPGroup>
    <InputOTPSlot index={3} />
    <InputOTPSlot index={4} />
    <InputOTPSlot index={5} />
  </InputOTPGroup>
</InputOTP>`}>
          <InputOTP
            maxLength={6}
            pattern={REGEXP_ONLY_DIGITS}
            value={code}
            onChange={setCode}
            onComplete={setCompleted}
            data-pg="otp-digits-input"
          >
            <InputOTPGroup>
              {[0, 1, 2].map((i) => (
                <InputOTPSlot key={i} index={i} data-pg={`otp-digits-slot-${i}`} />
              ))}
            </InputOTPGroup>
            <InputOTPSeparator data-pg="otp-separator" />
            <InputOTPGroup>
              {[3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} data-pg={`otp-digits-slot-${i}`} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          <p>
            Value: <span data-pg="otp-digits-state">{code === "" ? "empty" : code}</span> · completed:{" "}
            <span data-pg="otp-complete-state">{completed}</span>
          </p>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Invalid</h3>
        <ComponentPreview code={`<InputOTP maxLength={4} defaultValue="12">
  <InputOTPGroup>
    {[0, 1, 2, 3].map((i) => (
      <InputOTPSlot key={i} index={i} aria-invalid="true" />
    ))}
  </InputOTPGroup>
</InputOTP>`}>
          <InputOTP maxLength={4} defaultValue="12" data-pg="otp-invalid-input">
            <InputOTPGroup>
              {[0, 1, 2, 3].map((i) => (
                <InputOTPSlot key={i} index={i} aria-invalid="true" data-pg={`otp-invalid-slot-${i}`} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <ComponentPreview code={`<InputOTP maxLength={4} defaultValue="12" disabled>
  <InputOTPGroup>
    {[0, 1, 2, 3].map((i) => (
      <InputOTPSlot key={i} index={i} />
    ))}
  </InputOTPGroup>
</InputOTP>`}>
          <InputOTP maxLength={4} defaultValue="12" disabled data-pg="otp-disabled-input">
            <InputOTPGroup>
              {[0, 1, 2, 3].map((i) => (
                <InputOTPSlot key={i} index={i} data-pg={`otp-disabled-slot-${i}`} />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </ComponentPreview>
      </section>

      <ApiReference title="InputOTP" props={[
        { name: "maxLength", type: "number", default: "6", description: "Number of slots" },
        { name: "value", type: "string", description: "Controlled value" },
        { name: "defaultValue", type: "string", default: '""', description: "Initial value (uncontrolled)" },
        { name: "onChange", type: "(value: string) => void", description: "Called on every character change" },
        { name: "onComplete", type: "(value: string) => void", description: "Called when all slots are filled" },
        { name: "pattern", type: "string", description: "Regex pattern; rejects the entire change if it fails (e.g. REGEXP_ONLY_DIGITS)" },
        { name: "disabled", type: "boolean", default: "false", description: "Disables the input" },
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />
    </>
  )
}
