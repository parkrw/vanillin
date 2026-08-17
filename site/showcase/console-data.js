// Mock inventory for the Acme Cloud console showcase. Shapes mirror what a
// real cloud control plane would return; values are fiction.

export const PROJECTS = ["admin", "engineering", "data-science", "marketing"]
export const REGIONS = ["Dallas", "Salt Lake City", "Chicago"]

export const NAV_GROUPS = [
  {
    label: "Platform",
    items: [
      { id: "overview", name: "Overview", pages: ["Dashboard"] },
      { id: "vdc", name: "Virtual data centers", pages: ["Data centers", "Quotas"] },
      { id: "resources", name: "Resources", pages: ["Instances", "Instance sizes", "Machine images"] },
      { id: "networking", name: "Networking", pages: ["Networks", "Public IPs"] },
      { id: "storage", name: "Storage", pages: ["Volumes", "Snapshots"] },
    ],
  },
  {
    label: "Operations",
    items: [
      { id: "metrics", name: "Metrics", pages: ["Utilization"] },
      { id: "events", name: "Events", pages: ["Event log"] },
      { id: "service-health", name: "Service health", pages: ["Services"] },
    ],
  },
  {
    label: "Account",
    items: [
      { id: "billing", name: "Billing", pages: ["Invoices"] },
      { id: "contacts", name: "Contacts", pages: ["Contacts"] },
      { id: "support", name: "Support", pages: ["Support"] },
      { id: "security", name: "Security", pages: ["Access keys"] },
      { id: "your-data", name: "Your data", pages: ["Exports"] },
      { id: "settings", name: "Settings", pages: ["Settings"] },
    ],
  },
]

export function findService(id) {
  for (const group of NAV_GROUPS) {
    const svc = group.items.find((s) => s.id === id)
    if (svc) return { ...svc, category: group.label }
  }
  return null
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
  { resource: "Instances", limit: 40, used: 14 },
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

export const TASKS = [
  { task: "Upload machine image", target: "ubuntu-24.04-acme", status: "Running", started: "18 min ago", duration: "" },
  { task: "Launch instance", target: "api-prod-03", status: "Running", started: "22 min ago", duration: "" },
  { task: "Create snapshot", target: "snap-ml-checkpoint", status: "Running", started: "25 min ago", duration: "" },
  { task: "Start instance", target: "web-prod-03", status: "Succeeded", started: "2 min ago", duration: "12s" },
  { task: "Attach volume", target: "data-vol-07", status: "Succeeded", started: "15 min ago", duration: "3s" },
  { task: "Delete instance", target: "test-throwaway-01", status: "Succeeded", started: "4 hrs ago", duration: "8s" },
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
  { text: "instance.power_on", target: "web-prod-03", time: "2 min ago", tone: "success" },
  { text: "volume.attach", target: "data-vol-07", time: "15 min ago", tone: "success" },
  { text: "image.upload", target: "ubuntu-24.04-acme", time: "1 hr ago", tone: "success" },
  { text: "project.created", target: "dev-team", time: "3 hrs ago", tone: "success" },
  { text: "instance.check.failed", target: "host-apac-02", time: "4 hrs ago", tone: "error" },
]

export const STATS = [
  { num: "47", label: "Instances", sub: "38 active", tone: "success" },
  { num: "3", label: "Regions", sub: "3 active", tone: "success" },
  { num: "10", label: "Hosts", sub: "2 maintenance", tone: "warning" },
  { num: "18", label: "Services", sub: "all active", tone: "success" },
  { num: "10", label: "Projects", sub: "10 enabled", tone: "success" },
  { num: "6", label: "Public IPs", sub: "of 128 pool", tone: "success" },
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
