import { useState } from "react"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
  REGEXP_ONLY_DIGITS,
} from "../../ui/input-otp/input-otp.jsx"
import "../../ui/input-otp/input-otp.css"

export default function InputOTPPage() {
  const [code, setCode] = useState("")
  const [completed, setCompleted] = useState("none")

  return (
    <>
      <h2>Input OTP</h2>

      <section className="pg-section">
        <h3>Default (6 slots)</h3>
        <InputOTP maxLength={6} data-pg="otp-input">
          <InputOTPGroup>
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} data-pg={`otp-slot-${i}`} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </section>

      <section className="pg-section">
        <h3>Digits only, grouped with a separator, onComplete</h3>
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
          Value: <span data-pg="otp-digits-state">{code === "" ? "empty" : code}</span> — completed:{" "}
          <span data-pg="otp-complete-state">{completed}</span>
        </p>
      </section>

      <section className="pg-section">
        <h3>Invalid</h3>
        <InputOTP maxLength={4} defaultValue="12" data-pg="otp-invalid-input">
          <InputOTPGroup>
            {[0, 1, 2, 3].map((i) => (
              <InputOTPSlot key={i} index={i} aria-invalid="true" data-pg={`otp-invalid-slot-${i}`} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </section>

      <section className="pg-section">
        <h3>Disabled</h3>
        <InputOTP maxLength={4} defaultValue="12" disabled data-pg="otp-disabled-input">
          <InputOTPGroup>
            {[0, 1, 2, 3].map((i) => (
              <InputOTPSlot key={i} index={i} data-pg={`otp-disabled-slot-${i}`} />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </section>
    </>
  )
}
