// Mock inventory for the Acme Cloud console showcase. Shapes mirror what a
// real cloud control plane would return; values are fiction.

export const PROJECTS = ["admin", "engineering", "data-science", "marketing"]
export const REGIONS = ["Dallas", "Salt Lake City", "Chicago"]

// The three sites a vDC can live in. `code` is the folded rail's label;
// descriptions are the order form's copy: what the site is and who needs it.
export const ORDER_SITES = [
  {
    id: "dfw", code: "DFW", name: "DFW Cage 6", city: "Plano, TX",
    description: "Our largest footprint, with the widest size catalogue and the shortest queue for new capacity; pick it unless latency or law says otherwise.",
  },
  {
    id: "chi", code: "CHI", name: "Chicago Cage 6", city: "Chicago, IL",
    description: "Central-US site on the Midwest carrier hotels, for teams whose users and offices sit between the coasts.",
  },
  {
    id: "slc", code: "SLC", name: "SLC Cage 6", city: "Salt Lake City, UT",
    description: "Mountain-West site in a low-risk seismic and weather zone, the usual choice for a disaster-recovery target.",
  },
]

// Provisioned vDCs. Pools are [used, size]: GHz, GB, GB.
export const VDCS = [
  { name: "prod-core", site: "dfw", project: "engineering", cpu: [92, 140], ram: [412, 512], storage: [2650, 4000], vms: 9, protection: "hot", drSite: "slc", status: "Active" },
  { name: "prod-edge", site: "dfw", project: "engineering", cpu: [38, 60], ram: [96, 192], storage: [640, 1500], vms: 4, protection: "warm", drSite: "chi", status: "Active" },
  { name: "staging", site: "dfw", project: "engineering", cpu: [11, 40], ram: [44, 128], storage: [380, 1000], vms: 2, protection: "none", status: "Active" },
  { name: "analytics", site: "chi", project: "data-science", cpu: [118, 160], ram: [700, 768], storage: [6200, 8000], vms: 3, protection: "none", status: "Active" },
  { name: "web-marketing", site: "chi", project: "marketing", cpu: [6, 20], ram: [14, 64], storage: [120, 500], vms: 1, protection: "none", status: "Active" },
  { name: "prod-core-dr", site: "slc", project: "engineering", cpu: [0, 140], ram: [0, 512], storage: [3450, 5200], vms: 9, protection: "replica", drSite: "dfw", status: "Standby" },
  { name: "ml-platform", site: "slc", project: "data-science", cpu: [156, 180], ram: [590, 640], storage: [4100, 6000], vms: 2, protection: "none", status: "Active" },
]

// One secondary-rail entry per site, folding to its vDCs.
const SITE_ITEMS = ORDER_SITES.map((s) => ({
  id: `site-${s.id}`,
  name: s.name,
  short: s.code,
  site: s.id,
  collapsible: true,
  pages: VDCS.filter((v) => v.site === s.id).map((v) => v.name),
}))

export const ORDER_PAGE = "New virtual Data Center"

// Two levels of navigation plus tabs: category (primary rail row) → service
// (secondary rail row) → page (a tab in the main column). Overview sits above
// the categories, as the CloudKey console draws it; the category and service
// names follow the CloudKey Core prototype. A site folds to its vDCs and its
// vDCs are its links in the rail.
//
// No level repeats the one above it. A service never carries its category's
// name, and the tab bar is dropped wherever it would only echo the rail: a
// single-page service, or a site whose open fold already lists its vDCs.
export const OVERVIEW = {
  id: "overview", label: "Overview",
  items: [{ id: "overview", name: "Status", pages: ["Dashboard", "Capacity", "Health", "Recent Events"] }],
  quickLinks: [
    { label: "Virtual Machines", svc: "resources", page: "Virtual Machines" },
    { label: "Networks", svc: "networking", page: "Networks" },
    { label: "Volumes", svc: "storage", page: "Volumes" },
    { label: "Tickets", svc: "support", page: "Tickets" },
  ],
}

export const NAV_GROUPS = [
  {
    id: "vdcs", label: "Virtual Data Centers",
    items: [
      ...SITE_ITEMS,
      { id: "resources", name: "Compute", pages: ["Virtual Machines", "Virtual Machine Sizes", "Templates & Images"] },
      { id: "networking", name: "Networking", pages: ["Networks", "Public IPs"] },
      { id: "storage", name: "Storage", pages: ["Volumes", "Snapshots"] },
      { id: "quotas", name: "Quotas", pages: ["Quotas"] },
      { id: "order", name: "Order", pages: [ORDER_PAGE] },
    ],
  },
  {
    id: "operations", label: "Operations",
    items: [
      { id: "data-centers", name: "Data Centers", pages: ["Data Centers"] },
      { id: "metrics", name: "Metrics", pages: ["Utilization"] },
      { id: "events", name: "Events", pages: ["Event Log"] },
      { id: "service-health", name: "Service Health", pages: ["Services"] },
    ],
  },
  {
    id: "account", label: "Account",
    items: [
      { id: "billing", name: "Billing", pages: ["Invoices"] },
      { id: "security", name: "Security", pages: ["Access Keys"] },
      { id: "your-data", name: "Your Data", pages: ["Exports"] },
      { id: "settings", name: "Settings", pages: ["Profile", "Organization"] },
    ],
  },
  {
    id: "support-center", label: "Support Center",
    items: [
      { id: "support", name: "Tickets", pages: ["Tickets"] },
      { id: "documentation", name: "Documentation", pages: ["Knowledge base", "FAQ", "Docs"] },
    ],
  },
]

export const CATEGORIES = [OVERVIEW, ...NAV_GROUPS]

/** The category (Overview included) a service belongs to, or null. */
export function findCategory(svcId) {
  return CATEGORIES.find((c) => c.items.some((s) => s.id === svcId)) ?? null
}

/** A service with its category attached, or null. */
export function findService(svcId) {
  const category = findCategory(svcId)
  const svc = category?.items.find((s) => s.id === svcId)
  return svc ? { ...svc, category } : null
}

export const INSTANCES = [
  { name: "web-prod-01", status: "Active", az: "az-east-1a", size: "standard-4", ip: "10.1.0.45", project: "engineering", user: "ops", cpu: 42, mem: 61 },
  { name: "web-prod-02", status: "Active", az: "az-east-1a", size: "standard-4", ip: "10.1.0.46", project: "engineering", user: "ops", cpu: 38, mem: 57 },
  { name: "web-prod-03", status: "Active", az: "az-east-1a", size: "standard-4", ip: "10.1.0.47", project: "engineering", user: "ops", cpu: 51, mem: 63 },
  { name: "api-prod-01", status: "Active", az: "az-east-1a", size: "standard-8", ip: "10.1.0.60", project: "engineering", user: "ops", cpu: 66, mem: 72 },
  { name: "api-prod-02", status: "Active", az: "az-east-1b", size: "standard-8", ip: "10.1.0.61", project: "engineering", user: "ops", cpu: 58, mem: 69 },
  { name: "db-prod-01", status: "Active", az: "az-east-1b", size: "standard-16", ip: "10.1.0.70", project: "engineering", user: "ops", cpu: 74, mem: 81 },
  { name: "db-replica-01", status: "Active", az: "az-east-1b", size: "standard-16", ip: "10.1.0.71", project: "engineering", user: "ops", cpu: 31, mem: 77 },
  { name: "cache-prod-01", status: "Active", az: "az-east-1a", size: "standard-4", ip: "10.1.0.80", project: "engineering", user: "ops", cpu: 22, mem: 48 },
  { name: "web-staging-01", status: "Shutoff", az: "az-west-1a", size: "standard-2", ip: "10.3.0.22", project: "engineering", user: "dev", cpu: 0, mem: 0 },
  { name: "api-staging-01", status: "Shutoff", az: "az-west-1a", size: "standard-2", ip: "10.3.0.23", project: "engineering", user: "dev", cpu: 0, mem: 0 },
  { name: "ml-train-01", status: "Active", az: "az-apac-1a", size: "gpu-8", ip: "10.5.0.11", project: "data-science", user: "ml-team", cpu: 93, mem: 88 },
  { name: "ml-train-02", status: "Active", az: "az-apac-1a", size: "gpu-8", ip: "10.5.0.12", project: "data-science", user: "ml-team", cpu: 91, mem: 84 },
  { name: "ml-infer-01", status: "Error", az: "az-apac-1a", size: "standard-8", ip: "10.5.0.20", project: "data-science", user: "ml-team", cpu: 0, mem: 12 },
  { name: "cms-prod-01", status: "Active", az: "az-east-1a", size: "standard-2", ip: "10.1.0.90", project: "marketing", user: "web", cpu: 18, mem: 41 },
]

export const SIZES = [
  { name: "standard-1", vcpus: "1", ram: "1 GB", disk: "10 GB", pub: "Yes" },
  { name: "standard-2", vcpus: "2", ram: "4 GB", disk: "40 GB", pub: "Yes" },
  { name: "standard-4", vcpus: "4", ram: "8 GB", disk: "80 GB", pub: "Yes" },
  { name: "standard-8", vcpus: "8", ram: "16 GB", disk: "160 GB", pub: "Yes" },
  { name: "standard-16", vcpus: "16", ram: "32 GB", disk: "160 GB", pub: "No" },
  { name: "gpu-8", vcpus: "8 + 1 GPU", ram: "32 GB", disk: "160 GB", pub: "No" },
]

export const QUOTAS = [
  { resource: "Virtual machines", limit: 40, used: 14 },
  { resource: "vCPUs", limit: 80, used: 68 },
  { resource: "Memory (GB)", limit: 128, used: 92 },
  { resource: "Public IPs", limit: 20, used: 6 },
  { resource: "Volumes", limit: 30, used: 8 },
  { resource: "Volume storage (GB)", limit: 4000, used: 2550 },
  { resource: "Networks", limit: 20, used: 6 },
  { resource: "Firewall groups", limit: 20, used: 3 },
]

export const MACHINE_IMAGES = [
  { name: "Ubuntu 24.04 LTS", format: "raw", size: "2.4 GB", status: "Active", visibility: "Public" },
  { name: "Ubuntu 22.04 LTS", format: "raw", size: "2.1 GB", status: "Active", visibility: "Public" },
  { name: "Rocky Linux 9.3", format: "raw", size: "1.8 GB", status: "Active", visibility: "Public" },
  { name: "Debian 12", format: "raw", size: "1.6 GB", status: "Active", visibility: "Public" },
  { name: "Windows Server 2022", format: "vhd", size: "8.2 GB", status: "Active", visibility: "Private" },
  { name: "Fedora CoreOS 40", format: "raw", size: "780 MB", status: "Active", visibility: "Public" },
]

export const NETWORKS = [
  { name: "prod-web-net", subnet: "10.1.1.0/24", type: "Private", external: "No", status: "Active" },
  { name: "prod-app-net", subnet: "10.1.2.0/24", type: "Private", external: "No", status: "Active" },
  { name: "prod-db-net", subnet: "10.1.3.0/24", type: "Private", external: "No", status: "Active" },
  { name: "staging-net", subnet: "10.3.1.0/24", type: "Private", external: "No", status: "Active" },
  { name: "ml-training-net", subnet: "10.5.1.0/24", type: "Private", external: "No", status: "Active" },
  { name: "external-net", subnet: "203.0.113.0/24", type: "Public", external: "Yes", status: "Active" },
]

export const VOLUMES = [
  { name: "vol-root-42", size: "50 GB", status: "In-use", type: "standard-hdd", attached: "web-prod-01" },
  { name: "vol-root-78", size: "100 GB", status: "In-use", type: "fast-ssd", attached: "db-prod-01" },
  { name: "data-vol-01", size: "500 GB", status: "In-use", type: "fast-ssd", attached: "db-prod-01" },
  { name: "data-vol-02", size: "500 GB", status: "In-use", type: "fast-ssd", attached: "db-replica-01" },
  { name: "data-vol-07", size: "1000 GB", status: "In-use", type: "fast-ssd", attached: "ml-train-01" },
  { name: "backup-vol-01", size: "200 GB", status: "Available", type: "fast-ssd", attached: "" },
  { name: "scratch-01", size: "100 GB", status: "In-use", type: "standard-hdd", attached: "ml-train-02" },
]

// `progress` is where a running task stood when the page loaded; the taskbar
// advances it on the shared ticker.
export const TASKS = [
  { id: "t1", task: "Upload machine image", target: "ubuntu-24.04-acme", status: "Running", started: "18 min ago", duration: "", progress: 62 },
  { id: "t2", task: "Launch virtual machine", target: "api-prod-03", status: "Running", started: "22 min ago", duration: "", progress: 31 },
  { id: "t3", task: "Create snapshot", target: "snap-ml-checkpoint", status: "Running", started: "25 min ago", duration: "", progress: 86 },
  { id: "t4", task: "Start virtual machine", target: "web-prod-03", status: "Succeeded", started: "2 min ago", duration: "12s" },
  { id: "t5", task: "Attach volume", target: "data-vol-07", status: "Succeeded", started: "15 min ago", duration: "3s" },
  { id: "t6", task: "Extend volume", target: "scratch-01", status: "Failed", started: "41 min ago", duration: "1m 04s", error: "Volume is attached; detach it first" },
  { id: "t7", task: "Delete virtual machine", target: "test-throwaway-01", status: "Succeeded", started: "4 hrs ago", duration: "8s" },
]

export const UTILIZATION = [
  { label: "CPU", pct: 62, detail: "892 / 1,440 GHz", tone: "warning" },
  { label: "Memory", pct: 71, detail: "819 / 1,152 GB", tone: "warning" },
  { label: "Block storage", pct: 45, detail: "18.2 / 40 TB", tone: "success" },
  { label: "Object storage", pct: 32, detail: "6.4 / 20 TB", tone: "success" },
]

export const HEALTH = [
  { name: "Compute", value: "13 services up", tone: "success" },
  { name: "Networking", value: "8 agents active", tone: "success" },
  { name: "Block storage", value: "5 services up", tone: "success" },
  { name: "Machine images", value: "2 active", tone: "success" },
  { name: "Alarms", value: "2 alarms", tone: "error" },
]

export const EVENTS = [
  { text: "vm.power_on", target: "web-prod-03", time: "2 min ago", tone: "success" },
  { text: "volume.attach", target: "data-vol-07", time: "15 min ago", tone: "success" },
  { text: "image.upload", target: "ubuntu-24.04-acme", time: "1 hr ago", tone: "success" },
  { text: "project.created", target: "dev-team", time: "3 hrs ago", tone: "success" },
  { text: "vm.check.failed", target: "host-apac-02", time: "4 hrs ago", tone: "error" },
]

// Prepended to the feed one at a time while the dashboard is open, so it
// reads as a running system rather than a screenshot.
export const INCOMING_EVENTS = [
  { text: "snapshot.create", target: "web-prod-01-nightly", tone: "success" },
  { text: "autoscale.evaluate", target: "web-prod pool", tone: "info" },
  { text: "volume.extend", target: "scratch-01", tone: "success" },
  { text: "quota.warning", target: "vCPUs at 82%", tone: "warning" },
  { text: "vm.reboot", target: "cms-prod-01", tone: "info" },
  { text: "backup.complete", target: "backup-db-weekly", tone: "success" },
]

export const STATS = [
  {
    num: "47", label: "Virtual Machines", sub: "38 active", tone: "success",
    detail: [
      { label: "Active", value: "38", tone: "success" },
      { label: "Shutoff", value: "7" },
      { label: "Error", value: "2", tone: "error" },
    ],
  },
  {
    num: "3", label: "Regions", sub: "3 active", tone: "success",
    detail: [
      { label: "Dallas", value: "2 DCs", tone: "success" },
      { label: "Salt Lake City", value: "1 DC", tone: "success" },
      { label: "Chicago", value: "1 DC", tone: "success" },
    ],
  },
  {
    num: "10", label: "Hosts", sub: "2 maintenance", tone: "warning",
    detail: [
      { label: "dal-1", value: "4 hosts", tone: "success" },
      { label: "dal-2", value: "2 hosts", tone: "warning" },
      { label: "slc-1", value: "2 hosts", tone: "success" },
      { label: "chi-1", value: "2 hosts", tone: "success" },
    ],
  },
  {
    num: "18", label: "Services", sub: "all active", tone: "success",
    detail: [
      { label: "Compute", value: "13 up", tone: "success" },
      { label: "Block storage", value: "5 up", tone: "success" },
    ],
  },
  {
    num: "10", label: "Projects", sub: "10 enabled", tone: "success",
    detail: [
      { label: "engineering", value: "10 virtual machines" },
      { label: "data-science", value: "3 virtual machines" },
      { label: "marketing", value: "1 virtual machine" },
      { label: "7 more", value: "idle" },
    ],
  },
  {
    num: "6", label: "Public IPs", sub: "of 128 pool", tone: "success",
    detail: [
      { label: "In use", value: "6", tone: "success" },
      { label: "Available", value: "122" },
    ],
  },
]

export const DATA_CENTERS = [
  { name: "dal-1", region: "Dallas", hosts: "4", instances: "19", status: "Active" },
  { name: "dal-2", region: "Dallas", hosts: "2", instances: "6", status: "Maintenance" },
  { name: "slc-1", region: "Salt Lake City", hosts: "2", instances: "11", status: "Active" },
  { name: "chi-1", region: "Chicago", hosts: "2", instances: "11", status: "Active" },
]

export const SNAPSHOTS = [
  { name: "snap-db-prod-nightly", source: "data-vol-01", size: "500 GB", created: "6 hrs ago", status: "Available" },
  { name: "snap-ml-checkpoint", source: "data-vol-07", size: "1000 GB", created: "25 min ago", status: "Running" },
  { name: "snap-web-golden", source: "vol-root-42", size: "50 GB", created: "3 days ago", status: "Available" },
  { name: "snap-cache-pre-upgrade", source: "vol-root-78", size: "100 GB", created: "1 week ago", status: "Available" },
]

export const PUBLIC_IPS = [
  { address: "203.0.113.14", attached: "web-prod-01", network: "external-net", status: "In-use" },
  { address: "203.0.113.15", attached: "web-prod-02", network: "external-net", status: "In-use" },
  { address: "203.0.113.16", attached: "api-prod-01", network: "external-net", status: "In-use" },
  { address: "203.0.113.31", attached: "", network: "external-net", status: "Available" },
  { address: "203.0.113.32", attached: "", network: "external-net", status: "Available" },
]

export const UPLOADED_IMAGES = [
  { name: "ubuntu-24.04-acme.img", size: "2.4 GB", state: "done" },
  { name: "rocky-9.3-hardened.img", size: "1.8 GB", state: "done" },
  { name: "win2022-eval.vhd", size: "8.2 GB", state: "uploading" },
  { name: "coreos-40-edge.img", size: "780 MB", state: "processing" },
  { name: "legacy-appliance.img", size: "512 MB", state: "error" },
]

// ── Access keys (Security) ─────────────────────────────────────────────
// Fingerprints and key ids are fiction. The ck_demo_ prefix is deliberate:
// an sk_live_ prefix matches Stripe's pattern, so GitHub push protection
// rejects it and every consumer copying the kit inherits the same block.

export const SSH_KEYS = [
  { name: "ops-laptop", type: "ssh-ed25519", fingerprint: "SHA256:uJ3kQ9v8Xb1yTq6wLm2ZpR4sN7cH0dF5gA8eK1iB3oM", added: "14 Mar 2026", lastUsed: "2 hrs ago" },
  { name: "ci-runner", type: "ssh-ed25519", fingerprint: "SHA256:Q2wE4rT6yU8iO0pA1sD3fG5hJ7kL9zX2cV4bN6mQ8wE", added: "02 Jan 2026", lastUsed: "12 min ago" },
  { name: "bastion-2025", type: "ssh-rsa 4096", fingerprint: "SHA256:zX9cV7bN5mQ3wE1rT0yU2iO4pA6sD8fG1hJ3kL5zX7cV", added: "18 Aug 2025", lastUsed: "3 days ago" },
]

export const API_KEYS = [
  { name: "terraform", id: "ck_demo_ak_7Hq2mN9xR4tV1wY6zB3cD8fG", secret: "ck_demo_sk_Kp8Lm3Nq6Rs9Tv2Wx5Yz1Ab4Cd7Ef0Gh3Jk6Mn9Pq2", scopes: "compute, network, storage", created: "21 Feb 2026", lastUsed: "8 min ago" },
  { name: "billing-export", id: "ck_demo_ak_2Bc5Df8Gh1Jk4Mn7Pq0Rs3Tv", secret: "ck_demo_sk_Vw6Xy9Za2Bc5De8Fg1Hi4Jk7Lm0No3Pq6Rs9Tu2Vw5", scopes: "billing:read", created: "05 Nov 2025", lastUsed: "Yesterday" },
]

// ── Ordering a virtual data center ──────────────────────────────────────
// Rates are per month. Descriptions are the console's own copy: what the
// option is and who needs it, one sentence each. Sites are ORDER_SITES above.

export const BILLING_TERMS = [
  {
    id: "monthly", name: "Monthly",
    description: "Pay for what ran last month and cancel any time; the right term while a workload is still taking shape.",
  },
  {
    id: "annual", name: "Annual",
    description: "Commit to twelve months and receive one invoice a year, which keeps the rate fixed and procurement quiet.",
  },
]

export const ORDER_RATES = {
  drStorageGb: 0.05,
  replicationLicence: 15,
  backupGb: 0.02,
}

export const POOLS = [
  {
    id: "cpu", name: "CPU pool", unit: "GHz", rate: 2, min: 4, max: 200, step: 2, tick: 50,
    description: "Clock cycles shared by every virtual machine in the vDC; size it for the busiest hour, not the average.",
  },
  {
    id: "ram", name: "RAM pool", unit: "GB", rate: 7.5, min: 8, max: 1024, step: 8, tick: 256,
    description: "Memory the vDC can hand to its virtual machines; databases and caches fill this before they touch the CPU pool.",
  },
  {
    id: "ips", name: "Public IPs", unit: "", rate: 5, min: 0, max: 32, step: 1, tick: 8,
    description: "Routable addresses for anything the internet must reach directly; most vDCs need one per load balancer or bastion.",
  },
]

// Preset pool pairs; a slider move that matches none of them reads as Custom.
export const COMPUTE_PRESETS = [
  { id: "s", name: "S", cpu: 8, ram: 32, description: "A handful of small services, or a build farm that sleeps at night." },
  { id: "m", name: "M", cpu: 20, ram: 64, description: "The default: a web tier, an API and a modest database." },
  { id: "l", name: "L", cpu: 60, ram: 192, description: "Production with headroom for a busy quarter." },
  { id: "xl", name: "XL", cpu: 120, ram: 512, description: "Analytics and in-memory workloads that fill RAM before CPU." },
]

export const UPLINKS = [
  { id: "10", name: "10 Mbps", rate: 30, description: "Included with every vDC; enough for management traffic and a quiet site." },
  { id: "100", name: "100 Mbps", rate: 90, description: "Public web tiers and nightly transfers that must finish before morning." },
  { id: "1000", name: "1 Gbps", rate: 250, description: "Media, replication to your own sites, or anything measured in terabytes." },
]

export const NETWORK_ADDONS = [
  { id: "firewall", name: "Edge firewall", rate: 0, included: true, description: "Stateful rules at the vDC edge; always on and never billed." },
  { id: "vpn", name: "VPN gateway", rate: 25, description: "Site-to-site IPsec into the vDC, for offices and a second cloud." },
  { id: "lb", name: "Load balancer", rate: 40, description: "Layer 4 and 7 balancing across your machines, with health checks." },
  { id: "ddos", name: "DDoS shield", rate: 60, description: "Volumetric scrubbing upstream of the uplink, for anything on the public internet." },
]

export const STORAGE_TIERS = [
  { id: "t1", name: "Tier 1", rate: 0.05, media: "HDD", iops: "500", latency: "10 ms", description: "Capacity disks for backups, archives and logs you read rarely." },
  { id: "t2", name: "Tier 2", rate: 0.08, media: "Hybrid", iops: "3,000", latency: "4 ms", description: "General-purpose storage for boot volumes and application data with steady, modest I/O." },
  { id: "t3", name: "Tier 3", rate: 0.12, media: "SSD", iops: "16,000", latency: "1 ms", description: "SSD-backed storage for databases and queues that notice latency." },
  { id: "t4", name: "Tier 4", rate: 0.2, media: "NVMe", iops: "80,000", latency: "0.2 ms", description: "NVMe storage for the few volumes where every millisecond is billable." },
]

export const PROTECTION_TIERS = [
  {
    id: "none", name: "None", share: 0, rpo: "—", rto: "Rebuild",
    description: "No second site; right for dev, test and anything you can rebuild from an image faster than you can fail over.",
  },
  {
    id: "warm", name: "Warm standby", share: 0.25, rpo: "15 min", rto: "1 hr",
    description: "A quarter of your CPU and RAM reserved at a second site, ready to scale up inside an hour when the primary fails.",
  },
  {
    id: "hot", name: "Hot standby", share: 1, rpo: "5 min", rto: "15 min",
    description: "Your full compute footprint reserved at the second site, so failover is a DNS change rather than a capacity request.",
  },
]

export const BACKUP_RETENTION = [
  { id: "7", name: "7 days", factor: 1 },
  { id: "14", name: "14 days", factor: 1.5 },
  { id: "30", name: "30 days", factor: 2.2 },
]

// The BCDR step explains itself before it asks anything.
export const BCDR_COPY = [
  {
    id: "replica", title: "Replica site",
    body: "A second vDC in another site receives a continuous copy of your storage. When the primary site fails, the replica powers on and takes the traffic.",
  },
  {
    id: "objectives", title: "RPO and RTO",
    body: "Recovery point objective is how much data you can afford to lose, measured as time since the last replicated write. Recovery time objective is how long the failover itself may take. Tighter numbers cost more capacity at the replica.",
  },
  {
    id: "backups", title: "Backups",
    body: "Replication copies mistakes as faithfully as data, so nightly backups keep point-in-time copies you can restore a single volume from, for as long as the retention you pick.",
  },
]

export const ORDER_COPY = {
  included: "Every vDC includes the edge firewall, hypervisor high availability, live migration and the management plane.",
  drSite: "Where the replica lives; choose a site far enough away that one storm cannot reach both.",
  drStorage: "How much of your storage the replica holds; set it above 100% to keep room for journals and point-in-time copies.",
  licences: "One licence per protected virtual machine covers the replication agent and its recovery runbook.",
  backups: "Nightly snapshots of every volume in the vDC, priced per GB of provisioned storage and scaled by how long they are kept.",
  vms: "Virtual machines draw from the pools you sized; add them here so the replica sizing and licence count are right on day one.",
  headroom: "Keeps a tenth of both pools unallocated so a burst never waits on a resize; not billed.",
  dueToday: "Usage bills at month end; nothing is charged until the first vDC is running.",
}

// Per-vDC placement settings for its virtual machines, and per-VM options.
export const VM_GROUP_DEFAULTS = { antiAffinity: false, network: NETWORKS[0].name }
export const VM_DEFAULTS = { publicIp: false, backup: true, bootTier: "t2", startOnCreate: true }

// The form's starting point for each new vDC.
export const ORDER_DEFAULTS = {
  site: "dfw",
  billing: "monthly",
  cpu: 20,
  ram: 64,
  headroom: false,
  ips: 2,
  uplink: "10",
  addons: [],
  storage: { t1: 500, t2: 250, t3: 0, t4: 0 },
  protection: "none",
  drSite: "slc",
  drStoragePct: 130,
  backups: false,
  retention: "7",
  vmGroup: VM_GROUP_DEFAULTS,
}
