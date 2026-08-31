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
import { CopyField } from "../../../ui/copy-field/copy-field.jsx"
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../ui/table/table.jsx"
import { Textarea } from "../../../ui/textarea/textarea.jsx"
import { toast } from "../../../ui/toast/toast.jsx"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../../ui/tooltip/tooltip.jsx"
import { CONTACTS, DENSITIES, LANGUAGES, REGIONS } from "./panels-data.js"
import { RefreshIcon } from "./panels-icons.jsx"

import "../../../ui/avatar/avatar.css"
import "../../../ui/badge/badge.css"
import "../../../ui/button/button.css"
import "../../../ui/card/card.css"
import "../../../ui/copy-field/copy-field.css"
import "../../../ui/field/field.css"
import "../../../ui/input/input.css"
import "../../../ui/select/select.css"
import "../../../ui/separator/separator.css"
import "../../../ui/status-dot/status-dot.css"
import "../../../ui/switch/switch.css"
import "../../../ui/table/table.css"
import "../../../ui/textarea/textarea.css"
import "../../../ui/toast/toast.css"
import "../../../ui/tooltip/tooltip.css"
import "./panels.css"

// Obviously not a credential: fixed placeholder digits, never a real key shape.
const FAKE_KEY = "ak_demo_0000000000000000000000"

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

/* The two settings panels share a chrome: a title, a lede and one Save. */
function SettingsShell({ hook, title, lede, children }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="ackp-panel ackp-settings" data-pg={hook}>
        <header className="ackp-panel-head">
          <div className="ackp-panel-heading">
            <h4 className="ackp-panel-title">{title}</h4>
            <p className="ackp-panel-sub">{lede}</p>
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
        <div className="ackp-settings-grid">{children}</div>
      </div>
    </TooltipProvider>
  )
}

/** Account → Settings → Profile: what belongs to the person signed in. */
export function ProfilePanel() {
  return (
    <SettingsShell
      hook="panel-profile"
      title="Profile"
      lede="Your identity on this account, and how the console behaves for you"
    >
      <Card data-pg="settings-profile">
        <CardHeader>
          <CardTitle>Identity</CardTitle>
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
              <Textarea id="ackp-bio" rows={2} defaultValue="Acme Cloud Operations, Dallas" />
            </Field>
          </FieldGroup>
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
    </SettingsShell>
  )
}

/** Account → Settings → Organization: what applies to everyone on the account. */
export function OrganizationPanel() {
  const onCopyKey = () =>
    toast.success("API key copied", { description: "It is a placeholder, not a credential." })

  return (
    <SettingsShell
      hook="panel-organization"
      title="Organization"
      lede="Account-wide defaults, API access and the people Acme Cloud contacts"
    >
      <Card data-pg="settings-organization">
        <CardHeader>
          <CardTitle>Details</CardTitle>
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
          <StatusDot status="success" label={null} ring />
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
            <CopyField
              className="ackp-key-field"
              data-pg="settings-key-value"
              value={FAKE_KEY}
              secret
              copyLabel="Copy API key"
              copiedLabel="API key copied"
              onCopy={onCopyKey}
            />
            <div className="ackp-key-actions">
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

      <Card className="ackp-contacts-card" data-pg="settings-contacts">
        <CardHeader>
          <CardTitle>Contacts</CardTitle>
          <CardDescription>
            Who Acme Cloud writes to, and about what. Every account keeps at least one owner.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="ackp-table-wrap">
            <Table className="ackp-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Contact</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Notified about</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CONTACTS.map((contact) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="ackp-contact-cell">
                        <Avatar className="ackp-contact-avatar">
                          <AvatarFallback>{contact.initials}</AvatarFallback>
                        </Avatar>
                        <div className="ackp-profile-id">
                          <span className="ackp-profile-name">{contact.name}</span>
                          <span className="ackp-profile-mail">{contact.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{contact.role}</TableCell>
                    <TableCell>
                      <div className="ackp-contact-tags">
                        {contact.notify.map((topic) => (
                          <Badge key={topic} variant="secondary">{topic}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="ackp-cell-status">
                        <StatusDot
                          status={contact.status === "Verified" ? "success" : "pending"}
                          label={null}
                        />
                        {contact.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="ackp-contacts-foot">
          <span className="ackp-contacts-count">{CONTACTS.length} contacts</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              toast("Contacts are read only", {
                description: "This showcase does not add people to an account.",
              })
            }
          >
            Add contact
          </Button>
        </CardFooter>
      </Card>
    </SettingsShell>
  )
}
