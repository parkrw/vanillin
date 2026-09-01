import { Fragment, useCallback, useEffect, useMemo, useState } from "react"
import { flexRender, useDataTable } from "../../../lib/use-data-table.js"
import { Badge } from "../../../ui/badge/badge.jsx"
import { Button } from "../../../ui/button/button.jsx"
import { DataTableScroller } from "../../../ui/data-table/data-table.jsx"
import { Field, FieldDescription, FieldLabel } from "../../../ui/field/field.jsx"
import { Input } from "../../../ui/input/input.jsx"
import { NativeSelect, NativeSelectOption } from "../../../ui/native-select/native-select.jsx"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "../../../ui/popover/popover.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select/select.jsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table/table.jsx"
import { ToggleGroup, ToggleGroupItem } from "../../../ui/toggle-group/toggle-group.jsx"
import { MACHINE_IMAGES, NETWORKS, ORDER_COPY, POOLS, SIZES, STORAGE_TIERS, VM_GROUP_DEFAULTS } from "../console-data.js"
import { ChevronRightIcon, CloseIcon, PlusIcon, SlidersIcon } from "../icons.jsx"
import { CheckRow, DraftBar, OrderSection, SpecCard, SwitchRow } from "./form.jsx"
import { money, vmMonthly } from "./pricing.js"
import { Tip } from "../shared.jsx"
import "../../../ui/badge/badge.css"
import "../../../ui/button/button.css"
import "../../../ui/data-table/data-table.css"
import "../../../ui/field/field.css"
import "../../../ui/input/input.css"
import "../../../ui/native-select/native-select.css"
import "../../../ui/popover/popover.css"
import "../../../ui/select/select.css"
import "../../../ui/table/table.css"
import "../../../ui/toggle/toggle.css"
import "../../../ui/toggle-group/toggle-group.css"

/* The machines to provision: one grouped table across every vDC. */

function vmColumns(onPatch, onRemove, openVms, toggleOpen) {
  return [
    {
      accessorKey: "vdc",
      header: "",
      cell: ({ row }) => (
        <button
          type="button"
          className="ck-vm-expand"
          aria-expanded={openVms.has(row.original.id)}
          aria-label={`Settings for ${row.original.name}`}
          onClick={() => toggleOpen(row.original.id)}
        >
          <ChevronRightIcon />
        </button>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <Input
          className="ck-vm-input"
          value={row.original.name}
          aria-label={`Name of ${row.original.name}`}
          onChange={(e) => onPatch(row.original.id, { name: e.target.value })}
        />
      ),
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: ({ row }) => (
        <Select value={row.original.size} onValueChange={(size) => onPatch(row.original.id, { size })}>
          <SelectTrigger size="sm" className="ck-vm-select" aria-label={`Size of ${row.original.name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SIZES.map((s) => (
              <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "image",
      header: "Image",
      cell: ({ row }) => (
        <Select value={row.original.image} onValueChange={(image) => onPatch(row.original.id, { image })}>
          <SelectTrigger size="sm" className="ck-vm-select ck-vm-select--wide" aria-label={`Image of ${row.original.name}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MACHINE_IMAGES.map((i) => (
              <SelectItem key={i.name} value={i.name}>{i.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
    {
      accessorKey: "count",
      header: "Count",
      cell: ({ row }) => (
        <Input
          type="number"
          min="1"
          max="99"
          className="ck-vm-input ck-vm-count"
          value={row.original.count}
          aria-label={`Count of ${row.original.name}`}
          onChange={(e) => onPatch(row.original.id, { count: Math.max(1, Number(e.target.value) || 1) })}
        />
      ),
    },
    {
      id: "price",
      header: "Pool draw",
      cell: ({ row }) => {
        const size = SIZES.find((s) => s.name === row.original.size)
        const [cpu, ram] = POOLS
        const tier = STORAGE_TIERS.find((t) => t.id === row.original.bootTier)
        return (
          <span className="ck-vm-price">
            <SpecCard
              title={`${row.original.count} × ${size.name}`}
              rows={[
                ["vCPU", `${size.vcpus} × ${money(cpu.rate)}`],
                ["RAM", `${size.ram} × ${money(ram.rate)}`],
                ["Root disk", `${size.disk} on ${tier.name}`],
                ["Per machine", `${money(vmMonthly(size.name))}/mo`],
              ]}
            >
              {money(vmMonthly(row.original.size) * row.original.count)}/mo
            </SpecCard>
          </span>
        )
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <Tip label={`Remove ${row.original.name}`}>
          <Button variant="ghost" size="icon" aria-label={`Remove ${row.original.name}`} onClick={() => onRemove(row.original.id)}>
            <CloseIcon />
          </Button>
        </Tip>
      ),
    },
  ]
}

/* Per-machine options, revealed under the row by its chevron. */
function VmSettings({ vm, onPatch }) {
  const set = (changes) => onPatch(vm.id, changes)
  return (
    <div className="ck-vm-settings">
      <SwitchRow
        id={`${vm.id}-ip`}
        title="Public IP"
        meta="1 address"
        description="Attach a routable address from the vDC's public pool."
        checked={vm.publicIp}
        onCheckedChange={(publicIp) => set({ publicIp })}
      />
      <SwitchRow
        id={`${vm.id}-backup`}
        title="Nightly backup"
        description="Include this machine's volumes in the vDC backup set."
        checked={vm.backup}
        onCheckedChange={(backup) => set({ backup })}
      />
      <div className="ck-vm-setting">
        <span className="ck-vm-setting-title">Boot disk tier</span>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={vm.bootTier}
          onValueChange={(bootTier) => bootTier && set({ bootTier })}
          className="ck-segments"
          aria-label={`Boot disk tier of ${vm.name}`}
        >
          {STORAGE_TIERS.slice(1).map((t) => (
            <ToggleGroupItem key={t.id} value={t.id}>{t.name}</ToggleGroupItem>
          ))}
        </ToggleGroup>
        <span className="ck-option-desc">Where the root volume lives; data volumes come from the pools you sized.</span>
      </div>
      <CheckRow
        id={`${vm.id}-start`}
        title="Start after create"
        description="Power on as soon as the image is written."
        checked={vm.startOnCreate}
        onCheckedChange={(on) => set({ startOnCreate: on === true })}
      />
    </div>
  )
}

/* The kit's group row, plus the vDC's placement settings in a popover and an
   action cell: every group offers to add a machine to itself. */
function VmGroupRow({ row, colSpan, label, group, onAdd, onPatchGroup }) {
  const expanded = row.getIsExpanded()
  const vdcId = row.groupValue
  return (
    <TableRow className="data-table-group-row ck-vm-group" data-depth={row.depth}>
      <TableCell colSpan={colSpan - 1} className="data-table-group-cell ck-vm-group-cell">
        <button
          type="button"
          className="data-table-group-toggle"
          aria-expanded={expanded}
          onClick={() => row.toggleExpanded()}
        >
          <ChevronRightIcon />
          <span className="data-table-group-label">{label}</span>
          <span className="data-table-group-count">{row.leafCount}</span>
        </button>
        <Popover>
          <PopoverTrigger as={Button} variant="ghost" size="sm" className="ck-vm-group-settings">
            <SlidersIcon />
            Placement
            {group.antiAffinity && <Badge variant="info">anti-affinity</Badge>}
            <Badge variant="outline">{group.network}</Badge>
          </PopoverTrigger>
          <PopoverContent align="start" className="ck-vm-group-pop">
            <PopoverHeader>
              <PopoverTitle>Placement for {label}</PopoverTitle>
              <PopoverDescription>Applies to every machine in this vDC.</PopoverDescription>
            </PopoverHeader>
            <SwitchRow
              id={`${vdcId}-affinity`}
              title="Anti-affinity"
              description="Spread the machines across hosts, so one host failure takes one machine."
              checked={group.antiAffinity}
              onCheckedChange={(antiAffinity) => onPatchGroup(vdcId, { antiAffinity })}
            />
            <Field>
              <FieldLabel htmlFor={`${vdcId}-network`}>Default network</FieldLabel>
              <NativeSelect
                id={`${vdcId}-network`}
                value={group.network}
                onChange={(e) => onPatchGroup(vdcId, { network: e.target.value })}
              >
                {NETWORKS.filter((n) => n.type === "Private").map((n) => (
                  <NativeSelectOption key={n.name} value={n.name}>{n.name} · {n.subnet}</NativeSelectOption>
                ))}
              </NativeSelect>
              <FieldDescription>New machines attach here first; add more interfaces after launch.</FieldDescription>
            </Field>
          </PopoverContent>
        </Popover>
      </TableCell>
      <TableCell className="ck-vm-group-action">
        <Button variant="ghost" size="sm" className="ck-vm-add" onClick={() => onAdd(vdcId)}>
          <PlusIcon />
          Add virtual machine
        </Button>
      </TableCell>
    </TableRow>
  )
}

function VmTable({ vdcs, draft, vms, onAdd, onPatch, onRemove, onPatchGroup }) {
  const [openVms, setOpenVms] = useState(() => new Set())
  const toggleOpen = useCallback((id) => {
    setOpenVms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const columns = useMemo(() => vmColumns(onPatch, onRemove, openVms, toggleOpen), [onPatch, onRemove, openVms, toggleOpen])
  const table = useDataTable({
    data: vms,
    columns,
    initialPageSize: 200,
    initialGrouping: ["vdc"],
    getRowId: (vm) => vm.id,
  })
  const all = [...vdcs, draft]
  const names = Object.fromEntries(all.map((v) => [v.id, v.name]))
  const groups = Object.fromEntries(all.map((v) => [v.id, v.vmGroup]))
  // Groups open on arrival and whenever a vDC joins; a group the user folded
  // stays folded until then.
  const groupKey = Object.keys(names).join("|")
  useEffect(() => {
    table.toggleAllExpanded(true)
  }, [groupKey])
  const colSpan = table.getHeaderGroups()[0].headers.length

  return (
    <DataTableScroller className="ck-table-wrap ck-vm-wrap">
      <Table className="ck-table ck-vm-table">
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) =>
            row.isGrouped ? (
              <VmGroupRow
                key={row.id}
                row={row}
                colSpan={colSpan}
                label={names[row.groupValue] ?? row.groupValue}
                group={groups[row.groupValue] ?? VM_GROUP_DEFAULTS}
                onAdd={onAdd}
                onPatchGroup={onPatchGroup}
              />
            ) : (
              <Fragment key={row.id}>
                <TableRow data-expanded={openVms.has(row.id) || undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {openVms.has(row.id) && (
                  <TableRow className="ck-vm-detail">
                    <TableCell colSpan={colSpan}>
                      <VmSettings vm={row.original} onPatch={onPatch} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          )}
        </TableBody>
      </Table>
    </DataTableScroller>
  )
}

export function VmsStep({ draft, cost, vdcs, vms, onAddVm, onPatchVm, onRemoveVm, onPatchGroup, onNext }) {
  return (
    <>
      <OrderSection title="Virtual machines" hint={ORDER_COPY.vms} wide>
        <VmTable
          vdcs={vdcs}
          draft={draft}
          vms={vms}
          onAdd={onAddVm}
          onPatch={onPatchVm}
          onRemove={onRemoveVm}
          onPatchGroup={onPatchGroup}
        />
        <p className="ck-option-desc">
          Open a row's chevron for its own options; the vDC's placement rules sit on its group row.
        </p>
      </OrderSection>
      <DraftBar draft={draft} cost={cost} next="Summary" onNext={onNext} />
    </>
  )
}
