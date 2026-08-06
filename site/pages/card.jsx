import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter } from "../../ui/card/card.jsx"
import { Button } from "../../ui/button/button.jsx"
import { Avatar, AvatarFallback } from "../../ui/avatar/avatar.jsx"
import { Badge } from "../../ui/badge/badge.jsx"
import "../../ui/card/card.css"
import "../../ui/button/button.css"
import "../../ui/avatar/avatar.css"
import "../../ui/badge/badge.css"
import { ComponentPreview } from "../code-example.jsx"
import { InstallSnippet } from "../install-snippet.jsx"
import { ApiReference } from "../api-reference.jsx"
import "../code-example.css"
import "../install-snippet.css"
import "../api-reference.css"

export default function CardPage() {
  return (
    <>
      <h2>Card</h2>
      <p>A container that groups related content and actions.</p>

      <InstallSnippet slug="card" />

      <section className="pg-section">
        <h3>Usage</h3>
        <ComponentPreview code={`import { Card, CardHeader, CardTitle, CardDescription,
  CardContent, CardFooter } from "./ui/card/card"
import "./ui/card/card.css"

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description.</CardDescription>
  </CardHeader>
  <CardContent>Content here.</CardContent>
  <CardFooter>
    <Button>Save</Button>
  </CardFooter>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "22rem" }}>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card description goes here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0 }}>Card content area.</p>
            </CardContent>
            <CardFooter>
              <Button>Save</Button>
              <Button variant="outline">Cancel</Button>
            </CardFooter>
          </Card>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>With Action</h3>
        <ComponentPreview code={`<Card>
  <CardHeader>
    <CardTitle>Notifications</CardTitle>
    <CardDescription>Manage your notification preferences.</CardDescription>
    <CardAction>
      <Button variant="outline" size="sm">Settings</Button>
    </CardAction>
  </CardHeader>
  <CardContent>
    <p>You have 3 unread messages.</p>
  </CardContent>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "22rem" }}>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage your notification preferences.</CardDescription>
              <CardAction>
                <Button variant="outline" size="sm">Settings</Button>
              </CardAction>
            </CardHeader>
            <CardContent>
              <p style={{ margin: 0 }}>You have 3 unread messages.</p>
            </CardContent>
          </Card>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Header Only</h3>
        <ComponentPreview code={`<Card>
  <CardHeader>
    <CardTitle>Simple Card</CardTitle>
    <CardDescription>A card with header only.</CardDescription>
  </CardHeader>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "22rem" }}>
            <CardHeader>
              <CardTitle>Simple Card</CardTitle>
              <CardDescription>A card with header only.</CardDescription>
            </CardHeader>
          </Card>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Card Grid</h3>
        <ComponentPreview code={`<div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))", gap: "1rem" }}>
  <Card>
    <CardHeader><CardTitle>Plan A</CardTitle></CardHeader>
    <CardContent><p>Basic features included.</p></CardContent>
    <CardFooter><Button variant="outline">Select</Button></CardFooter>
  </Card>
  <Card>
    <CardHeader><CardTitle>Plan B</CardTitle></CardHeader>
    <CardContent><p>Everything in A, plus more.</p></CardContent>
    <CardFooter><Button>Select</Button></CardFooter>
  </Card>
</div>`}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(16rem, 1fr))", gap: "1rem", width: "100%" }}>
            <Card>
              <CardHeader><CardTitle>Plan A</CardTitle></CardHeader>
              <CardContent><p style={{ margin: 0 }}>Basic features included.</p></CardContent>
              <CardFooter><Button variant="outline">Select</Button></CardFooter>
            </Card>
            <Card>
              <CardHeader><CardTitle>Plan B</CardTitle></CardHeader>
              <CardContent><p style={{ margin: 0 }}>Everything in A, plus more.</p></CardContent>
              <CardFooter><Button>Select</Button></CardFooter>
            </Card>
          </div>
        </ComponentPreview>
      </section>

      <section className="pg-section">
        <h3>Card with Avatar and Badge</h3>
        <ComponentPreview code={`<Card>
  <CardHeader>
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <Avatar>
        <AvatarFallback>JD</AvatarFallback>
      </Avatar>
      <div>
        <CardTitle>Jane Doe</CardTitle>
        <CardDescription>Product Engineer</CardDescription>
      </div>
    </div>
    <CardAction>
      <Badge>Active</Badge>
    </CardAction>
  </CardHeader>
  <CardFooter>
    <Button variant="outline" size="sm">Message</Button>
    <Button size="sm">View profile</Button>
  </CardFooter>
</Card>`}>
          <Card style={{ width: "100%", maxWidth: "22rem" }}>
            <CardHeader>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Avatar>
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>Jane Doe</CardTitle>
                  <CardDescription>Product Engineer</CardDescription>
                </div>
              </div>
              <CardAction>
                <Badge>Active</Badge>
              </CardAction>
            </CardHeader>
            <CardFooter>
              <Button variant="outline" size="sm">Message</Button>
              <Button size="sm">View profile</Button>
            </CardFooter>
          </Card>
        </ComponentPreview>
      </section>

      <ApiReference title="Card" props={[
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="CardHeader / CardContent / CardFooter" props={[
        { name: "className", type: "string", description: "Additional CSS classes" },
      ]} />

      <ApiReference title="CardAction" props={[
        { name: "className", type: "string", description: "Additional CSS classes — renders in the header's trailing slot" },
      ]} />
    </>
  )
}
