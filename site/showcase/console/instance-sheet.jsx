import { Badge } from "../../../ui/badge/badge.jsx"
import { Button } from "../../../ui/button/button.jsx"
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from "../../../ui/item/item.jsx"
import { Progress } from "../../../ui/progress/progress.jsx"
import { Separator } from "../../../ui/separator/separator.jsx"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "../../../ui/sheet/sheet.jsx"
import { StatusBadge, fakeTask } from "../shared.jsx"
import "../../../ui/badge/badge.css"
import "../../../ui/button/button.css"
import "../../../ui/item/item.css"
import "../../../ui/progress/progress.css"
import "../../../ui/separator/separator.css"
import "../../../ui/sheet/sheet.css"

export function InstanceSheet({ instance, onOpenChange }) {
  return (
    <Sheet open={!!instance} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="ck-sheet">
        {instance && (
          <>
            <SheetHeader>
              <SheetTitle>{instance.name}</SheetTitle>
              <SheetDescription>
                {instance.size} in {instance.az}
              </SheetDescription>
            </SheetHeader>
            <div className="ck-sheet-body">
              <ItemGroup>
                <Item size="sm">
                  <ItemContent><ItemTitle>Status</ItemTitle></ItemContent>
                  <ItemActions><StatusBadge value={instance.status} /></ItemActions>
                </Item>
                <Item size="sm">
                  <ItemContent><ItemTitle>IP address</ItemTitle></ItemContent>
                  <ItemActions><code className="ck-mono">{instance.ip}</code></ItemActions>
                </Item>
                <Item size="sm">
                  <ItemContent><ItemTitle>Project</ItemTitle></ItemContent>
                  <ItemActions><Badge variant="outline">{instance.project}</Badge></ItemActions>
                </Item>
                <Item size="sm">
                  <ItemContent>
                    <ItemTitle>Owner</ItemTitle>
                    <ItemDescription>Launched by {instance.user}</ItemDescription>
                  </ItemContent>
                </Item>
              </ItemGroup>
              <Separator decorative />
              <div className="ck-util">
                <div className="ck-util-row">
                  <span className="ck-util-label">CPU</span>
                  <Progress value={instance.cpu} className="ck-util-bar" data-tone={instance.cpu >= 85 ? "warning" : "success"} />
                  <span className="ck-util-val">{instance.cpu}%</span>
                </div>
                <div className="ck-util-row">
                  <span className="ck-util-label">Memory</span>
                  <Progress value={instance.mem} className="ck-util-bar" data-tone={instance.mem >= 85 ? "warning" : "success"} />
                  <span className="ck-util-val">{instance.mem}%</span>
                </div>
              </div>
            </div>
            <SheetFooter>
              <Button
                variant="outline"
                onClick={() => fakeTask("Soft reboot", instance.name)}
              >
                Soft reboot
              </Button>
              <SheetClose as={Button} variant="secondary">Close</SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
