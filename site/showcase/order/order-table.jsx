import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { cn } from "../../../lib/cn.js"
import { flexRender, useDataTable } from "../../../lib/use-data-table.js"
import { Badge } from "../../../ui/badge/badge.jsx"
import { Button } from "../../../ui/button/button.jsx"
import { ContextMenu, ContextMenuContent, ContextMenuLabel, ContextMenuSeparator, ContextMenuTrigger } from "../../../ui/context-menu/context-menu.jsx"
import { DataTableScroller, useDataTableHighlight } from "../../../ui/data-table/data-table.jsx"
import { Density } from "../../../ui/density/density.jsx"
import { Input } from "../../../ui/input/input.jsx"
import { LiveValue } from "../../../ui/live-value/live-value.jsx"
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarTrigger } from "../../../ui/menubar/menubar.jsx"
import { NativeSelect, NativeSelectOption } from "../../../ui/native-select/native-select.jsx"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../../ui/pagination/pagination.jsx"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../ui/select/select.jsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table/table.jsx"
import { ToggleGroup, ToggleGroupItem } from "../../../ui/toggle-group/toggle-group.jsx"
import { MACHINE_IMAGES, POOLS, SIZES, SOFTWARE, STORAGE_TIERS } from "../console-data.js"
import { ChevronRightIcon, ColumnsIcon, GroupIcon, PlusIcon, RowsExpandIcon, SearchIcon } from "../icons.jsx"
import { CheckRow, SpecCard, SwitchRow } from "./form.jsx"
import { money, moneyHr, siteName, vdcCost, vmMonthly } from "./pricing.js"
import { ActionItems, RowActions } from "../shared.jsx"
import "../../../ui/badge/badge.css"
import "../../../ui/button/button.css"
import "../../../ui/context-menu/context-menu.css"
import "../../../ui/data-table/data-table.css"
import "../../../ui/dropdown-menu/dropdown-menu.css"
import "../../../ui/input/input.css"
import "../../../ui/live-value/live-value.css"
import "../../../ui/menubar/menubar.css"
import "../../../ui/native-select/native-select.css"
import "../../../ui/pagination/pagination.css"
import "../../../ui/select/select.css"
import "../../../ui/table/table.css"
import "../../../ui/toggle/toggle.css"
import "../../../ui/toggle-group/toggle-group.css"

/* The order as one table: every vDC a group row, its machines the rows
   under it. It sits under the form on every step, so a change up there is a
   number moving down here. Grouping, search, columns and paging come from
   lib/use-data-table; the footer, the row-action trigger and the group
   row's extra cells are built here (#38, #39). */

const IMAGES = [...new Set([...MACHINE_IMAGES.map((i) => i.name), ...SOFTWARE.map((s) => s.name)])]
const PAGE_SIZES = [10, 25, 50, 100]
const GROUPINGS = [
  { id: "vdc", label: "vDC" },
  { id: "site", label: "Site" },
  { id: "", label: "None" },
]

function vmColumns({ onPatch, openVms, toggleOpen, names }) {
  return [
    {
      id: "expand",
      header: "",
      enableHiding: false,
      size: 40,
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
      header: "Machine",
      enableHiding: false,
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
      accessorKey: "vdc",
      header: "vDC",
      getFilterValue: (id) => names[id] ?? id,
      cell: ({ row }) => <code className="ck-mono">{names[row.original.vdc] ?? row.original.vdc}</code>,
    },
    { accessorKey: "site", header: "Site" },
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
            {IMAGES.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
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
          onChange={(e) => onPatch(row.original.id, { count: Math.min(99, Math.max(1, Number(e.target.value) || 1)) })}
        />
      ),
    },
    {
      accessorKey: "monthly",
      header: "Pool draw",
      cell: ({ row }) => {
        const size = SIZES.find((s) => s.name === row.original.size) ?? SIZES[1]
        const [cpu, ram] = POOLS
        const tier = STORAGE_TIERS.find((t) => t.id === row.original.bootTier) ?? STORAGE_TIERS[1]
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
              {money(row.original.monthly)}/mo
            </SpecCard>
          </span>
        )
      },
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

/* Menu entries for a vDC row and a machine row; the (…) trigger and the
   right-click menu share them (shared.jsx RowActions / ActionItems). */
function vdcItems({ vdc, draft, editing, onEdit, onRemove, onDuplicate, onAddVm, onCommit }) {
  const isDraft = vdc.id === draft.id
  return [
    isDraft
      ? { label: editing ? "Add back to order" : "Add to order", onSelect: onCommit }
      : { label: "Edit", onSelect: () => onEdit(vdc.id) },
    { label: "Add virtual machine", onSelect: () => onAddVm(vdc.id) },
    { label: "Duplicate", onSelect: () => onDuplicate(vdc.id) },
    ...(isDraft ? [] : [{ label: "Remove from order", onSelect: () => onRemove(vdc.id), className: "ck-menu-danger" }]),
  ]
}

function vmItems({ vm, open, onOpen, onDuplicate, onRemove, canRemove }) {
  return [
    { label: open ? "Hide settings" : "Settings", onSelect: () => onOpen(vm.id) },
    { label: "Duplicate", onSelect: () => onDuplicate(vm.id) },
    { label: canRemove ? "Remove" : "Remove (last machine)", onSelect: canRemove ? () => onRemove(vm.id) : () => {}, className: "ck-menu-danger", disabled: !canRemove },
  ]
}

/* A vDC's row: the kit's group toggle, then the figures that make it a
   vDC row and not a bucket label, then its own actions. */
function VdcGroupRow({ row, colSpan, vdc, cost, isDraft, editing, actions }) {
  const expanded = row.getIsExpanded()
  return (
    <TableRow className="data-table-group-row ck-vdc-row" data-depth={row.depth} data-row="vdc" data-id={vdc.id} data-draft={isDraft || undefined}>
      <TableCell colSpan={colSpan - 1} className="data-table-group-cell">
        <div className="ck-vdc-cell">
          <button type="button" className="data-table-group-toggle" aria-expanded={expanded} onClick={() => row.toggleExpanded()}>
            <ChevronRightIcon />
            <span className="data-table-group-label">{vdc.name || "unnamed"}</span>
            <span className="data-table-group-count">{row.leafCount}</span>
          </button>
          {isDraft && <Badge variant={editing ? "warning" : "info"}>{editing ? "Editing" : "Draft"}</Badge>}
          <span className="ck-vdc-facts">
            <span>{siteName(vdc.site)}</span>
            <span className="ck-num">{vdc.cpu} GHz</span>
            <span className="ck-num">{vdc.ram} GB</span>
            <span className="ck-num">{cost.storageGb.toLocaleString("en-US")} GB</span>
            {cost.tier.share > 0 && <Badge variant="outline">{cost.tier.name}</Badge>}
            {cost.draw.licensed > 0 && <Badge variant="outline">licensed</Badge>}
          </span>
          <span className="ck-vdc-price">
            <LiveValue value={cost.total} format={money} className="ck-vdc-price-live" />
            <span className="ck-vdc-price-unit">/mo · {moneyHr(cost.total)}/hr</span>
          </span>
        </div>
      </TableCell>
      <TableCell className="ck-vdc-actions">{actions}</TableCell>
    </TableRow>
  )
}

function pageWindow(index, count) {
  if (count <= 7) return [...Array(count).keys()]
  const pages = new Set([0, count - 1, index - 1, index, index + 1].filter((p) => p >= 0 && p < count))
  return [...pages].sort((a, b) => a - b)
}

/* ui/data-table ships no pagination footer (#39): page size, range, pages. */
function TablePager({ table }) {
  const { pageIndex, pageSize } = table.getState().pagination
  const count = table.getPageCount()
  const total = table.getRowCount()
  const from = total === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(total, (pageIndex + 1) * pageSize)
  const pages = pageWindow(pageIndex, count)
  return (
    <div className="ck-order-pager">
      <label className="ck-page-size">
        Rows per page
        <NativeSelect value={String(pageSize)} onChange={(e) => table.setPageSize(Number(e.target.value))} aria-label="Rows per page">
          {PAGE_SIZES.map((n) => (
            <NativeSelectOption key={n} value={String(n)}>{n}</NativeSelectOption>
          ))}
        </NativeSelect>
      </label>
      <span className="ck-order-pager-range">
        {from}–{to} of {total} rows
      </span>
      <Pagination className="ck-order-pages">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious as="button" type="button" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()} />
          </PaginationItem>
          {pages.map((p, i) => (
            <Fragment key={p}>
              {i > 0 && pages[i - 1] !== p - 1 && (
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
              )}
              <PaginationItem>
                <PaginationLink as="button" type="button" isActive={p === pageIndex} onClick={() => table.setPageIndex(p)}>
                  {p + 1}
                </PaginationLink>
              </PaginationItem>
            </Fragment>
          ))}
          <PaginationItem>
            <PaginationNext as="button" type="button" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export function OrderTable({ order, onAddVdc, onAddVm, onPatchVm, onRemoveVm, onDuplicateVm, onEditVdc, onRemoveVdc, onDuplicateVdc }) {
  const { vdcs, draft, vms, editing } = order
  const all = useMemo(() => [...vdcs, draft], [vdcs, draft])
  const byId = useMemo(() => Object.fromEntries(all.map((v) => [v.id, v])), [all])
  const names = useMemo(() => Object.fromEntries(all.map((v) => [v.id, v.name])), [all])
  const costs = useMemo(() => Object.fromEntries(all.map((v) => [v.id, vdcCost(v, vms)])), [all, vms])
  const rows = useMemo(
    () => vms.map((vm) => ({ ...vm, site: siteName(byId[vm.vdc]?.site), monthly: vmMonthly(vm.size) * vm.count })),
    [vms, byId]
  )

  const [openVms, setOpenVms] = useState(() => new Set())
  const toggleOpen = useCallback((id) => {
    setOpenVms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])
  const [density, setDensity] = useState("compact")
  const [contextRow, setContextRow] = useState(null)

  const columns = useMemo(() => vmColumns({ onPatch: onPatchVm, openVms, toggleOpen, names }), [onPatchVm, openVms, toggleOpen, names])
  const table = useDataTable({ data: rows, columns, initialPageSize: 25, initialGrouping: ["vdc"], getRowId: (vm) => vm.id })
  const grouping = table.getState().grouping[0] ?? ""
  // The highlight wants the body, but the body is the context menu's trigger
  // and owns its ref; resolve the element from the wrapper instead.
  const wrapRef = useRef(null)
  const bodyRef = useRef(null)
  useLayoutEffect(() => {
    bodyRef.current = wrapRef.current?.querySelector("tbody") ?? null
  })
  useDataTableHighlight(bodyRef, table.getState().globalFilter)

  // Groups open on arrival and whenever a vDC joins; a group the user folded
  // stays folded until then.
  const groupKey = `${grouping}|${Object.keys(names).join("|")}`
  useEffect(() => {
    table.toggleAllExpanded(true)
  }, [groupKey])

  // The vDC column repeats the group label while grouped by vDC; the site
  // column repeats it while grouped by site.
  useEffect(() => {
    table.getColumn("vdc").toggleVisibility(grouping !== "vdc")
    table.getColumn("site").toggleVisibility(grouping !== "site")
  }, [grouping])

  const colSpan = table.getHeaderGroups()[0].headers.length
  const vmCount = (vdcId) => vms.filter((v) => v.vdc === vdcId).length
  const vdcActions = (vdc) => ({
    vdc, draft, editing,
    onEdit: onEditVdc, onRemove: onRemoveVdc, onDuplicate: onDuplicateVdc, onAddVm, onCommit: onAddVdc,
  })
  const vmActions = (vm) => ({
    vm, open: openVms.has(vm.id), onOpen: toggleOpen, onDuplicate: onDuplicateVm, onRemove: onRemoveVm, canRemove: vmCount(vm.vdc) > 1,
  })
  const columnsMenu = table.getAllColumns().filter((c) => c.getCanHide())

  return (
    <section className="ck-order-table-section" aria-label="Order">
      <div className="ck-order-toolbar">
        <div className="ck-order-toolbar-left">
          <div className="ck-order-search">
            <SearchIcon />
            <Input
              className="ck-order-search-input"
              placeholder="Filter machines and vDCs…"
              aria-label="Filter the order"
              value={table.getState().globalFilter}
              onChange={(e) => table.setGlobalFilter(e.target.value)}
            />
          </div>
          <Menubar className="ck-order-menubar" aria-label="Table view">
            <MenubarMenu value="expand">
              <MenubarTrigger className="menubar-trigger ck-order-menubar-trigger">
                <RowsExpandIcon />
                Expand
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem onSelect={() => table.toggleAllExpanded(true)}>Expand all vDCs</MenubarItem>
                <MenubarItem onSelect={() => table.toggleAllExpanded(false)}>Collapse all vDCs</MenubarItem>
                <MenubarSeparator />
                <MenubarItem onSelect={() => setOpenVms(new Set(vms.map((v) => v.id)))}>Open every machine's settings</MenubarItem>
                <MenubarItem onSelect={() => setOpenVms(new Set())}>Close machine settings</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu value="group">
              <MenubarTrigger className="menubar-trigger ck-order-menubar-trigger">
                <GroupIcon />
                Group by
              </MenubarTrigger>
              <MenubarContent>
                <MenubarRadioGroup value={grouping} onValueChange={(id) => table.setGrouping(id ? [id] : [])}>
                  {GROUPINGS.map((g) => (
                    <MenubarRadioItem key={g.id} value={g.id}>{g.label}</MenubarRadioItem>
                  ))}
                </MenubarRadioGroup>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu value="columns">
              <MenubarTrigger className="menubar-trigger ck-order-menubar-trigger">
                <ColumnsIcon />
                Columns
              </MenubarTrigger>
              <MenubarContent>
                <MenubarLabel>Show</MenubarLabel>
                {columnsMenu.map((c) => (
                  <MenubarCheckboxItem key={c.id} checked={c.getIsVisible()} onCheckedChange={(on) => c.toggleVisibility(on)}>
                    {typeof c.columnDef.header === "string" ? c.columnDef.header : c.id}
                  </MenubarCheckboxItem>
                ))}
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
          <ToggleGroup type="single" variant="outline" size="sm" value={density} onValueChange={(d) => d && setDensity(d)} className="ck-segments ck-order-density" aria-label="Row density">
            <ToggleGroupItem value="compact">Compact</ToggleGroupItem>
            <ToggleGroupItem value="comfortable">Comfortable</ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="ck-order-toolbar-right">
          <Button variant="outline" size="sm" className="ck-order-add-vm" onClick={() => onAddVm(draft.id)}>
            <PlusIcon />
            Add VM
          </Button>
          <Button size="sm" className="ck-order-add-vdc" onClick={onAddVdc}>
            <PlusIcon />
            {editing ? "Add back to order" : "Add vDC"}
          </Button>
        </div>
      </div>
      <ContextMenu>
        <Density mode={density} className="ck-order-density-scope" ref={wrapRef}>
          <DataTableScroller className="ck-table-wrap ck-order-table-wrap">
            <Table className="ck-table ck-order-table">
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id}>
                    {hg.headers.map((header) => (
                      <TableHead key={header.id}>{flexRender(header.column.columnDef.header, header.getContext())}</TableHead>
                    ))}
                    <TableHead className="ck-order-actions-head">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                ))}
              </TableHeader>
              <ContextMenuTrigger
                as={TableBody}
                onContextMenu={(e) => {
                  const tr = e.target.closest("tr[data-row]")
                  setContextRow(tr ? { kind: tr.dataset.row, id: tr.dataset.id } : null)
                }}
              >
                {table.getRowModel().rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={colSpan + 1} className="ck-table-empty">
                      No machines match that filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  table.getRowModel().rows.map((row) => {
                    if (row.isGrouped && row.groupColumnId === "vdc") {
                      const vdc = byId[row.groupValue]
                      if (!vdc) return null
                      return (
                        <VdcGroupRow
                          key={row.id}
                          row={row}
                          colSpan={colSpan + 1}
                          vdc={vdc}
                          cost={costs[vdc.id]}
                          isDraft={vdc.id === draft.id}
                          editing={editing !== null}
                          actions={<RowActions name={vdc.name} items={vdcItems(vdcActions(vdc))} />}
                        />
                      )
                    }
                    if (row.isGrouped) {
                      return (
                        <TableRow key={row.id} className="data-table-group-row ck-site-row" data-depth={row.depth}>
                          <TableCell colSpan={colSpan + 1} className="data-table-group-cell">
                            <button type="button" className="data-table-group-toggle" aria-expanded={row.getIsExpanded()} onClick={() => row.toggleExpanded()}>
                              <ChevronRightIcon />
                              <span className="data-table-group-label">{String(row.groupValue)}</span>
                              <span className="data-table-group-count">{row.leafCount}</span>
                            </button>
                          </TableCell>
                        </TableRow>
                      )
                    }
                    const vm = row.original
                    return (
                      <Fragment key={row.id}>
                        <TableRow data-row="vm" data-id={vm.id} data-expanded={openVms.has(vm.id) || undefined}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                          ))}
                          <TableCell className="ck-vm-actions">
                            <RowActions name={vm.name} items={vmItems(vmActions(vm))} />
                          </TableCell>
                        </TableRow>
                        {openVms.has(vm.id) && (
                          <TableRow className="ck-vm-detail">
                            <TableCell colSpan={colSpan + 1}>
                              <VmSettings vm={vm} onPatch={onPatchVm} />
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })
                )}
              </ContextMenuTrigger>
            </Table>
          </DataTableScroller>
        </Density>
        <ContextMenuContent className="ck-context ck-order-context">
          {contextRow?.kind === "vdc" && byId[contextRow.id] && (
            <>
              <ContextMenuLabel className="ck-context-label">
                <code className="ck-mono">{byId[contextRow.id].name}</code>
                <span className="ck-option-desc">{siteName(byId[contextRow.id].site)}</span>
              </ContextMenuLabel>
              <ContextMenuSeparator />
              <ActionItems name={byId[contextRow.id].name} items={vdcItems(vdcActions(byId[contextRow.id]))} />
            </>
          )}
          {contextRow?.kind === "vm" && vms.some((v) => v.id === contextRow.id) && (
            <>
              <ContextMenuLabel className="ck-context-label">
                <code className="ck-mono">{vms.find((v) => v.id === contextRow.id).name}</code>
                <span className="ck-option-desc">{names[vms.find((v) => v.id === contextRow.id).vdc]}</span>
              </ContextMenuLabel>
              <ContextMenuSeparator />
              <ActionItems name={vms.find((v) => v.id === contextRow.id).name} items={vmItems(vmActions(vms.find((v) => v.id === contextRow.id)))} />
            </>
          )}
        </ContextMenuContent>
      </ContextMenu>
      <TablePager table={table} />
      <p className="ck-option-desc ck-order-table-hint">
        Right-click any row for its actions, or use the (…) at its end; a machine's own options open under its chevron.
      </p>
    </section>
  )
}
