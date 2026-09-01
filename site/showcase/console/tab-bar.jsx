import { Badge } from "../../../ui/badge/badge.jsx"
import { Tabs, TabsList, TabsTrigger } from "../../../ui/tabs/tabs.jsx"
import "../../../ui/badge/badge.css"
import "../../../ui/tabs/tabs.css"

/* No bar when it would only echo the rail. A one-page service's lone tab
   carries the rail row's own name; a site's tabs are the vDC links its open
   fold is already showing. `TabBar` returning null keeps that rule in one
   place rather than at every call site. */
export function TabBar({ svc, page, onNavigate }) {
  if (svc.collapsible || svc.pages.length < 2) return null
  return (
    <div className="ck-tabbar">
      <Tabs value={page} onValueChange={(p) => onNavigate(svc.id, p)} className="ck-tabs">
        <TabsList>
          {svc.pages.map((p) => (
            <TabsTrigger key={p} value={p}>{p}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <Badge variant="success" glow className="ck-live-badge">Live</Badge>
    </div>
  )
}
