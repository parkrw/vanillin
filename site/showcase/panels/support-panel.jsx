import { useMemo, useRef, useState } from "react"
import { Avatar, AvatarFallback } from "../../../ui/avatar/avatar.jsx"
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "../../../ui/attachment/attachment.jsx"
import { Badge } from "../../../ui/badge/badge.jsx"
import { Bubble, BubbleContent } from "../../../ui/bubble/bubble.jsx"
import { Button } from "../../../ui/button/button.jsx"
import { Card, CardContent, CardHeader, CardTitle } from "../../../ui/card/card.jsx"
import {
  DataTableColumnHeader,
  DataTableFacetedFilter,
  DataTableScroller,
} from "../../../ui/data-table/data-table.jsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../../ui/dropdown-menu/dropdown-menu.jsx"
import { Input } from "../../../ui/input/input.jsx"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageHeader,
} from "../../../ui/message/message.jsx"
import { ScrollArea } from "../../../ui/scroll-area/scroll-area.jsx"
import { Separator } from "../../../ui/separator/separator.jsx"
import { StatusDot } from "../../../ui/status-dot/status-dot.jsx"
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
import { useDataTable, flexRender } from "../../../lib/use-data-table.js"
import {
  DRAFT_ATTACHMENTS,
  SPARE_ATTACHMENTS,
  SUPPORT_THREAD,
  TICKETS,
  TICKET_TONE,
} from "./panels-data.js"
import {
  CloseIcon,
  EllipsisIcon,
  FileIcon,
  PaperclipIcon,
  RefreshIcon,
  SendIcon,
} from "./panels-icons.jsx"

import "../../../ui/attachment/attachment.css"
import "../../../ui/avatar/avatar.css"
import "../../../ui/badge/badge.css"
import "../../../ui/bubble/bubble.css"
import "../../../ui/button/button.css"
import "../../../ui/card/card.css"
import "../../../ui/command/command.css"
import "../../../ui/data-table/data-table.css"
import "../../../ui/dropdown-menu/dropdown-menu.css"
import "../../../ui/input/input.css"
import "../../../ui/message/message.css"
import "../../../ui/popover/popover.css"
import "../../../ui/scroll-area/scroll-area.css"
import "../../../ui/separator/separator.css"
import "../../../ui/status-dot/status-dot.css"
import "../../../ui/table/table.css"
import "../../../ui/textarea/textarea.css"
import "../../../ui/toast/toast.css"
import "../../../ui/tooltip/tooltip.css"
import "./panels.css"

const PRIORITY_VARIANT = {
  Urgent: "destructive-soft",
  High: "warning",
  Normal: "secondary",
  Low: "outline",
}

/** Icon-only control that names itself on hover and on keyboard focus. */
function IconButton({ label, onClick, children }) {
  return (
    <Tooltip>
      <TooltipTrigger
        as={Button}
        variant="ghost"
        size="icon"
        aria-label={label}
        onClick={onClick}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function ticketColumns() {
  const act = (verb, ticket) =>
    toast(`${verb} ${ticket.id}`, { description: ticket.subject })

  return [
    {
      accessorKey: "id",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Ticket" />,
      cell: ({ row }) => <code className="ackp-mono">{row.getValue("id")}</code>,
    },
    {
      accessorKey: "subject",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
      cell: ({ row }) => <span className="ackp-cell-subject">{row.getValue("subject")}</span>,
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      cell: ({ row }) => {
        const status = row.getValue("status")
        return (
          <span className="ackp-cell-status">
            <StatusDot status={TICKET_TONE[status]} label={null} />
            {status}
          </span>
        )
      },
    },
    {
      accessorKey: "priority",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
      cell: ({ row }) => {
        const priority = row.getValue("priority")
        return <Badge variant={PRIORITY_VARIANT[priority]}>{priority}</Badge>
      },
    },
    {
      accessorKey: "team",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Team" />,
    },
    {
      accessorKey: "updated",
      header: "Updated",
    },
    {
      id: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            as={Button}
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${row.original.id}`}
            data-pg="ticket-actions"
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{row.original.id}</DropdownMenuLabel>
            <DropdownMenuItem
              data-pg="ticket-action-reply"
              onSelect={() => act("Replying to", row.original)}
            >
              Reply
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => act("Escalated", row.original)}>
              Escalate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => act("Assigned", row.original)}>
              Assign
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => act("Closed", row.original)}>
              Close
            </DropdownMenuItem>
            <DropdownMenuItem
              className="ackp-menu-danger"
              onSelect={() =>
                toast.error("Delete blocked", {
                  description: `${row.original.id} is read only in this showcase.`,
                })
              }
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]
}

function ThreadMessage({ message }) {
  const isAgent = message.side === "end"
  return (
    <Message align={message.side} data-pg="support-message">
      <MessageAvatar>
        <Avatar>
          <AvatarFallback>{message.initials}</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader>
          <span className="ackp-msg-author">{message.author}</span>
        </MessageHeader>
        <Bubble variant={isAgent ? "default" : "muted"} align={message.side}>
          <BubbleContent>{message.body}</BubbleContent>
        </Bubble>
        {message.attachments?.length ? (
          <div className="ackp-msg-files">
            {message.attachments.map((name) => (
              <Badge key={name} variant="outline" className="ackp-file-chip">
                <FileIcon />
                {name}
              </Badge>
            ))}
          </div>
        ) : null}
        <MessageFooter>{message.time}</MessageFooter>
      </MessageContent>
    </Message>
  )
}

export function SupportPanel() {
  const [thread, setThread] = useState(SUPPORT_THREAD)
  const [draft, setDraft] = useState("")
  const [staged, setStaged] = useState(DRAFT_ATTACHMENTS)
  const spareIndex = useRef(0)
  const columns = useMemo(() => ticketColumns(), [])
  const table = useDataTable({ data: TICKETS, columns, initialPageSize: 6 })
  const rows = table.getRowModel().rows

  const openCount = TICKETS.filter((t) => t.status === "Open").length
  const escalatedCount = TICKETS.filter((t) => t.status === "Escalated").length

  const attachFile = () => {
    const next = SPARE_ATTACHMENTS[spareIndex.current % SPARE_ATTACHMENTS.length]
    spareIndex.current += 1
    if (staged.some((file) => file.id === next.id)) {
      toast("Already attached", { description: next.name })
      return
    }
    setStaged((files) => [...files, next])
    toast("Attached to draft", { description: `${next.name} (${next.size})` })
  }

  const removeFile = (file) => {
    setStaged((files) => files.filter((f) => f.id !== file.id))
    toast("Removed from draft", { description: file.name })
  }

  const send = () => {
    const body = draft.trim()
    if (!body) {
      toast.error("Nothing to send", { description: "Write a reply first." })
      return
    }
    const now = new Date()
    setThread((messages) => [
      ...messages,
      {
        id: `m${messages.length + 1}`,
        author: "Support Engineer",
        initials: "SE",
        side: "end",
        time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
        body,
        attachments: staged.map((file) => file.name),
      },
    ])
    setDraft("")
    setStaged([])
    toast.success("Reply sent", { description: "Ticket AC-4821 updated." })
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="ackp-panel ackp-support" data-pg="panel-support">
        <header className="ackp-panel-head">
          <div className="ackp-panel-heading">
            <h4 className="ackp-panel-title">Support</h4>
            <p className="ackp-panel-sub">Acme Cloud, Dallas region</p>
          </div>
          <div className="ackp-panel-badges">
            <Badge variant="info" data-pg="support-open-count">{openCount} open</Badge>
            <Badge variant="destructive">{escalatedCount} escalated</Badge>
          </div>
          <div className="ackp-panel-tools">
            <IconButton
              label="Refresh tickets"
              onClick={() => toast("Tickets refreshed", { description: "Nothing new since 09:47." })}
            >
              <RefreshIcon />
            </IconButton>
          </div>
        </header>

        <div className="ackp-support-grid">
          <Card className="ackp-thread-card">
            <CardHeader className="ackp-thread-head">
              <CardTitle className="ackp-thread-title">
                <StatusDot status="warning" label={null} /> AC-4821 Load balancer returns intermittent 502
              </CardTitle>
              <span className="ackp-thread-meta">Account Owner, Platform team</span>
            </CardHeader>
            <CardContent className="ackp-thread-body">
              <ScrollArea className="ackp-thread-scroll" data-pg="support-thread">
                <div className="ackp-thread-list">
                  {thread.map((message) => (
                    <ThreadMessage key={message.id} message={message} />
                  ))}
                </div>
              </ScrollArea>

              <Separator />

              <div className="ackp-composer">
                <Textarea
                  className="ackp-composer-input"
                  data-pg="support-draft"
                  rows={3}
                  placeholder="Write a reply..."
                  aria-label="Reply to ticket AC-4821"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                {staged.length > 0 && (
                  <AttachmentGroup className="ackp-composer-files" data-pg="support-attachments">
                    {staged.map((file) => (
                      <Attachment key={file.id} size="sm" data-pg="support-attachment">
                        <AttachmentMedia>
                          <FileIcon />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>{file.name}</AttachmentTitle>
                          <AttachmentDescription>
                            {file.kind}, {file.size}
                          </AttachmentDescription>
                        </AttachmentContent>
                        <AttachmentActions>
                          <AttachmentAction
                            aria-label={`Remove ${file.name}`}
                            onClick={() => removeFile(file)}
                          >
                            <CloseIcon />
                          </AttachmentAction>
                        </AttachmentActions>
                      </Attachment>
                    ))}
                  </AttachmentGroup>
                )}
                <div className="ackp-composer-actions">
                  <IconButton label="Attach file" onClick={attachFile}>
                    <PaperclipIcon />
                  </IconButton>
                  <span className="ackp-composer-hint">
                    {staged.length} file{staged.length === 1 ? "" : "s"} staged
                  </span>
                  <Button size="sm" data-pg="support-send" onClick={send}>
                    <SendIcon />
                    Send
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="ackp-tickets-card">
            <CardHeader className="ackp-tickets-head">
              <CardTitle className="ackp-tickets-title">All tickets</CardTitle>
              <div className="ackp-tickets-tools">
                <Input
                  className="ackp-tickets-filter"
                  placeholder="Filter tickets..."
                  aria-label="Filter tickets"
                  value={table.getState().globalFilter}
                  onChange={(event) => table.setGlobalFilter(event.target.value)}
                />
                <DataTableFacetedFilter column={table.getColumn("status")} title="Status" />
              </div>
            </CardHeader>
            <CardContent className="ackp-tickets-body">
              <DataTableScroller className="ackp-table-wrap">
                <Table className="ackp-table" data-pg="tickets-table">
                  <TableHeader>
                    {table.getHeaderGroups().map((group) => (
                      <TableRow key={group.id}>
                        {group.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id} data-pg="ticket-row">
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DataTableScroller>
              <div className="ackp-tickets-foot">
                <span className="ackp-tickets-count">
                  Showing {rows.length} of {TICKETS.length} tickets
                </span>
                <div className="ackp-tickets-pager">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!table.getCanPreviousPage()}
                    onClick={() => table.previousPage()}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!table.getCanNextPage()}
                    onClick={() => table.nextPage()}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
