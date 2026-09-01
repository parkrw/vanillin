import { Button } from "../../../ui/button/button.jsx"
import { DATA_CENTERS, EVENTS, HEALTH, MACHINE_IMAGES, NETWORKS, PUBLIC_IPS, SIZES, SNAPSHOTS, VDCS, VOLUMES } from "../console-data.js"
import { OrganizationPanel, ProfilePanel, StatusShowcase, SupportPanel } from "../panels/index.js"
import { CardPage, Dashboard, EventsCard, HealthCard, StatCards, UtilizationCard } from "./dashboard.jsx"
import { CartIcon } from "../icons.jsx"
import { StatusBadge } from "../shared.jsx"
import { AccessKeysView, ImageUploads, InstancesView, QuotasView, SimpleTable, UnderConstruction, VdcView } from "./views.jsx"
import "../../../ui/button/button.css"

/* Page routing inside the mock. */

export function PageContent({ svc, page, project, orderHref, onNavigate, onDetails }) {
  if (svc === "overview") {
    switch (page) {
      case "Capacity":
        return (
          <CardPage title="Capacity" count="live">
            <StatCards />
            <UtilizationCard />
          </CardPage>
        )
      case "Health":
        return <CardPage title="Service Health" count={`${HEALTH.length} groups`}><HealthCard /></CardPage>
      case "Recent Events":
        return <CardPage title="Recent Events" count="live"><EventsCard max={12} /></CardPage>
      default:
        return <Dashboard />
    }
  }
  switch (page) {
    case "Virtual Machines":
      return <InstancesView project={project} onDetails={onDetails} />
    case "Virtual Machine Sizes":
      return (
        <SimpleTable
          title="Virtual Machine Sizes"
          count={`${SIZES.length} sizes`}
          cols={["Name", "vCPUs", "Memory", "Root disk", "Public"]}
          rows={SIZES.map((f) => [<code className="ck-mono" key="n">{f.name}</code>, f.vcpus, f.ram, f.disk, f.pub])}
          actions={SIZES.map((f) => ({
            name: f.name,
            items: [{ label: "Launch virtual machine" }, { label: "Copy specification" }, { label: "Set as project default" }, { label: "Retire", danger: true }],
          }))}
        />
      )
    case "Quotas":
      return <QuotasView />
    case "Data Centers":
      return (
        <SimpleTable
          title="Data Centers"
          count={`${DATA_CENTERS.length} data centers`}
          cols={["Name", "Region", "Hosts", "Virtual Machines", "Status"]}
          rows={DATA_CENTERS.map((d) => [
            <code className="ck-mono" key="n">{d.name}</code>,
            d.region,
            d.hosts,
            d.instances,
            <StatusBadge key="s" value={d.status} />,
          ])}
          actions={DATA_CENTERS.map((d) => ({
            name: d.name,
            items: [{ label: "View hosts" }, { label: "Add capacity" }, { label: "Drain for maintenance" }, { label: "Decommission", danger: true }],
          }))}
        >
          <div className="ck-actions">
            <Button as="a" size="sm" className="ck-order-open" href={orderHref}>
              <CartIcon />
              Order a VDC
            </Button>
          </div>
        </SimpleTable>
      )
    case "Public IPs":
      return (
        <SimpleTable
          title="Public IPs"
          count={`${PUBLIC_IPS.length} addresses`}
          cols={["Address", "Attached to", "Network", "Status"]}
          rows={PUBLIC_IPS.map((a) => [
            <code className="ck-mono" key="a">{a.address}</code>,
            a.attached || "none",
            a.network,
            <StatusBadge key="s" value={a.status} />,
          ])}
          actions={PUBLIC_IPS.map((a) => ({
            name: a.address,
            items: [{ label: "Attach to virtual machine" }, { label: "Detach" }, { label: "Set reverse DNS" }, { label: "Release", danger: true }],
          }))}
        />
      )
    case "Snapshots":
      return (
        <SimpleTable
          title="Snapshots"
          count={`${SNAPSHOTS.length} snapshots`}
          cols={["Name", "Source volume", "Size", "Created", "Status"]}
          rows={SNAPSHOTS.map((n) => [
            n.name,
            <code className="ck-mono" key="v">{n.source}</code>,
            n.size,
            n.created,
            <StatusBadge key="s" value={n.status} />,
          ])}
          actions={SNAPSHOTS.map((n) => ({
            name: n.name,
            items: [{ label: "Restore to volume" }, { label: "Clone" }, { label: "Export" }, { label: "Delete", danger: true }],
          }))}
        />
      )
    case "Utilization":
      return (
        <CardPage title="Utilization" count="last 24 hours">
          <UtilizationCard />
          <StatusShowcase />
        </CardPage>
      )
    case "Event Log":
      return <CardPage title="Event Log" count={`${EVENTS.length} events`}><EventsCard max={12} /></CardPage>
    case "Services":
      return <CardPage title="Services" count={`${HEALTH.length} groups`}><HealthCard /></CardPage>
    case "Tickets":
      return <SupportPanel />
    case "Profile":
      return <ProfilePanel />
    case "Organization":
      return <OrganizationPanel />
    case "Access Keys":
      return <AccessKeysView />
    case "Templates & Images":
      return (
        <SimpleTable
          title="Templates & Images"
          count={`${MACHINE_IMAGES.length} images`}
          cols={["Name", "Format", "Size", "Status", "Visibility"]}
          rows={MACHINE_IMAGES.map((i) => [
            i.name,
            <code className="ck-mono" key="f">{i.format}</code>,
            i.size,
            <StatusBadge key="s" value={i.status} />,
            i.visibility,
          ])}
          actions={MACHINE_IMAGES.map((i) => ({
            name: i.name,
            items: [{ label: "Launch virtual machine" }, { label: "Copy to region" }, { label: "Share with project" }, { label: "Deprecate" }, { label: "Delete", danger: true }],
          }))}
        >
          <ImageUploads />
        </SimpleTable>
      )
    case "Networks":
      return (
        <SimpleTable
          title="Networks"
          count={`${NETWORKS.length} networks`}
          cols={["Name", "Subnet", "Type", "External", "Status"]}
          rows={NETWORKS.map((n) => [
            n.name,
            <code className="ck-mono" key="s">{n.subnet}</code>,
            n.type,
            n.external,
            <StatusBadge key="b" value={n.status} />,
          ])}
          actions={NETWORKS.map((n) => ({
            name: n.name,
            items: [{ label: "Edit network" }, { label: "Add subnet" }, { label: "Attach virtual machine" }, { label: "Manage firewall" }, { label: "Delete", danger: true }],
          }))}
        />
      )
    case "Volumes":
      return (
        <SimpleTable
          title="Volumes"
          count={`${VOLUMES.length} volumes`}
          cols={["Name", "Size", "Status", "Type", "Attached to"]}
          rows={VOLUMES.map((v) => [
            v.name,
            v.size,
            <StatusBadge key="s" value={v.status} />,
            <code className="ck-mono" key="t">{v.type}</code>,
            v.attached || "–",
          ])}
          actions={VOLUMES.map((v) => ({
            name: v.name,
            items: [{ label: "Attach" }, { label: "Detach" }, { label: "Extend" }, { label: "Snapshot" }, { label: "Delete", danger: true }],
          }))}
        />
      )
    default: {
      const vdc = VDCS.find((v) => v.name === page)
      return vdc ? <VdcView vdc={vdc} /> : <UnderConstruction name={page} />
    }
  }
}
