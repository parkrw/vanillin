import { useRef, useState } from "react"
import { Button } from "../../../ui/button/button.jsx"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../ui/dialog/dialog.jsx"
import { Field, FieldDescription, FieldLabel } from "../../../ui/field/field.jsx"
import { Input } from "../../../ui/input/input.jsx"
import { Textarea } from "../../../ui/textarea/textarea.jsx"
import { ToggleGroup, ToggleGroupItem } from "../../../ui/toggle-group/toggle-group.jsx"
import { ACCESS_METHODS } from "../console-data.js"
import { Disclosure, InlineError } from "./form.jsx"
import { USERNAME_RE, accessIssue } from "./pricing.js"
import "../../../ui/button/button.css"
import "../../../ui/dialog/dialog.css"
import "../../../ui/field/field.css"
import "../../../ui/input/input.css"
import "../../../ui/textarea/textarea.css"
import "../../../ui/toggle/toggle.css"
import "../../../ui/toggle-group/toggle-group.css"

/* How you get into a machine: asked as each one is added, and again from
   its row menu. `request` is `{ vdc, vm, access }`, edited on a copy and
   saved on the machine; no `vm` adds one. Opened on an existing machine
   (the row menu, or the access issue's link), it shows a problem at once. */
export function AccessDialog({ request, onCancel, onConfirm }) {
  // The content stays mounted through the close animation, so it keeps
  // the last request after the parent clears it.
  const lastRef = useRef(null)
  if (request) lastRef.current = request
  const shown = request ?? lastRef.current
  return (
    <Dialog
      open={Boolean(request)}
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      {shown && (
        <DialogContent className="ck-access-dialog">
          <AccessForm key={shown.vm?.id ?? `new-${shown.vdc.id}`} request={shown} onConfirm={onConfirm} />
        </DialogContent>
      )}
    </Dialog>
  )
}

function AccessForm({ request, onConfirm }) {
  const { vdc, vm } = request
  const [access, setAccess] = useState(request.access)
  const [touched, setTouched] = useState(Boolean(vm))
  const problem = accessIssue(access)
  const error = touched ? problem : null
  const set = (changes) => setAccess((a) => ({ ...a, ...changes }))
  const confirm = () => {
    if (problem) {
      setTouched(true)
      return
    }
    onConfirm(access)
  }
  return (
    <>
      <DialogHeader>
        <DialogTitle>{vm ? `Access to ${vm.name}` : `Add a machine to ${vdc.name}`}</DialogTitle>
        <DialogDescription>An SSH key is the default; a username and password, or a startup script, on request. It applies to this machine alone; its row menu changes it later.</DialogDescription>
      </DialogHeader>
      <div className="ck-access-fields">
        <ToggleGroup type="single" variant="outline" value={access.method} onValueChange={(method) => method && set({ method })} className="ck-segments" aria-label="Access method">
          {ACCESS_METHODS.map((m) => (
            <ToggleGroupItem key={m.id} value={m.id}>{m.name}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        {access.method === "ssh" ? (
          <Field className="ck-order-field ck-order-field--wide">
            <FieldLabel htmlFor="ck-order-ssh">Public key</FieldLabel>
            <Textarea
              id="ck-order-ssh"
              className="ck-order-key"
              rows={3}
              spellCheck={false}
              placeholder="ssh-ed25519 AAAAC3… you@laptop"
              value={access.sshKey}
              aria-invalid={Boolean(error) || undefined}
              onChange={(e) => set({ sshKey: e.target.value })}
              onBlur={() => setTouched(true)}
            />
            <FieldDescription>{ACCESS_METHODS[0].description}</FieldDescription>
            <InlineError field="access">{error}</InlineError>
          </Field>
        ) : (
          <div className="ck-access-login">
            <div className="ck-order-two">
              <Field className="ck-order-field">
                <FieldLabel htmlFor="ck-order-username">Username</FieldLabel>
                <Input
                  id="ck-order-username"
                  autoComplete="off"
                  spellCheck={false}
                  value={access.username}
                  aria-invalid={Boolean(error && !USERNAME_RE.test(access.username)) || undefined}
                  onChange={(e) => set({ username: e.target.value })}
                  onBlur={() => setTouched(true)}
                />
              </Field>
              <Field className="ck-order-field">
                <FieldLabel htmlFor="ck-order-password">Password</FieldLabel>
                <Input
                  id="ck-order-password"
                  type="password"
                  autoComplete="new-password"
                  value={access.password}
                  aria-invalid={Boolean(error && USERNAME_RE.test(access.username)) || undefined}
                  onChange={(e) => set({ password: e.target.value })}
                  onBlur={() => setTouched(true)}
                />
              </Field>
            </div>
            <FieldDescription>{ACCESS_METHODS[1].description}</FieldDescription>
            <InlineError field="access">{error}</InlineError>
          </div>
        )}
        <Disclosure id="startup-script" label="Add a startup script" hint="cloud-init or a shell script, run once on first boot" defaultOpen={Boolean(access.script)}>
          <Field className="ck-order-field ck-order-field--wide">
            <FieldLabel htmlFor="ck-order-script">Startup script</FieldLabel>
            <Textarea
              id="ck-order-script"
              className="ck-order-script"
              rows={5}
              spellCheck={false}
              placeholder={"#!/bin/sh\napt-get update && apt-get install -y nginx"}
              value={access.script}
              onChange={(e) => set({ script: e.target.value })}
            />
            <FieldDescription>Runs as root the first time the machine boots; not billed.</FieldDescription>
          </Field>
        </Disclosure>
      </div>
      <DialogFooter>
        <DialogClose as={Button} variant="outline">
          Cancel
        </DialogClose>
        <Button className="ck-access-confirm" onClick={confirm}>
          {vm ? "Save" : "Add machine"}
        </Button>
      </DialogFooter>
    </>
  )
}
