import { useRef, useState } from "react"
import { useTicker } from "../../../lib/use-ticker.js"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../../../ui/collapsible/collapsible.jsx"
import { Progress } from "../../../ui/progress/progress.jsx"
import { Spinner } from "../../../ui/spinner/spinner.jsx"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../ui/table/table.jsx"
import { TASKS } from "../console-data.js"
import { ChevronUpIcon } from "../icons.jsx"
import { Dot, RowActions, TICK_MS, clamp } from "../shared.jsx"
import "../../../ui/collapsible/collapsible.css"
import "../../../ui/progress/progress.css"
import "../../../ui/spinner/spinner.css"
import "../../../ui/table/table.css"

/* The taskbar spans the console's width and resizes from its top edge. */

const TASKBAR_H = { initial: 220, min: 96, max: 480 }
/* A running task gains this much per tick, so the bars visibly move. */
const TASK_PACE = 0.6

const taskTone = (t) =>
  t.status === "Failed" ? "err" : t.status === "Succeeded" ? "ok" : t.pct < 50 ? "info" : "run"

const taskActions = (t) =>
  t.status === "Running"
    ? [{ label: "View log" }, { label: "Cancel", danger: true }]
    : t.status === "Failed"
      ? [{ label: "View log" }, { label: "Retry" }, { label: "Dismiss" }]
      : [{ label: "View log" }, { label: "Open target" }, { label: "Dismiss" }]

export function ConsoleTaskbar() {
  const [open, setOpen] = useState(false)
  const [height, setHeight] = useState(TASKBAR_H.initial)
  const [dragging, setDragging] = useState(false)
  const drag = useRef(null)
  // The ticker is shared page-wide, so a bar's progress counts from the tick
  // the panel opened on: opening always shows the data's own figures first.
  const tick = useTicker(TICK_MS)
  const [origin, setOrigin] = useState(0)
  const elapsed = open ? tick - origin : 0
  const rows = TASKS.map((t) => ({
    ...t,
    pct: t.status === "Running" ? Math.min(99, Math.round(t.progress + elapsed * TASK_PACE)) : 100,
  }))
  const running = TASKS.filter((t) => t.status === "Running").length
  const failed = TASKS.filter((t) => t.status === "Failed").length

  const onGripDown = (e) => {
    drag.current = { startY: e.clientY, startH: height }
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }
  const onGripMove = (e) => {
    if (!drag.current) return
    const { startY, startH } = drag.current
    setHeight(clamp(startH + (startY - e.clientY), TASKBAR_H))
  }
  const onGripUp = (e) => {
    if (!drag.current) return
    drag.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(false)
  }

  return (
    <Collapsible
      className="ck-taskbar"
      open={open}
      onOpenChange={(next) => {
        if (next) setOrigin(tick)
        setOpen(next)
      }}
      data-dragging={dragging || undefined}
      style={{ "--ck-taskbar-h": `${height}px` }}
    >
      {open && (
        <div
          className="ck-taskbar-grip"
          role="separator"
          aria-orientation="horizontal"
          aria-label="Resize the task panel"
          aria-valuenow={height}
          aria-valuemin={TASKBAR_H.min}
          aria-valuemax={TASKBAR_H.max}
          onPointerDown={onGripDown}
          onPointerMove={onGripMove}
          onPointerUp={onGripUp}
          onPointerCancel={onGripUp}
        />
      )}
      <CollapsibleTrigger className="ck-taskbar-bar">
        <Spinner className="ck-taskbar-spinner" />
        <span className="ck-taskbar-label">Recent tasks</span>
        <span className="ck-taskbar-stat">Running: <b data-tone="run">{running}</b></span>
        <span className="ck-taskbar-stat">Failed: <b data-tone={failed ? "err" : "ok"}>{failed}</b></span>
        <span className="ck-taskbar-caret" aria-hidden="true"><ChevronUpIcon /></span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ck-taskbar-panel">
          <Table className="ck-table ck-task-table">
            <TableHeader>
              <TableRow>
                <TableHead>Task</TableHead>
                <TableHead>Target</TableHead>
                <TableHead className="ck-task-progress-head">Progress</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((t) => {
                const tone = taskTone(t)
                return (
                  <TableRow key={t.id} data-status={t.status}>
                    <TableCell>{t.task}</TableCell>
                    <TableCell><code className="ck-mono">{t.target}</code></TableCell>
                    <TableCell>
                      <div className="ck-task-progress" data-tone={tone}>
                        {t.status === "Running" ? (
                          <Spinner className="ck-task-spinner" />
                        ) : (
                          <Dot tone={t.status === "Failed" ? "error" : "success"} size="sm" />
                        )}
                        <Progress
                          value={t.pct}
                          glow={t.status === "Running"}
                          className="ck-task-bar"
                          aria-label={`${t.task} ${t.target}`}
                        />
                        <span className="ck-task-pct">{t.pct}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="ck-task-status" data-tone={tone}>{t.status}</span>
                      {t.error && <span className="ck-task-error"> · {t.error}</span>}
                    </TableCell>
                    <TableCell>{t.started}</TableCell>
                    <TableCell>{t.duration || "–"}</TableCell>
                    <TableCell className="ck-task-actions">
                      <RowActions name={`${t.task}: ${t.target}`} items={taskActions(t)} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
