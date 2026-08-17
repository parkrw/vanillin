// Mock inventory for the CloudKey console showcase. Shapes mirror what a
// real OpenStack-flavoured control plane would return; values are fiction.

export const PROJECTS = ["admin", "engineering", "data-science", "marketing"]
export const REGIONS = ["Dallas", "Salt Lake City", "Chicago"]

export const SERVICES = [
  {
    label: "Compute",
    items: [
      { id: "nova", name: "Instances", code: "Nova", pages: ["Servers", "Flavors", "Quotas"] },
      { id: "glance", name: "Images", code: "Glance", pages: ["Images"] },
    ],
  },
  {
    label: "Network",
    items: [
      { id: "neutron", name: "Networking", code: "Neutron", pages: ["Networks"] },
      { id: "octavia", name: "Load Balancer", code: "Octavia", pages: ["Load Balancers"] },
    ],
  },
  {
    label: "Storage",
    items: [
      { id: "cinder", name: "Block Storage", code: "Cinder", pages: ["Volumes"] },
      { id: "swift", name: "Object Storage", code: "Swift", pages: ["Containers"] },
    ],
  },
  {
    label: "Access",
    items: [
      { id: "keystone", name: "Identity", code: "Keystone", pages: ["Projects"] },
    ],
  },
]

export function findService(id) {
  for (const cat of SERVICES) {
    const svc = cat.items.find((s) => s.id === id)
    if (svc) return { ...svc, category: cat.label }
  }
  return null
}

export const SERVERS = [
  { name: "web-prod-01", status: "Active", az: "az-east-1a", flavor: "m1.large", ip: "10.1.0.45", project: "engineering", user: "ops", cpu: 42, mem: 61 },
  { name: "web-prod-02", status: "Active", az: "az-east-1a", flavor: "m1.large", ip: "10.1.0.46", project: "engineering", user: "ops", cpu: 38, mem: 57 },
  { name: "web-prod-03", status: "Active", az: "az-east-1a", flavor: "m1.large", ip: "10.1.0.47", project: "engineering", user: "ops", cpu: 51, mem: 63 },
  { name: "api-prod-01", status: "Active", az: "az-east-1a", flavor: "m1.xlarge", ip: "10.1.0.60", project: "engineering", user: "ops", cpu: 66, mem: 72 },
  { name: "api-prod-02", status: "Active", az: "az-east-1b", flavor: "m1.xlarge", ip: "10.1.0.61", project: "engineering", user: "ops", cpu: 58, mem: 69 },
  { name: "db-prod-01", status: "Active", az: "az-east-1b", flavor: "m1.2xlarge", ip: "10.1.0.70", project: "engineering", user: "ops", cpu: 74, mem: 81 },
  { name: "db-replica-01", status: "Active", az: "az-east-1b", flavor: "m1.2xlarge", ip: "10.1.0.71", project: "engineering", user: "ops", cpu: 31, mem: 77 },
  { name: "cache-prod-01", status: "Active", az: "az-east-1a", flavor: "m1.large", ip: "10.1.0.80", project: "engineering", user: "ops", cpu: 22, mem: 48 },
  { name: "web-staging-01", status: "Shutoff", az: "az-west-1a", flavor: "m1.medium", ip: "10.3.0.22", project: "engineering", user: "dev", cpu: 0, mem: 0 },
  { name: "api-staging-01", status: "Shutoff", az: "az-west-1a", flavor: "m1.medium", ip: "10.3.0.23", project: "engineering", user: "dev", cpu: 0, mem: 0 },
  { name: "ml-train-01", status: "Active", az: "az-apac-1a", flavor: "g1.large", ip: "10.5.0.11", project: "data-science", user: "ml-team", cpu: 93, mem: 88 },
  { name: "ml-train-02", status: "Active", az: "az-apac-1a", flavor: "g1.large", ip: "10.5.0.12", project: "data-science", user: "ml-team", cpu: 91, mem: 84 },
  { name: "ml-infer-01", status: "Error", az: "az-apac-1a", flavor: "m1.xlarge", ip: "10.5.0.20", project: "data-science", user: "ml-team", cpu: 0, mem: 12 },
  { name: "cms-prod-01", status: "Active", az: "az-east-1a", flavor: "m1.medium", ip: "10.1.0.90", project: "marketing", user: "web", cpu: 18, mem: 41 },
]

export const FLAVORS = [
  { name: "m1.small", vcpus: "1", ram: "1 GB", disk: "10 GB", pub: "Yes" },
  { name: "m1.medium", vcpus: "2", ram: "4 GB", disk: "40 GB", pub: "Yes" },
  { name: "m1.large", vcpus: "4", ram: "8 GB", disk: "80 GB", pub: "Yes" },
  { name: "m1.xlarge", vcpus: "8", ram: "16 GB", disk: "160 GB", pub: "Yes" },
  { name: "m1.2xlarge", vcpus: "16", ram: "32 GB", disk: "160 GB", pub: "No" },
  { name: "g1.large", vcpus: "8 + 1 GPU", ram: "32 GB", disk: "160 GB", pub: "No" },
]

export const QUOTAS = [
  { resource: "Servers", limit: 40, used: 14 },
  { resource: "VCPUs", limit: 80, used: 68 },
  { resource: "RAM (GB)", limit: 128, used: 92 },
  { resource: "Floating IPs", limit: 20, used: 6 },
  { resource: "Volumes", limit: 30, used: 8 },
  { resource: "Volume storage (GB)", limit: 4000, used: 2550 },
  { resource: "Networks", limit: 20, used: 6 },
  { resource: "Security groups", limit: 20, used: 3 },
]

export const IMAGES = [
  { name: "Ubuntu 24.04 LTS", format: "qcow2", size: "2.4 GB", status: "Active", visibility: "Public" },
  { name: "Ubuntu 22.04 LTS", format: "qcow2", size: "2.1 GB", status: "Active", visibility: "Public" },
  { name: "Rocky Linux 9.3", format: "qcow2", size: "1.8 GB", status: "Active", visibility: "Public" },
  { name: "Debian 12", format: "qcow2", size: "1.6 GB", status: "Active", visibility: "Public" },
  { name: "Windows Server 2022", format: "qcow2", size: "8.2 GB", status: "Active", visibility: "Private" },
  { name: "Fedora CoreOS 40", format: "qcow2", size: "780 MB", status: "Active", visibility: "Public" },
]

export const NETWORKS = [
  { name: "prod-web-net", subnet: "10.1.1.0/24", type: "VXLAN", external: "No", status: "Active" },
  { name: "prod-app-net", subnet: "10.1.2.0/24", type: "VXLAN", external: "No", status: "Active" },
  { name: "prod-db-net", subnet: "10.1.3.0/24", type: "VXLAN", external: "No", status: "Active" },
  { name: "staging-net", subnet: "10.3.1.0/24", type: "VXLAN", external: "No", status: "Active" },
  { name: "ml-training-net", subnet: "10.5.1.0/24", type: "VXLAN", external: "No", status: "Active" },
  { name: "external-net", subnet: "203.0.113.0/24", type: "Flat", external: "Yes", status: "Active" },
]

export const VOLUMES = [
  { name: "vol-root-42", size: "50 GB", status: "In-use", type: "lvmdriver-1", attached: "web-prod-01" },
  { name: "vol-root-78", size: "100 GB", status: "In-use", type: "ceph-ssd", attached: "db-prod-01" },
  { name: "data-vol-01", size: "500 GB", status: "In-use", type: "ceph-ssd", attached: "db-prod-01" },
  { name: "data-vol-02", size: "500 GB", status: "In-use", type: "ceph-ssd", attached: "db-replica-01" },
  { name: "data-vol-07", size: "1000 GB", status: "In-use", type: "ceph-ssd", attached: "ml-train-01" },
  { name: "backup-vol-01", size: "200 GB", status: "Available", type: "ceph-ssd", attached: "" },
  { name: "scratch-01", size: "100 GB", status: "In-use", type: "lvmdriver-1", attached: "ml-train-02" },
]

export const TASKS = [
  { task: "Upload Image", target: "ubuntu-24.04-ck", status: "Running", started: "18 min ago", duration: "" },
  { task: "Launch Server", target: "api-prod-03", status: "Running", started: "22 min ago", duration: "" },
  { task: "Create Snapshot", target: "snap-ml-checkpoint", status: "Running", started: "25 min ago", duration: "" },
  { task: "Start Server", target: "web-prod-03", status: "Succeeded", started: "2 min ago", duration: "12s" },
  { task: "Attach Volume", target: "data-vol-07", status: "Succeeded", started: "15 min ago", duration: "3s" },
  { task: "Delete Server", target: "test-throwaway-01", status: "Succeeded", started: "4 hrs ago", duration: "8s" },
]

export const UTILIZATION = [
  { label: "CPU", pct: 62, detail: "892 / 1,440 GHz", tone: "warning" },
  { label: "Memory", pct: 71, detail: "819 / 1,152 GB", tone: "warning" },
  { label: "Block storage", pct: 45, detail: "18.2 / 40 TB", tone: "success" },
  { label: "Object storage", pct: 32, detail: "6.4 / 20 TB", tone: "success" },
]

export const HEALTH = [
  { name: "Nova (Compute)", value: "13 services up", tone: "success" },
  { name: "Neutron (Network)", value: "8 agents active", tone: "success" },
  { name: "Cinder (Block Storage)", value: "5 services up", tone: "success" },
  { name: "Glance (Image)", value: "2 active", tone: "success" },
  { name: "Aodh (Alarming)", value: "2 alarms", tone: "error" },
]

export const EVENTS = [
  { text: "compute.instance.power_on.end", target: "web-prod-03", time: "2 min ago", tone: "success" },
  { text: "volume.attach.end", target: "data-vol-07", time: "15 min ago", tone: "success" },
  { text: "image.upload", target: "ubuntu-24.04-ck", time: "1 hr ago", tone: "success" },
  { text: "identity.project.created", target: "dev-team", time: "3 hrs ago", tone: "success" },
  { text: "compute.instance.exists.error", target: "nova-apac-02", time: "4 hrs ago", tone: "error" },
]

export const STATS = [
  { num: "47", label: "Servers", sub: "38 active", tone: "success" },
  { num: "3", label: "Regions", sub: "3 active", tone: "success" },
  { num: "10", label: "Compute nodes", sub: "2 maintenance", tone: "warning" },
  { num: "18", label: "Services", sub: "all active", tone: "success" },
  { num: "10", label: "Projects", sub: "10 enabled", tone: "success" },
  { num: "6", label: "Floating IPs", sub: "of 128 pool", tone: "success" },
]
