import { useState } from "react"
import { Avatar, AvatarFallback } from "../../../ui/avatar/avatar.jsx"
import { Badge } from "../../../ui/badge/badge.jsx"
import { Button } from "../../../ui/button/button.jsx"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../ui/card/card.jsx"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "../../../ui/field/field.jsx"
import { Input } from "../../../ui/input/input.jsx"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../ui/select/select.jsx"
import { Separator } from "../../../ui/separator/separator.jsx"
import { StatusDot } from "../../../ui/status-dot/status-dot.jsx"
import { Switch } from "../../../ui/switch/switch.jsx"
import { Textarea } from "../../../ui/textarea/textarea.jsx"
import { toast } from "../../../ui/toast/toast.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../ui/tooltip/tooltip.jsx"
import { DENSITIES, LANGUAGES, REGIONS } from "./panels-data.js"
import { CopyIcon, EyeIcon, EyeOffIcon, RefreshIcon } from "./panels-icons.jsx"

import "../../../ui/avatar/avatar.css"
import "../../../ui/badge/badge.css"
import "../../../ui/button/button.css"
import "../../../ui/card/card.css"
import "../../../ui/field/field.css"
import "../../../ui/input/input.css"
import "../../../ui/select/select.css"
import "../../../ui/separator/separator.css"
import "../../../ui/status-dot/status-dot.css"
import "../../../ui/switch/switch.css"
import "../../../ui/textarea/textarea.css"
import "../../../ui/toast/toast.css"
import "../../../ui/tooltip/tooltip.css"
import "./panels.css"

// Obviously not a credential: fixed placeholder digits, never a real key shape.
const FAKE_KEY = "ak_demo_0000000000000000000000"
const MASKED_KEY = "ak_demo_••••••••••••••••••••••"

function IconButton({ label, onClick, children, ...props }) {
  return (
    <Tooltip>
      <TooltipTrigger
        as={Button}
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={onClick}
        {...props}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

/** A labelled switch row. Nothing here persists; the toast says so. */
function PreferenceRow({ id, title, description, defaultChecked }) {
  return (
    <Field orientation="horizontal" className="ackp-pref-row">
      <div className="ackp-pref-text">
        <FieldLabel htmlFor={id}>{title}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </div>
      <Switch
        id={id}
        defaultChecked={defaultChecked}
        onCheckedChange={(checked) =>
          toast(`${title} ${checked ? "on" : "off"}`, {
            description: "Preferences are not saved in this showcase.",
          })
        }
      />
    </Field>
  )
}

export function SettingsPanel() {
  const [revealed, setRevealed] = useState(false)

  const copyKey = () => {
    navigator.clipboard?.writeText(FAKE_KEY).catch(() => {})
    toast.success("API key copied", { description: "It is a placeholder, not a credential." })
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="ackp-panel ackp-settings" data-pg="panel-settings">
        <header className="ackp-panel-head">
          <div className="ackp-panel-heading">
            <h4 className="ackp-panel-title">Settings</h4>
            <p className="ackp-panel-sub">Acme Cloud account and workspace preferences</p>
          </div>
          <div className="ackp-panel-tools">
            <Button
              size="sm"
              onClick={() =>
                toast.success("Settings saved", { description: "Nothing persists in this showcase." })
              }
            >
              Save changes
            </Button>
          </div>
        </header>

        <div className="ackp-settings-grid">
          <Card data-pg="settings-profile">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>How your name appears on tickets and audit entries.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="ackp-profile-row">
                <Avatar className="ackp-profile-avatar">
                  <AvatarFallback>OP</AvatarFallback>
                </Avatar>
                <div className="ackp-profile-id">
                  <span className="ackp-profile-name">Operations Team</span>
                  <span className="ackp-profile-mail">ops@acme.cloud</span>
                </div>
                <Badge variant="success">Verified</Badge>
              </div>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="ackp-name">Display name</FieldLabel>
                  <Input id="ackp-name" defaultValue="Operations Team" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ackp-email">Email</FieldLabel>
                  <Input id="ackp-email" type="email" defaultValue="ops@acme.cloud" />
                  <FieldDescription>Ticket notifications go to this address.</FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="ackp-bio">Signature</FieldLabel>
                  <Textarea
                    id="ackp-bio"
                    rows={2}
                    defaultValue="Acme Cloud Operations, Dallas"
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          <Card data-pg="settings-organization">
            <CardHeader>
              <CardTitle>Organization</CardTitle>
              <CardDescription>Applies to every project in this account.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="ackp-org">Organization name</FieldLabel>
                  <Input id="ackp-org" defaultValue="Acme Cloud" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ackp-domain">Primary domain</FieldLabel>
                  <Input id="ackp-domain" defaultValue="acme.cloud" />
                </Field>
                <Field>
                  <FieldLabel htmlFor="ackp-region">Default region</FieldLabel>
                  <Select defaultValue="dallas">
                    <SelectTrigger id="ackp-region">
                      <SelectValue placeholder="Pick a region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((region) => (
                        <SelectItem key={region.value} value={region.value}>
                          {region.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>New resources land here unless overridden.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="ackp-org-foot">
              <StatusDot status="success" label={null} />
              <span>All services operational</span>
            </CardFooter>
          </Card>

          <Card data-pg="settings-api">
            <CardHeader>
              <CardTitle>API access</CardTitle>
              <CardDescription>
                One key per environment. Rotating a key revokes the old one immediately.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="ackp-key-row" data-pg="settings-key-row">
                <div className="ackp-key-meta">
                  <span className="ackp-key-name">Production</span>
                  <span className="ackp-key-age">Created 14 days ago</span>
                </div>
                <code className="ackp-key-value" data-pg="settings-key-value">
                  {revealed ? FAKE_KEY : MASKED_KEY}
                </code>
                <div className="ackp-key-actions">
                  <IconButton
                    label={revealed ? "Hide API key" : "Reveal API key"}
                    data-pg="settings-key-reveal"
                    onClick={() => {
                      setRevealed((value) => !value)
                      toast(revealed ? "API key hidden" : "API key revealed", {
                        description: "Placeholder value, safe to show.",
                      })
                    }}
                  >
                    {revealed ? <EyeOffIcon /> : <EyeIcon />}
                  </IconButton>
                  <IconButton label="Copy API key" onClick={copyKey}>
                    <CopyIcon />
                  </IconButton>
                  <IconButton
                    label="Rotate API key"
                    onClick={() =>
                      toast("Rotation is disabled", {
                        description: "This showcase has no live credentials.",
                      })
                    }
                  >
                    <RefreshIcon />
                  </IconButton>
                </div>
              </div>
              <Separator />
              <div className="ackp-key-note">
                <StatusDot status="info" label={null} />
                <span>Staging and development keys are managed by the platform team.</span>
              </div>
            </CardContent>
          </Card>

          <Card data-pg="settings-preferences">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Local to this browser. Nothing is saved here.</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <PreferenceRow
                  id="ackp-notify-ticket"
                  title="Ticket updates"
                  description="Email me when a ticket I follow changes status."
                  defaultChecked
                />
                <PreferenceRow
                  id="ackp-notify-incident"
                  title="Incident alerts"
                  description="Page the on-call rotation for severity one events."
                  defaultChecked
                />
                <PreferenceRow
                  id="ackp-notify-digest"
                  title="Weekly digest"
                  description="A Monday summary of usage and spend."
                  defaultChecked={false}
                />
                <Separator />
                <Field>
                  <FieldLabel htmlFor="ackp-density">Interface density</FieldLabel>
                  <Select defaultValue="comfortable">
                    <SelectTrigger id="ackp-density">
                      <SelectValue placeholder="Pick a density" />
                    </SelectTrigger>
                    <SelectContent>
                      {DENSITIES.map((density) => (
                        <SelectItem key={density.value} value={density.value}>
                          {density.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="ackp-language">Language</FieldLabel>
                  <Select defaultValue="en-GB">
                    <SelectTrigger id="ackp-language">
                      <SelectValue placeholder="Pick a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldDescription>Dates and numbers follow the same locale.</FieldDescription>
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
