// Mock inventory for the Acme Cloud showcase panels. Every value is fiction:
// role-based names, RFC 5737 documentation addresses, no real people.

export const SUPPORT_THREAD = [
  {
    id: "m1",
    author: "Account Owner",
    initials: "AO",
    side: "start",
    time: "09:12",
    body: "Load balancer in the Dallas region started returning 502 for about one request in twenty. Nothing changed on our side this morning.",
  },
  {
    id: "m2",
    author: "Support Engineer",
    initials: "SE",
    side: "end",
    time: "09:18",
    body: "Thanks for the report. I can see elevated backend timeouts on lb-dal-02 starting 08:54. Pulling the health-check history now.",
  },
  {
    id: "m3",
    author: "Account Owner",
    initials: "AO",
    side: "start",
    time: "09:24",
    body: "Attaching the access log slice and the graph we pulled from the dashboard.",
    attachments: ["access-log-0854.txt", "latency-dallas.png"],
  },
  {
    id: "m4",
    author: "Support Engineer",
    initials: "SE",
    side: "end",
    time: "09:41",
    body: "One member (203.0.113.24) was failing its health check but staying in rotation because the threshold was set to 10. I have lowered it to 3 and drained the member. Error rate is back to zero.",
  },
  {
    id: "m5",
    author: "Account Owner",
    initials: "AO",
    side: "start",
    time: "09:47",
    body: "Confirmed on our dashboards too. Can you leave the ticket open until the next deploy window so we can watch it?",
  },
]

export const TICKETS = [
  { id: "AC-4821", subject: "Load balancer returns intermittent 502", requester: "Account Owner", team: "Platform", status: "Open", priority: "High", updated: "6 min ago" },
  { id: "AC-4818", subject: "Volume snapshot stuck in creating", requester: "Storage Lead", team: "Storage", status: "Escalated", priority: "Urgent", updated: "24 min ago" },
  { id: "AC-4815", subject: "Increase floating IP quota for staging", requester: "Network Admin", team: "Network", status: "Pending", priority: "Normal", updated: "1 hr ago" },
  { id: "AC-4809", subject: "API key rotation guidance", requester: "Security Reviewer", team: "Identity", status: "Open", priority: "Normal", updated: "2 hr ago" },
  { id: "AC-4802", subject: "Object storage container listing is slow", requester: "Data Engineer", team: "Storage", status: "Pending", priority: "Low", updated: "5 hr ago" },
  { id: "AC-4794", subject: "Add second availability zone to the cluster", requester: "Platform Lead", team: "Compute", status: "Resolved", priority: "Normal", updated: "Yesterday" },
  { id: "AC-4788", subject: "Billing export missing the last cycle", requester: "Finance Contact", team: "Billing", status: "Resolved", priority: "Low", updated: "Yesterday" },
  { id: "AC-4781", subject: "Instance rescue mode fails on g1 flavors", requester: "ML Engineer", team: "Compute", status: "Escalated", priority: "High", updated: "2 days ago" },
  { id: "AC-4776", subject: "Enable audit log streaming", requester: "Security Reviewer", team: "Identity", status: "Open", priority: "Normal", updated: "2 days ago" },
  { id: "AC-4770", subject: "Region maintenance window confirmation", requester: "Account Owner", team: "Platform", status: "Resolved", priority: "Low", updated: "3 days ago" },
]

/** Ticket status to the tone StatusDot understands. */
export const TICKET_TONE = {
  Open: "info",
  Pending: "pending",
  Escalated: "error",
  Resolved: "success",
}

export const DRAFT_ATTACHMENTS = [
  { id: "a1", name: "health-check-config.yaml", size: "2.4 KB", kind: "YAML" },
  { id: "a2", name: "latency-dallas.png", size: "184 KB", kind: "PNG" },
]

/** Files the "Attach file" control cycles through, so the demo can add more. */
export const SPARE_ATTACHMENTS = [
  { id: "a3", name: "access-log-0854.txt", size: "61 KB", kind: "TXT" },
  { id: "a4", name: "lb-member-drain.json", size: "1.1 KB", kind: "JSON" },
  { id: "a5", name: "dashboard-export.csv", size: "12 KB", kind: "CSV" },
]

export const LANGUAGES = [
  { value: "en-GB", label: "English (United Kingdom)" },
  { value: "en-US", label: "English (United States)" },
  { value: "de-DE", label: "German" },
  { value: "ja-JP", label: "Japanese" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
]

export const DENSITIES = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
]

export const REGIONS = [
  { value: "dallas", label: "Dallas" },
  { value: "salt-lake-city", label: "Salt Lake City" },
  { value: "chicago", label: "Chicago" },
]

/*
 * Status widgets. `duration` is the seconds one 0 to 100% sweep takes, and the
 * spread is the point of the showcase: the slow rings and the fast ones share
 * a grid so the eye can compare them. `kind` picks ring or bar.
 */
export const STATUS_WIDGETS = [
  { id: "cpu", kind: "ring", label: "Compute utilisation", detail: "48 instances", tone: "success", duration: 3 },
  { id: "replication", kind: "ring", label: "Volume replication", detail: "dal to slc", tone: "info", duration: 9 },
  { id: "index", kind: "ring", label: "Object index rebuild", detail: "swift-prod", tone: "warning", duration: 20 },
  { id: "drain", kind: "ring", label: "Member drain", detail: "lb-dal-02", tone: "error", duration: 5 },
  { id: "rollout", kind: "bar", label: "Image rollout", detail: "base-2604 to 14 hosts", tone: "info", duration: 6 },
  { id: "backup", kind: "bar", label: "Nightly backup", detail: "12 volumes", tone: "success", duration: 14 },
  { id: "migrate", kind: "bar", label: "Live migration", detail: "ml-train-01", tone: "warning", duration: 4 },
  { id: "audit", kind: "bar", label: "Audit log export", detail: "last 30 days", tone: "info", duration: 11 },
]
